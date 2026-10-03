import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button, LoginButton, Sheet, Skeleton } from '../ui';
import { useSession, useWallet, useWalletActions } from '../api/hooks';
import { savedPhone, startCheckout, validPhone } from '../pay/checkout';

const REASON: Record<string, string> = { checkin: 'Daily check-in', purchase: 'Coin pack', unlock: 'Episode unlock' };
type Pack = { id: number; price: number; coins: number; tag: string };

export default function Rewards() {
  const { userId } = useSession();
  const { data: w, isLoading } = useWallet();
  const { checkin } = useWalletActions();
  const [msg, setMsg] = useState('');
  const [pack, setPack] = useState<Pack | null>(null);
  const [phone, setPhone] = useState(savedPhone());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const claim = async () => {
    setMsg('');
    try {
      const r = await checkin.mutateAsync();
      setMsg(r.claimed ? `+${r.reward} coins mile` : 'Aaj ka check-in ho chuka hai');
    } catch (e) { setMsg((e as Error).message || 'Check-in nahi hua'); }
  };
  const buy = async () => {
    if (!pack) return;
    if (!validPhone(phone)) { setErr('10 digit ka sahi mobile number daalein.'); return; }
    setErr(''); setBusy(true);
    try { await startCheckout({ coin_pack_id: pack.id }, phone); }
    catch (e) { setErr((e as Error).message || 'Payment shuru nahi hua.'); setBusy(false); }
  };

  const ck = w?.checkin;
  return (
    <div className="pb-6">
      <h1 className="px-[18px] pb-1.5 pt-4 text-[28px]">Rewards</h1>

      <div className="mx-[18px] mt-1 rounded-3xl border border-rr-line bg-gradient-to-br from-rr-s2 to-rr-s1 p-5">
        <small className="text-rr-dim">Aapke coins</small>
        <div className="font-display text-[48px] leading-none text-rr-hi tabular-nums">{isLoading ? '…' : w?.balance ?? 0}</div>
        <small className="text-rr-dim">{w?.unlock_cost ?? 10} coins me ek premium episode khulta hai</small>
      </div>

      {!userId && (
        <div className="mx-[18px] mt-4 space-y-2 rounded-2xl border border-rr-line bg-rr-s1 p-4">
          <p className="text-[15px]">Coins kamane aur kharidne ke liye login karein.</p>
          <LoginButton />
        </div>
      )}

      {userId && (
        <>
          <h2 className="mb-2.5 mt-7 px-[18px] text-[24px]">Daily check-in</h2>
          {isLoading || !ck ? <div className="px-[18px]"><Skeleton className="h-16" /></div> : (
            <>
              <div className="grid grid-cols-7 gap-1.5 px-[18px]">
                {(w?.rewards || []).map((r, i) => {
                  const d = i + 1;
                  const done = d < ck.day || (d === ck.day && ck.claimed_today);
                  const today = d === ck.day && !ck.claimed_today;
                  return (
                    <div key={d} aria-label={`Din ${d}`} className={`grid min-h-14 place-items-center rounded-xl border text-[14px] font-bold ${done ? 'border-rr-ok/50 bg-rr-ok/10 text-rr-ok' : today ? 'border-rr-gold bg-rr-gold/15 text-rr-hi' : 'border-rr-line bg-rr-s2 text-rr-dim'}`}>
                      {done ? <Check size={18} aria-hidden /> : `+${r}`}
                    </div>
                  );
                })}
              </div>
              <div className="px-[18px] pt-3">
                <Button block disabled={ck.claimed_today} loading={checkin.isPending} onClick={claim}>
                  {ck.claimed_today ? 'Aaj ka check-in ho gaya. Kal phir aayein' : 'Aaj ka check-in lein'}
                </Button>
                {msg && <p role="status" className="pt-2 text-center text-[14.5px] text-rr-hi">{msg}</p>}
              </div>
            </>
          )}
        </>
      )}

      <h2 className="mb-2.5 mt-7 px-[18px] text-[24px]">Coin packs</h2>
      <div className="flex gap-3 overflow-x-auto px-[18px] [scrollbar-width:none]">
        {(w?.packs || []).map(p => (
          <button key={p.id} onClick={() => { setErr(''); setPack(p); }}
            className={`grid min-h-[120px] w-[140px] shrink-0 place-items-center gap-0.5 rounded-2xl border bg-rr-s1 p-3 ${p.tag ? 'border-rr-gold' : 'border-rr-line'}`}>
            {p.tag && <span className="rounded-full bg-rr-gold px-2 py-0.5 text-[12px] font-bold text-[#14100A]">{p.tag}</span>}
            <b className="font-display text-[30px] font-normal text-rr-hi">{p.coins}</b>
            <small className="text-rr-dim">coins</small>
            <span className="font-bold">₹{p.price}</span>
          </button>
        ))}
      </div>

      {userId && !!w?.history.length && (
        <>
          <h2 className="mb-2.5 mt-7 px-[18px] text-[24px]">Coin history</h2>
          <ul className="mx-[18px] divide-y divide-rr-line rounded-2xl border border-rr-line bg-rr-s1">
            {w.history.map(h => (
              <li key={h.id} className="flex min-h-12 items-center justify-between px-4 py-2.5 text-[15px]">
                <span>{REASON[h.reason] || h.reason}<small className="block text-[12.5px] text-rr-dim">{new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</small></span>
                <b className={h.type === 'credit' ? 'text-rr-ok' : 'text-rr-dim'}>{h.type === 'credit' ? '+' : '-'}{h.coins}</b>
              </li>
            ))}
          </ul>
        </>
      )}

      <Sheet open={!!pack} onClose={() => setPack(null)} title={pack ? `${pack.coins} coins · ₹${pack.price}` : ''}>
        {!userId ? (
          <div className="space-y-3"><p>Coins kharidne ke liye pehle login karein.</p><LoginButton /></div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-[14px] text-rr-dim">Mobile number (payment ke liye)</span>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10 digit number"
                className="min-h-12 w-full rounded-2xl border border-rr-line bg-rr-s2 px-4 text-rr-tx outline-none focus:border-rr-gold" />
            </label>
            {err && <p role="alert" className="text-[14.5px] text-rr-ember">{err}</p>}
            <Button block loading={busy} onClick={buy}>₹{pack?.price} dekar {pack?.coins} coins lein</Button>
            <p className="text-center text-[13.5px] text-rr-dim">Ek baar ka payment. Coins turant jud jaate hain.</p>
          </div>
        )}
      </Sheet>
    </div>
  );
}
