// api/cashfree/create-order.js
// ─────────────────────────────────────────────────────────────────
// Vercel Serverless Function — Cashfree Order Create
// CommonJS format (module.exports) — works on all Vercel projects
// ─────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {

  // ── CORS headers (zaroori hai agar different domain se call ho) ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight OPTIONS request handle karo
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      amount,
      currency = 'INR',
      planName,
      userName,
      userEmail,
      userId,
      testMode,
    } = req.body;

    // ── Validation ────────────────────────────────────────────────
    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Valid amount required' });
    }

    // ── Read keys from Vercel Environment Variables ────────────────
    // Vercel Dashboard → Settings → Environment Variables mein set karo:
    // CASHFREE_APP_ID = tumhara App ID
    // CASHFREE_SECRET_KEY = tumhara Secret Key
    const appId     = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    // Debug: log karo keys hain ya nahi (production mein hata do)
    console.log('CASHFREE_APP_ID set:', !!appId);
    console.log('CASHFREE_SECRET_KEY set:', !!secretKey);

    if (!appId || !secretKey) {
      return res.status(500).json({
        error: 'Cashfree keys missing! Vercel Dashboard mein ye set karo: CASHFREE_APP_ID aur CASHFREE_SECRET_KEY',
        hint: 'Vercel → Project → Settings → Environment Variables'
      });
    }

    // ── Cashfree API URL ──────────────────────────────────────────
    // testMode = true  → Sandbox (test payments)
    // testMode = false → Production (real payments)
    const baseUrl = testMode
      ? 'https://sandbox.cashfree.com/pg/orders'
      : 'https://api.cashfree.com/pg/orders';

    // ── Unique Order ID (max 50 chars, alphanumeric + _ - only) ───
    const safeUserId = String(userId || 'guest').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    const orderId = `RR_${safeUserId}_${Date.now()}`;

    const appUrl = process.env.VITE_APP_URL
      || process.env.APP_URL
      || 'https://reelramppro.vercel.app';

    // ── Call Cashfree API ─────────────────────────────────────────
    const cfResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secretKey,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: Number(amount),
        order_currency: currency,
        order_note: planName || 'ReelRamp Pro Plan',
        customer_details: {
          customer_id: safeUserId || `guest${Date.now()}`,
          customer_name: userName || 'ReelRamp User',
          customer_email: userEmail || 'user@reelramp.com',
          customer_phone: '9999999999',
        },
        order_meta: {
          return_url: `${appUrl}/?payment=success&order_id=${orderId}`,
          notify_url: `${appUrl}/api/cashfree/webhook`,
        },
      }),
    });

    // ── Parse response ────────────────────────────────────────────
    const cfData = await cfResponse.json();
    console.log('Cashfree response status:', cfResponse.status);

    if (!cfResponse.ok) {
      console.error('Cashfree API Error:', cfData);
      return res.status(cfResponse.status).json({
        error: cfData.message || cfData.error || 'Cashfree order create failed',
        details: cfData,
      });
    }

    // ── Success → return session ID to frontend ───────────────────
    return res.status(200).json({
      payment_session_id: cfData.payment_session_id,
      order_id: cfData.order_id,
      order_status: cfData.order_status,
    });

  } catch (err) {
    console.error('create-order crash:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
};
