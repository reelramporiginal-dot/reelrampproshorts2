-- ReelRamp Phase 0 Lockdown. Run ONCE in Supabase SQL Editor (safe to re-run).
-- The API uses the service role (bypasses RLS). Browser (anon key) gets only what policies below allow.

BEGIN;

-- 1) Entitlement plumbing (server writes these from the Cashfree webhook)
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id BIGINT,
  ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS provider_ref TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_ref ON public.subscriptions(provider_ref);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_txn ON public.payments(transaction_id) WHERE transaction_id <> '';
CREATE UNIQUE INDEX IF NOT EXISTS uq_referrals_referred ON public.referrals(referred_id) WHERE referred_id <> '';

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_key TEXT NOT NULL UNIQUE,
  type TEXT DEFAULT '',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) RLS on EVERY public table (no policy = anon/authenticated denied)
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END $$;

-- 3) Read-only policies the browser may still need (realtime): published videos, own rows
DROP POLICY IF EXISTS "Public can read published videos" ON public.videos;
CREATE POLICY "Public can read published videos" ON public.videos
  FOR SELECT USING (is_published = TRUE);

DROP POLICY IF EXISTS "Own watch_history" ON public.watch_history;
CREATE POLICY "Own watch_history" ON public.watch_history
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Own subscriptions" ON public.subscriptions;
CREATE POLICY "Own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Own wallet" ON public.wallet_transactions;
CREATE POLICY "Own wallet" ON public.wallet_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);

-- No INSERT/UPDATE/DELETE policies anywhere: coins, subscriptions, payments are written by the server only.

COMMIT;

-- After running: make yourself admin by setting ADMIN_EMAILS in Vercel (no SQL needed).
-- Check:  select tablename, rowsecurity from pg_tables where schemaname='public' and not rowsecurity;  -- should be empty
