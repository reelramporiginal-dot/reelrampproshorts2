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
      const { data, error } = await supabase.from('platform_settings').select('*').order('id', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      const { data, error } = await supabase.from('platform_settings').insert({
        site_name: body.site_name || 'ReelRamp Pro',
        hero_title: body.hero_title || 'Original short stories that stay with you',
        hero_subtitle: body.hero_subtitle || '',
        pwa_message: body.pwa_message || 'Install ReelRamp Pro for a cinematic app experience.',
        maintenance_mode: Boolean(body.maintenance_mode),
        updated_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Setting id is required' });
      const { data, error } = await supabase.from('platform_settings').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Setting id is required' });
      const { error } = await supabase.from('platform_settings').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Platform settings API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
