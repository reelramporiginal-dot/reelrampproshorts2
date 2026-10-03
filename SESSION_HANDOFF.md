
# SESSION HANDOFF - ReelRamp (02 Oct 2026, session 7)

> Naye chat me upload karo: `RULES.md` (agar hai), ye file, `PROJECT_STATUS.md`, `REELRAMP_MASTER_BIBLE_v2.md`, `reelramp-prototype.html`. Claude ko bolo: "Handoff padho aur Next Steps se aage badho."

## 1. Goal (owner Ayush)
App "cheap website" jaisa lagta hai. Chahiye: Kuku TV / Story TV se 4 kadam behtar, premium vertical micro-drama app. Design sabse important.

## 2. Is session me kya hua
1. Handoff + Master Bible v2 padhe. Purana prototype link khula nahi, aur file beech me kat gayi thi (JS adhoora).
2. **Prototype v3 zero se banaya** (Midnight Gold, same tokens/fonts). Naye screens: Onboarding, Explore, Rewards, Profile, My List. Home, Series, Player, Paywall v2 se dobara likhe.
3. **Fonts + contrast pass** ho gaya (chhota text 11-14.5px, dim colour halka chamakdaar, touch targets 44-48px).
4. Owner ne v3 ko "done" bola. GitHub me kaise daalna hai samjhaya: file `docs/reelramp-prototype.html` me upload. `App.tsx` abhi NAHI badalna.

Prototype link (v3): https://claude.ai/artifact/7oudVxecoaKHMJKjGXxedh
(purana v2 link band hai, use mat karna)

## 2b. Session 3: Phase 0 Lockdown (code likha, test: guest smoke test pass)
- `api/index.js` zero se: allowlisted tables. Public = sirf catalog read (`admin_settings` me sirf theme/player). User data = verified Supabase JWT, hamesha token user tak limited. Admin = JWT email `ADMIN_EMAILS` me. `json_import` admin-only, 500 rows cap.
- Coins/subscriptions/payments client se write nahi ho sakte (403). `api/payment.js` aur `api/referrals.js` delete.
- `api/cashfree/create-order.js`: JWT zaroori, price `plans` table se (client ka amount nahi), pending `payments` row, notify_url server set. `create-subscription.js`: recurring price plan se match, trial cap Rs.10 / 7 din.
- `api/cashfree/webhook.js`: signature + dedupe (`webhook_events`) + amount match + entitlement (subscriptions row). Subscription events defensive likhe; sandbox me verify karna baaki.
- `supabase_phase0.sql`: naye columns, `webhook_events`, RLS saari tables par, sirf own-row SELECT policies.
- `src/lib/apiAuth.ts` + `main.tsx` me 1 import: purane App.tsx ke `/api` calls me token jodta hai (App.tsx untouched).
- Purane app me ab: guest sirf catalog dekh sakta hai; like/bookmark/history ke liye login. Old admin panel tabhi chalega jab owner `ADMIN_EMAILS` wale email se login ho. Payment ke baad client ka subscription POST 403 hoga; access webhook se aayega.
- Baaki hardening (S6): rate limit, premium video signed URLs (abhi `videos` row me filename/bunny id public), coins earn routes (S4), Bunny/storage keys `admin_settings` se nikalna.

## 2c. Session 4: S1 Foundation (build pass, tsc clean for v2)
- Naya app `/v2` par, purana App.tsx untouched `/` par. `src/main.tsx` me BrowserRouter + QueryClient; `src/v2/V2App.tsx` lazy load.
- Legacy ko `src/legacy/` me NAHI hilaya (imports toot-te); v2 ke live hone par hi hatayenge.
- Tokens: `src/v2/tokens.css` (Midnight Gold, `.rr2` scoped, Hind + Tiro Devanagari) + `tailwind.config.js` (`rr-*` colors, `font-display/body`).
- UI kit `src/v2/ui/`: Button (gold/ghost/quiet, 48px), Chip, Sheet (drag close), Skeleton, BottomNav.
- Data: `src/v2/api/client.ts` (token ke saath), `hooks.ts` (useCatalog, usePlans, useSession, useSubscription). Home abhi check screen hai.
- `vercel.json` me `/v2/:path*` rewrite jodi. `package.json` me react-router-dom + @tanstack/react-query.

