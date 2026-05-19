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
    const table = 'promo_campaigns';
    if (req.method === 'GET') {
      const { data, error } = await supabase.from(table).select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const b = req.body || {};
      const { data, error } = await supabase.from(table).insert({
        title: b.title || 'Special Subscription Offer',
        subtitle: b.subtitle || '',
        celebrity_name: b.celebrity_name || '',
        video_filename: b.video_filename || '',
        poster_url: b.poster_url || '',
        offer_text: b.offer_text || '',
        cta_label: b.cta_label || 'View Plan',
        cta_action: b.cta_action || 'plans',
        placement: b.placement || 'app_open',
        show_after_seconds: Number(b.show_after_seconds || 2),
        frequency_hours: Number(b.frequency_hours || 12),
        is_active: b.is_active !== false,
        sort_order: Number(b.sort_order || 0),
        updated_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...u } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      if (u.show_after_seconds !== undefined) u.show_after_seconds = Number(u.show_after_seconds);
      if (u.frequency_hours !== undefined) u.frequency_hours = Number(u.frequency_hours);
      if (u.sort_order !== undefined) u.sort_order = Number(u.sort_order);
      const { data, error } = await supabase.from(table).update({ ...u, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('promo_campaigns api', err);
    return res.status(500).json({ error: err.message });
  }
}
