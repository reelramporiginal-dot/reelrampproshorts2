export const initiatePayment = async (plan: any, user: any) => {
  try {
    const res = await fetch('/api/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: plan.price,
        order_id: `ORDER_${Date.now()}`,
        customer_email: user?.email || 'guest@user.com',
        customer_phone: "0000000000"
      })
    });
    const data = await res.json();
    if (data.payment_session_id) {
       window.location.href = data.payment_session_url;
    }
  } catch (err) {
    alert("Payment filhal unavailable hai.");
  }
};
