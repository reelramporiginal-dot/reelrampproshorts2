# ReelRamp Pro - GitHub/Vercel Deploy Package

## What to copy to GitHub
Upload/commit these folders/files from this ZIP into your Vite React TypeScript repo:

- `src/`
- `api/`
- `public/`
- `index.html`
- `package.json`
- `package-lock.json` if present
- `vite.config.ts`
- `tsconfig*.json`
- `vercel.json`
- `README_REELRAMP_DEPLOY.md`

## Required Vercel Environment Variables
Set these in Vercel Project > Settings > Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_GOOGLE_CLIENT_ID` optional for Google login
- `VITE_GOOGLE_AUTH_PROXY` optional for Google login

## Admin Panel
Open your domain with:

`?admin=1`

Default admin secret:

`RRPRO2026`

## Demo Login
Email/password auth demo user created in this environment:

- Email: `demo@reelramp.pro`
- Password: `password123`

Create the same user in your own Supabase Auth project if needed.

## Bunny.net Videos
Upload videos to Bunny.net and put filenames in Admin > videos:

Example filename:

`episode-1.mp4`

The app builds final URL as:

`https://reelrampproshorts1.b-cdn.net/episode-1.mp4`

Full URLs also work.

## Final Checks Before Launch
1. `npm install`
2. `npm run build`
3. Set Vercel env vars
4. Run Supabase schema/seed in your real Supabase project
5. Upload Bunny videos
6. Add video filenames in admin
7. Test `?admin=1`
8. Test video playback, login, profile, plans, support, reports, JSON export/import

## Notes
- Razorpay live integration and Play Store publishing are intentionally left for your external account setup.
- Bunny signed premium URLs require Bunny security token/key setup.
