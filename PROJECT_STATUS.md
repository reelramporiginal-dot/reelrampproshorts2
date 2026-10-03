# PROJECT STATUS - ReelRamp (02 Oct 2026, session 7)

**Abhi kahan:** Phase 0 Lockdown ka code ban gaya (deploy + keys rotate baaki). Agla: S5 Profile + Auth.
**Live app:** purana frontend, security holes khule hain. Public launch/ads ROK ke rakho.

## Stage tracker
| Stage | Kaam | Status |
|---|---|---|
| D1 | Clickable prototype (Midnight Gold) | Done (v3 + fonts/contrast pass) |
| S0 | Phase 0 Lockdown: keys rotate, `/api` auth, RLS, coins/entitlement server se | Code done, owner deploy + SQL + keys pending |
| S1 | Foundation: Router, TanStack Query, tokens, UI kit (`/v2`) | Done (build pass) |
| S2 | Home / Series / Explore (real) | Done (build pass, owner test pending) |
| S3 | Vertical player (hls.js, signed Bunny URLs) | Pending |
| S4 | Paywall, coins, rewards (Cashfree webhook -> entitlement) | Pending |
| S5 | Profile + Auth v2 | Pending |
| S6 | Backend hardening (LAUNCH GATE) | Pending |
| S7 | Admin v2 | Pending |
| S8 | Growth: push, share, i18n, downloads | Pending |
| S9 | Compliance + launch | Pending |
| S10 | Android wrapper + Play Billing | Pending |

## Owner ke pending kaam
- [ ] S0 files GitHub me daalna, `supabase_phase0.sql` Supabase SQL Editor me run karna
- [ ] Vercel env: `ADMIN_EMAILS`, `APP_URL` add; `VITE_ADMIN_SECRET` hatao
- [ ] `plans` table me asli prices daalo (Cashfree sirf plans table ke price par chalega)
- [ ] Cashfree dashboard me webhook URL: `<APP_URL>/api/cashfree/webhook`; sandbox me ek payment + ek mandate test
- [ ] `supabase_s4.sql` run karna; Vercel env `CASHFREE_ENV` (sandbox/production) set karna
- [ ] Prototype + docs GitHub `docs/` me daalna
- [ ] Supabase service key, Cashfree secret, Bunny keys rotate; `RRPRO2026` badalna
- [ ] Open decisions: brand name, launch languages, web vs Play Store, pricing/coins, grievance officer, OTP provider

## Links / files
- Prototype v3: https://claude.ai/artifact/7oudVxecoaKHMJKjGXxedh (file: `reelramp-prototype.html`)
- Docs: `REELRAMP_MASTER_BIBLE_v2.md`, `SESSION_HANDOFF.md`, `PROJECT_STATUS.md`

## Known gaps (prototype)
Asli video, auth, asli payment, UI language toggle, Hindi/English copy final nahi.

