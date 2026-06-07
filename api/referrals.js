import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // 1. Data Fetch karne ke liye (GET request)
  if (req.method === 'GET') {
    const { user_id } = req.query;
    
    // Yahan hum database se data mang rahe hain
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .or(`referrer_id.eq.${user_id},referred_id.eq.${user_id}`);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  // 2. Naya data save karne ke liye (POST request)
  if (req.method === 'POST') {
    const { referrer_id, referred_id } = req.body;
    
    const { data, error } = await supabase
      .from('referrals')
      .insert([{ referrer_id, referred_id }]);
    
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ data });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
