// POST /api/playback { video_id } -> { url, kind, expires_at }
// Decides access on the server (free episode, or active subscription) and returns a short-lived signed URL.
import { supabase } from './_lib/supabase.js';
import { setCors, getUser, fail } from './_lib/auth.js';
import { allow } from './_lib/ratelimit.js';
import { signDirectory, signFile } from './_lib/bunny.js';
import { isFreeEpisode, hasActiveSubscription, hasUnlock } from './_lib/entitlement.js';

const TTL = 3600;

const hostOf = v => String(v || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');

function resolveSource(v) {
  const streamHost = hostOf(process.env.BUNNY_STREAM_HOST);
  const streamKey = process.env.BUNNY_STREAM_KEY || '';
  const filesHost = hostOf(process.env.BUNNY_FILES_HOST || process.env.BUNNY_CDN_URL);
  const filesKey = process.env.BUNNY_FILES_KEY || '';

  if (v.bunny_video_id && streamHost) {
    const dir = `/${v.bunny_video_id}/`;
    const file = `${dir}playlist.m3u8`;
    const url = streamKey ? signDirectory(streamHost, streamKey, dir, file, TTL) : `https://${streamHost}${file}`;
    return { url, kind: 'hls' };
  }

  const f = String(v.video_filename || '');
  if (!f) return null;
  const isHls = /\.m3u8(\?|$)/i.test(f);
  if (/^https?:\/\//i.test(f)) return { url: f, kind: isHls ? 'hls' : 'mp4' }; // external URL: cannot be signed here
  if (!filesHost) return null;
  const path = '/' + f.replace(/^\//, '');
  if (isHls) {
    const dir = path.slice(0, path.lastIndexOf('/') + 1) || '/';
    return { url: filesKey ? signDirectory(filesHost, filesKey, dir, path, TTL) : `https://${filesHost}${path}`, kind: 'hls' };
  }
  return { url: filesKey ? signFile(filesHost, filesKey, path, TTL) : `https://${filesHost}${path}`, kind: 'mp4' };
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');
  if (!allow(req, res, 'playback', 60)) return;

  try {
    const videoId = Number(req.body?.video_id);
    if (!Number.isInteger(videoId)) return fail(res, 400, 'video_id required');

    const { data: v } = await supabase.from('videos').select('*').eq('id', videoId).eq('is_published', true).maybeSingle();
    if (!v || (v.publish_at && new Date(v.publish_at).getTime() > Date.now())) return fail(res, 404, 'Video not found');

    if (!isFreeEpisode(v)) {
      const user = await getUser(req);
      if (!user) return fail(res, 401, 'login_required');
      const ok = (await hasActiveSubscription(user.id)) || (await hasUnlock(user.id, videoId));
      if (!ok) return fail(res, 403, 'locked');
    }

    const src = resolveSource(v);
    if (!src) return fail(res, 404, 'No video source configured');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ...src, expires_at: Math.floor(Date.now() / 1000) + TTL });
  } catch (e) {
    console.error('playback error:', e.message);
    return fail(res, 500, 'Internal server error');
  }
}
