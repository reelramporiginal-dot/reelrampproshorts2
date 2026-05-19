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
      const { user_id } = req.query;
      let query = supabase.from('subscriptions').select('*').order('created_at', { ascending: false });
      if (user_id) query = query.eq('user_id', user_id);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body.user_id) return res.status(400).json({ error: 'user_id is required' });
      const { data, error } = await supabase.from('subscriptions').insert({
        user_id: body.user_id,
        plan: body.plan || 'monthly',
        status: body.status || 'active',
        expires_at: body.expires_at || new Date(Date.now() + 30 * 86400000).toISOString()
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Subscription id is required' });
      const { data, error } = await supabase.from('subscriptions').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Subscription id is required' });
      const { error } = await supabase.from('subscriptions').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Subscriptions API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
