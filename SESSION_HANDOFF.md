
# SESSION HANDOFF - ReelRamp (02 Oct 2026, session 2)

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
1. Owner: prototype `docs/` me GitHub par daale; keys rotate kare.
2. **Phase 0 Lockdown:** `api/` + Supabase schema padhna, auth-verified routes, proxy hatana, RLS sab tables, coins + entitlement server se. (`App.tsx` ko haath nahi.)
3. Phase 2 Foundation: Vite + Router + TanStack Query + tokens + UI components; purana code `src/legacy/`.
4. Phase 3 Player (hls.js, signed Bunny URLs). 5. Phase 4 Money (Cashfree webhook -> entitlement). 6. Phase 5 Admin v2, 12 am drop, push, WhatsApp share.

## 7. Rules for next Claude
- Hinglish, mobile par chhote jawab, answer pehle.
- Premium, simple, ek screen = ek kaam, ek gold CTA.
- Public launch/ads tab tak nahi jab tak Phase 0 + hardening complete.
- Prototype edit ho to `reelramp-prototype.html` upload se uthao, wahi update karo.
- Har stage/session ke end me updated `SESSION_HANDOFF.md` aur `PROJECT_STATUS.md` do.
