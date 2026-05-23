export default async function handler(req, res) {
  // 1️⃣ CORS headers (admin panel ke liye)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS request (preflight) handle
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2️⃣ Supabase client (service role key se, isliye sab allowed)
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Vercel env' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 3️⃣ URL se table name nikaalo
  // Example: /api/users -> table = "users"
  //        /api/videos -> table = "videos"
  const { path } = req.query;  // path ek array hoga, e.g., ['users']
  const tableName = path[0];   // pehla part table name hai

  if (!tableName) {
    return res.status(400).json({ error: 'Table name missing in URL' });
  }

  // 4️⃣ Method ke according operation
  try {
    if (req.method === 'GET') {
      // SELECT * from table
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // INSERT into table
      const { data, error } = await supabase.from(tableName).insert(req.body);
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      // UPDATE : body mein { id, ...updates } hona chahiye
      const { id, ...updates } = req.body;
      if (!id) throw new Error('Missing id for PUT');
      const { data, error } = await supabase.from(tableName).update(updates).eq('id', id);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      // DELETE : body mein { id } hona chahiye
      const { id } = req.body;
      if (!id) throw new Error('Missing id for DELETE');
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return res.status(204).end();
    }

    // Agar koi aur method ho to 405
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
