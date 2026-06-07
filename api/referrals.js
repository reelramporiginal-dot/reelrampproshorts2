import { createClient } from '@supabase/supabase-js';

// Aapke Vercel variables se key utha raha hai
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Agar request POST nahi hai, toh error dega
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { referrer_id, referred_id } = req.body;

    // Database mein data insert kar raha hai
    const { data, error } = await supabase
      .from('referrals')
      .insert([{ referrer_id, referred_id }]);
    
    if (error) {
      console.error("Supabase Error:", error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
