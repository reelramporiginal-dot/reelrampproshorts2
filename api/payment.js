import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { amount, order_id, customer_email, customer_phone } = req.body;

    const response = await axios.post('https://sandbox.cashfree.com/pg/orders', {
      order_amount: amount,
      order_currency: "INR",
      order_id: order_id,
      customer_details: {
        customer_id: order_id,
        customer_email: customer_email,
        customer_phone: customer_phone
      }
    }, {
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2022-09-01',
        'accept': 'application/json'
      }
    });

    return res.status(200).json(response.data);
  } catch (err) {
    console.error("Payment API Error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Failed to create order" });
  }
}
