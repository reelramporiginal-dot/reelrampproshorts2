// api/cashfree/create-subscription.js
// Vercel Serverless Function to safely create Cashfree Subscription (Auto-Pay e-mandate)

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
    const { plan_id, customer_details, return_url, testMode } = req.body;

    const app_id = process.env.CASHFREE_APP_ID || '13027093ee54013453fbcb1eb089072031';
    const secret_key = process.env.CASHFREE_SECRET_KEY || 'cfsk_ma_prod_23c0f05b2c2f34547eee4dc55405f3f1_50516b4a';

    const cleanPhone = (customer_details?.customer_phone || '').replace(/\D/g, '').slice(-10);
    const cleanEmail = (customer_details?.customer_email || '').trim() || 'user@reelramp.com';
    const cleanName = (customer_details?.customer_name || '').trim() || 'ReelRamp User';
    const cleanId = (customer_details?.customer_id || '').trim() || 'guest_user';

    if (cleanPhone.length < 10) {
      return res.status(400).json({ message: 'Validation failed: Mobile number must be exactly 10 digits.' });
    }

    const isProdKey = secret_key.startsWith('cfsk_ma_prod_') || secret_key.startsWith('cfsk_prod_');
    const actualTestMode = isProdKey ? false : !!testMode;

    const host = actualTestMode 
      ? 'sandbox.cashfree.com' 
      : 'api.cashfree.com';

    // Step 1: Create or fetch a Plan dynamically (Periodic Quarterly or Monthly auto-pay)
    // Kuku FM style: ₹1 Trial first day, then auto-pay ₹399/quarterly
    const uniquePlanId = plan_id || `rr_autopay_399_quarterly`;
    const planUrl = `https://${host}/pg/plans`;

    // Try to create plan (will succeed if not exists, Cashfree allows creation with unique plan_id)
    try {
      await fetch(planUrl, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'x-client-id': app_id,
          'x-client-secret': secret_key,
          'x-api-version': '2023-08-01'
        },
        body: JSON.stringify({
          plan_id: uniquePlanId,
          plan_name: 'ReelRamp Auto-Pay Trial Offer',
          plan_type: 'PERIODIC',
          plan_currency: 'INR',
          plan_recurring_amount: 399, // Next charging amount after trial
          plan_max_amount: 399,
          plan_max_cycles: 99,
          plan_intervals: 3, // Charged every 3 months (Quarterly)
          plan_interval_type: 'MONTH',
          plan_note: '₹1 Trial for 2 days, then auto-pay ₹399 every quarter'
        })
      });
    } catch (e) {
      console.log('Plan already exists or failed, proceeding to subscription...', e);
    }

    // Step 2: Create Subscription (Mandate)
    const subUrl = `https://${host}/pg/subscriptions`;
    const subscription_id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Calculate expiry (10 years from now)
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 10);

    // Calculate first charge time (Kuku FM style: e.g. after 2 days of trial)
    const firstCharge = new Date();
    firstCharge.setDate(firstCharge.getDate() + 2); // 2 Days trial

    const subPayload = {
      subscription_id,
      customer_details: {
        customer_id: cleanId,
        customer_name: cleanName,
        customer_email: cleanEmail,
        customer_phone: cleanPhone
      },
      plan_details: {
        plan_id: uniquePlanId
      },
      authorization_details: {
        authorization_amount: 1, // Pay ₹1 today to verify and start trial
        authorization_amount_refund: false, // Don't refund as it is the trial charge
        payment_methods: ['upi', 'card'] // Kuku FM style (UPI mandate / Cards)
      },
      subscription_meta: {
        return_url: return_url || `${req.headers.origin || 'https://reelrampro.com'}?cf_sub=${subscription_id}`
      },
      subscription_expiry_time: expiry.toISOString().split('.')[0] + '+05:30',
      subscription_first_charge_time: firstCharge.toISOString().split('.')[0] + '+05:30'
    };

    const response = await fetch(subUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-client-id': app_id,
        'x-client-secret': secret_key,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify(subPayload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree subscription creation error payload:', data);
      throw new Error(data.message || 'Failed to create subscription on Cashfree');
    }

    return res.status(200).json({
      subscription_id: data.subscription_id,
      sub_auth_url: data.subscription_meta?.sub_auth_url || data.sub_auth_url || '',
      session_id: data.session_id || ''
    });

  } catch (error) {
    console.error('Cashfree subscription error:', error);
    return res.status(500).json({ message: error.message });
  }
}
