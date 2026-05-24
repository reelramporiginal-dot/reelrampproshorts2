import { createClient } from '@supabase/supabase-js';

// Vercel environment variables se aayenge
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_KEY required');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Jinhe filter karna hai user_id ya guest_id se
const USER_FILTERED = ['subscriptions', 'payments', 'watch_history', 'likes', 'bookmarks', 'wallet_transactions', 'referrals'];

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Resource name URL se nikalo: /api/watch_history → watch_history
  const urlPath = req.url.split('?')[0].replace(/^\/api\//, '');
  const resource = urlPath || 'videos';
  const searchParams = new URL(req.url, `https://${req.headers.host || 'x.com'}`).searchParams;

  console.log(`[${req.method}] /api/${resource}`);

  try {
    // ── GET ──────────────────────────────────────────────
    if (req.method === 'GET') {
      let query = supabase.from(resource).select('*');

      // guest_id filter (users table)
      if (searchParams.get('guest_id')) {
        query = query.eq('guest_id', searchParams.get('guest_id'));
      }

      // user_id filter
      if (searchParams.get('user_id')) {
        query = query.eq('user_id', searchParams.get('user_id'));
      }

      // Videos: unpublished sirf admin ke liye
      if (resource === 'videos' && !searchParams.get('includeUnpublished')) {
        query = query.eq('is_published', true);
      }

      const { data, error } = await query
        .order('id', { ascending: false })
        .limit(500);

      if (error) {
        console.error(`GET ${resource} error:`, error);
        return res.status(400).json({ error: error.message });
      }
      return res.status(200).json(data || []);
    }

    // ── POST ─────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = req.body;
      if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Invalid request body' });
      }

      // json_import special route
      if (resource === 'json_import') {
        const { resource: targetResource, rows, dryRun } = body;
        if (!targetResource || !Array.isArray(rows)) {
          return res.status(400).json({ error: 'resource and rows[] required' });
        }
        if (dryRun) {
          return res.status(200).json({ valid: true, count: rows.length, dryRun: true });
        }
        const { data, error } = await supabase.from(targetResource).upsert(rows).select();
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ imported: data?.length || 0 });
      }

      const { data, error } = await supabase
        .from(resource)
        .upsert(body, { onConflict: resource === 'users' ? 'guest_id' : 'id' })
        .select()
        .single();

      if (error) {
        console.error(`POST ${resource} error:`, error);
        return res.status(400).json({ error: error.message });
      }
      return res.status(200).json(data);
    }

    // ── PUT ──────────────────────────────────────────────
    if (req.method === 'PUT') {
      const body = req.body;
      if (!body?.id) return res.status(400).json({ error: 'id required for PUT' });
      const { id, ...rest } = body;

      const { data, error } = await supabase
        .from(resource)
        .update(rest)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`PUT ${resource} error:`, error);
        return res.status(400).json({ error: error.message });
      }
      return res.status(200).json(data);
    }

    // ── DELETE ───────────────────────────────────────────
    if (req.method === 'DELETE') {
      const body = req.body;
      
      // id se delete
      if (body?.id) {
        const { error } = await supabase.from(resource).delete().eq('id', body.id);
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      // likes/bookmarks: user_id + video_id se delete
      if (body?.user_id && body?.video_id) {
        const { error } = await supabase
          .from(resource)
          .delete()
          .eq('user_id', body.user_id)
          .eq('video_id', body.video_id);
        if (error) return res.status(400).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'id or user_id+video_id required for DELETE' });
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });

  } catch (err) {
    console.error('Unhandled error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
