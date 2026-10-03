// Sandbox vs production is decided here (env CASHFREE_ENV, else by key prefix). The 2nd arg is ignored on purpose.
export const cfHost = (secret) => {
  const env = String(process.env.CASHFREE_ENV || '').toLowerCase();
  if (env === 'sandbox') return 'sandbox.cashfree.com';
  if (env === 'production') return 'api.cashfree.com';
  return String(secret || '').includes('_test_') ? 'sandbox.cashfree.com' : 'api.cashfree.com';
};

export const cfHeaders = (appId, secret) => ({
  accept: 'application/json',
  'content-type': 'application/json',
  'x-client-id': appId,
  'x-client-secret': secret,
  'x-api-version': '2023-08-01',
});

const origins = () => [process.env.APP_URL, ...(process.env.ALLOWED_ORIGINS || '').split(',')]
  .map(s => (s || '').trim().replace(/\/$/, '')).filter(Boolean);

// Client-supplied return URLs are accepted only if they point at our own origins.
export const safeReturnUrl = (candidate, fallbackQuery = '') => {
  const list = origins();
  const base = list[0] || '';
  const c = String(candidate || '');
  if (c && list.some(o => c === o || c.startsWith(o + '/') || c.startsWith(o + '?'))) return c;
  return base ? `${base}${fallbackQuery}` : '';
};

export const appUrl = () => origins()[0] || '';

export const cleanPhone = v => String(v || '').replace(/\D/g, '').slice(-10);
