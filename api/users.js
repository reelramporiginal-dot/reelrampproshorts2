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
    if (req.method === 'GET') {
      const { guest_id } = req.query;
      let query = supabase.from('users').select('*').order('created_at', { ascending: false });
      if (guest_id) query = query.eq('guest_id', guest_id);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body.guest_id) return res.status(400).json({ error: 'guest_id is required' });
      const existing = await supabase.from('users').select('*').eq('guest_id', body.guest_id).limit(1);
      if (existing.error) throw existing.error;
      if (existing.data && existing.data[0]) return res.status(200).json(existing.data[0]);
      const { data, error } = await supabase.from('users').insert({
        guest_id: body.guest_id,
        display_name: body.display_name || 'Guest Viewer',
        email: body.email || '',
        role: body.role || 'viewer',
        is_admin: Boolean(body.is_admin)
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ error: 'User id is required' });
      const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'User id is required' });
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Users API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
