import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  // Debugging: Check karo ki keys aa rahi hain ya nahi
  if (!url || !key) {
    console.error("Missing Environment Variables!");
    return res.status(500).json({ error: "Missing Env Vars" });
  }

  const supabase = createClient(url, key);

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.from('referrals').select('*');
      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      console.error("GET Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { referrer_id, referred_id } = req.body;
      const { data, error } = await supabase.from('referrals').insert([{ referrer_id, referred_id }]);
      if (error) throw error;
      return res.status(200).json({ data });
    } catch (err) {
      console.error("POST Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
