import supabase from './_supabase.js';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

const allowed = ['title','description','series_title','episode_number','video_filename','thumbnail_url','is_premium','is_published','duration_seconds','category','bunny_video_id','bunny_embed_url','age_rating','publish_at'];
function clean(body) {
  const out = {};
  for (const key of allowed) if (body[key] !== undefined) out[key] = body[key];
  if (out.episode_number !== undefined) out.episode_number = Number(out.episode_number || 1);
  if (out.duration_seconds !== undefined) out.duration_seconds = Number(out.duration_seconds || 0);
  if (out.is_premium !== undefined) out.is_premium = Boolean(out.is_premium);
  if (out.is_published !== undefined) out.is_published = Boolean(out.is_published);
  return out;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      const { includeUnpublished } = req.query;
      let q = supabase.from('videos').select('*').order('series_title', { ascending: true }).order('episode_number', { ascending: true });
      if (includeUnpublished !== 'true') q = q.eq('is_published', true);
      const { data, error } = await q;
      if (error) throw error;
      const now = Date.now();
      const filtered = (data || []).filter(v => includeUnpublished === 'true' || !v.publish_at || new Date(v.publish_at).getTime() <= now);
      return res.status(200).json(filtered);
    }
    if (req.method === 'POST') {
      const payload = clean(req.body || {});
      if (!payload.title) return res.status(400).json({ error: 'title required' });
      if (!payload.video_filename && !payload.bunny_video_id && !payload.bunny_embed_url) return res.status(400).json({ error: 'video filename, bunny video id, or embed url required' });
      const { data, error } = await supabase.from('videos').insert({
        description: '', series_title: 'ReelRamp Originals', episode_number: 1, thumbnail_url: '', is_premium: false, is_published: true, duration_seconds: 0, category: 'Drama', age_rating: 'U/A 13+', ...payload
      }).select().single();
      if (error) throw error;
      await supabase.from('audit_logs').insert({ actor: 'admin', action: 'create', resource: 'videos', resource_id: data.id, metadata: { title: data.title } });
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...body } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from('videos').update(clean(body)).eq('id', id).select().single();
      if (error) throw error;
      await supabase.from('audit_logs').insert({ actor: 'admin', action: 'update', resource: 'videos', resource_id: Number(id), metadata: { title: data.title } });
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      await supabase.from('audit_logs').insert({ actor: 'admin', action: 'delete', resource: 'videos', resource_id: Number(id), metadata: {} });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('videos api', err);
    return res.status(500).json({ error: err.message });
  }
}
