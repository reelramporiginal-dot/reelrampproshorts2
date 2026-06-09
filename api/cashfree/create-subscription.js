// api/cashfree/create-subscription.js
// ─────────────────────────────────────────────────────────────────
// Vercel Serverless Function — Cashfree Subscription / Auto-Pay
// CommonJS format — same style as create-order.js
// ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {

  // ── CORS ──────────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      planName,
      amount,
      intervalDays,
      userId,
      userName,
      userEmail,
      userPhone,
      cfPlanId,      // optional: agar Cashfree dashboard mein plan pehle se banaya ho
      testMode,
      returnUrl,
    } = req.body;

    // ── Validation ────────────────────────────────────────────────
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Valid amount required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    // ── Keys from Vercel Env ──────────────────────────────────────
    const appId     = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: 'Cashfree keys missing! Set CASHFREE_APP_ID aur CASHFREE_SECRET_KEY in Vercel Dashboard.',
      });
    }

    const baseUrl = testMode
      ? 'https://sandbox.cashfree.com/pg'
      : 'https://api.cashfree.com/pg';

    const appUrl = process.env.APP_URL || process.env.VITE_APP_URL || 'https://reelramppro.vercel.app';
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);

    // ── STEP 1: Cashfree Plan create karo (agar cfPlanId nahi diya) ──
    let planId = cfPlanId;

    if (!planId) {
      const planPayload = {
        plan_id:          `RRP_${safeUserId}_${Date.now()}`,
        plan_name:        planName || 'ReelRamp Pro Plan',
        plan_type:        'PERIODIC',
        plan_currency:    'INR',
        plan_max_amount:  Number(amount),
        plan_max_cycles:  120,   // max 10 saal tak renew
        plan_intervals:   Number(intervalDays) || 30,
        plan_interval_type: 'DAY',
        plan_description: `${planName} — ReelRamp Pro`,
      };

      const planRes = await fetch(`${baseUrl}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type':    'application/json',
          'x-api-version':   '2023-08-01',
          'x-client-id':     appId,
          'x-client-secret': secretKey,
        },
        body: JSON.stringify(planPayload),
      });

      const planData = await planRes.json();
      console.log('Cashfree Plan response:', planRes.status, planData);

      if (!planRes.ok) {
        // Agar plan already exists (409), uska plan_id use karo
        if (planRes.status === 409 && planData.plan_id) {
          planId = planData.plan_id;
        } else {
          return res.status(planRes.status).json({
            error: planData.message || 'Plan create failed',
            details: planData,
          });
        }
      } else {
        planId = planData.plan_id;
      }
    }

    // ── STEP 2: Subscription create karo ─────────────────────────
    const subId = `RRSUB_${safeUserId}_${Date.now()}`;

    const subPayload = {
      subscription_id:            subId,
      plan_id:                     planId,
      customer_details: {
        customer_id:    safeUserId,
        customer_name:  userName  || 'ReelRamp User',
        customer_email: userEmail || 'user@reelramp.com',
        customer_phone: (userPhone || '9999999999').replace(/\D/g, '').slice(-10),
      },
      subscription_meta: {
        return_url:  returnUrl || `${appUrl}/?cf_sub=success&sub_id=${subId}`,
        notify_url:  `${appUrl}/api/cashfree/webhook`,
      },
      subscription_first_charge_time: new Date(Date.now() + 60000).toISOString(), // 1 min baad
      subscription_expiry_time:        new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const subRes = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-version':   '2023-08-01',
        'x-client-id':     appId,
        'x-client-secret': secretKey,
      },
      body: JSON.stringify(subPayload),
    });

    const subData = await subRes.json();
    console.log('Cashfree Subscription response:', subRes.status, subData);

    if (!subRes.ok) {
      return res.status(subRes.status).json({
        error: subData.message || 'Subscription create failed',
        details: subData,
      });
    }

    // ── Success ───────────────────────────────────────────────────
    return res.status(200).json({
      subscription_id: subData.subscription_id || subId,
      plan_id:         planId,
      auth_link:       subData.authorization_details?.authorization_url || subData.auth_link || '',
      status:          subData.subscription_status || 'INITIALIZED',
    });

  } catch (err) {
    console.error('create-subscription crash:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
    });
  }
};
