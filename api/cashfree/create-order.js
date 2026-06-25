// Cashfree Order Creation — Vercel Serverless Function
// This runs on the server, NOT in the browser.
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const {
      appId, secretKey, testMode,
      amount, planName, userId, userName, userEmail, userPhone
    } = req.body || {};
    if (!appId || !secretKey) {
      return res.status(400).json({ error: 'Cashfree App ID aur Secret Key required hai' });
    }
    const baseUrl = testMode
      ? 'https://sandbox.cashfree.com/pg/orders'
      : 'https://api.cashfree.com/pg/orders';
    const orderId = `rrp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const origin = req.headers.origin || req.headers.referer || 'https://reelramppro.com';
    const orderPayload = {
      order_id: orderId,
      order_amount: Number(amount) || 99,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId || 'guest_' + Date.now(),
        customer_name: userName || 'ReelRamp User',
        customer_email: userEmail || 'user@reelramp.com',
        customer_phone: userPhone || '9999999999'
      },
      order_meta: {
        return_url: `${origin}?cf_order_id=${orderId}`,
        notify_url: `${origin}/api/cashfree-webhook`
      },
      order_note: planName || 'ReelRamp Pro Plan'
    };
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(orderPayload)
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Cashfree error:', data);
      return res.status(response.status).json({
        error: data.message || 'Cashfree order creation failed',
        details: data
      });
    }
    return res.status(200).json({
      order_id: data.order_id || orderId,
      payment_session_id: data.payment_session_id,
      order_status: data.order_status
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
