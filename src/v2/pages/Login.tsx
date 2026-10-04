import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Button, LoginButton } from '../ui';
import { useSession } from '../api/hooks';

// Google + email magic link. Phone OTP comes later (provider not decided yet).
export default function Login() {
  const { userId } = useSession();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const next = sp.get('next') && sp.get('next')!.startsWith('/v2') ? sp.get('next')! : '/v2/profile';
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  if (userId) { nav(next, { replace: true }); return null; }

  const sendLink = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Sahi email daalein.'); return; }
    setErr(''); setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}${next}` },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  };

  return (
    <div className="mx-auto max-w-md px-[18px] pt-10">
      <h1 className="text-[30px]">Login karein</h1>
      <p className="mt-1 text-rr-dim">Coins, My List aur plan sab ek jagah save rahenge.</p>

      <div className="mt-6 space-y-3">
        <LoginButton />
        <div className="flex items-center gap-3 text-[14px] text-rr-dim"><span className="h-px flex-1 bg-rr-line" />ya<span className="h-px flex-1 bg-rr-line" /></div>
        {sent ? (
          <div className="rounded-2xl border border-rr-line bg-rr-s1 p-4 text-[15px]">
            <b>{email}</b> par login link bhej diya hai. Mail me link kholein (spam folder bhi dekh lein).
          </div>
        ) : (
          <>
            <label className="block text-[14px] text-rr-dim" htmlFor="rr-email">Email se link paayein</label>
            <input
              id="rr-email" type="email" inputMode="email" autoComplete="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="aap@example.com"
              className="min-h-12 w-full rounded-2xl border border-rr-line bg-rr-s1 px-4 text-[16px] text-rr-tx outline-none focus:border-rr-gold"
            />
            {err && <p role="alert" className="text-[14px] text-rr-ember">{err}</p>}
            <Button block variant="ghost" loading={busy} onClick={sendLink}>Login link bhejein</Button>
          </>
        )}
      </div>

      <p className="mt-6 text-[13px] text-rr-dim">
        Login karke aap hamari <Link to="/v2/policy/terms" className="underline">Terms</Link> aur{' '}
        <Link to="/v2/policy/privacy" className="underline">Privacy Policy</Link> maante hain.
      </p>
    </div>
  );
}
