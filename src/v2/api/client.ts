import supabase from '../../lib/supabase';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

// Single door to /api. Adds the Supabase token when logged in; the server decides what is allowed.
export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data.session?.access_token) headers.Authorization = `Bearer ${data.session.access_token}`;
  const r = await fetch(`/api/${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const j = await r.json().catch(() => null);
  if (!r.ok) throw new ApiError(j?.error || `HTTP ${r.status}`, r.status);
  return j as T;
}

