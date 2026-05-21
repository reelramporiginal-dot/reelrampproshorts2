# ReelRamp Pro security/env setup

GitHub secret scanning blocks repositories when service-role or provider secrets are committed. This project now keeps secrets out of frontend/build config.

## Client-side Supabase
Use only anon/public keys in the browser:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key
```

`src/lib/supabase.ts` uses only these public variables.

## Server-side Supabase
Set this only in Vercel Project Settings > Environment Variables:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Do not commit it to GitHub. API routes may use it server-side through `api/_supabase.js`.

## Bunny.net
Public CDN URL can be exposed:

```env
VITE_BUNNY_CDN_URL=https://your-zone.b-cdn.net
```

Storage access keys must be server-only in Vercel:

```env
BUNNY_ACCESS_KEY=your_bunny_storage_key
BUNNY_STORAGE_URL=https://storage.bunnycdn.com/your-zone
```

## Vercel
`vercel.json` no longer contains environment values. Add all real values in the Vercel dashboard instead.

## If GitHub already detected a secret
1. Rotate the exposed key in Supabase/Bunny.
2. Remove the secret from git history or create a clean commit if acceptable for your workflow.
3. Push the updated repository.
