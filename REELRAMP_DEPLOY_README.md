# ReelRamp Pro Updated Files

Is ZIP ko apne GitHub/Vercel project me extract/copy karein.

## Copy these folders/files
- `src/App.tsx`
- `src/index.css`
- `src/lib/`
- `src/components/`
- `api/`
- `public/`
- `index.html`
- `vercel.json`

## Required npm packages
Ensure these are installed:
```bash
npm install @supabase/supabase-js lucide-react framer-motion
```

## Vercel env variables
Set in Vercel Project Settings:
```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
VITE_GOOGLE_CLIENT_ID
VITE_GOOGLE_AUTH_PROXY
```

## Admin
Open app with:
```text
?admin=1
```
Secret:
```text
RRPRO2026
```

## Bunny.net
Upload videos to Bunny.net and put exact filename in Admin > videos / promoVideo.
CDN base used by app:
```text
https://reelrampproshorts1.b-cdn.net/
```

## Build test
```bash
npm install
npm run build
```