## 2d. Session 5: S2 real screens (build + tsc pass; S1 deploy verified by owner: catalog dikha)
- `/v2` Home (chips, hero, midnight drop countdown, rails: Dekhna jaari rakhein / Naye episodes / Sab series), `/v2/explore` (search + genre + minute filters), `/v2/series/:title` (episode grid, 1-5 Free, locked sheet with real plans).
- `/v2/watch/:id` abhi Stub (S3 Player).
- Shared: `src/v2/lib/poster.ts` (FREE_EPISODES=5, gradient fallback), `ui/Poster.tsx`, `ui/Rail.tsx`, `useWatchHistory` in hooks.
- Chhodha: Top 10 (real views data nahi), Bhasha filter (DB me language column nahi), Yaad dilao (push S8), coins pill (S4).

## 2e. Session 6: S3 Player (build + tsc pass; Bunny keys ke bina test nahi hua)
- `/v2/watch/:id` full-screen vertical player: tap play/pause, double-tap like (edges +-10s), swipe up/down next/prev, long-press 2x, scrub bar, resume, next-episode countdown, paywall sheet (cliffhanger), 480p data saver, retry on error. Ek hi `<video>` recycle, hls.js on-demand (alag chunk).
- Server: `api/playback.js` (POST `{video_id}`): free ya active subscription check, phir short-lived signed URL. `api/_lib/bunny.js`: Bunny directory token (HLS) + file token (mp4). Keys na ho to unsigned URL.
- Env (Vercel, server only): `BUNNY_STREAM_HOST`, `BUNNY_STREAM_KEY`, `BUNNY_FILES_HOST`, `BUNNY_FILES_KEY`, optional `BUNNY_TOKEN_SCHEME` (`hmac` default, `sha256` purane token auth ke liye), `FREE_EPISODES` (default 5).
- Progress `watch_history` me har 10s + pause/end; `video_views` episode chhodte waqt.
- Hooks: `useFlag` (likes/bookmarks optimistic), `usePlayback`, `useVideoSource`.
- Bunny signing official docs ke hisaab se likhi, real CDN par abhi verify nahi. Pehle test: ek premium-protected video chalao; 403 aaye to `BUNNY_TOKEN_SCHEME=sha256` try karo.
- Baaki: login UI (S5) tak guest like/list nahi kar sakta. `/api/videos` ab bhi video_filename dikhata hai (S6 hardening me hatega). Preload sirf next ka signed URL hai, segments nahi.

## 2f. Session 7: S4 Paywall + Coins + Rewards (build + tsc pass; SQL asli Postgres 16 par test pass; payment sandbox me test baaki)
- SQL `supabase_s4.sql`: `coin_packs` (19/20, 49/60 Best, 99/140), `episode_unlocks`, `payments.kind/coin_pack_id/coins`, ledger unique (user, reference), functions `wallet_balance`, `grant_coins`, `unlock_episode`, `checkin_state`, `claim_checkin` (service_role only, advisory lock, India date). Check-in: 10 coins/din, 7va din 50.
- `api/wallet.js`: GET (balance, check-in, unlocked, history, packs) + POST checkin/unlock. Unlock cost env `UNLOCK_COINS` (default 10). Subscriber se coins nahi kat-te.
- `api/_lib/entitlement.js` shared (free episode / subscription / unlock). `api/playback.js` ab unlock bhi maanta hai.
- `create-order.js`: plan YA `coin_pack_id`; price table se; response me `mode`. `_lib/cashfree.js`: sandbox/production server decide karta hai (`CASHFREE_ENV` ya key me `_test_`). `webhook.js`: coin pack paid => `grant_coins` (idempotent).
- Client: `ui/PaywallSheet.tsx` (plan radio + phone + coins unlock), `ui/LoginButton.tsx` (Google, S5 tak), `pages/Rewards.tsx`, `pay/checkout.ts` (Cashfree JS SDK), `pay/PaymentReturn.tsx` (`?cf_order=` par webhook poll). Series + Watch ab PaywallSheet use karte hain.
- Decision: abhi sirf one-time plan (auto-debit mandate S4b me; trial Rs.1 tabhi jab paywall par poori disclosure ho).
- Chhodha: share/referral coins (farm risk, S8), Home me coin pill, admin se packs/plans edit (S7).

