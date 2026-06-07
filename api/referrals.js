import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      console.log("Fetching for user_id:", user_id); // Ye Vercel logs mein dikhega

      if (!user_id) {
        return res.status(400).json({ error: "Missing user_id" });
      }

      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .or(`referrer_id.eq.${user_id},referred_id.eq.${user_id}`);

      if (error) {
        console.error("Supabase Query Error:", error);
        return res.status(400).json({ error: error.message });
      }
      return res.status(200).json(data);
    }

    // ... (POST logic waisa hi rahega)
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error("Critical Server Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
