// api/cashfree/create-order.js
// Vercel Serverless Function to safely create Cashfree Order

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { order_id, order_amount, order_currency, customer_details, order_meta, order_note, testMode } = req.body;

    // Sanitize customer details - strictly formatted for Cashfree
    const cleanPhone = (customer_details?.customer_phone || '').replace(/\D/g, '').slice(-10);
    const cleanEmail = (customer_details?.customer_email || '').trim() || 'user@reelramp.com';
    const cleanName = (customer_details?.customer_name || '').trim() || 'ReelRamp User';
    const cleanId = (customer_details?.customer_id || '').trim() || 'guest_user';

    const sanitizedDetails = {
      customer_id: cleanId,
      customer_name: cleanName,
      customer_email: cleanEmail,
      customer_phone: cleanPhone
    };

    if (cleanPhone.length < 10) {
      return res.status(400).json({ message: 'Validation failed: Mobile number must be exactly 10 digits without country code or spaces.' });
    }

    // Keys environment variables se aayengi (safest way!)
    // Agar env vars blank hain, toh default keys used directly as secure backup
    const app_id = process.env.CASHFREE_APP_ID || '13027093ee54013453fbcb1eb089072031';
    const secret_key = process.env.CASHFREE_SECRET_KEY || 'cfsk_ma_prod_23c0f05b2c2f34547eee4dc55405f3f1_50516b4a';

    // Enforce production mode if keys are live production keys
    const isProdKey = secret_key.startsWith('cfsk_ma_prod_') || secret_key.startsWith('cfsk_prod_');
    const actualTestMode = isProdKey ? false : !!testMode;

    const host = actualTestMode 
      ? 'sandbox.cashfree.com' 
      : 'api.cashfree.com';

    const url = `https://${host}/pg/orders`;

    const payload = {
      order_id,
      order_amount: Number(order_amount),
      order_currency,
      customer_details: sanitizedDetails,
      order_meta: {
        return_url: order_meta?.return_url || '',
        notify_url: order_meta?.notify_url || ''
      },
      order_note: order_note || ''
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-client-id': app_id,
        'x-client-secret': secret_key,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree response error payload:', data);
      throw new Error(data.message || data.error_description || 'Failed to create order on Cashfree');
    }

    return res.status(200).json({
      order_id: data.order_id,
      payment_session_id: data.payment_session_id
    });

  } catch (error) {
    console.error('Cashfree order error:', error);
    return res.status(500).json({ message: error.message });
  }
}
