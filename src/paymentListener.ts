// src/paymentListener.ts
import { initiatePayment } from './paymentHelper';

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  // Sabhi button jinka text "Pay" ya "Unlock" hai
  if (target.innerText.toLowerCase().includes('pay') || target.innerText.toLowerCase().includes('unlock')) {
    // Yahan default plan le rahe hain, aap dynamically bhi nikal sakte ho
    const mockPlan = { price: 2 }; 
    initiatePayment(mockPlan, null);
  }
});
