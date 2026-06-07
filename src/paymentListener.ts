// src/paymentListener.ts
import { initiatePayment } from './paymentHelper';

window.addEventListener('load', () => {
  const checkButton = setInterval(() => {
    // "Pay Now" button ko dhoondho (jo tumhare popup mein hai)
    const payBtn = document.querySelector('[data-payment-trigger]'); 
    if (payBtn) {
      payBtn.addEventListener('click', (e) => {
        // Yahan se payment trigger ho jayega
        const planData = JSON.parse(payBtn.getAttribute('data-plan') || '{}');
        initiatePayment(planData, null);
      });
      clearInterval(checkButton);
    }
  }, 1000);
});
