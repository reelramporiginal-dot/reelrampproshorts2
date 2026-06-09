// api/cashfree/webhook.js
// ─────────────────────────────────────────────────────────────────
// Vercel Serverless Function — Cashfree Webhook Handler
// Payment success hone par automatically subscription activate karta hai
// Supabase mein payments + subscriptions table update karta hai
// ─────────────────────────────────────────────────────────────────

const crypto = require('crypto');

// ── Supabase direct REST call (no SDK needed) ─────────────────────
async function supabaseQuery(table, method, body, matchQuery = '') {
  const url = `${process.env.VITE_SUPABASE_URL}/rest/v1/${table}${matchQuery}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type':  'application/json',
      'apikey':        process.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY}`,
      'Prefer':        method === 'POST' ? 'return=representation' : 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase ${table} ${method} failed: ${err}`);
  }
  return method === 'GET' ? res.json() : res.json().catch(() => ({}));
}

module.exports = async function handler(req, res) {

  // Cashfree sirf POST bhejta hai
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const rawBody   = JSON.stringify(req.body);
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    // ── Signature verify (optional but recommended) ───────────────
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (webhookSecret && signature && timestamp) {
      const signedPayload = timestamp + rawBody;
      const expectedSig   = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('base64');
      if (expectedSig !== signature) {
        console.warn('Webhook signature mismatch — ignoring');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;
    const eventType = event?.type || event?.event_type || '';
    console.log('Cashfree Webhook Event:', eventType, JSON.stringify(event).slice(0, 300));

    // ── One-time Payment Success ──────────────────────────────────
    if (
      eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
      eventType === 'ORDER_PAID'              ||
      event?.data?.payment?.payment_status === 'SUCCESS'
    ) {
      const payment    = event?.data?.payment || event?.data || {};
      const order      = event?.data?.order   || {};
      const cfOrderId  = order.order_id  || payment.order_id  || '';
      const cfPayId    = payment.cf_payment_id || payment.payment_id || '';
      const amount     = Number(payment.payment_amount || order.order_amount || 0);

      if (!cfOrderId) {
        console.warn('No order_id in webhook payload');
        return res.status(200).json({ received: true });
      }

      // 1. payments table mein status update karo
      await supabaseQuery(
        'payments', 'PATCH',
        { status: 'success', cf_payment_id: cfPayId },
        `?cf_order_id=eq.${cfOrderId}`
      ).catch(e => console.error('Payment update error:', e));

      // 2. Pending payment dhundo user_id ke liye
      const existingPayments = await supabaseQuery(
        'payments', 'GET', null,
        `?cf_order_id=eq.${cfOrderId}&select=user_id,plan_id`
      ).catch(() => []);

      const payRow = Array.isArray(existingPayments) ? existingPayments[0] : null;

      if (payRow?.user_id && payRow?.plan_id) {
        // 3. Plan details lo
        const plans = await supabaseQuery(
          'plans', 'GET', null,
          `?id=eq.${payRow.plan_id}&select=name,duration_days`
        ).catch(() => []);
        const plan = Array.isArray(plans) ? plans[0] : null;

        if (plan) {
          const expiresAt = new Date(
            Date.now() + (plan.duration_days || 30) * 86400000
          ).toISOString();

          // 4. Subscription activate karo
          await supabaseQuery('subscriptions', 'POST', {
            user_id:     payRow.user_id,
            plan:        plan.name,
            plan_id:     payRow.plan_id,
            status:      'active',
            expires_at:  expiresAt,
            auto_renew:  false,
            renewal_date: expiresAt,
            gateway:     'Cashfree',
          }).catch(e => console.error('Subscription insert error:', e));

          console.log(`✅ Subscription activated for user ${payRow.user_id} — ${plan.name}`);
        }
      }
    }

    // ── Subscription / Auto-Pay Events ────────────────────────────
    else if (
      eventType === 'SUBSCRIPTION_PAYMENT_SUCCESS' ||
      eventType === 'SUBSCRIPTION_ACTIVATED'
    ) {
      const sub     = event?.data?.subscription || event?.data || {};
      const payment = event?.data?.payment || {};
      const subId   = sub.subscription_id || sub.cf_subscription_id || '';
      const cfPayId = payment.cf_payment_id || '';
      const amount  = Number(payment.payment_amount || 0);

      // subscriptions table dhundo by cf_subscription_id
      const existing = await supabaseQuery(
        'subscriptions', 'GET', null,
        `?cf_subscription_id=eq.${subId}&select=id,plan_id,user_id`
      ).catch(() => []);

      const subRow = Array.isArray(existing) ? existing[0] : null;

      if (subRow) {
        // Plan details lo
        const plans = await supabaseQuery(
          'plans', 'GET', null,
          `?id=eq.${subRow.plan_id}&select=name,duration_days`
        ).catch(() => []);
        const plan = Array.isArray(plans) ? plans[0] : null;
        const days = plan?.duration_days || 30;

        const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

        // Subscription extend karo
        await supabaseQuery(
          'subscriptions', 'PATCH',
          { status: 'active', expires_at: expiresAt, renewal_date: expiresAt },
          `?cf_subscription_id=eq.${subId}`
        ).catch(e => console.error('Sub extend error:', e));

        // Payment record karo
        if (subRow.user_id && amount > 0) {
          await supabaseQuery('payments', 'POST', {
            user_id:           subRow.user_id,
            plan_id:           subRow.plan_id,
            amount,
            gateway:           'Cashfree Auto-Pay',
            status:            'success',
            notes:             `Auto-renewal: ${subId}`,
            cf_payment_id:     cfPayId,
            cf_subscription_id: subId,
          }).catch(e => console.error('Auto-pay payment insert error:', e));
        }

        console.log(`🔄 Auto-pay renewal done for sub ${subId}`);
      }
    }

    // ── Subscription Cancelled ────────────────────────────────────
    else if (eventType === 'SUBSCRIPTION_CANCELLED' || eventType === 'SUBSCRIPTION_EXPIRED') {
      const sub   = event?.data?.subscription || event?.data || {};
      const subId = sub.subscription_id || '';
      if (subId) {
        await supabaseQuery(
          'subscriptions', 'PATCH',
          { status: 'cancelled', auto_renew: false, cancelled_at: new Date().toISOString() },
          `?cf_subscription_id=eq.${subId}`
        ).catch(e => console.error('Sub cancel error:', e));
        console.log(`❌ Subscription cancelled: ${subId}`);
      }
    }

    // ── Payment Failed ────────────────────────────────────────────
    else if (eventType === 'PAYMENT_FAILED_WEBHOOK' || eventType === 'PAYMENT_USER_DROPPED') {
      const payment   = event?.data?.payment || event?.data || {};
      const cfOrderId = event?.data?.order?.order_id || payment.order_id || '';
      if (cfOrderId) {
        await supabaseQuery(
          'payments', 'PATCH',
          { status: 'failed' },
          `?cf_order_id=eq.${cfOrderId}`
        ).catch(() => {});
      }
    }

    // Cashfree ko 200 dena zaroori hai — warna retry karta rahega
    return res.status(200).json({ received: true, event: eventType });

  } catch (err) {
    console.error('Webhook crash:', err);
    // Phir bhi 200 do — Cashfree ko error nahi dikhana
    return res.status(200).json({ received: true, error: err.message });
  }
};
