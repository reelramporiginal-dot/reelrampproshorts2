# Bunny.net setup for ReelRamp Pro

## Vercel Environment Variables
Add these in Vercel Project Settings > Environment Variables. Do not put storage passwords in frontend code.

```text
BUNNY_STORAGE_ZONE=trrlramp2
BUNNY_STORAGE_ENDPOINT=https://storage.bunnycdn.com/trrlramp2
BUNNY_STORAGE_PASSWORD=<Primary Access Password from Bunny dashboard>
VITE_BUNNY_CDN_URL=https://reelrampproshorts1.b-cdn.net
```

## Admin Player Modes
Admin > player:

1. `default` mode: plays direct MP4/HLS URLs from `video_filename`.
2. `bunny` mode: uses Bunny iframe embed. Set either:
   - `bunny_embed_url` on each video, or
   - `bunnyLibraryId` in player settings and `bunny_video_id` on each video.

If direct MP4 gives 403, switch Admin > player > mode to `bunny` and use Bunny embed IDs/URLs.

## Watch History Fix
Run `supabase_schema.sql` in Supabase SQL editor. It adds a unique `(user_id, video_id)` constraint and the API now updates existing rows instead of inserting endless duplicates.

## GitHub Push
I cannot push directly to GitHub from this environment because no GitHub credentials/tool are available. Copy these files to your `reelrampproshorts2` repo and push to trigger Vercel.