## 3. Prototype v3 me kya hai
- Onboarding: bhasha -> 3 genre -> seedha Ep 1 (skip allowed).
- Home: hero, 12 baje drop countdown, rails, Top 10.
- Explore: search + bhasha/genre/"kitne minute" filters.
- Rewards: coins, 7-din check-in, referral, coin packs (Rs.19/49/99 demo).
- Profile: plan pause/cancel (2 tap), Data saver, Parental lock, Madad, Shikayat, Privacy.
- Series: header, episode grid (1-5 Free). Player: tap, double-tap like, swipe next/prev, long-press 2x, Episodes sheet.
- Paywall: Weekly 59 / Monthly 179 (best) / Quarterly 399 + "10 coins se kholein".
- Nahi bana / demo: asli video, auth, asli payment, Hindi/English UI toggle.

## 4. Audit findings (LAUNCH GATE, ab bhi valid)
1. `api/index.js` khula proxy (service key, bina auth read/write/delete, `json_import`).
2. RLS sirf 3 tables par; ~24 par nahi.
3. Coins client se mint (`wallet_transactions` POST browser se).
4. Admin secret default `RRPRO2026` + `VITE_ADMIN_SECRET` bundle me.
5. Bunny key / storage password / Cashfree secret client config me leak risk.
6. Cashfree webhook signature verify karta hai par entitlement nahi deta.
7. `api/payment.js` sandbox hardcoded + `axios` missing; `/api/referrals` poora table dump.

**Owner ka turant kaam:** Supabase service key, Cashfree secret, Bunny keys rotate karo; `RRPRO2026` badlo.

## 5. Decisions
| Decision | Status |
|---|---|
| Frontend zero se redesign, backend rakho, same repo | Final |
| Pehle prototype, phir code | Final (v3 approved) |
| Files complete + root path, zip nahi | Final |
| Web/PWA = Cashfree; Play Store = Play Billing (baad me) | Final |
| Custom hls.js player (iframe nahi) | Final |
| Dark-first, Style A Midnight Gold | Working default |
| Har session ke end me SESSION_HANDOFF + PROJECT_STATUS dena | Final |

Open: final brand name, launch languages, web-only vs Play Store, pricing/coins, grievance officer, phone OTP provider.

## 6. Next Steps (is order me)
1. Owner: S0 files deploy, `supabase_phase0.sql` run, keys rotate, `ADMIN_EMAILS` + `APP_URL` set, plans prices, sandbox payment test.
2. **S5 Profile + Auth v2:** login/logout, profile, my list, plan status/cancel, policies.
3. Phase 2 Foundation: Vite + Router + TanStack Query + tokens + UI components; purana code `src/legacy/`.
4. Phase 3 Player (hls.js, signed Bunny URLs). 5. Phase 4 Money (Cashfree webhook -> entitlement). 6. Phase 5 Admin v2, 12 am drop, push, WhatsApp share.

## 7. Rules for next Claude
- Hinglish, mobile par chhote jawab, answer pehle.
- Premium, simple, ek screen = ek kaam, ek gold CTA.
- Public launch/ads tab tak nahi jab tak Phase 0 + hardening complete.
- Prototype edit ho to `reelramp-prototype.html` upload se uthao, wahi update karo.
- Har stage/session ke end me updated `SESSION_HANDOFF.md` aur `PROJECT_STATUS.md` do.
