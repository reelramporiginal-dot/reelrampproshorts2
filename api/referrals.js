import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { referrer_id, referred_id } = req.body;
    const { data, error } = await supabase
      .from('referrals')
      .insert([{ referrer_id, referred_id }]);
    
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ data });
  }
  res.status(405).json({ message: 'Method not allowed' });
}
