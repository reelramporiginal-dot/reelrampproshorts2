import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Play } from 'lucide-react';
import { PaywallSheet, Skeleton } from '../ui';
import { useCatalog, useSubscription, useWallet } from '../api/hooks';
import { FREE_EPISODES, gradientFor, isLocked, watchPath } from '../lib/poster';

export default function Series() {
  const { title = '' } = useParams();
  const navigate = useNavigate();
  const { groups, isLoading } = useCatalog();
  const { isPremium } = useSubscription();
  const wallet = useWallet();
  const unlocked = new Set(wallet.data?.unlocked || []);
  const [lockEp, setLockEp] = useState<{ id: number; episode_number: number } | null>(null);

  const g = groups.find(x => x.title === title);

  if (isLoading) return <div className="space-y-3 p-[18px]"><Skeleton className="h-64" /><Skeleton className="h-24" /></div>;
  if (!g) {
    return (
      <div className="px-6 py-16 text-center text-rr-dim">
        <p>Ye series nahi mili.</p>
        <Link to="/v2" className="mt-3 inline-block text-rr-hi underline">Home par jayein</Link>
      </div>
    );
  }

  const first = g.episodes[0];
  return (
    <div className="pb-6">
      <div className="relative h-72 overflow-hidden" style={{ background: gradientFor(g.title) }}>
        {g.poster && <img src={g.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-rr-bg via-rr-bg/20 to-transparent" />
        <button onClick={() => navigate(-1)} aria-label="Wapas" className="absolute left-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/45 backdrop-blur">
          <ArrowLeft size={22} aria-hidden />
        </button>
      </div>

      <div className="-mt-10 space-y-3 px-[18px]">
        <h1 className="relative text-[34px] leading-tight">{g.title}</h1>
        <p className="text-[15px] text-rr-dim">{g.category} · {g.episodes.length} episodes · Pehle {FREE_EPISODES} free</p>
        {g.description && <p className="text-[15.5px]">{g.description}</p>}
        {first && (
          <Link to={watchPath(first.id)} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-rr-gold font-bold text-[#14100A]">
            <Play size={18} fill="currentColor" aria-hidden /> Episode 1 dekhein
          </Link>
        )}
      </div>

      <h2 className="mb-2.5 mt-7 px-[18px] text-[22px]">Episodes</h2>
      <div className="grid grid-cols-5 gap-2 px-[18px]">
        {g.episodes.map(e => {
          const locked = isLocked(e.episode_number, e.is_premium, isPremium) && !unlocked.has(e.id);
          const cls = 'relative grid min-h-12 aspect-square place-items-center rounded-xl border border-rr-line bg-rr-s2 font-bold';
          const sub = !e.is_premium || e.episode_number <= FREE_EPISODES
            ? <small className="absolute bottom-1 text-[11px] text-rr-ok">Free</small>
            : locked ? <Lock size={12} className="absolute bottom-1 text-rr-gold" aria-hidden /> : null;
          return locked ? (
            <button key={e.id} className={`${cls} text-rr-dim`} onClick={() => setLockEp({ id: e.id, episode_number: e.episode_number })} aria-label={`Episode ${e.episode_number}, locked`}>
              {e.episode_number}{sub}
            </button>
          ) : (
            <Link key={e.id} to={watchPath(e.id)} className={cls}>{e.episode_number}{sub}</Link>
          );
        })}
      </div>

      <PaywallSheet open={!!lockEp} onClose={() => setLockEp(null)} episode={lockEp || undefined} />
    </div>
  );
}
