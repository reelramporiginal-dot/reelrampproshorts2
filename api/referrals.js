import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Sirf simple select, koi filter nahi taaki error na aaye
      const { data, error } = await supabase
        .from('referrals')
        .select('*');

      if (error) throw error;
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { referrer_id, referred_id } = req.body;
      const { data, error } = await supabase
        .from('referrals')
        .insert([{ referrer_id, referred_id }]);
      
      if (error) throw error;
      return res.status(200).json({ data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
