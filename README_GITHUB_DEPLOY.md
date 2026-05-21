# ReelRamp Pro — GitHub/Vercel Manual Deploy Guide

Bhai, ye package GitHub me manually upload karne ke liye ready hai. Is guide ko dhyan se follow karo taaki Vercel/domain par smooth chale.

## 1. Minimum required files/folders copy karo

Apne old GitHub repo me ye files/folders update/copy karo:

```txt
src/App.tsx
src/index.css
src/lib/supabase.ts
src/lib/googleAuth.ts
src/components/PremiumVideoPlayer.tsx
api/
public/favicon.svg
public/manifest.webmanifest
public/sw.js
public/offline.html
vercel.json
index.html
```

Important: agar aapke repo me `api/_supabase.js` nahi hai, to ye file root `api/_supabase.js` me add karo:

```js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;
```

## 2. Vercel environment variables

Vercel dashboard me Project → Settings → Environment Variables me ye set karo:

```txt
VITE_SUPABASE_URL=https://rwtndqorpizoozbpcmca.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL=https://rwtndqorpizoozbpcmca.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_IF_USING_GOOGLE_LOGIN
VITE_GOOGLE_AUTH_PROXY=https://designarena.ai/auth/google/callback
```

Notes:
- `SUPABASE_SERVICE_ROLE_KEY` Supabase dashboard → Project Settings → API se milegi.
- Service role key kabhi frontend code me mat daalna.
- Google login optional hai; email/password login without Google bhi chalega.

## 3. Supabase database setup

Supabase SQL Editor me `supabase_schema_reelramp.sql` run karo.
Phir optional seed data ke liye `supabase_seed_reelramp.sql` run karo.

## 4. Bunny.net setup

Admin panel me video filename daalna hai. App URL automatically banata hai:

```txt
https://reelrampproshorts1.b-cdn.net/ + video_filename
```

Example:

```txt
episode-1.mp4
promo-launch-offer.mp4
```

Agar full URL daaloge to app direct full URL use karega.

## 5. Admin panel access

Live domain ke end me add karo:

```txt
?admin=1
```

Admin secret:

```txt
RRPRO2026
```

## 6. Install popup/button

Install popup already added hai. App me `PwaInstall` component hai:
- Install button show hota hai
- `manifest.webmanifest` linked hai
- service worker `/sw.js` registered hai
- offline fallback `/offline.html` hai

Browser PWA prompt sirf tab show karta hai jab site HTTPS par ho aur browser install criteria pass kare.

## 7. Local test before GitHub push

```bash
npm install
npm run build
```

Build pass hone ke baad hi GitHub push karo.

## 8. Vercel config

`vercel.json` me ye hona chahiye:

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/((?!api/.*).*)", "destination": "/index.html" }
  ]
}
```

Agar aapke `vercel.json` me env vars already hain to unhe hatao mat, bas framework/build/output/rewrites ensure karo.

## 9. Common issues

### API 500
Check:
- Supabase env vars
- service role key
- tables created

### Video not playing
Check:
- Bunny file exists
- filename exact hai
- file public/CDN accessible hai

### Google login not working
Check:
- Google client ID
- OAuth redirect/proxy config
- Supabase auth provider settings

### Admin changes users ko immediately nahi dikh rahe
App save ke baad refresh event dispatch karta hai. Browser hard refresh bhi test karo.

## 10. Launch status

Payment gateway aur Play Store ko chhod kar app ready hai for:
- soft launch
- internal testing
- public free launch
- demo/investor showcase

Paid public launch se pehle:
- Razorpay live integration
- Bunny signed URL premium protection
- admin/API security hardening
- final legal review
