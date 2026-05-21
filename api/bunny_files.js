const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || 'trrlramp2';
const STORAGE_ENDPOINT = (process.env.BUNNY_STORAGE_ENDPOINT || `https://storage.bunnycdn.com/${STORAGE_ZONE}`).replace(/\/$/, '');
const ACCESS_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
function requireKey(res) {
  if (!ACCESS_PASSWORD) {
    res.status(500).json({ error: 'BUNNY_STORAGE_PASSWORD env var is required on Vercel/server. Do not expose it in frontend code.' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (!requireKey(res)) return;
    if (req.method === 'GET') {
      const path = String(req.query.path || '').replace(/^\/+/, '');
      const response = await fetch(`${STORAGE_ENDPOINT}/${path}`, { headers: { AccessKey: ACCESS_PASSWORD } });
      const text = await response.text();
      if (!response.ok) return res.status(response.status).json({ error: text || 'Bunny list failed' });
      let data;
      try { data = JSON.parse(text); } catch { data = text; }
      return res.status(200).json({ storageZone: STORAGE_ZONE, path, files: data });
    }
    if (req.method === 'POST') {
      const { filename, contentBase64, folder = '' } = req.body || {};
      if (!filename || !contentBase64) return res.status(400).json({ error: 'filename and contentBase64 required' });
      const cleanFolder = String(folder).replace(/^\/+|\/+$/g, '');
      const cleanName = String(filename).replace(/^\/+/, '');
      const target = cleanFolder ? `${cleanFolder}/${cleanName}` : cleanName;
      const buffer = Buffer.from(String(contentBase64).split(',').pop(), 'base64');
      const response = await fetch(`${STORAGE_ENDPOINT}/${target}`, { method: 'PUT', headers: { AccessKey: ACCESS_PASSWORD, 'Content-Type': 'application/octet-stream' }, body: buffer });
      const text = await response.text();
      if (!response.ok) return res.status(response.status).json({ error: text || 'Bunny upload failed' });
      return res.status(201).json({ ok: true, filename: target, response: text });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('bunny_files api', err);
    return res.status(500).json({ error: err.message });
  }
}
