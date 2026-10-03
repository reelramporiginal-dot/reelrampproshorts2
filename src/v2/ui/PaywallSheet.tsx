import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from './Button';
import { LoginButton } from './LoginButton';
import { Sheet } from './Sheet';
import { usePlans, useSession, useWallet, useWalletActions } from '../api/hooks';
import { FREE_EPISODES } from '../lib/poster';
import { savedPhone, startCheckout, validPhone } from '../pay/checkout';

type Props = { open: boolean; onClose: () => void; episode?: { id: number; episode_number: number } };

// Cliffhanger paywall: unlock this episode with coins, or buy a plan (one-time, no auto-debit).
export function PaywallSheet({ open, onClose, episode }: Props) {
  const { userId } = useSession();
  const plans = usePlans();
  const wallet = useWallet();
  const { unlock } = useWalletActions();
  const [planId, setPlanId] = useState<number | null>(null);
  const [phone, setPhone] = useState(savedPhone());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const list = plans.data || [];
  const chosen = list.find(p => p.id === (planId ?? list[0]?.id));
  const cost = wallet.data?.unlock_cost ?? 10;
  const balance = wallet.data?.balance ?? 0;

  const pay = async () => {
    if (!chosen) return;
    if (!validPhone(phone)) { setErr('10 digit ka sahi mobile number daalein.'); return; }
    setErr(''); setBusy(true);
    try { await startCheckout({ plan_id: chosen.id }, phone); }
    catch (e) { setErr((e as Error).message || 'Payment shuru nahi hua.'); setBusy(false); }
  };
  const doUnlock = async () => {
    if (!episode) return;
    setErr('');
    try {
      const r = await unlock.mutateAsync(episode.id);
      if (r.result === 'insufficient') setErr('Coins kam hain.');
      else onClose();
    } catch (e) { setErr((e as Error).message || 'Unlock nahi hua.'); }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Ab kya hoga? Dekhne ke liye unlock karein">
      <div className="mb-4 flex items-center gap-2 text-[14.5px] text-rr-dim">
        <Lock size={16} aria-hidden /> {episode ? `Episode ${episode.episode_number} premium hai. ` : ''}Pehle {FREE_EPISODES} episode free hain.
      </div>

      {!userId ? (
        <div className="space-y-3">
          <p className="text-[15px]">Payment ya coins ke liye pehle login karein.</p>
          <LoginButton />
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="space-y-2" role="radiogroup" aria-label="Plan chunein">
            {list.map(p => {
              const on = p.id === chosen?.id;
              return (
                <li key={p.id}>
                  <button role="radio" aria-checked={on} onClick={() => setPlanId(p.id)}
                    className={`flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${on ? 'border-rr-gold bg-rr-gold/10' : 'border-rr-line bg-rr-s2'}`}>
                    <span><b className="block">{p.name}</b><small className="text-rr-dim">{p.duration_days} din · saari series</small></span>
                    <b className="text-[18px] text-rr-hi">₹{p.price}</b>
                  </button>
                </li>
              );
            })}
          </ul>

          <label className="block">
            <span className="mb-1 block text-[14px] text-rr-dim">Mobile number (payment ke liye)</span>
            <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" autoComplete="tel-national"
              placeholder="10 digit number" className="min-h-12 w-full rounded-2xl border border-rr-line bg-rr-s2 px-4 text-rr-tx outline-none focus:border-rr-gold" />
          </label>

          {err && <p role="alert" className="text-[14.5px] text-rr-ember">{err}</p>}
          <Button block loading={busy} onClick={pay} disabled={!chosen}>{chosen ? `₹${chosen.price} ka plan lein` : 'Plan nahi mila'}</Button>
          <p className="text-center text-[13.5px] text-rr-dim">Ek baar ka payment. Auto-debit nahi hota.</p>

          {episode && (
            <div className="rounded-2xl border border-rr-line bg-rr-s2 p-4">
              <div className="mb-2 flex items-center justify-between text-[14.5px]"><span>Sirf yeh episode</span><b className="text-rr-hi">{cost} coins</b></div>
              {balance >= cost
                ? <Button block variant="ghost" loading={unlock.isPending} onClick={doUnlock}>Coins se unlock karein (aapke {balance})</Button>
                : <Link to="/v2/rewards" className="flex min-h-12 items-center justify-center rounded-full border border-rr-line bg-rr-s1 font-bold">Coins kam hain ({balance}). Rewards dekhein</Link>}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
