// ReelRamp /api — Phase 0 lockdown.
// Allowlisted tables only. Public = catalog reads. User data = verified JWT, scoped to token user.
// Admin = verified JWT whose confirmed email is in ADMIN_EMAILS. Money/coins/entitlement = server only.
import { supabase } from './_lib/supabase.js';
import { setCors, getUser, fail } from './_lib/auth.js';
import { allow } from './_lib/ratelimit.js';

const CATALOG = {
  videos: q => q.eq('is_published', true).or(`publish_at.is.null,publish_at.lte.${new Date().toISOString()}`),
  categories: q => q.eq('is_active', true),
  series: q => q.eq('status', 'published'),
  plans: q => q.eq('is_active', true),
  banners: q => q.eq('is_active', true),
  popup_settings: q => q,
  platform_settings: q => q,
  legal_policies: q => q.eq('is_published', true),
  help_articles: q => q.eq('is_published', true),
  promo_campaigns: q => q.eq('is_active', true),
  notifications: q => q.eq('is_active', true),
  admin_settings: q => q.in('key', ['theme', 'player']), // payment/storage keys are admin-only
};
const CONFLICT = {
  admin_settings: 'key', categories: 'id', plans: 'id', series: 'id', videos: 'id', banners: 'id',
  popup_settings: 'id', platform_settings: 'id', legal_policies: 'id', help_articles: 'id',
  promo_campaigns: 'id', notifications: 'id',
};
const OWNER_COL = {
  users: 'guest_id', likes: 'user_id', bookmarks: 'user_id', watch_history: 'user_id',
  wallet_transactions: 'user_id', subscriptions: 'user_id', payments: 'user_id',
};
const SERVER_ONLY_WRITE = ['wallet_transactions', 'subscriptions', 'payments', 'audit_logs', 'webhook_events'];
const EVENTS = {
  video_views: { auth: false, cols: ['video_id', 'watch_seconds', 'completed', 'device'] },
  promo_events: { auth: false, cols: ['campaign_id', 'event_type', 'metadata'] },
  error_logs: { auth: false, cols: ['source', 'message', 'stack', 'metadata', 'severity'] },
  support_tickets: { auth: true, cols: ['name', 'contact', 'message'] },
  content_reports: { auth: true, cols: ['video_id', 'reason', 'details'] },
  push_subscriptions: { auth: true, cols: ['endpoint', 'subscription', 'enabled'] },
};
const ADMIN_READ = [...Object.keys(CATALOG), ...Object.keys(OWNER_COL), ...Object.keys(EVENTS), 'referrals', 'audit_logs'];
const ADMIN_PUT = [...Object.keys(CATALOG), 'users', 'support_tickets', 'content_reports'];
const ADMIN_DELETE = [...Object.keys(CATALOG), 'support_tickets', 'content_reports'];
// Set HIDE_VIDEO_SOURCES=1 once the legacy app (which plays from video_filename) is retired.
const HIDE_SOURCES = process.env.HIDE_VIDEO_SOURCES === '1';
const IMPORTABLE = Object.keys(CATALOG).filter(t => t !== 'admin_settings');

const pick = (o, keys) => Object.fromEntries(keys.filter(k => o && k in o).map(k => [k, o[k]]));
const tooBig = (b, n = 20000) => JSON.stringify(b || {}).length > n;

function cleanName(dn, email) {
  const d = String(dn || '').trim();
  if (d && !d.includes('@')) return d.slice(0, 80);
  const src = (d.includes('@') ? d : email) || '';
  const part = src.split('@')[0] || '';
  return part.replace(/[._\d]+/g, ' ').trim().split(' ').filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' ').slice(0, 80) || 'User';
}

