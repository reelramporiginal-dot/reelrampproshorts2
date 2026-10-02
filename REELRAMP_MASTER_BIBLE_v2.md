# ReelRamp - Master Bible v2.0

> Ye project ka **single source of truth** hai. Naye chat/session me sabse pehle `RULES.md`, phir `SESSION_HANDOFF.md`, phir ye file padho.
> Ye document purane `00_AUDIT_REPORT`, `01_PROJECT_BIBLE`, `04_ADDENDUM` ko replace karta hai jahan conflict ho. Audit ke technical findings ab bhi valid hain (reference ke liye rakho).
> Last updated: 02 Oct 2026

---

## 1. Vision

**ReelRamp = India ka sabse premium vertical micro-drama app.** Kuku TV aur Story TV ke level ka polish, aur kuch cheezon me unse aage: tez start, behtar discovery, transparent pricing, aur player ke andar hi language/recap/share.

**Brand promise:** "Ek episode aur." Har episode 1-3 min, har episode cliffhanger par khatam, app itna smooth ki phone se haath na hate.

**Success ka matlab (12 mahine):**
1. Pehle 5 second me user video dekh raha ho (login wall nahi).
2. Cheap nahi, "premium cinema in pocket" feel.
3. Paise ka trust: koi dark pattern nahi, cancel 2 tap me.
4. Owner (aap) sirf content dalein, baaki platform khud chale (admin tools simple).

## 2. Market + competitor research (Oct 2026)

> Source quality note: neeche **official app-store listing / company interview** = high; **third-party APK/blog sites** = medium-low (directional). Numbers estimates hain, investor deck se pehle verify karo.

### 2.1 Kuku TV (Kuku FM / Kuku Technologies, India)
- Kuku FM wali team ka video app; vertical HD series, movies, short videos; episodes **2-3 min** (APKMirror listing, official description copy).
- Model: freemium. Third-party descriptions ke mutabiq pehle ~10 episodes free, phir coins / daily rewards / subscription; free tier me ads aur daily premium-episode cap, paid me full library + no ads + **offline downloads** (medium-low confidence).
- US app listing (App Store, official): weekly subscription $4.99 aur coin packs (10/25/50/100 coins + bonus) - yaani **subscription + coins dono**.
- Feed: app khulte hi full-screen vertical feed jaisa experience (third-party review).
- Takeaway: Kuku ka asli moat content + distribution (Kuku FM audience) + coin/sub hybrid hai.

### 2.2 Story TV (India)
- App Store listing: "India's fastest-growing short drama app", **roz raat 12 baje naye dramas/movies launch**, mobile-first, premium HD.
- CEO interview (afaqs): teen models dekhte hain - subscription, ads, pay-per-episode; **abhi subscription sabse zyada chal raha hai**. Roadmap: Tamil/Telugu jaisi regional languages, unique IP/formats (reality micro-drama "Sach Ya Kalesh"), Applause Entertainment ke saath premium dramas. Goal: "Netflix of micro-dramas".
- Takeaway: **daily drop ritual** (12 am) retention ka tool hai; celeb/IP content premium feel deta hai.

### 2.3 Pocket FM (adjacent, India-born)
- Microtransaction-led model se FY24 revenue ~INR 1,052 Cr; us me se ~INR 935 Cr microtransactions se (radioinfo). Commentary: ~Rs.5 ke episode-level payments India me subscription se zyada accessible lagte hain (substack analysis, opinion).
- Takeaway: **sirf Rs.399-899 ka subscription wall mat rakho**; chhote unlock (coins/low-price pass) bhi rakho. Dono A/B test karo.

### 2.4 Global (ReelShort / DramaBox)
- Dono ne Q1 2026 me ~US$140M IAP revenue ke aaspaas kiya (Sensor Tower via ReelPulse). Winners ka formula: hook funnel (free episodes) + cliffhanger paywall + heavy performance marketing; ab ads (programmatic) bhi teesri lane hai.

### 2.5 India audience signals
- Regional: Tamil, Telugu, Kannada micro-drama viewing me aage; romance, family drama, comedy top genres (IdeaUsher - vendor blog, medium-low).
- Device: low/mid Android, 4G, UPI. Isliye data saver + chhota JS bundle + HLS zaroori.

