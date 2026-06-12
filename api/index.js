import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const INSERT_ONLY = [
  'video_views', 'payments', 'subscriptions', 'support_tickets',
  'content_reports', 'audit_logs', 'promo_events',
  'error_logs', 'push_subscriptions'
];

const CONFLICT_MAP = {
  users: 'guest_id',
  admin_settings: 'key',
  categories: 'id',
  plans: 'id',
  series: 'id',
  videos: 'id',
  banners: 'id',
  popup_settings: 'id',
  platform_settings: 'id',
  legal_policies: 'id',
  help_articles: 'id',
  promo_campaigns: 'id',
  notifications: 'id',
  wallet_transactions: 'id',
  referrals: 'id',
  likes: 'user_id,video_id',
  bookmarks: 'user_id,video_id',
  watch_history: 'user_id,video_id',
};

// ── Clean display name: agar email ya empty hai to email se proper name banao ──
function cleanDisplayName(displayName, email) {
  const dn = (displayName || '').trim();
  // Agar display_name khali hai ya email jaisa hai (contains @)
  if (!dn || dn.includes('@')) {
    const source = (dn.includes('@') ? dn : email) || '';
    if (!source) return dn || 'User';
    const namePart = source.split('@')[0];
    return namePart
      .replace(/[._\d]+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ') || 'User';
  }
  return dn;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const urlPath = req.url.split('?')[0].replace(/^\/api\//, '');
  const resource = urlPath || 'videos';

  let searchParams;
  try {
    searchParams = new URL(req.url, `https://${req.headers.host || 'localhost'}`).searchParams;
  } catch {
    searchParams = new URLSearchParams();
  }

  console.log(`[${req.method}] /api/${resource}`);

  try {

    if (req.method === 'GET') {
      let query = supabase.from(resource).select('*');

      if (searchParams.get('guest_id'))
        query = query.eq('guest_id', searchParams.get('guest_id'));

      if (searchParams.get('user_id'))
        query = query.eq('user_id', searchParams.get('user_id'));

      if (resource === 'videos' && !searchParams.get('includeUnpublished'))
        query = query.eq('is_published', true);

      const { data, error } = await query.order('id', { ascending: false }).limit(500);

      if (error) {
        console.error(`GET ${resource} error:`, error.message);
        return res.status(400).json({ error: error.message });
      }
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object')
        return res.status(400).json({ error: 'Invalid body' });

      if (resource === 'json_import') {
        const { resource: target, rows, dryRun } = body;
        if (!target || !Array.isArray(rows))
          return res.status(400).json({ error: 'resource and rows[] required' });
        if (dryRun)
          return res.status(200).json({ valid: true, count: rows.length, dryRun: true });
        const { data, error } = await supabase.from(target).upsert(rows).select();
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ imported: data?.length || 0 });
      }

      let data, error;

      if (resource === 'users') {
        // ── FIX: display_name kabhi email nahi honi chahiye ──
        const cleanedBody = { ...body };
        cleanedBody.display_name = cleanDisplayName(body.display_name, body.email);

        ({ data, error } = await supabase
          .from(resource)
          .upsert(cleanedBody, { onConflict: 'guest_id' })
          .select()
          .single());

      } else if (resource === 'likes' || resource === 'bookmarks') {
        ({ data, error } = await supabase
          .from(resource)
          .upsert(body, { onConflict: 'user_id,video_id', ignoreDuplicates: true })
          .select()
          .single());

      } else if (resource === 'watch_history') {
        ({ data, error } = await supabase
          .from(resource)
          .upsert(body, { onConflict: 'user_id,video_id' })
          .select()
          .single());

      } else if (INSERT_ONLY.includes(resource)) {
        ({ data, error } = await supabase
          .from(resource)
          .insert(body)
          .select()
          .single());

      } else {
        const onConflict = CONFLICT_MAP[resource] || 'id';
        ({ data, error } = await supabase
          .from(resource)
          .upsert(body, { onConflict })
          .select()
          .single());
      }

      if (error) {
        console.error(`POST ${resource} error:`, error.message, '| body:', JSON.stringify(body));
        return res.status(400).json({ error: error.message });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const body = req.body;
      if (!body?.id) return res.status(400).json({ error: 'id required for PUT' });
      const { id, ...rest } = body;

      // ── FIX: PUT /api/users mein bhi display_name clean karo ──
      if (resource === 'users' && 'display_name' in rest) {
        rest.display_name = cleanDisplayName(rest.display_name, rest.email);
      }

      const { data, error } = await supabase
        .from(resource)
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`PUT ${resource} error:`, error.message);
        return res.status(400).json({ error: error.message });
      }
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const body = req.body;
      let error;

      if (body?.id) {
        ({ error } = await supabase.from(resource).delete().eq('id', body.id));
      } else if (body?.user_id && body?.video_id) {
        ({ error } = await supabase
          .from(resource)
          .delete()
          .eq('user_id', body.user_id)
          .eq('video_id', body.video_id));
      } else {
        return res.status(400).json({ error: 'id or user_id+video_id required' });
      }

      if (error) {
        console.error(`DELETE ${resource} error:`, error.message);
        return res.status(400).json({ error: error.message });
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });

  } catch (err) {
    console.error('Unhandled error:', err.message);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
