export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // GET all videos
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('videos').select('*');
    if (error) return res.status(500).json({ error });
    return res.status(200).json(data);
  }

  // POST new video
  if (req.method === 'POST') {
    const { data, error } = await supabase.from('videos').insert(req.body);
    if (error) return res.status(500).json({ error });
    return res.status(201).json(data);
  }

  // PUT update video
  if (req.method === 'PUT') {
    const { id, ...updates } = req.body;
    const { data, error } = await supabase.from('videos').update(updates).eq('id', id);
    if (error) return res.status(500).json({ error });
    return res.status(200).json(data);
  }

  // DELETE video
  if (req.method === 'DELETE') {
    const { id } = req.body;
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) return res.status(500).json({ error });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
