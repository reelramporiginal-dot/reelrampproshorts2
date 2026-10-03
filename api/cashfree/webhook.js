// Cashfree webhook: verify signature -> dedupe -> grant entitlement server-side.
import crypto from 'node:crypto';
import { supabase } from '../_lib/supabase.js';

export const config = { api: { bodyParser: false } };

const readRaw = async req => { const c = []; for await (const x of req) c.push(x); return Buffer.concat(c).toString('utf8'); };

// Payload shapes differ across webhook versions, so look keys up defensively.
const find = (o, key) => {
  if (!o || typeof o !== 'object') return undefined;
  if (key in o && o[key] != null && typeof o[key] !== 'object') return o[key];
  for (const v of Object.values(o)) { const r = find(v, key); if (r !== undefined) return r; }
  return undefined;
};

const addDays = (from, days) => new Date(from.getTime() + days * 86400000);

async function latestExpiry(userId) {
  const { data } = await supabase.from('subscriptions').select('expires_at')
    .eq('user_id', userId).eq('status', 'active').order('expires_at', { ascending: false }).limit(1).maybeSingle();
  const t = data?.expires_at ? new Date(data.expires_at) : null;
  return t && t.getTime() > Date.now() ? t : new Date();
}

async function onOrderPaid(evt) {
  const orderId = find(evt.data?.order, 'order_id') || find(evt.data, 'order_id');
  const paidAmt = Number(find(evt.data?.order, 'order_amount') ?? find(evt.data, 'order_amount'));
  const status = String(find(evt.data?.payment, 'payment_status') || '');
  if (!orderId || status !== 'SUCCESS') return;

  const { data: pay } = await supabase.from('payments').select('*').eq('transaction_id', orderId).maybeSingle();
  if (!pay) { console.warn('webhook: unknown order', orderId); return; }
  if (pay.status === 'success') return;
  if (Number(pay.amount) !== paidAmt) {
    await supabase.from('payments').update({ status: 'amount_mismatch', notes: `paid ${paidAmt}` }).eq('id', pay.id);
    console.error('webhook: amount mismatch', orderId, pay.amount, paidAmt);
    return;
  }
  const { data: claimed } = await supabase.from('payments').update({ status: 'success' })
    .eq('id', pay.id).eq('status', 'pending').select().maybeSingle();
  if (!claimed) return; // another delivery already handled it

  if (pay.kind === 'coins') {
    const { error } = await supabase.rpc('grant_coins', { p_user: pay.user_id, p_coins: Number(pay.coins) || 0, p_reason: 'purchase', p_ref: `pack:${orderId}` });
    if (error) throw error; // let Cashfree retry; grant_coins is idempotent
    return;
  }

  const { data: plan } = await supabase.from('plans').select('*').eq('id', pay.plan_id).maybeSingle();
  const days = Number(plan?.duration_days) || 30;
  const start = await latestExpiry(pay.user_id);
  await supabase.from('subscriptions').insert({
    user_id: pay.user_id, plan: plan?.name || pay.notes || 'premium', plan_id: pay.plan_id, status: 'active',
    expires_at: addDays(start, days).toISOString(), provider: 'cashfree', provider_ref: orderId, amount: pay.amount,
  });
}

async function onOrderFailed(evt) {
  const orderId = find(evt.data?.order, 'order_id') || find(evt.data, 'order_id');
  if (orderId) await supabase.from('payments').update({ status: 'failed' }).eq('transaction_id', orderId).eq('status', 'pending');
}

async function onSubStatus(evt) {
  const subId = find(evt.data, 'subscription_id');
  const st = String(find(evt.data, 'subscription_status') || find(evt.data, 'status') || '').toUpperCase();
  if (!subId) return;
  const { data: row } = await supabase.from('subscriptions').select('*').eq('provider_ref', subId).maybeSingle();
  if (!row) return;
  if (st === 'ACTIVE') {
    if (row.status === 'active') return;
    const exp = addDays(new Date(), Number(row.trial_days) || 0); // access during trial window
    await supabase.from('subscriptions').update({ status: 'active', expires_at: exp.toISOString() }).eq('id', row.id);
  } else if (['CANCELLED', 'COMPLETED', 'EXPIRED'].includes(st)) {
    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', row.id); // access until expires_at is not re-granted
  } else if (st === 'ON_HOLD') {
    await supabase.from('subscriptions').update({ status: 'on_hold' }).eq('id', row.id);
  }
}

async function onSubPaid(evt) {
  const subId = find(evt.data, 'subscription_id');
  const amt = Number(find(evt.data, 'payment_amount') ?? find(evt.data, 'amount'));
  if (!subId) return;
  const { data: row } = await supabase.from('subscriptions').select('*').eq('provider_ref', subId).maybeSingle();
  if (!row) return;
  if (!(amt >= Number(row.amount))) return; // trial/authorization charge: trial access is set on ACTIVE
  const { data: plan } = await supabase.from('plans').select('duration_days').eq('id', row.plan_id).maybeSingle();
  const days = Number(plan?.duration_days) || 30;
  const base = row.expires_at && new Date(row.expires_at).getTime() > Date.now() ? new Date(row.expires_at) : new Date();
  await supabase.from('subscriptions').update({ status: 'active', expires_at: addDays(base, days).toISOString() }).eq('id', row.id);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!secret) return res.status(500).end();

  const raw = await readRaw(req);
  const ts = String(req.headers['x-webhook-timestamp'] || '');
  const sig = String(req.headers['x-webhook-signature'] || '');
  const expected = crypto.createHmac('sha256', secret).update(ts + raw).digest('base64');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (!sig || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(401).json({ error: 'bad signature' });

  let evt;
  try { evt = JSON.parse(raw); } catch { return res.status(400).json({ error: 'bad json' }); }

  try {
    // Idempotency: one row per delivery key. Duplicate => already processed.
    const key = crypto.createHash('sha256').update(`${evt.type}|${ts}|${raw}`).digest('hex');
    const { error: dupErr } = await supabase.from('webhook_events').insert({ event_key: key, type: String(evt.type || ''), payload: evt });
    if (dupErr) {
      if (dupErr.code === '23505') return res.status(200).json({ ok: true, duplicate: true });
      throw dupErr;
    }

    switch (evt.type) {
      case 'PAYMENT_SUCCESS_WEBHOOK': await onOrderPaid(evt); break;
      case 'PAYMENT_FAILED_WEBHOOK':
      case 'PAYMENT_USER_DROPPED_WEBHOOK': await onOrderFailed(evt); break;
      case 'SUBSCRIPTION_STATUS_CHANGE':
      case 'SUBSCRIPTION_STATUS_CHANGED': await onSubStatus(evt); break;
      case 'SUBSCRIPTION_PAYMENT_SUCCESS': await onSubPaid(evt); break;
      default: break; // logged in webhook_events, no action
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('webhook processing error:', e.message);
    return res.status(500).json({ error: 'processing failed' }); // Cashfree will retry
  }
}
