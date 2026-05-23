export default async function handler(req, res) {
  // 1️⃣ Sirf POST request allow karein
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed - Sirf POST requests allowed' });
  }

  // 2️⃣ Supabase client banayein
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Environment variables missing' });
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 3️⃣ Request body se data leke users table mein insert karein
    const { data, error } = await supabase
      .from('users')
      .insert([req.body]); // req.body contains user data

    if (error) throw error;

    return res.status(200).json({ message: 'User created successfully', data });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
