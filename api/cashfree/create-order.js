// Creates a Cashfree order. Price comes from the `plans` table, never from the browser.
import { supabase } from '../_lib/supabase.js';
import { setCors, getUser, fail } from '../_lib/auth.js';
import { cfHost, cfHeaders, safeReturnUrl, appUrl, cleanPhone } from '../_lib/cashfree.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return fail(res, 405, 'Method not allowed');

  try {
    const user = await getUser(req);
    if (!user) return fail(res, 401, 'Login required');

    const b = req.body || {};
    const phone = cleanPhone(b.customer_details?.customer_phone);
    if (phone.length < 10) return fail(res, 400, 'Mobile number must be exactly 10 digits.');

    // Resolve plan: explicit plan_id, else an exact match on an active plan's price.
    let plan = null;
    if (b.plan_id) {
      ({ data: plan } = await supabase.from('plans').select('*').eq('id', b.plan_id).eq('is_active', true).maybeSingle());
    } else {
      const amt = Number(b.order_amount);
      if (Number.isFinite(amt) && amt > 0) {
        ({ data: plan } = await supabase.from('plans').select('*').eq('price', amt).eq('is_active', true).limit(1).maybeSingle());
      }
    }
    if (!plan) return fail(res, 400, 'Unknown plan or price');

    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secret) return fail(res, 500, 'Payment gateway not configured');
    if (!appUrl()) return fail(res, 500, 'APP_URL not configured');

    const orderId = `rrp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { error: insErr } = await supabase.from('payments').insert({
      user_id: user.id, plan_id: plan.id, amount: plan.price, gateway: 'cashfree',
      status: 'pending', transaction_id: orderId, notes: String(plan.name || '').slice(0, 120),
    });
    if (insErr) return fail(res, 500, 'Could not record payment');

    const payload = {
      order_id: orderId,
      order_amount: Number(plan.price),
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id,
        customer_name: String(b.customer_details?.customer_name || 'ReelRamp User').slice(0, 80),
        customer_email: user.email || 'user@reelramp.com',
        customer_phone: phone,
      },
      order_meta: {
        return_url: safeReturnUrl(b.order_meta?.return_url, '?cf_order={order_id}&cf_payment={payment_id}'),
        notify_url: `${appUrl()}/api/cashfree/webhook`,
      },
      order_note: String(plan.name || '').slice(0, 120),
    };

    const r = await fetch(`https://${cfHost(secret, b.testMode)}/pg/orders`, {
      method: 'POST', headers: cfHeaders(appId, secret), body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) {
      await supabase.from('payments').update({ status: 'failed' }).eq('transaction_id', orderId);
      console.error('cashfree order error:', data?.message);
      return fail(res, 502, data?.message || 'Order create failed');
    }
    return res.status(200).json({ order_id: data.order_id, payment_session_id: data.payment_session_id });
  } catch (e) {
    console.error('create-order error:', e.message);
    return fail(res, 500, 'Internal server error');
  }
}
