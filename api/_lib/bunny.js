import crypto from 'node:crypto';

const b64url = buf => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const expiresIn = ttl => Math.floor(Date.now() / 1000) + ttl;

// BUNNY_TOKEN_SCHEME: 'hmac' (default, current bunny.net "HS256-" tokens) or 'sha256' (older Token Auth V2).
const scheme = () => (process.env.BUNNY_TOKEN_SCHEME || 'hmac').toLowerCase();

function makeToken(key, message) {
  if (scheme() === 'sha256') return b64url(crypto.createHash('sha256').update(key + message).digest());
  return 'HS256-' + b64url(crypto.createHmac('sha256', key).update(message).digest());
}

// Directory token: one signed playlist URL, all segments inherit it (needed for HLS).
export function signDirectory(host, key, dir, file, ttl = 3600) {
  const exp = expiresIn(ttl);
  const signing = `token_path=${dir}`;
  const message = `${dir}${exp}${signing}`;
  const token = makeToken(key, message);
  return `https://${host}/bcdn_token=${token}&expires=${exp}&token_path=${encodeURIComponent(dir)}${file}`;
}

// Single-file token for mp4.
export function signFile(host, key, path, ttl = 3600) {
  const exp = expiresIn(ttl);
  const token = makeToken(key, `${path}${exp}`);
  return `https://${host}${path}?token=${token}&expires=${exp}`;
}

