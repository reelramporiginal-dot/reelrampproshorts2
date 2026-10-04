// Best-effort rate limit (in-memory, per serverless instance). It blunts floods and scripts;
// it is NOT a hard global limit. Money safety never depends on it (DB unique keys + advisory locks do).
const buckets = new Map();

export const clientIp = req =>
  String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();

// Returns true when the request may continue. On false, a 429 has already been sent.
export function allow(req, res, name, max, windowMs = 60_000) {
  const now = Date.now();
  const key = `${name}|${clientIp(req)}`;
  let b = buckets.get(key);
  if (!b || now > b.reset) { b = { n: 0, reset: now + windowMs }; buckets.set(key, b); }
  b.n += 1;
  if (buckets.size > 5000) for (const [k, v] of buckets) if (now > v.reset) buckets.delete(k);
  if (b.n > max) {
    res.setHeader('Retry-After', String(Math.ceil((b.reset - now) / 1000)));
    res.status(429).json({ error: 'Too many requests. Thodi der baad try karein.', message: 'Too many requests' });
    return false;
  }
  return true;
}
