export default async function handler(req, res) {
  // Sirf GET aur POST methods allow karenge (tumhare admin panel ke liye)
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing env variables' });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Request ka path nikaalo (e.g., "users", "videos", "categories")
  const { path } = req.query;
  const tableName = path.join('/');  // "users" ya "videos/1" etc.
  
  // Sirf table name wale requests handle karo (e.g., /api/users)
  if (req.method === 'GET') {
    const { data, error } = await supabase.from(tableName).select('*');
    if (error) return res.status(500).json({ error });
    return res.status(200).json(data);
  }
  
  if (req.method === 'POST') {
    const { data, error } = await supabase.from(tableName).insert(req.body);
    if (error) return res.status(500).json({ error });
    return res.status(201).json(data);
  }
  
  // Agar aur methods chahiye toh add kar do, warna 405 return karo
  return res.status(405).json({ error: 'Method not allowed' });
}
