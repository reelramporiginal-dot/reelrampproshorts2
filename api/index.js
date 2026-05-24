import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service_role key (secret, sirf server side)
);

export default async function handler(req, res) {
  const resource = req.url.replace('/api/', '').split('?')[0];
  const params = Object.fromEntries(new URL(req.url, 'http://x').searchParams);
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (method === 'OPTIONS') return res.status(200).end();

  try {
    if (method === 'GET') {
      let query = supabase.from(resource).select('*');
      
      // Filters
      if (params.guest_id) query = query.eq('guest_id', params.guest_id);
      if (params.user_id) query = query.eq('user_id', params.user_id);
      if (resource === 'videos' && !params.includeUnpublished) {
        query = query.eq('is_published', true);
      }
      
      const { data, error } = await query.order('id', { ascending: false }).limit(500);
      if (error) return res.status(400).json({ error: error.message });
      return res.json(data || []);
    }

    const body = req.body || {};

    if (method === 'POST') {
      const { data, error } = await supabase.from(resource).upsert(body).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    }

    if (method === 'PUT') {
      const { id, ...rest } = body;
      const { data, error } = await supabase.from(resource).update(rest).eq('id', id).select().single();
      if (error) return res.status(400).json({ error: error.message });
      return res.json(data);
    }

    if (method === 'DELETE') {
      const { id } = body;
      const { error } = await supabase.from(resource).delete().eq('id', id);
      if (error) return res.status(400).json({ error: error.message });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
