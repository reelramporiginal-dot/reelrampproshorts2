import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, ChevronRight, Coins, FileText, HelpCircle, LogOut, Shield, Wifi } from 'lucide-react';
import supabase from '../../lib/supabase';
import { Button, Sheet, Skeleton } from '../ui';
import { useSession, useSubscription, useWallet } from '../api/hooks';
import { api } from '../api/client';

const ds = {
  get: () => { try { return localStorage.getItem('rr_datasaver') === '1'; } catch { return false; } },
  set: (v: boolean) => { try { localStorage.setItem('rr_datasaver', v ? '1' : '0'); } catch { /* ignore */ } },
};

function Row({ icon, label, to, onClick, right }: { icon: ReactNode; label: string; to?: string; onClick?: () => void; right?: ReactNode }) {
  const cls = 'flex min-h-14 w-full items-center gap-3 border-b border-rr-line px-1 text-left text-[16px]';
  const inner = (<>{icon}<span className="flex-1">{label}</span>{right ?? <ChevronRight size={18} className="text-rr-dim" aria-hidden />}</>);
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button onClick={onClick} className={cls}>{inner}</button>;
}

export default function Profile() {
  const nav = useNavigate();
  const { session, userId, ready } = useSession();
  const { data: w } = useWallet();
  const { active, isLoading: subLoading } = useSubscription();
  const [saver, setSaver] = useState(ds.get());
  const [help, setHelp] = useState(false);
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState<'' | 'ok' | 'err'>('');
  const [busy, setBusy] = useState(false);

  if (ready && !userId) {
    return (
      <div className="mx-auto max-w-md px-[18px] pt-10 text-center">
        <h1 className="text-[28px]">Profile</h1>
        <p className="mt-2 text-rr-dim">Login karke coins, My List aur plan ek jagah dekhein.</p>
        <Button block className="mt-5" onClick={() => nav('/v2/login?next=/v2/profile')}>Login karein</Button>
        <div className="mt-6 text-left">
          <Row icon={<FileText size={20} aria-hidden />} label="Terms of Use" to="/v2/policy/terms" />
          <Row icon={<Shield size={20} aria-hidden />} label="Privacy Policy" to="/v2/policy/privacy" />
        </div>
      </div>
    );
  }

  const meta = (session?.user.user_metadata || {}) as { full_name?: string; name?: string; avatar_url?: string };
  const email = session?.user.email || '';
  const name = meta.full_name || meta.name || email.split('@')[0] || 'Aap';
  const expiry = active?.expires_at ? new Date(active.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const sendHelp = async () => {
    if (msg.trim().length < 5) return;
    setBusy(true); setSent('');
    try {
      await api('support_tickets', { method: 'POST', body: { name, contact: email, message: msg.trim().slice(0, 1000) } });
      setSent('ok'); setMsg('');
    } catch { setSent('err'); }
    setBusy(false);
  };

  return (
    <div className="px-[18px] pb-6 pt-4">
      <h1 className="text-[28px]">Profile</h1>

      <div className="mt-3 flex items-center gap-3 rounded-3xl border border-rr-line bg-rr-s1 p-4">
        {meta.avatar_url
          ? <img src={meta.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" referrerPolicy="no-referrer" />
          : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rr-s2 font-display text-[24px] text-rr-hi" aria-hidden>{name[0]?.toUpperCase()}</div>}
        <div className="min-w-0">
          <div className="truncate font-display text-[20px]">{name}</div>
          <div className="truncate text-[14px] text-rr-dim">{email}</div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-rr-line bg-rr-s1 p-4">
        <small className="text-rr-dim">Aapka plan</small>
        {subLoading ? <Skeleton className="mt-2 h-6" /> : active ? (
          <>
            <div className="text-[18px] font-bold text-rr-hi">{active.plan}</div>
            <div className="text-[14px] text-rr-dim">{expiry} tak chalega. Auto-debit nahi hota, date par apne aap band ho jayega.</div>
          </>
        ) : (
          <div className="text-[15px]">Free plan. Pehle 5 episode free hain; baaki coins se ya plan lekar khulte hain.</div>
        )}
      </div>

      <div className="mt-2">
        <Row icon={<Coins size={20} aria-hidden />} label="Coins aur Rewards" to="/v2/rewards" right={<span className="tabular-nums text-rr-hi">{w?.balance ?? 0}</span>} />
        <Row icon={<Bookmark size={20} aria-hidden />} label="My List" to="/v2/mylist" />
        <Row
          icon={<Wifi size={20} aria-hidden />} label="Data saver (480p)"
          onClick={() => { const n = !saver; setSaver(n); ds.set(n); }}
          right={<span role="switch" aria-checked={saver} className={`inline-flex h-7 w-12 items-center rounded-full px-0.5 transition ${saver ? 'bg-rr-gold' : 'bg-rr-s2'}`}><span className={`h-6 w-6 rounded-full bg-white transition ${saver ? 'translate-x-5' : ''}`} /></span>}
        />
        <Row icon={<HelpCircle size={20} aria-hidden />} label="Madad / Shikayat" onClick={() => { setSent(''); setHelp(true); }} />
        <Row icon={<FileText size={20} aria-hidden />} label="Terms of Use" to="/v2/policy/terms" />
        <Row icon={<Shield size={20} aria-hidden />} label="Privacy Policy" to="/v2/policy/privacy" />
        <Row icon={<FileText size={20} aria-hidden />} label="Refund aur Cancellation" to="/v2/policy/refund" />
      </div>

      <Button block variant="ghost" className="mt-5" onClick={async () => { await supabase.auth.signOut(); nav('/v2', { replace: true }); }}>
        <LogOut size={18} aria-hidden /> Logout
      </Button>

      <Sheet open={help} onClose={() => setHelp(false)} title="Madad / Shikayat">
        {sent === 'ok' ? (
          <p className="text-[15px]">Aapka message mil gaya. Hum jald jawab denge.</p>
        ) : (
          <div className="space-y-3">
            <textarea
              value={msg} onChange={e => setMsg(e.target.value)} rows={4} maxLength={1000}
              placeholder="Kya dikkat hai? Payment, video ya kuch aur likhein."
              className="w-full rounded-2xl border border-rr-line bg-rr-bg p-3 text-[16px] text-rr-tx outline-none focus:border-rr-gold"
            />
            {sent === 'err' && <p role="alert" className="text-[14px] text-rr-ember">Message nahi gaya. Dobara try karein.</p>}
            <Button block loading={busy} disabled={msg.trim().length < 5} onClick={sendHelp}>Bhejein</Button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
