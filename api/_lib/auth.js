
import { supabase } from './supabase.js';

export function setCors(req, res) {
  const o = req.headers.origin;
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (o && allowed.includes(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

// Returns { id, email, isAdmin } for a valid Supabase JWT, otherwise null.
export async function getUser(req) {
  const h = String(req.headers.authorization || '');
  if (!h.startsWith('Bearer ')) return null;
  const token = h.slice(7).trim();
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  const u = data.user;
  const email = (u.email || '').toLowerCase();
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const isAdmin = !!email && !!u.email_confirmed_at && admins.includes(email);
  return { id: u.id, email, isAdmin };
}

export const fail = (res, code, msg) => res.status(code).json({ error: msg, message: msg });
