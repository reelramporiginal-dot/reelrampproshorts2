import supabase from './_supabase.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const table = 'watch_history';
    if (req.method === 'GET') {
      const { user_id } = req.query;
      let q = supabase.from(table).select('*').order('updated_at', { ascending: false }).limit(100);
      if (user_id) q = q.eq('user_id', user_id);
      const { data, error } = await q;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.user_id || !b.video_id) return res.status(400).json({ error: 'user_id and video_id required' });
      const payload = {
        user_id: String(b.user_id),
        video_id: Number(b.video_id),
        current_time: Number(b.current_time || 0),
        duration: Number(b.duration || 0),
        completed: Boolean(b.completed),
        updated_at: new Date().toISOString()
      };
      const existing = await supabase.from(table).select('id').eq('user_id', payload.user_id).eq('video_id', payload.video_id).limit(1);
      if (existing.error) throw existing.error;
      if (existing.data?.[0]?.id) {
        const { data, error } = await supabase.from(table).update(payload).eq('id', existing.data[0].id).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...u } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from(table).update({ ...u, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id, user_id } = req.body || {};
      let q = supabase.from(table).delete();
      if (id) q = q.eq('id', id); else if (user_id) q = q.eq('user_id', user_id); else return res.status(400).json({ error: 'id or user_id required' });
      const { error } = await q;
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('watch_history api', err);
    return res.status(500).json({ error: err.message });
  }
}
