-- ReelRamp S4: coins, unlocks, check-in, coin packs. Run ONCE in Supabase SQL Editor (safe to re-run).
-- Needs supabase_phase0.sql to have been run first.

BEGIN;

-- 1) payments can now be a coin-pack purchase
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'plan',
  ADD COLUMN IF NOT EXISTS coin_pack_id BIGINT,
  ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- 2) coin packs (prices here are the ONLY source; the server never trusts the browser)
CREATE TABLE IF NOT EXISTS public.coin_packs (
  id BIGSERIAL PRIMARY KEY,
  price NUMERIC NOT NULL,
  coins INTEGER NOT NULL,
  tag TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);
INSERT INTO public.coin_packs (price, coins, tag, sort_order)
SELECT * FROM (VALUES (19, 20, '', 1), (49, 60, 'Best', 2), (99, 140, '', 3)) AS v(price, coins, tag, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.coin_packs);

-- 3) per-user episode unlocks
CREATE TABLE IF NOT EXISTS public.episode_unlocks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id BIGINT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  coins_spent INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

-- 4) ledger idempotency: one row per (user, reference) e.g. checkin:2026-10-03, unlock:42, pack:<orderId>
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_ref ON public.wallet_transactions(user_id, reference_id) WHERE reference_id <> '';

ALTER TABLE public.coin_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_unlocks ENABLE ROW LEVEL SECURITY;

-- 5) atomic money functions (service role only)
CREATE OR REPLACE FUNCTION public.wallet_balance(p_user TEXT) RETURNS INTEGER
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN coins ELSE -coins END), 0)::INTEGER
  FROM public.wallet_transactions WHERE user_id = p_user
$$;

CREATE OR REPLACE FUNCTION public.grant_coins(p_user TEXT, p_coins INTEGER, p_reason TEXT, p_ref TEXT) RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.wallet_transactions(user_id, type, coins, reason, reference_id)
  VALUES (p_user, 'credit', p_coins, p_reason, p_ref);
  RETURN TRUE;
EXCEPTION WHEN unique_violation THEN
  RETURN FALSE;
END $$;

CREATE OR REPLACE FUNCTION public.unlock_episode(p_user TEXT, p_video BIGINT, p_cost INTEGER) RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE bal INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user));
  IF EXISTS (SELECT 1 FROM public.episode_unlocks WHERE user_id = p_user AND video_id = p_video) THEN RETURN 'already'; END IF;
  bal := public.wallet_balance(p_user);
  IF bal < p_cost THEN RETURN 'insufficient'; END IF;
  INSERT INTO public.wallet_transactions(user_id, type, coins, reason, reference_id)
  VALUES (p_user, 'debit', p_cost, 'unlock', 'unlock:' || p_video::TEXT);
  INSERT INTO public.episode_unlocks(user_id, video_id, coins_spent) VALUES (p_user, p_video, p_cost);
  RETURN 'ok';
END $$;

-- Check-in day = India date. streak = consecutive days (ending today if claimed, else yesterday).
CREATE OR REPLACE FUNCTION public.checkin_state(p_user TEXT)
RETURNS TABLE(claimed_today BOOLEAN, streak INTEGER)
LANGUAGE plpgsql STABLE AS $$
DECLARE d DATE := (now() AT TIME ZONE 'Asia/Kolkata')::DATE; n INTEGER := 0; cur DATE;
BEGIN
  claimed_today := EXISTS (SELECT 1 FROM public.wallet_transactions WHERE user_id = p_user AND reference_id = 'checkin:' || d::TEXT);
  cur := CASE WHEN claimed_today THEN d ELSE d - 1 END;
  WHILE EXISTS (SELECT 1 FROM public.wallet_transactions WHERE user_id = p_user AND reference_id = 'checkin:' || cur::TEXT) LOOP
    n := n + 1; cur := cur - 1;
  END LOOP;
  streak := n;
  RETURN NEXT;
END $$;

CREATE OR REPLACE FUNCTION public.claim_checkin(p_user TEXT)
RETURNS TABLE(claimed BOOLEAN, day_no INTEGER, reward INTEGER)
LANGUAGE plpgsql AS $$
DECLARE d DATE := (now() AT TIME ZONE 'Asia/Kolkata')::DATE; st RECORD; dn INTEGER; rw INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user));
  SELECT * INTO st FROM public.checkin_state(p_user);
  IF st.claimed_today THEN
    claimed := FALSE; day_no := ((st.streak - 1) % 7) + 1; reward := 0; RETURN NEXT; RETURN;
  END IF;
  dn := (st.streak % 7) + 1;
  rw := CASE WHEN dn = 7 THEN 50 ELSE 10 END;
  INSERT INTO public.wallet_transactions(user_id, type, coins, reason, reference_id)
  VALUES (p_user, 'credit', rw, 'checkin', 'checkin:' || d::TEXT);
  claimed := TRUE; day_no := dn; reward := rw; RETURN NEXT;
END $$;

REVOKE ALL ON FUNCTION public.wallet_balance(TEXT), public.grant_coins(TEXT, INTEGER, TEXT, TEXT),
  public.unlock_episode(TEXT, BIGINT, INTEGER), public.checkin_state(TEXT), public.claim_checkin(TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_balance(TEXT), public.grant_coins(TEXT, INTEGER, TEXT, TEXT),
  public.unlock_episode(TEXT, BIGINT, INTEGER), public.checkin_state(TEXT), public.claim_checkin(TEXT)
  TO service_role;

COMMIT;
