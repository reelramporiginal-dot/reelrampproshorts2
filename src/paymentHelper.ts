// ─── paymentHelper.ts ─────────────────────────────────────────────────────────
// Global one-click payment trigger for ReelRamp Pro
// Supports: Cashfree, Razorpay, UPI Manual, and generic gateways
// Usage anywhere in the app:
//   import { initiatePayment } from './paymentHelper'
//   initiatePayment(plan, user, { navigate: go })
// ──────────────────────────────────────────────────────────────────────────────

export type PaymentPlan = {
  id?: number;
  name?: string;
  price: number;
  duration_days?: number;
  features?: Record<string, any>;
  supports_autorenew?: boolean;
};

export type PaymentUser = {
  id?: number;
  display_name?: string;
  email?: string;
  guest_id?: string;
} | null;

export type PaymentOptions = {
  onSuccess?: (transactionId: string, gateway: string) => void;
  onFailure?: (reason: string) => void;
  navigate?: (tab: string) => void;
};

// ─── Global bridge setter (called from Provider on every payment settings load) ─
export function setPaymentBridge(payment: any): void {
  (window as any).__RR_PAYMENT__ = payment;
}

// ─── Cashfree SDK loader ──────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: any;
    Cashfree: any;
  }
}

let cashfreeLoaded = false;
const loadCashfreeSDK = (): Promise<boolean> =>
  new Promise(resolve => {
    if (cashfreeLoaded || window.Cashfree) { cashfreeLoaded = true; return resolve(true); }
    const script = document.createElement('script');
    // Use sandbox URL for test mode, production URL otherwise
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => { cashfreeLoaded = true; resolve(true); };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

// ─── Razorpay SDK loader ──────────────────────────────────────────────────────
let razorpayLoaded = false;
const loadRazorpaySDK = (): Promise<boolean> =>
  new Promise(resolve => {
    if (razorpayLoaded || window.Razorpay) { razorpayLoaded = true; return resolve(true); }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => { razorpayLoaded = true; resolve(true); };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

// ─── Main dispatcher ──────────────────────────────────────────────────────────
export async function initiatePayment(
  plan: PaymentPlan,
  user: PaymentUser,
  options: PaymentOptions = {}
): Promise<void> {
  const { onSuccess, onFailure, navigate } = options;

  const paymentConfig = (window as any).__RR_PAYMENT__ as {
    gateways: Array<{
      id: string; name: string; type: string; enabled: boolean;
      isDefault: boolean; testMode: boolean;
      keys: Record<string, string>;
      webhookSecret?: string;
    }>;
    whatsapp?: string;
    instructions?: string;
  } | undefined;

  const activeGateway =
    paymentConfig?.gateways?.find(g => g.enabled && g.isDefault) ||
    paymentConfig?.gateways?.find(g => g.enabled);

  // No gateway configured → go to Plans page
  if (!activeGateway) {
    if (navigate) navigate('plans');
    else window.location.hash = '#plans';
    return;
  }

  const planName = plan.name || `₹${plan.price} Plan`;
  const userName = user?.display_name || user?.email || 'Viewer';
  const userEmail = user?.email || '';

  // ── Cashfree ──────────────────────────────────────────────────────────────
  if (activeGateway.type === 'Cashfree') {
    const loaded = await loadCashfreeSDK();
    if (!loaded) {
      onFailure?.('Cashfree SDK load nahi hua. Internet check karein.');
      return;
    }

    try {
      // Step 1: Create order on your backend
      const res = await fetch('/api/cashfree/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          currency: 'INR',
          planName,
          userName,
          userEmail,
          userId: user?.guest_id || user?.id,
          appId: activeGateway.keys.appId,
          secretKey: activeGateway.keys.secretKey,
          testMode: activeGateway.testMode,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        onFailure?.(err.message || 'Order create karne mein problem aayi.');
        return;
      }

      const { payment_session_id, order_id } = await res.json();

      if (!payment_session_id) {
        onFailure?.('Payment session ID nahi mila. Backend check karein.');
        return;
      }

      // Step 2: Open Cashfree checkout
      const cashfree = new window.Cashfree({ mode: activeGateway.testMode ? 'sandbox' : 'production' });
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: '_modal',
      }).then((result: any) => {
        if (result.error) {
          onFailure?.(result.error.message || 'Payment fail ho gaya.');
        } else if (result.redirect) {
          // Payment redirect — verify on return
          onSuccess?.(order_id, 'Cashfree');
        } else if (result.paymentDetails) {
          onSuccess?.(result.paymentDetails.paymentMessage || order_id, 'Cashfree');
        }
      }).catch((err: any) => {
        onFailure?.(err?.message || 'Cashfree checkout error.');
      });

    } catch (e: any) {
      onFailure?.(e.message || 'Cashfree error.');
    }
    return;
  }

  // ── Razorpay ──────────────────────────────────────────────────────────────
  if (activeGateway.type === 'Razorpay') {
    const loaded = await loadRazorpaySDK();
    if (!loaded) {
      onFailure?.('Razorpay load nahi hua. Internet check karein.');
      return;
    }
    const rzp = new window.Razorpay({
      key: activeGateway.keys.keyId,
      amount: Math.round(plan.price * 100),
      currency: 'INR',
      name: 'ReelRamp Pro',
      description: planName,
      prefill: { name: userName, email: userEmail },
      theme: { color: '#c5a26f' },
      handler: (response: any) => onSuccess?.(response.razorpay_payment_id, 'Razorpay'),
      modal: { ondismiss: () => onFailure?.('Payment cancel ho gaya') },
    });
    rzp.open();
    return;
  }

  // ── UPI Manual / any other → navigate to Plans ────────────────────────────
  window.dispatchEvent(new CustomEvent('rr:open-plan', { detail: { plan } }));
  if (navigate) navigate('plans');
  else window.location.hash = '#plans';
}
