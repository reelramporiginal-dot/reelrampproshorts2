// src/paymentHelper.ts
export const initiatePayment = async (plan: any, user: any) => {
  console.log("Payment process shuru ho raha hai...");
  
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
    
    // Yahan console mein check karo ki backend se kya aa raha hai
    console.log("Backend Response:", data);

    if (data.payment_session_id) {
       console.log("Session ID mil gaya, redirect ho raha hai...");
       window.location.href = data.payment_session_url; 
    } else {
       console.error("Error: payment_session_id nahi mila!", data);
       alert("Payment error: " + (data.error || "Session ID nahi mila"));
    }
  } catch (err) {
    console.error("System Error:", err);
    alert("Payment setup mein error aaya hai. Console check karein.");
  }
};
