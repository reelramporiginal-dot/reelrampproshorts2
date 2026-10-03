import { api } from '../api/client';

type CfInstance = { checkout: (o: { paymentSessionId: string; redirectTarget?: string }) => Promise<unknown> };
const cf = () => (window as unknown as { Cashfree?: (o: { mode: string }) => CfInstance }).Cashfree;

let sdk: Promise<void> | null = null;
const loadSdk = () => (sdk ??= new Promise<void>((resolve, reject) => {
  if (cf()) return resolve();
  const s = document.createElement('script');
  s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
  s.onload = () => resolve();
  s.onerror = () => { sdk = null; reject(new Error('Payment page load nahi hua. Internet check karein.')); };
  document.head.appendChild(s);
}));

export const validPhone = (p: string) => /^[6-9]\d{9}$/.test(p);
export const savedPhone = () => { try { return localStorage.getItem('rr_phone') || ''; } catch { return ''; } };
const savePhone = (p: string) => { try { localStorage.setItem('rr_phone', p); } catch { /* ignore */ } };

// The server prices the order from its own tables; we only say WHAT is being bought.
export async function startCheckout(item: { plan_id: number } | { coin_pack_id: number }, phone: string, name = 'ReelRamp User') {
  savePhone(phone);
  const returnUrl = `${location.origin}${location.pathname}?cf_order={order_id}`;
  const o = await api<{ order_id: string; payment_session_id: string; mode: 'sandbox' | 'production' }>('cashfree/create-order', {
    method: 'POST',
    body: { ...item, customer_details: { customer_name: name, customer_phone: phone }, order_meta: { return_url: returnUrl } },
  });
  await loadSdk();
  const Cashfree = cf();
  if (!Cashfree) throw new Error('Payment page load nahi hua.');
  await Cashfree({ mode: o.mode }).checkout({ paymentSessionId: o.payment_session_id, redirectTarget: '_self' });
}
