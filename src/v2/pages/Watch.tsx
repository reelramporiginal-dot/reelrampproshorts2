import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, Heart, List, Loader2, Lock, Pause, Play, Share2, Volume2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, PaywallSheet, Sheet } from '../ui';
import { api, ApiError } from '../api/client';
import { useCatalog, useFlag, useSession, useSubscription, useWallet, useWatchHistory } from '../api/hooks';
import { prefetchPlayback, usePlayback } from '../player/usePlayback';
import { useVideoSource } from '../player/useVideoSource';
import { gradientFor, isLocked, seriesPath, watchPath } from '../lib/poster';

const ds = {
  get: () => { try { return localStorage.getItem('rr_datasaver') === '1'; } catch { return false; } },
  set: (v: boolean) => { try { localStorage.setItem('rr_datasaver', v ? '1' : '0'); } catch { /* ignore */ } },
};

export default function Watch() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { groups, isLoading } = useCatalog();
  const { userId } = useSession();
  const { isPremium } = useSubscription();
  const history = useWatchHistory();
  const wallet = useWallet();
  const unlockedIds = wallet.data?.unlocked;

  const found = useMemo(() => {
    for (const g of groups) {
      const i = g.episodes.findIndex(e => e.id === id);
      if (i >= 0) return { g, i, ep: g.episodes[i] };
    }
    return null;
  }, [groups, id]);
  const g = found?.g; const ep = found?.ep;
  const prev = found && found.i > 0 ? found.g.episodes[found.i - 1] : null;
  const next = found && found.i < found.g.episodes.length - 1 ? found.g.episodes[found.i + 1] : null;
  const isUnlocked = (vid: number) => !!unlockedIds?.includes(vid);
  const locked = ep ? isLocked(ep.episode_number, ep.is_premium, isPremium) && !isUnlocked(ep.id) : false;

  const playback = usePlayback(ep && !locked ? ep.id : null);
  const serverLocked = playback.error instanceof ApiError && (playback.error.status === 401 || playback.error.status === 403);
  const showPaywall = locked || serverLocked;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [dataSaver, setDataSaver] = useState(ds.get());
  const startAt = useMemo(() => {
    const r = (history.data || []).find(x => x.video_id === id);
    return r && !r.completed ? r.current_position : 0;
    // resume point is read once per episode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, !!history.data]);
  const src = playback.data ? { url: playback.data.url, kind: playback.data.kind } : null;
  const { state, retry, soundBlocked, unmute } = useVideoSource(videoRef, src, { startAt, dataSaver });

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fast, setFast] = useState(false);
  const [flash, setFlash] = useState<'play' | 'pause' | null>(null);
  const [burst, setBurst] = useState(0);
  const [toast, setToast] = useState('');
  const [epsOpen, setEpsOpen] = useState(false);
  const [upNext, setUpNext] = useState<number | null>(null);
  const like = useFlag('likes', ep?.id);
  const list = useFlag('bookmarks', ep?.id);

  const posRef = useRef({ id: 0, pos: 0, dur: 0 });
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(''), 1800); };

  const save = useCallback((done = false) => {
    const p = posRef.current;
    if (!userId || !p.id || (!done && p.pos < 2)) return;
    void api('watch_history', {
      method: 'POST',
      body: { video_id: p.id, current_position: Math.floor(p.pos), watched_duration: Math.floor(p.pos), duration: Math.floor(p.dur), completed: done },
    }).catch(() => {});
  }, [userId]);

  // video element events
  useEffect(() => {
    const v = videoRef.current; if (!v || !ep) return;
    posRef.current = { id: ep.id, pos: 0, dur: ep.duration_seconds || 0 };
    setProgress(0); setUpNext(null); setPlaying(false);
    const onTime = () => {
      posRef.current.pos = v.currentTime; posRef.current.dur = v.duration || posRef.current.dur;
      setProgress(v.duration ? v.currentTime / v.duration : 0);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => { setPlaying(false); save(); };
    const onEnd = () => {
      setPlaying(false); save(true);
      if (!next) return;
      if (isLocked(next.episode_number, next.is_premium, isPremium) && !isUnlocked(next.id)) go(next, 1); // cliffhanger paywall
      else setUpNext(3);
    };
    v.addEventListener('timeupdate', onTime); v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause); v.addEventListener('ended', onEnd);
    const tick = setInterval(() => { if (!v.paused) save(); }, 10000);
    return () => {
      v.removeEventListener('timeupdate', onTime); v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause); v.removeEventListener('ended', onEnd);
      clearInterval(tick);
      const p = posRef.current;
      save();
      if (p.pos >= 3) void api('video_views', { method: 'POST', body: { video_id: p.id, watch_seconds: Math.floor(p.pos), completed: p.dur > 0 && p.pos >= p.dur - 1 } }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id, save, isPremium]);

  // warm next episode once this one is playing
  useEffect(() => {
    if (playing && next && !(isLocked(next.episode_number, next.is_premium, isPremium) && !isUnlocked(next.id))) prefetchPlayback(qc, next.id);
  }, [playing, next?.id, isPremium, qc]); // eslint-disable-line react-hooks/exhaustive-deps

  // "next episode" countdown
  useEffect(() => {
    if (upNext === null) return;
    if (upNext <= 0) { if (next) go(next, 1); return; }
    const t = setTimeout(() => setUpNext(u => (u === null ? null : u - 1)), 1000);
    return () => clearTimeout(t);
  }, [upNext]); // eslint-disable-line react-hooks/exhaustive-deps

  function go(target: { id: number }, _dir: number) {
    setUpNext(null);
    navigate(watchPath(target.id), { replace: true });
  }
  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) { void v.play(); setFlash('play'); } else { v.pause(); setFlash('pause'); }
    setTimeout(() => setFlash(null), 500);
  };
  const seek = (delta: number) => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, Math.min((v.duration || 0), v.currentTime + delta)); };
  const needLogin = () => say('Pehle login karein');
  const doLike = (forceOn: boolean) => {
    if (!like.loggedIn) return needLogin();
    if (forceOn && like.on) { setBurst(b => b + 1); return; }
    like.set(!like.on); if (!like.on) setBurst(b => b + 1);
  };
  const share = async () => {
    if (!g) return;
    const url = `${location.origin}${seriesPath(g.title)}`;
    try {
      if (navigator.share) await navigator.share({ title: g.title, url });
      else { await navigator.clipboard.writeText(url); say('Link copy ho gaya'); }
    } catch { /* cancelled */ }
  };

  // gestures on the video surface
  const down = useRef({ x: 0, y: 0, moved: false, long: false, lp: 0 as unknown as ReturnType<typeof setTimeout> });
  const lastTap = useRef({ t: 0, timer: 0 as unknown as ReturnType<typeof setTimeout> });
  const onDown = (e: React.PointerEvent) => {
    const d = down.current; d.x = e.clientX; d.y = e.clientY; d.moved = false; d.long = false;
    d.lp = setTimeout(() => { d.long = true; const v = videoRef.current; if (v) v.playbackRate = 2; setFast(true); }, 450);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = down.current;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) { d.moved = true; clearTimeout(d.lp); }
  };
  const onUp = (e: React.PointerEvent) => {
    const d = down.current; clearTimeout(d.lp);
    if (d.long) { const v = videoRef.current; if (v) v.playbackRate = 1; setFast(false); return; }
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx) * 1.3) {
      const target = dy < 0 ? next : prev;
      if (target) go(target, dy < 0 ? 1 : -1); else say(dy < 0 ? 'Aakhri episode' : 'Pehla episode');
      return;
    }
    if (d.moved) return;
    const now = Date.now(); const ratio = e.clientX / window.innerWidth;
    if (now - lastTap.current.t < 300) {
      clearTimeout(lastTap.current.timer); lastTap.current.t = 0;
      if (ratio < 0.3) { seek(-10); say('-10 sec'); } else if (ratio > 0.7) { seek(10); say('+10 sec'); } else doLike(true);
    } else {
      lastTap.current.t = now;
      lastTap.current.timer = setTimeout(() => { lastTap.current.t = 0; togglePlay(); }, 300);
    }
  };

  // scrub bar
  const barRef = useRef<HTMLDivElement>(null);
  const scrub = (e: React.PointerEvent) => {
    const v = videoRef.current, b = barRef.current; if (!v || !b || !v.duration) return;
    const r = b.getBoundingClientRect();
    v.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * v.duration;
  };

  if (isLoading) return <div className="fixed inset-0 grid place-items-center bg-black"><Loader2 className="animate-spin text-rr-gold" aria-label="Loading" /></div>;
  if (!found || !g || !ep) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-black px-6 text-center text-rr-dim">
        <div><p>Ye episode nahi mila.</p><Button className="mt-4" variant="ghost" onClick={() => navigate('/v2', { replace: true })}>Home par jayein</Button></div>
      </div>
    );
  }

  const failed = !showPaywall && (state === 'error' || (playback.isError && !serverLocked));
  const buffering = !showPaywall && !failed && state !== 'ready';

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      <video
        ref={videoRef} playsInline poster={ep.thumbnail_url || undefined} preload="auto"
        className={`absolute inset-0 h-full w-full object-cover ${showPaywall ? 'scale-110 blur-2xl opacity-60' : ''}`}
        style={!ep.thumbnail_url ? { background: gradientFor(g.title) } : undefined}
      />

      {!showPaywall && (
        <div className="absolute inset-0 touch-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
          onPointerCancel={() => { clearTimeout(down.current.lp); setFast(false); const v = videoRef.current; if (v) v.playbackRate = 1; }} />
      )}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 to-transparent" />

      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-3 px-3 pt-[calc(10px+env(safe-area-inset-top))]">
        <button onClick={() => navigate(seriesPath(g.title), { replace: true })} aria-label="Wapas" className="grid h-12 w-12 place-items-center rounded-full bg-black/40 backdrop-blur">
          <ArrowLeft size={22} aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[19px] leading-tight">{g.title}</div>
          <div className="text-[13.5px] text-white/70">Episode {ep.episode_number} / {g.episodes.length}</div>
        </div>
        <button onClick={() => { const n = !dataSaver; setDataSaver(n); ds.set(n); say(n ? 'Data saver on (480p)' : 'Data saver off'); retry(); }}
          aria-pressed={dataSaver} className={`min-h-11 rounded-full px-3.5 text-[13.5px] font-bold backdrop-blur ${dataSaver ? 'bg-rr-gold text-[#14100A]' : 'bg-black/40'}`}>
          480p
        </button>
      </div>

      {/* right rail */}
      {!showPaywall && (
        <div className="absolute bottom-[150px] right-2.5 flex flex-col items-center gap-3.5">
          <RailBtn label="Like" active={like.on} onClick={() => doLike(false)}><Heart size={30} fill={like.on ? 'var(--ember)' : 'none'} stroke={like.on ? 'var(--ember)' : '#fff'} aria-hidden /></RailBtn>
          <RailBtn label="My List" active={list.on} onClick={() => (list.loggedIn ? list.set(!list.on) : needLogin())}><Bookmark size={28} fill={list.on ? 'var(--gold)' : 'none'} stroke={list.on ? 'var(--gold)' : '#fff'} aria-hidden /></RailBtn>
          <RailBtn label="Episodes" onClick={() => setEpsOpen(true)}><List size={28} aria-hidden /></RailBtn>
          <RailBtn label="Share" onClick={share}><Share2 size={27} aria-hidden /></RailBtn>
        </div>
      )}

      {/* bottom info + scrub */}
      {!showPaywall && (
        <div className="absolute inset-x-0 bottom-0 pb-[env(safe-area-inset-bottom)]">
          <div className="pointer-events-none px-4 pb-2 pr-20">
            <div className="line-clamp-1 text-[17px] font-bold">{ep.title}</div>
            {ep.description && <div className="line-clamp-2 text-[14.5px] text-white/75">{ep.description}</div>}
          </div>
          <div ref={barRef} className="flex h-8 touch-none items-end" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); scrub(e); }}
            onPointerMove={e => { if (e.buttons) scrub(e); }} role="slider" aria-label="Progress" aria-valuenow={Math.round(progress * 100)}>
            <div className="h-1 w-full bg-white/25"><div className="h-full bg-rr-gold" style={{ width: `${progress * 100}%` }} /></div>
          </div>
        </div>
      )}

      {/* overlays */}
      <AnimatePresence>
        {flash && (
          <motion.div key={flash + Date.now()} initial={{ opacity: 0.9, scale: 0.8 }} animate={{ opacity: 0, scale: 1.3 }} transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-black/50">{flash === 'play' ? <Play size={36} fill="#fff" aria-hidden /> : <Pause size={36} fill="#fff" aria-hidden />}</div>
          </motion.div>
        )}
        {burst > 0 && (
          <motion.div key={burst} initial={{ opacity: 1, scale: 0.4 }} animate={{ opacity: 0, scale: 1.6 }} transition={{ duration: 0.7 }}
            className="pointer-events-none absolute inset-0 grid place-items-center">
            <Heart size={110} fill="var(--ember)" stroke="var(--ember)" aria-hidden />
          </motion.div>
        )}
      </AnimatePresence>


      {buffering && <div className="pointer-events-none absolute inset-0 grid place-items-center"><Loader2 size={34} className="animate-spin text-white/80" aria-label="Loading" /></div>}
      {fast && <div className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[14px] font-bold">2x</div>}
      {soundBlocked && !showPaywall && (
        <button onClick={unmute} className="absolute left-1/2 top-28 flex min-h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-black/65 px-4 text-[14.5px] font-semibold backdrop-blur">
          <Volume2 size={18} aria-hidden /> Awaaz ke liye tap karein
        </button>
      )}
      {toast && <div role="status" className="pointer-events-none absolute left-1/2 top-40 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-[14.5px] font-semibold">{toast}</div>}

      {failed && (
        <div className="absolute inset-0 grid place-items-center bg-black/70 px-8 text-center">
          <div>
            <p className="mb-4 text-[17px]">Video nahi chala. Internet check karke dobara try karein.</p>
            <Button onClick={() => { if (playback.isError) void playback.refetch(); else retry(); }}>Dobara try karein</Button>
          </div>
        </div>
      )}

      {upNext !== null && next && (
        <div className="absolute inset-x-4 bottom-24 flex items-center justify-between rounded-2xl bg-black/75 px-4 py-3 backdrop-blur">
          <div><div className="text-[13.5px] text-white/70">Agla episode</div><div className="font-bold">Episode {next.episode_number} · {upNext}s</div></div>
          <Button variant="ghost" onClick={() => setUpNext(null)}>Roken</Button>
        </div>
      )}

      {/* paywall (cliffhanger) */}
      <PaywallSheet open={showPaywall} onClose={() => navigate(seriesPath(g.title), { replace: true })} episode={{ id: ep.id, episode_number: ep.episode_number }} />

      {/* episodes */}
      <Sheet open={epsOpen} onClose={() => setEpsOpen(false)} title={g.title}>
        <div className="grid grid-cols-5 gap-2">
          {g.episodes.map(e => {
            const lk = isLocked(e.episode_number, e.is_premium, isPremium) && !isUnlocked(e.id);
            return (
              <button key={e.id} onClick={() => { setEpsOpen(false); if (e.id !== ep.id) go(e, e.episode_number > ep.episode_number ? 1 : -1); }}
                className={`relative grid aspect-square min-h-12 place-items-center rounded-xl border font-bold ${e.id === ep.id ? 'border-rr-gold bg-rr-gold/15 text-rr-hi' : 'border-rr-line bg-rr-s2'} ${lk ? 'text-rr-dim' : ''}`}>
                {e.episode_number}
                {lk && <Lock size={12} className="absolute bottom-1 text-rr-gold" aria-hidden />}
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

function RailBtn({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={active} className="flex min-h-12 min-w-12 flex-col items-center gap-0.5 text-[13px] font-semibold drop-shadow">
      {children}<span>{label}</span>
    </button>
  );
}