### 2.6 Gap jahan ReelRamp jeet sakta hai (hypotheses - test karne hain)
1. **Speed:** first frame < 2s + agla episode preload (competitors aksar buffer karte hain - user complaints common, par hamne measure nahi kiya).
2. **Discovery:** language + mood + "kitne minute hain" filters, "Aaj raat 12 baje ka drop" shelf.
3. **Trust pricing:** saaf trial/auto-debit disclosure, subscription pause, no surprise renewals.
4. **Player-native tools:** 15-sec recap, in-player language/subtitle switch, sleep timer/binge mode.
5. **Share loop:** WhatsApp pe 20-sec teaser clip + deep link (India ka #1 share channel).
6. **Interactive episodes** (choose-your-path) - abhi kisi bade India app ka core feature nahi (verify before claiming).

## 3. Users
| Persona | Detail | App ko kya chahiye |
|---|---|---|
| Sunita 28-45, Tier-2/3, Hindi | Kaam ke beech 10-15 min, Android mid-range, UPI | Zero-friction start, Hindi UI, bada text, easy payment |
| Rohit 18-30 | Commute binge, thriller/romance | Fast swipe, shareable clips, dark premium look |
| Regional viewer (Tamil/Telugu/Kannada) | Apni bhasha me content | Language chips, subtitles/dub |
| Owner/Admin (aap) | Content upload karna | Simple admin: upload, schedule, publish, see revenue |

Baseline device: **360x800 viewport, Android Chrome, 4G**.

## 4. Product principles
1. **Content first:** login se pehle video chalna chahiye.
2. **Server decides money & access** (client kabhi price/entitlement decide nahi karta).
3. **Dark cinematic by default.** Light theme sirf settings option (baad me).
4. **Har screen ek kaam:** ek primary action.
5. **Fast beats pretty:** animation tabhi jab perf budget me ho.
6. **No dark patterns:** cancel/pause easy, price pehle dikhe.
7. **Small modules, ek stage ek time:** monolith nahi.

## 5. Information architecture

**Bottom nav (5):** Home | Explore | Rewards | My List | Profile
**Full-screen routes (nav hidden):** Player `/watch/:seriesId/:ep`, Paywall sheet, Onboarding, Auth.

| Route | Screen |
|---|---|
| `/` | Home: hero carousel, language chips, Continue Watching, Trending, New (aaj ka drop), Top 10, Genre rails |
| `/explore` | Search + filters (language, genre, mood, episode-length), trending searches |
| `/series/:id` | Series detail: poster/trailer, synopsis, rating badge, episode grid (free/locked), Play/Resume, Share, Add to List |
| `/watch/:id/:ep` | Vertical player |
| `/rewards` | Coins balance, daily check-in, earn (ads/share/refer), coin packs, history |
| `/mylist` | Watchlist, History, Downloads (V1) |
| `/profile` | Menu-list style profile (neeche spec) |
| `/plans` | Subscription plans (paywall ka full page version) |
| `/admin/*` | Legacy admin pehle (move), phir Admin v2 |

**Onboarding (first launch):** Language pick -> 3 genre chips -> seedha Episode 1 play (skip allowed). Login baad me (paywall ya profile par).

## 6. Design system

### 6.1 Style directions (owner ko choose karna hai - **OPEN DECISION D1**)
| Option | Look | Feel | Mera recommendation |
|---|---|---|---|
| **A. Midnight Gold** | Near-black + brand gold `#C5A26F` + sparing ember accent | Premium, luxury cinema, aapke existing brand se match | **Default recommendation** |
| B. Netflix Noir | Black + red | Familiar, mass | Safe par generic |
| C. Neon Pop | Black + hot pink/violet gradients | Youthful, Reels-like | Gen-Z ke liye, premium kam |

> Owner choose kare tab tak A ko working default maano, par tokens aise banenge ki style badalna 1 file (`tokens.css`) ka kaam ho.

### 6.2 Tokens (Option A - starting values)
```
--bg: #0B0B10;          --surface: #14141B;     --surface-2: #1C1C26;
--line: rgba(255,255,255,.08);
--text: #F5F3EE;        --text-dim: #A8A5AD;    --text-faint: #6F6C75;
--gold: #C5A26F;        --gold-hi: #E8CB94;     --gold-lo: #8C6F3F;
--ember: #FF4F6D;       (like/live/NEW badge, sparingly)
--ok: #3DDC97;  --warn: #FFB020;  --err: #FF5470;
--r-sm: 10px; --r-md: 16px; --r-lg: 24px; --r-pill: 999px;
--space: 4,8,12,16,20,24,32,40 (px scale)
--ease: cubic-bezier(.2,.8,.2,1); --dur-1: 140ms; --dur-2: 240ms; --dur-3: 360ms;
```
Gold gradient (CTA): `linear-gradient(135deg, #E8CB94, #C5A26F 55%, #8C6F3F)`; CTA text dark `#17130B`.

### 6.3 Typography
- Latin: **Inter** (ya Plus Jakarta Sans). Hindi/Devanagari: **Noto Sans Devanagari** (fallback `system-ui`). Font files Google Fonts (CSP allowed) ya self-host (better perf).
- Scale: 12 / 14 / 16 / 18 / 22 / 28 / 36. Body 15-16 (Hindi readable). Line-height 1.45.
- Titles semi-bold, numbers tabular.

### 6.4 Components (library `src/components/ui`)
Button (primary gold / secondary / ghost), IconButton, Chip, Badge (NEW, FREE, 13+, LOCKED), PosterCard (2:3), WideCard, Rail (horizontal snap), HeroCarousel, EpisodeGrid, BottomNav, TopBar, Sheet (bottom sheet), Dialog, Toast, Skeleton, EmptyState, ProgressBar, RatingBadge, PriceCard, CoinPill, Avatar, ListRow (profile menu), Switch.

### 6.5 Rules for look
- Posters: **2:3**, rounded `--r-md`, subtle bottom gradient for text; no heavy shadows.
- Ek screen par ek gold CTA.
- Touch target >= 44px. Contrast AA. `prefers-reduced-motion` respect.
- Skeleton loaders (spinner nahi) har list par.
- Safe-area insets (notch) respect.
- Haptics (navigator.vibrate) sirf like/unlock par, halka.

## 7. Vertical Player spec (sabse important screen)

**Layout:** full-screen 9:16, video `object-fit: cover` (letterbox nahi), top: back + series title + episode no. + menu; right rail: Like, My List, Share, Episodes; bottom: progress bar (scrub), title/desc collapsed.

**Gestures**
- Tap = play/pause (icon fade)
- Double-tap = like (heart burst)
- Swipe up/down = next/previous episode (snap, 240ms)
- Long-press = 2x speed (jab tak dabaya)
- Horizontal drag on progress = scrub; left/right edge double-tap = -10s / +10s

**Behavior**
- Autoplay muted-policy handle (user gesture ke baad sound). Resume from last position.
- Preload: next episode ka first 2-3 HLS segments; previous ka bhi light preload.
- End of episode -> 3s countdown "Agla episode" (cancel option) ya direct swipe.
- Locked episode: video start hone se pehle **Cliffhanger Paywall Sheet** (blurred last frame background).
- Buffering: skeleton + auto quality drop; **Data Saver** toggle (480p cap).
- Error: retry with backoff, "Dobara try karein" + report.
- Subtitles/language: tracks menu (V1: subtitle; V2: dub audio).
- Recap (V1): "Pichla episode 15 sec" chip jab user kaafi der baad wapas aaye.
- Sleep timer, binge mode (V1).

**Tech approach:** `hls.js` + custom controls (iframe embed nahi - custom gestures iframe me possible nahi). Source: Bunny Stream HLS playlist **token-authenticated** (server se signed URL). Ek hi `<video>` element recycle (pool of 2-3) taaki low-end phones par memory na phate. IntersectionObserver ya index-based snap list.

**Metrics (har play par):** `time_to_first_frame`, `rebuffer_count`, `completion %`, `drop_off_second`, `swipe_next`, `paywall_shown/click/purchase`.

**Perf budget:** first frame < 2.0s (4G, 360p-480p start), switch next ep < 400ms (preloaded), JS initial < 180 KB gzip.

## 8. Monetization (hybrid; A/B ke saath)

| Layer | Detail | Stage |
|---|---|---|
| Free hook | Har series ke pehle **N** episode free (admin config; default 5-8) | MVP |
| Subscription | Weekly / Monthly / Quarterly (aur Annual) - full library, no ads, downloads | MVP |
| **Coins** | Episode-by-episode unlock; packs; daily check-in; referral; rewards | MVP-lite -> V1 |
| Micro pass | Low-price (Rs.-single-digit/tens) 24h/72h pass - Pocket FM ke evidence ke baad test | V1 test |
| Rewarded ads | Ad dekho = 1 episode | V2 |
| Programmatic ads | Free tier | V2 |

Pricing starting hypothesis (test karna hai, final nahi): Weekly ~Rs.49-79, Monthly ~Rs.149-199, Quarterly ~Rs.399, Annual ~Rs.899. Coin packs Rs.19/49/99/199 with bonus. **Trial Rs.1/Rs.2** tabhi jab auto-debit amount, date aur cancel method paywall par bade dikhein.

**Play Store note (verified, Chrome docs):** agar app Google Play par distribute hoga aur digital goods/subscriptions bechega to **Google Play Billing zaroori** hai (TWA ke liye Digital Goods API + Payment Request). Matlab: **web/PWA = Cashfree**, **Play Store build = Play Billing** (alag integration). Launch plan me pehle PWA/web; Play Store baad me (decision D3).

## 9. Feature map
**MVP:** onboarding, home rails, series page, vertical player, search/explore, paywall + plans (Cashfree), coins basic + daily check-in, profile v2, my list/continue watching, auth (Google + email; phone OTP V1), policies + age gate + report, admin (content CRUD + schedule), analytics.
**V1:** push + daily drop alerts, downloads (protected), subtitles + languages, recommendations, referral anti-fraud, A/B paywall, micro pass, recap, sleep timer.
**V2:** Android wrapper (TWA/Capacitor) + Play Billing, creator portal, rewarded ads, AI dubbing/subtitle pipeline, interactive episodes, watch parties.

## 10. Architecture

**Frontend (naya):** React 18 + Vite + TypeScript (strict) + **React Router** + **TanStack Query** + Tailwind (tokens via CSS vars) + framer-motion (limited) + hls.js + Zustand (small UI state, optional).
**Backend (existing):** Supabase (Auth + Postgres + RLS), Vercel Functions (`/api`), Bunny Stream/CDN, Cashfree (web payments).
**Repo layout (target):**
```
src/
  app/            routes.tsx, providers.tsx, AppShell.tsx
  design/         tokens.css, tailwind preset
  components/ui/  Button, Sheet, Chip, Rail...
  features/
    onboarding/ home/ series/ player/ explore/ rewards/ mylist/ profile/ paywall/ auth/ admin/
  lib/            supabase.ts, api.ts, analytics.ts, i18n.ts, format.ts
  legacy/         App.old.tsx (purana monolith, reference/admin reuse)
api/              (Vercel functions)
docs/             BIBLE.md, RULES.md, SESSION_HANDOFF.md, PROJECT_STATUS.md, BUILD_PLAN.md
```
**Data flow:** UI -> TanStack Query -> `/api/*` (JWT) ya Supabase client (RLS-protected reads) -> Postgres. Playback: `POST /api/playback/token` -> entitlement check -> signed HLS URL.

## 11. Data model v2 (essentials)
`profiles`, `series`, `episodes` (bunny_video_id, is_free, unlock_coins, rating, publish_at, duration), `plans`, `orders`, `payments`, `subscriptions`, `entitlements` (access ka single source), `wallets` + `wallet_ledger` (append-only), `watch_progress`, `likes`, `bookmarks`, `referrals`, `consents`, `reports`, `audit_logs`, `webhook_events`, `app_config` (public only). `user_id` = `auth.users.id` + FK. RLS default deny. Detail migration SQL Stage 6 me.

## 12. Security (non-negotiable)
1. Secrets sirf server env; kabhi code/DB-public/browser me nahi; rotate on leak.
2. RLS ON sab tables; writes zyada tar server functions se.
3. Admin = server-verified role (+ MFA later); `VITE_ADMIN_SECRET` pattern band.
4. Payments: server-priced, webhook signature verified (raw body), idempotent, entitlement server-side.
5. Video: token-signed short TTL URLs; premium par DRM (MediaCage) evaluate; download default OFF.
6. CORS allow-list (`ALLOWED_ORIGINS`), rate limits, no third-party recorders/trackers.
7. Logs me PII/payload nahi.
**Launch gate:** jab tak Stage 6 (hardening) complete nahi, public launch/ads/marketing **nahi**.

## 13. Compliance (India) - engineering checklist, legal sign-off advocate se
- **IT Rules 2021 Part III:** content rating (U/7+/13+/16+/A) + descriptors, parental lock 13+, grievance officer (India-resident), 15-din resolution, monthly report.
- **DPDP Rules 2025:** notice + consent, under-18 verifiable parental consent, deletion/export, breach plan; core obligations ~mid-May 2027 (dates advocate se confirm).
- Consumer: price/auto-debit disclosure, refund/cancel policy, GST invoice.
- IP: har series ka rights proof; takedown policy.

## 14. Analytics / KPIs (4 hafte baseline, phir targets)
Activation: install->first play; first-session episodes >= 3. Retention D1/D7/D30. Monetization: paywall view->purchase, trial->paid, ARPPU, churn. Quality: TTFF, rebuffer ratio, crash-free. Growth: share->install, referral conversion. Ops: refund %, ticket SLA.

## 15. Content ops (aapka kaam)
Flow: upload to Bunny -> admin me series/episode metadata + rating -> schedule (`publish_at`, daily 12 am drop) -> QC checklist (9:16, audio level, thumbnail 2:3 + 9:16, subtitles) -> publish. **Launch slate:** kam se kam 8-10 series x 30-50 episodes. Rights proof folder maintain karo.

## 16. Roadmap (detail `BUILD_PLAN.md` me)
D1 Prototype -> S1 Foundation -> S2 Home/Series/Explore -> S3 Player -> S4 Paywall/Coins/Rewards -> S5 Profile+Auth v2 -> S6 Backend hardening (LAUNCH GATE) -> S7 Admin v2 -> S8 Growth (push, share, i18n, downloads) -> S9 Compliance + launch -> S10 Android wrapper.

## 17. Risks
| Risk | Mitigation |
|---|---|
| UI "cheap" lagna | Prototype pehle, tokens, design review har stage |
| Content kam | Slate plan; owner ka kaam; AI dubbing V2 |
| Piracy | Token URLs, DRM evaluate, download OFF |
| Payment bugs | Server-authoritative + sandbox tests |
| Regulatory | Compliance checklist, advocate |
| Solo-owner dependency | Docs + rules + stage-wise complete files |
| Chat-session confusion | RULES + HANDOFF + STATUS har stage ke baad update |

## 18. Decision log
| # | Decision | Date |
|---|---|---|
| D-1 | Frontend zero se redesign, backend rakho, same repo | 02 Oct 2026 |
| D-2 | Pehle clickable prototype, phir code | 02 Oct 2026 |
| D-3 | Files complete + root path, zip nahi | 02 Oct 2026 |
| D-4 | Web/PWA = Cashfree; Play Store build = Play Billing (baad me) | 02 Oct 2026 |
| D-5 | Custom hls.js player (iframe nahi) | 02 Oct 2026 |
| D-6 | Dark-first design | 02 Oct 2026 |

## 19. Open decisions (owner)
1. **D1 Style:** A Midnight Gold / B Netflix Noir / C Neon Pop?
2. App ka final naam/brand: "ReelRamp" rahega?
3. Launch language(s): Hindi only ya + regional?
4. Pehla launch: sirf web/PWA ya Play Store bhi?
5. Pricing/coins finalize.
6. Grievance officer ka naam/contact.
7. Phone OTP provider (MSG91 etc., DLT registration).

## 20. Sources
Kuku TV: App Store listing (US), APKMirror listing, third-party review pages. Story TV: App Store India listing, afaqs CEO interview. Pocket FM: radioinfo.asia revenue report, thehardcopy case study, substack analysis (opinion). Global: ReelPulse/Sensor Tower (earlier research). Play Billing: developer.chrome.com (TWA billing docs). Regional preference: IdeaUsher blog (vendor, low-medium).
