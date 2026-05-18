import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient, User, Session } from '@supabase/supabase-js';
import {
  Play, Pause, Heart, Bookmark, Download, Share2, X, ArrowLeft,
  User as UserIcon, Clock, Star, CreditCard, CheckCircle, Lock, Plus, Edit2, Trash2,
  BarChart3, Users, Settings, TrendingUp, Volume2, VolumeX,
  Facebook, Instagram, Youtube, MessageCircle, Download as InstallIcon, Home, Compass
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE CLIENT (Direct & Clean Connection)
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://rwtndqorpizoozbpcmca.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dG5kcW9ycGl6b296YnBjbWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDYwMjMsImV4cCI6MjA5NDE4MjAyM30.8mHW5OGBM8mNuMBp-yASHWYlwcbQkNaUhYQ-JvMl_6Q";

// Initializing the master single connection client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUNNY = {
  cdnBase: "https://reelrampproshorts1.b-cdn.net",
};

const getBunnyCdnUrl = (path: string) =>
  path.startsWith("http") ? path : `${BUNNY.cdnBase}/${path.replace(/^\//, "")}`;

const REELRAMP_LOGO = "https://drive.google.com/uc?export=view&id=1qs734lVBcgz-fJ_TitnibEG-KqX0LCVg";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & PLATFORM STRUCTURE
// ─────────────────────────────────────────────────────────────────────────────
interface Video {
  id: number; title: string; description: string; category: string; duration: string;
  isPremium: boolean; thumbnail: string; videoUrl: string; source?: 'direct' | 'youtube' | 'gdrive' | 'bunny';
  likesCount?: number; bookmarksCount?: number; rating?: number;
}

interface WatchHistoryItem { videoId: number; watchedAt: string; progress: number; }
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION LOCALSTORAGE STORAGE CONTROLLERS (Vite Generic Syntax Fixed)
// ─────────────────────────────────────────────────────────────────────────────
const ls = {
  get: <T,>(key: string, fallback: T): T => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  },
  set: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* fail-safe */ }
  },
  remove: (key: string) => localStorage.removeItem(key),
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL MONETIZATION & AUTH CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null; session: Session | null; loading: boolean; isSubscribed: boolean;
  setSyncingState: (v: boolean) => void; syncing: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, session: null, loading: true, isSubscribed: false,
  setSyncingState: () => {}, syncing: false, signOut: async () => {},
});

const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session); setUser(session?.user ?? null); setLoading(false);
      if (session?.user) checkSubscription(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session); setUser(session?.user ?? null); setLoading(false);
      if (session?.user) checkSubscription(session.user.id);
      else setIsSubscribed(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkSubscription = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('is_subscribed').eq('id', userId).single();
    setIsSubscribed(!!data?.is_subscribed);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    setUser(null); setSession(null); setIsSubscribed(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isSubscribed, syncing, setSyncingState: setSyncing, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 6: CUSTOM PROGRESSIVE WEB APP (PWA) INSTALL TRIGGER
// ─────────────────────────────────────────────────────────────────────────────
export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!sessionStorage.getItem('rr_pwa_dismissed')) setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  if (!showBanner) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                className="fixed bottom-28 left-4 right-4 max-w-[420px] mx-auto z-[100] bg-[#111]/95 backdrop-blur-xl border border-[#c5a26f]/40 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#c5a26f]/10 flex items-center justify-center text-[#c5a26f] shrink-0"><Download size={18} /></div>
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Install App Web Instance</h4>
          <p className="text-[11px] text-white/60 mt-0.5">Fluid fullscreen cinematic player</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={async () => { if (!deferredPrompt) return; setShowBanner(false); await deferredPrompt.prompt(); }} className="px-3 py-1.5 bg-[#c5a26f] text-black text-xs font-black rounded-lg uppercase">INSTALL</button>
        <button onClick={() => { setShowBanner(false); sessionStorage.setItem('rr_pwa_dismissed', 'true'); }} className="text-white/40 text-xs p-1">X</button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 1: ANONYMOUS GUEST ENTRY WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
export function GuestRoute({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!localStorage.getItem('rr_guest_id')) {
      localStorage.setItem('rr_guest_id', `guest_${Math.random().toString(36).slice(2, 11)}`);
    }
  }, []);
  return <>{children}</>;
}

