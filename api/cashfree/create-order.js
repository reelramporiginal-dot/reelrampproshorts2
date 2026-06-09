// api/cashfree/create-order.js (Vercel serverless)
import { Cashfree } from 'cashfree-pg';

export default async function handler(req, res) {
  const { amount, currency, userName, userEmail, userId, appId, secretKey, testMode } = req.body;
  
  Cashfree.XClientId = appId;
  Cashfree.XClientSecret = secretKey;
  Cashfree.XEnvironment = testMode 
    ? Cashfree.Environment.SANDBOX 
    : Cashfree.Environment.PRODUCTION;

  const order = await Cashfree.PGCreateOrder("2023-08-01", {
    order_amount: amount,
    order_currency: currency || "INR",
    customer_details: {
      customer_id: String(userId),
      customer_name: userName,
      customer_email: userEmail,
      customer_phone: "9999999999"
    }
  });

  res.json({ 
    payment_session_id: order.data.payment_session_id,
    order_id: order.data.order_id 
  });
}
