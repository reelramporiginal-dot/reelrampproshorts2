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
      const { includeUnpublished } = req.query;
      let query = supabase.from('videos').select('*').order('series_title', { ascending: true }).order('episode_number', { ascending: true });
      if (includeUnpublished !== 'true') query = query.eq('is_published', true);
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }
    if (req.method === 'POST') {
      const body = req.body || {};
      if (!body.title || !body.video_filename) return res.status(400).json({ error: 'Title and video filename are required' });
      const { data, error } = await supabase.from('videos').insert({
        title: body.title,
        description: body.description || '',
        series_title: body.series_title || 'ReelRamp Originals',
        episode_number: Number(body.episode_number || 1),
        video_filename: body.video_filename,
        thumbnail_url: body.thumbnail_url || '',
        is_premium: Boolean(body.is_premium),
        is_published: body.is_published !== false,
        duration_seconds: Number(body.duration_seconds || 0),
        category: body.category || 'Drama'
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Video id is required' });
      const clean = { ...updates };
      if (clean.episode_number !== undefined) clean.episode_number = Number(clean.episode_number);
      if (clean.duration_seconds !== undefined) clean.duration_seconds = Number(clean.duration_seconds);
      const { data, error } = await supabase.from('videos').update(clean).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'Video id is required' });
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Videos API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
