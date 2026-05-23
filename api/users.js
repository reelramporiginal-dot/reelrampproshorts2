const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  return res.status(500).json({ 
    error: 'Missing env: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    urlProvided: !!supabaseUrl,
    keyProvided: !!supabaseKey
  });
}
