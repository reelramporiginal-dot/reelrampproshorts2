import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useSession } from '../api/hooks';

type Row = { transaction_id: string; status: string };

// After Cashfree sends the user back (?cf_order=...), wait for the webhook to confirm, then refresh coins/plan.
export default function PaymentReturn() {
  const [sp, setSp] = useSearchParams();
  const order = sp.get('cf_order');
  const { ready, userId } = useSession();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!order || !ready) return;
    let dead = false;
    const clear = () => { const n = new URLSearchParams(sp); n.delete('cf_order'); setSp(n, { replace: true }); };
    if (!userId) { clear(); return; }
    setMsg({ text: 'Payment confirm ho raha hai…', ok: true });
    let tries = 0;
    const poll = async () => {
      if (dead) return;
      tries += 1;
      try {
        const rows = await api<Row[]>('payments');
        const r = rows.find(x => x.transaction_id === order);
        if (r && r.status === 'success') {
          qc.invalidateQueries({ queryKey: ['wallet'] }); qc.invalidateQueries({ queryKey: ['subscriptions'] }); qc.invalidateQueries({ queryKey: ['playback'] });
          setMsg({ text: 'Payment ho gaya. Shukriya!', ok: true }); clear();
          setTimeout(() => !dead && setMsg(null), 4000); return;
        }
        if (r && (r.status === 'failed' || r.status === 'amount_mismatch')) {
          setMsg({ text: 'Payment poora nahi hua. Paise kate hon to 24 ghante me wapas aa jayenge.', ok: false }); clear();
          setTimeout(() => !dead && setMsg(null), 7000); return;
        }
      } catch { /* keep polling */ }
      if (tries >= 15) {
        setMsg({ text: 'Confirmation me der lag rahi hai. Thodi der baad Rewards ya Profile dekhein.', ok: true }); clear();
        setTimeout(() => !dead && setMsg(null), 7000); return;
      }
      setTimeout(poll, 2000);
    };
    void poll();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, ready, userId]);

  if (!msg) return null;
  return (
    <div role="status" className={`fixed inset-x-4 top-[calc(12px+env(safe-area-inset-top))] z-[60] rounded-2xl border px-4 py-3 text-center text-[15px] font-semibold backdrop-blur ${msg.ok ? 'border-rr-ok/40 bg-black/80 text-rr-ok' : 'border-rr-ember/40 bg-black/80 text-rr-ember'}`}>
      {msg.text}
    </div>
  );
}
