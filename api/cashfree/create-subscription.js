// Creates a Cashfree auto-pay mandate. Recurring price must match an active plan; trial is capped.
import { supabase } from '../_lib/supabase.js';
import { setCors, getUser, fail } from '../_lib/auth.js';
import { cfHost, cfHeaders, safeReturnUrl, cleanPhone } from '../_lib/cashfree.js';

const INTERVAL_TYPES = ['DAY', 'WEEK', 'MONTH', 'YEAR'];
const MAX_TRIAL_PRICE = 10;
const MAX_TRIAL_DAYS = 7;

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

    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET_KEY;
    if (!appId || !secret) return fail(res, 500, 'Payment gateway not configured');

    const recurring = Number(b.recurring_price);
    const { data: plan } = await supabase.from('plans').select('*').eq('price', recurring).eq('is_active', true).limit(1).maybeSingle();
    if (!plan) return fail(res, 400, 'Unknown plan or price');

    const trialPrice = Math.min(Math.max(Number(b.trial_price ?? 1), 1), MAX_TRIAL_PRICE);
    const trialDays = Math.min(Math.max(parseInt(b.trial_days ?? 2, 10) || 0, 0), MAX_TRIAL_DAYS);
    const intervals = Math.min(Math.max(parseInt(b.intervals ?? 1, 10) || 1, 1), 12);
    const intervalType = INTERVAL_TYPES.includes(String(b.interval_type)) ? String(b.interval_type) : 'MONTH';

    const host = cfHost(secret, b.testMode);
    const hdr = cfHeaders(appId, secret);

    const planId = `rr_plan_${recurring}_${intervals}${intervalType[0]}`;
    const planRes = await fetch(`https://${host}/pg/plans`, {
      method: 'POST', headers: hdr,
      body: JSON.stringify({
        plan_id: planId, plan_name: `ReelRamp Auto-Pay ${recurring}`, plan_type: 'PERIODIC', plan_currency: 'INR',
        plan_recurring_amount: recurring, plan_max_amount: recurring, plan_max_cycles: 99,
        plan_intervals: intervals, plan_interval_type: intervalType,
      }),
    });
    const planData = await planRes.json().catch(() => ({}));
    // Plan id is deterministic now; "already exists" is fine.
    const planOk = planRes.ok || planRes.status === 409 || /exist/i.test(String(planData?.message || ''));
    if (!planOk) return fail(res, 502, 'Cashfree plan setup failed');

    const subId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const expiry = new Date(); expiry.setFullYear(expiry.getFullYear() + 10);
    const first = new Date(); first.setDate(first.getDate() + trialDays);
    const iso = d => d.toISOString().split('.')[0] + '+05:30';

    const { error: insErr } = await supabase.from('subscriptions').insert({
      user_id: user.id, plan: plan.name, plan_id: plan.id, status: 'pending', expires_at: null,
      provider: 'cashfree', provider_ref: subId, amount: recurring, trial_days: trialDays,
    });
    if (insErr) return fail(res, 500, 'Could not record subscription');

    const r = await fetch(`https://${host}/pg/subscriptions`, {
      method: 'POST', headers: hdr,
      body: JSON.stringify({
        subscription_id: subId,
        customer_details: {
          customer_id: user.id,
          customer_name: String(b.customer_details?.customer_name || 'ReelRamp User').slice(0, 80),
          customer_email: user.email || 'user@reelramp.com',
          customer_phone: phone,
        },
        plan_details: { plan_id: planId },
        authorization_details: { authorization_amount: trialPrice, authorization_amount_refund: false, payment_methods: ['upi', 'card'] },
        subscription_meta: { return_url: safeReturnUrl(b.return_url, `?cf_sub=${subId}`) },
        subscription_expiry_time: iso(expiry),
        subscription_first_charge_time: iso(first),
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      await supabase.from('subscriptions').update({ status: 'failed' }).eq('provider_ref', subId);
      console.error('cashfree subscription error:', data?.message);
      return fail(res, 502, data?.message || 'Subscription create failed');
    }
    return res.status(200).json({
      subscription_id: data.subscription_id,
      sub_auth_url: data.subscription_meta?.sub_auth_url || data.sub_auth_url || '',
      session_id: data.session_id || '',
    });
  } catch (e) {
    console.error('create-subscription error:', e.message);
    return fail(res, 500, 'Internal server error');
  }
}
