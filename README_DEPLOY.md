# ReelRamp Pro — GitHub/Vercel Deployment Guide

This package is ready to move into your existing Vite + React + TypeScript GitHub project.

## 1. Copy these folders/files into your GitHub repo

```txt
src/App.tsx
src/index.css
src/lib/supabase.ts
src/lib/googleAuth.ts
src/components/PremiumVideoPlayer.tsx
api/*.js
public/favicon.svg
public/manifest.webmanifest
public/sw.js
public/offline.html
vercel.json
supabase_schema.sql
supabase_seed.sql
```

## 2. Install required packages

```bash
npm install @supabase/supabase-js lucide-react framer-motion
npm install -D typescript
```

Your project should already have React, Vite and Tailwind.

## 3. Vercel environment variables

Add these in Vercel Project → Settings → Environment Variables:

```txt
VITE_SUPABASE_URL=https://rwtndqorpizoozbpcmca.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL=https://rwtndqorpizoozbpcmca.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_IF_USING_GOOGLE_LOGIN
VITE_GOOGLE_AUTH_PROXY=https://designarena.ai/auth/google/callback
```

Important: `SUPABASE_SERVICE_ROLE_KEY` must only be in Vercel env, never in frontend code.

## 4. Supabase setup

Open Supabase SQL Editor and run:

1. `supabase_schema.sql`
2. `supabase_seed.sql`

## 5. Bunny.net setup

Upload your videos to Bunny.net storage/CDN. In admin panel, add only filename:

```txt
episode-1.mp4
promo-launch-offer.mp4
```

The app automatically builds URLs like:

```txt
https://reelrampproshorts1.b-cdn.net/episode-1.mp4
```

## 6. Admin panel

Open your live domain with:

```txt
?admin=1
```

Secret:

```txt
RRPRO2026
```

## 7. Demo login

A demo Supabase auth user was created in this environment:

```txt
Email: demo@reelramp.pro
Password: password123
```

If using your own Supabase project, create this user from Supabase Auth dashboard or use the signup screen.

## 8. Build locally

```bash
npm install
npm run build
```

If build passes locally, push to GitHub and Vercel will deploy.

## 9. What you still need to do manually

- Upload real videos and promo videos to Bunny.net
- Put exact filenames in Admin → videos / promoVideo
- Set real Vercel env variables
- Run SQL files in your real Supabase project
- Connect Razorpay later if needed
- Play Store publishing later if needed
- Legal final review before public paid launch

## 10. Launch path

- Private beta: ready after videos/env are set
- Public free launch: ready after testing
- Paid public launch: connect payment + Bunny signed URLs first
