import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Chip, Rail, Skeleton } from '../ui';
import { useCatalog, useWatchHistory } from '../api/hooks';
import { gradientFor, seriesPath, watchPath } from '../lib/poster';

const pad = (x: number) => String(x).padStart(2, '0');
function untilMidnight() {
  const n = new Date();
  const m = new Date(n); m.setHours(24, 0, 0, 0);
  const s = Math.max(0, Math.floor((+m - +n) / 1000));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export default function Home() {
  const { groups, isLoading, error } = useCatalog();
  const history = useWatchHistory();
  const [cat, setCat] = useState('Sab');
  const [left, setLeft] = useState(untilMidnight());

  useEffect(() => {
    const i = setInterval(() => setLeft(untilMidnight()), 1000);
    return () => clearInterval(i);
  }, []);

  const cats = useMemo(() => ['Sab', ...Array.from(new Set(groups.map(g => g.category).filter(Boolean)))], [groups]);
  const list = cat === 'Sab' ? groups : groups.filter(g => g.category === cat);
  const hero = list[0];

  const newest = useMemo(() => {
    const t = (g: typeof groups[number]) => Math.max(...g.episodes.map(e => new Date(e.created_at).getTime() || 0));
    return [...list].sort((a, b) => t(b) - t(a));
  }, [list]);

  const { continueGroups, notes } = useMemo(() => {
    const byVideo = new Map<number, { g: typeof groups[number]; ep: number }>();
    groups.forEach(g => g.episodes.forEach(e => byVideo.set(e.id, { g, ep: e.episode_number })));
    const rows = [...(history.data || [])].filter(r => !r.completed).sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
    const seen = new Set<string>(); const out: typeof groups = []; const n: Record<string, string> = {};
    for (const r of rows) {
      const hit = byVideo.get(r.video_id);
      if (!hit || seen.has(hit.g.title)) continue;
      seen.add(hit.g.title); out.push(hit.g); n[hit.g.title] = `Episode ${hit.ep}`;
    }
    return { continueGroups: out, notes: n };
  }, [history.data, groups]);

  return (
    <div className="pb-6">
      <header className="flex items-center justify-between px-[18px] pb-1 pt-4">
        <div className="font-display text-[26px]">Reel<i className="text-rr-gold">Ramp</i></div>
      </header>

      <div className="flex gap-2 overflow-x-auto px-[18px] py-2 [scrollbar-width:none]">
        {cats.map(c => <Chip key={c} active={c === cat} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>

      {isLoading && <div className="space-y-4 px-[18px] pt-2"><Skeleton className="h-[400px]" /><Skeleton className="h-16" /></div>}
      {error && <p className="px-[18px] pt-4 text-rr-ember">Catalog nahi khul paya. Thodi der baad try karein.</p>}
      {!isLoading && !error && !hero && <p className="px-6 py-10 text-center text-rr-dim">Abhi koi series nahi hai.</p>}

      {hero && (
        <Link
          to={watchPath(hero.episodes[0].id)}
          className="relative mx-[18px] mt-1.5 flex h-[400px] flex-col justify-end overflow-hidden rounded-3xl p-5 text-left"
          style={{ background: gradientFor(hero.title) }}
        >
          {hero.poster && <img src={hero.poster} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          <div className="relative">
            <span className="mb-2.5 inline-block rounded-full bg-rr-ember px-2.5 py-0.5 text-[12px] font-bold">Aaj ka pick</span>
            <h1 className="text-[40px] leading-[1.05]">{hero.title}</h1>
            {hero.description && <p className="my-2 line-clamp-2 max-w-[28ch] text-[#e6e2d9]">{hero.description}</p>}
            <span className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-full bg-rr-gold px-6 font-bold text-[#14100A]">
              <Play size={18} fill="currentColor" aria-hidden /> Episode 1 dekhein
            </span>
          </div>
        </Link>
      )}

      {hero && (
        <div className="mx-[18px] mt-4 flex items-center justify-between rounded-2xl border border-rr-line bg-rr-s1 px-4 py-3.5">
          <div>
            <small className="block text-[14px] text-rr-dim">Agla drop raat 12:00 baje</small>
            <strong className="font-display text-[22px] font-normal tabular-nums text-rr-hi">{left}</strong>
          </div>
        </div>
      )}

      <Rail title="Dekhna jaari rakhein" groups={continueGroups} notes={notes} />
      <Rail title="Naye episodes" groups={newest} />
      <Rail title="Sab series" groups={list} />

      {hero && (
        <p className="px-[18px] pt-6 text-center text-[14px] text-rr-dim">
          <Link to={seriesPath(hero.title)} className="text-rr-hi underline">{hero.title}</Link> ke saare episode dekhein
        </p>
      )}
    </div>
  );
}
