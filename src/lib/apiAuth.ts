import supabase from './supabase';

// Attaches the Supabase access token to same-origin /api calls so the server can verify who is calling.
// Lets the legacy App.tsx keep working unchanged while /api enforces auth.
const origFetch = window.fetch.bind(window);

window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const sameOriginApi = url.startsWith('/api/') || url.startsWith(`${window.location.origin}/api/`);
    if (sameOriginApi) {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
        return origFetch(input, { ...init, headers });
      }
    }
  } catch { /* fall through to plain fetch */ }
  return origFetch(input, init);
};