export function LoginPage() {
  const navigate = useNavigate(); const { user } = useAuth();
  useEffect(() => { if (user) navigate('/profile', { replace: true }); }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5 pb-10">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2.5 justify-center mb-6">
          <span className="font-semibold text-2xl text-white tracking-tight">ReelRamp Pro</span>
        </div>
        <AuthForms onSuccess={() => navigate('/profile', { replace: true })} />
      </div>
    </div>
  );
}

export function AuthForms({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [name, setName] = useState(''); const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (mode === 'register') {
        const { data: up, error: upErr } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (upErr) throw upErr;
        if (up?.user) await supabase.from('profiles').upsert({ id: up.user.id, full_name: name, email, is_subscribed: false });
        await supabase.auth.signInWithPassword({ email, password }); onSuccess?.();
      } else {
        const { error: inErr } = await supabase.auth.signInWithPassword({ email, password });
        if (inErr) throw inErr; onSuccess?.();
      }
    } catch (err: any) { setError(err.message || 'Auth execution failed.'); } finally { setLoading(false); }
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-3xl p-6 w-full text-left">
      <div className="flex bg-[#1a1a1a] rounded-2xl p-1 mb-6">
        {(['login', 'register'] as const).map(m => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === m ? 'bg-[#c5a26f] text-black font-bold' : 'text-[#666]'}`}>{m === 'login' ? 'Login' : 'Register'}</button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'register' && <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none text-white" />}
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none text-white" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none text-white" />
        {error && <p className="text-[#e11d48] text-xs px-1">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider flex items-center justify-center gap-2 text-sm">{loading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}Continue</button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 2: CUSTOM PREMIUM ULTRA VERTICAL PLAYER
// ─────────────────────────────────────────────────────────────────────────────
export function PremiumVideoPlayer({ video, isPlaying, onPlayPause, onEnded, onProgress }: {
  video: Video; isPlaying: boolean; onPlayPause: () => void; onEnded: () => void; onProgress?: (pct: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null); const [loaded, setLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false); const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1); const [showSpeedHUD, setShowSpeedHUD] = useState(false);
  const [tapSide, setTapSide] = useState<'left' | 'right' | null>(null);
  const [heartBursts, setHeartBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTap = useRef<{ time: number; side: 'left' | 'right' }>({ time: 0, side: 'left' });

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    isPlaying ? v.play().catch(() => {}) : v.pause();
  }, [isPlaying, video]);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left; const tapY = e.clientY - rect.top;
    const isLeft = tapX < rect.width / 2; const side = isLeft ? 'left' : 'right';
    const now = Date.now(); const delta = now - lastTap.current.time;

    if (delta < 300 && lastTap.current.side === side) {
      if (videoRef.current) videoRef.current.currentTime = isLeft ? Math.max(0, videoRef.current.currentTime - 10) : Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
      setTapSide(side); setTimeout(() => setTapSide(null), 650);
      if (!isLeft) {
        const id = Date.now(); setHeartBursts(prev => [...prev, { id, x: tapX, y: tapY }]);
        setTimeout(() => setHeartBursts(prev => prev.filter(b => b.id !== id)), 900);
      }
    } else { setTimeout(() => { if (Date.now() - now >= 290) onPlayPause(); }, 300); }
    lastTap.current = { time: now, side };
  };

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      <video ref={videoRef} src={video.source === 'bunny' ? getBunnyCdnUrl(video.videoUrl) : video.videoUrl} className="w-full h-full object-cover" playsInline autoPlay={isPlaying} onEnded={onEnded} onLoadedData={() => setLoaded(true)} 
             onTimeUpdate={() => {
               if (!videoRef.current || !videoRef.current.duration) return;
               const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100; setProgress(pct); onProgress?.(pct);
             }} />
      <div className="absolute inset-0 z-10" onClick={handleTap} />
      <AnimatePresence>{!isPlaying && loaded && <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 pointer-events-none"><div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl"><Play size={28} className="text-black ml-0.5" /></div></div>}</AnimatePresence>
      {heartBursts.map(b => <motion.div key={b.id} initial={{ opacity: 1, scale: 0.5, x: b.x - 20, y: b.y - 20 }} animate={{ opacity: 0, scale: 2, y: b.y - 120 }} exit={{ opacity: 0 }} className="absolute z-40 pointer-events-none text-[#e11d48] text-4xl" style={{ left: 0, top: 0 }}>❤️</motion.div>)}
      
      {/* HUD Bar Controls overlay */}
      <div className="absolute top-6 right-4 z-40 flex flex-col gap-3">
        <button onClick={e => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-lg">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        <button onClick={e => { e.stopPropagation(); const next = speed >= 2 ? 0.5 : speed + 0.5; setSpeed(next); if (videoRef.current) videoRef.current.playbackRate = next; }} className="w-11 h-11 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white text-xs font-mono font-black flex items-center justify-center shadow-lg">{speed}x</button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-40 h-1.5 bg-white/10"><div className="h-full bg-[#c5a26f]" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INTERACTIVE SHORTS DISCOVERY COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function ShortsPlayerPage() {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate();
  const { isSubscribed } = useAuth();
  const [feedVideos, setFeedVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    // Sync table values instantly via state hook triggers
    supabase.from('videos').select('*').then(({ data }) => {
      if (data && data.length > 0) {
        setFeedVideos(data);
        const idx = data.findIndex(v => v.id === parseInt(id ?? '1', 10));
        setCurrentIndex(idx !== -1 ? idx : 0);
      }
    });
  }, [id]);

  const currentShort = feedVideos[currentIndex];

  const handleMove = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= feedVideos.length) return;
    if (feedVideos[nextIndex].isPremium && !isSubscribed) { setShowPaywall(true); setIsPlaying(false); }
    else { setCurrentIndex(nextIndex); setIsPlaying(true); }
  };

  if (!currentShort) return <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden" style={{ touchAction: 'none' }}
         onTouchStart={e => touchStartY.current = e.touches[0].clientY}
         onTouchEnd={e => { const diff = touchStartY.current - e.changedTouches[0].clientY; if (Math.abs(diff) > 60) diff > 0 ? handleMove(currentIndex + 1) : handleMove(currentIndex - 1); }}>
      
      {/* Structural Top Layer Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-5 pt-12 pb-4 bg-gradient-to-b from-black/85 to-transparent">
        <button onClick={() => navigate(-1)} className="p-3.5 bg-black/40 border border-white/5 rounded-2xl text-white backdrop-blur-xl"><ArrowLeft size={20} /></button>
        <div className="text-xs px-4 py-1.5 bg-black/40 border border-white/5 rounded-full text-white font-mono tracking-widest uppercase">{currentShort.category}</div>
        <div className="text-xs px-3.5 py-1.5 bg-white/10 text-white font-mono rounded-xl font-bold">{currentIndex + 1} / {feedVideos.length}</div>
      </div>

      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="relative w-full max-w-[460px] h-full shadow-2xl">
          <PremiumVideoPlayer video={currentShort} isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)} onEnded={() => handleMove(currentIndex + 1)} />

          {/* Core Visual Elements Layer Overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-5 pb-28 pt-24 pointer-events-none">
            <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">{currentShort.title}</h2>
            <p className="text-sm text-white/70 mt-1.5 pr-20 line-clamp-2 leading-relaxed">{currentShort.description}</p>
          </div>

          {/* Core Visual Interactive Action Rail Stack */}
          <div className="absolute right-4 bottom-32 z-30 flex flex-col items-center gap-4">
            <button className="w-14 h-14 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"><Heart size={22} /></button>
            <button className="w-14 h-14 rounded-2xl bg-black/55 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"><Bookmark size={22} /></button>
            <button onClick={() => alert("Link Copied!")} className="w-14 h-14 rounded-2xl bg-black/55 border border-white/10 flex items-center justify-center text-white"><Share2 size={22} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center px-4">
            <div className="bg-[#111] border border-[#c5a26f]/30 w-full max-w-sm rounded-3xl p-8 text-center">
              <div className="w-16 h-16 bg-[#c5a26f]/10 text-[#c5a26f] rounded-2xl flex items-center justify-center mx-auto mb-4"><Lock size={28}/></div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Premium Pass Required</h3>
              <button onClick={() => { setShowPaywall(false); navigate('/subscription'); }} className="w-full mt-6 py-4 bg-[#c5a26f] text-black font-black tracking-wider text-xs rounded-xl uppercase">Unlock Access</button>
            </div>
          </div>
        )}
      </AnimatePresence>
      <BottomNavigation /> <PWAInstallBanner />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL FIX: MAIN SECURE REAL-TIME CONFIG EDITOR PANEL (Admin System Fix)
// ─────────────────────────────────────────────────────────────────────────────
export function EditorPanel() {
  const { syncing, setSyncingState } = useAuth();
  const [promoUrl, setPromoUrl] = useState('');
  const [showPromo, setShowPromo] = useState(true);

  // Sync mutations instantly without getting stuck in states loop locks
  const handleSavePromo = async () => {
    setSyncingState(true);
    try {
      // Direct raw atomic save schema to handle Supabase relational tables mutations
      const { error } = await supabase
        .from('popup_settings')
        .upsert({ id: 'global_popup', video_url: promoUrl, is_active: showPromo, updated_at: new Date().toISOString() });
      if (error) throw error;
      alert("Promo Settings Synced Successfully Live to Production Nodes!");
    } catch (err: any) {
      alert(`Database Mutation Error: ${err.message}`);
    } finally {
      // CRITICAL LOCK RELEASE TRIGGER: Releases the syncing screen freeze safely
      setSyncingState(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-md mx-auto pt-14 pb-32">
      <h1 className="text-3xl font-black tracking-tight mb-2">Production Control</h1>
      <p className="text-xs text-white/40 mb-8">Mutate and rewrite configurations directly on nodes.</p>

      <div className="bg-[#111] border border-[#222] p-5 rounded-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold">Show Promo Video</h3>
            <p className="text-[11px] text-white/40 mt-0.5">Display inside fallback trial popup</p>
          </div>
          <input type="checkbox" checked={showPromo} onChange={e => setShowPromo(e.target.checked)} className="accent-[#c5a26f] w-5 h-5" />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-white/60">Promo Direct / Embed Video URL</label>
          <input type="text" value={promoUrl} onChange={e => setPromoUrl(e.target.value)} placeholder="https://youtube.com/embed/..." className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl py-3 px-4 text-xs text-white focus:border-[#c5a26f] outline-none" />
        </div>

        <button onClick={handleSavePromo} disabled={syncing} className="w-full py-4 bg-[#c5a26f] text-black font-black text-xs tracking-wider rounded-xl uppercase flex items-center justify-center gap-2">
          {syncing ? 'Syncing to Supabase...' : 'Save Promo Video Settings'}
        </button>
      </div>
      <BottomNavigation />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION SHELL ROUTER MAP
// ─────────────────────────────────────────────────────────────────────────────
function BottomNavigation() {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d0d]/90 backdrop-blur-2xl border-t border-white/5 px-4 pb-6 pt-3 flex justify-around items-center max-w-[460px] mx-auto rounded-t-3xl">
      <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 text-white/50 hover:text-[#c5a26f] transition"><Home size={20} /><span className="text-[10px] font-bold">Home</span></button>
      <button onClick={() => navigate('/player/1')} className="flex flex-col items-center gap-1 text-[#c5a26f] transition"><Compass size={20}/><span className="text-[10px] font-bold">Shorts</span></button>
      <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-white/50 hover:text-[#c5a26f] transition"><UserIcon size={20} /><span className="text-[10px] font-bold">Profile</span></button>
    </div>
  );
}

export function ProfilePage() {
  const navigate = useNavigate(); const { user, signOut, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-md mx-auto pt-14">
      <h1 className="text-3xl font-black tracking-tight mb-6">Studio Profile</h1>
      {user ? (
        <div className="bg-[#111] p-5 border border-[#222] rounded-3xl text-center space-y-4">
          <p className="text-sm font-mono truncate">{user.email}</p>
          <button onClick={signOut} className="text-xs font-black text-red-500 uppercase tracking-wider block mx-auto">Sign Out Account</button>
        </div>
      ) : (
        <AuthForms onSuccess={() => navigate('/profile', { replace: true })} />
      )}
      <BottomNavigation />
    </div>
  );
}

// Shell Master Entry Fallbacks Routing Setup Map configurations bounds
function MainLayoutStore() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestRoute><ShortsPlayerPage /></GuestRoute>} />
          <Route path="/player/:id" element={<GuestRoute><ShortsPlayerPage /></GuestRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin-secure-7842" element={<EditorPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default MainLayoutStore;
