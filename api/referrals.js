export default async function handler(req, res) {
  // 1. GET Request: Data fetch karne ke liye
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('referrals').select('*');
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  }

  // 2. POST Request: Naya entry daalne ke liye
  if (req.method === 'POST') {
    const { referrer_id, referred_id } = req.body;
    const { data, error } = await supabase.from('referrals').insert([{ referrer_id, referred_id }]);
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ data });
  }

  res.status(405).json({ message: 'Method not allowed' });
}
