export const cfHost = (secret, testMode) => {
  const prod = String(secret || '').startsWith('cfsk_ma_prod_') || String(secret || '').startsWith('cfsk_prod_');
  return prod ? 'api.cashfree.com' : (testMode ? 'sandbox.cashfree.com' : 'api.cashfree.com');
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