async function audit(user, action, resource, meta = {}) {
  try { await supabase.from('audit_logs').insert({ actor: user.email || user.id, action, resource, metadata: meta }); } catch {}
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const u = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const resource = u.pathname.replace(/^\/api\/?/, '').split('/')[0] || 'videos';
  const sp = u.searchParams;

  if (!allow(req, res, req.method === 'GET' ? 'api-read' : 'api-write', req.method === 'GET' ? 300 : 60)) return;

  try {
    const user = await getUser(req); // null for guests / bad token
    const admin = !!user?.isAdmin;

    // ---------- GET ----------
    if (req.method === 'GET') {
      let q;
      if (admin && ADMIN_READ.includes(resource)) {
        q = supabase.from(resource).select('*');
        if (sp.get('guest_id')) q = q.eq('guest_id', sp.get('guest_id'));
        if (sp.get('user_id')) q = q.eq('user_id', sp.get('user_id'));
        if (resource === 'videos' && !sp.get('includeUnpublished')) q = q.eq('is_published', true);
      } else if (CATALOG[resource]) {
        q = CATALOG[resource](supabase.from(resource).select('*'));
      } else if (OWNER_COL[resource]) {
        if (!user) return res.status(200).json([]); // guests have no private rows
        q = supabase.from(resource).select('*').eq(OWNER_COL[resource], user.id); // always forced to token user
      } else if (resource === 'referrals') {
        if (!user) return res.status(200).json([]);
        q = supabase.from('referrals').select('*').or(`referrer_id.eq.${user.id},referred_id.eq.${user.id}`);
      } else {
        return fail(res, 404, 'Not found');
      }
      const { data, error } = await q.order('id', { ascending: false }).limit(500);
      if (error) return fail(res, 400, error.message);
      let rows = data || [];
      if (resource === 'videos' && HIDE_SOURCES && !admin) {
        rows = rows.map(({ video_filename, bunny_video_id, ...rest }) => rest); // playback.js resolves the real source
      }
      // Only anonymous catalog reads may be cached at the CDN; anything user-specific never is.
      const publicRead = !req.headers.authorization && !!CATALOG[resource];
      res.setHeader('Vary', 'Authorization');
      res.setHeader('Cache-Control', publicRead ? 'public, s-maxage=30, stale-while-revalidate=120' : 'private, no-store');
      return res.status(200).json(rows);
    }

    // ---------- POST ----------
    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') return fail(res, 400, 'Invalid body');

      if (resource === 'json_import') {
        if (!admin) return fail(res, 403, 'Admin only');
        const { resource: target, rows, dryRun } = body;
        if (!IMPORTABLE.includes(target) || !Array.isArray(rows)) return fail(res, 400, 'Valid resource and rows[] required');
        if (rows.length > 500) return fail(res, 400, 'Max 500 rows per import');
        if (dryRun) return res.status(200).json({ valid: true, count: rows.length, dryRun: true });
        const { data, error } = await supabase.from(target).upsert(rows).select();
        if (error) return fail(res, 400, error.message);
        await audit(user, 'json_import', target, { count: data?.length || 0 });
        return res.status(200).json({ imported: data?.length || 0 });
      }

      if (SERVER_ONLY_WRITE.includes(resource)) return fail(res, 403, 'Server-managed resource');

      if (EVENTS[resource]) {
        const cfg = EVENTS[resource];
        if (cfg.auth && !user) return fail(res, 401, 'Login required');
        if (tooBig(body)) return fail(res, 413, 'Payload too large');
        const row = { ...pick(body, cfg.cols), user_id: user?.id || '' };
        if (resource === 'error_logs') delete row.user_id;
        const { data, error } = await supabase.from(resource).insert(row).select().single();
        if (error) return fail(res, 400, error.message);
        return res.status(200).json(data);
      }

      if (CATALOG[resource]) {
        if (!admin) return fail(res, 403, 'Admin only');
        const { data, error } = await supabase.from(resource)
          .upsert(body, { onConflict: CONFLICT[resource] || 'id' }).select().single();
        if (error) return fail(res, 400, error.message);
        await audit(user, 'upsert', resource, { id: data?.id ?? data?.key });
        return res.status(200).json(data);
      }

      // everything below needs a verified user
      if (!user) return fail(res, 401, 'Login required');

      if (resource === 'users') {
        const row = {
          guest_id: user.id,
          display_name: cleanName(body.display_name, user.email),
          email: user.email,
        };
        const { data, error } = await supabase.from('users').upsert(row, { onConflict: 'guest_id' }).select().single();
        if (error) return fail(res, 400, error.message);
        return res.status(200).json(data);
      }

      if (resource === 'likes' || resource === 'bookmarks') {
        const vid = Number(body.video_id);
        if (!Number.isInteger(vid)) return fail(res, 400, 'video_id required');
        const { data, error } = await supabase.from(resource)
          .upsert({ user_id: user.id, video_id: vid }, { onConflict: 'user_id,video_id', ignoreDuplicates: true })
          .select().maybeSingle();
        if (error) return fail(res, 400, error.message);
        return res.status(200).json(data || { user_id: user.id, video_id: vid });
      }

      if (resource === 'watch_history') {
        const vid = Number(body.video_id);
        if (!Number.isInteger(vid)) return fail(res, 400, 'video_id required');
        const row = { ...pick(body, ['current_position', 'watched_duration', 'duration', 'completed']), user_id: user.id, video_id: vid, updated_at: new Date().toISOString() };
        const { data, error } = await supabase.from('watch_history').upsert(row, { onConflict: 'user_id,video_id' }).select().single();
        if (error) return fail(res, 400, error.message);
        return res.status(200).json(data);
      }

      if (resource === 'referrals') {
        const referrer = String(body.referrer_id || '').trim();
        if (!referrer || referrer === user.id) return fail(res, 400, 'Invalid referral');
        const { data: ex } = await supabase.from('referrals').select('*').eq('referred_id', user.id).maybeSingle();
        if (ex) return res.status(200).json(ex); // one referral per new user
        const row = { referrer_id: referrer, referred_id: user.id, code: String(body.code || '').slice(0, 40), reward_status: 'pending', reward_amount: 0 };
        const { data, error } = await supabase.from('referrals').insert(row).select().single();
        if (error) return fail(res, 400, error.message);
        return res.status(200).json(data);
      }

      return fail(res, 404, 'Not found');
    }

    // ---------- PUT ----------
    if (req.method === 'PUT') {
      const body = req.body;
      if (!user) return fail(res, 401, 'Login required');
      if (!body?.id) return fail(res, 400, 'id required for PUT');
      const { id, ...rest } = body;

      if (admin && ADMIN_PUT.includes(resource)) {
        if (resource === 'users' && 'display_name' in rest) rest.display_name = cleanName(rest.display_name, rest.email);
        const { data, error } = await supabase.from(resource).update(rest).eq('id', id).select().single();
        if (error) return fail(res, 400, error.message);
        await audit(user, 'update', resource, { id });
        return res.status(200).json(data);
      }
      if (resource === 'users') { // self only, display_name only
        const patch = { display_name: cleanName(rest.display_name, user.email) };
        const { data, error } = await supabase.from('users').update(patch).eq('id', id).eq('guest_id', user.id).select().single();
        if (error) return fail(res, 400, error.message);
        return res.status(200).json(data);
      }
      return fail(res, 403, 'Not allowed');
    }

    // ---------- DELETE ----------
    if (req.method === 'DELETE') {
      const body = req.body || {};
      if (!user) return fail(res, 401, 'Login required');

      if (resource === 'likes' || resource === 'bookmarks') {
        const vid = Number(body.video_id);
        if (!Number.isInteger(vid)) return fail(res, 400, 'video_id required');
        const { error } = await supabase.from(resource).delete().eq('user_id', user.id).eq('video_id', vid);
        if (error) return fail(res, 400, error.message);
        return res.status(200).json({ success: true });
      }
      if (admin && ADMIN_DELETE.includes(resource) && body.id) {
        const { error } = await supabase.from(resource).delete().eq('id', body.id);
        if (error) return fail(res, 400, error.message);
        await audit(user, 'delete', resource, { id: body.id });
        return res.status(200).json({ success: true });
      }
      return fail(res, 403, 'Not allowed');
    }

    return fail(res, 405, `Method ${req.method} not allowed`);
  } catch (err) {
    console.error('api error:', err.message);
    return fail(res, 500, 'Internal server error');
  }
}
