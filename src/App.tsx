import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Heart, Bookmark, Share2, ArrowLeft, User as UserIcon, 
  Star, CheckCircle, Lock, Volume2, VolumeX, ChevronUp, ChevronDown, 
  LogIn, UserPlus, KeyRound, Chrome, Download 
} from 'lucide-react';

// =========================================================================
// TYPES & INTERFACES
// =========================================================================
export interface Video {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: string;
  isPremium: boolean;
  thumbnail: string;
  videoUrl: string;
  source?: 'direct' | 'youtube' | 'gdrive' | 'bunny';
  storagePath?: string;
}

export interface WatchHistoryItem {
  videoId: number;
  watchedAt: string;
  progress: number;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// =========================================================================
// SUPABASE & UTILS (Bunny.net Connectivity Built-in)
// =========================================================================
// Yahan aap apna asli Supabase client import ya define kar sakte hain
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL as string) || "https://your-supabase-url.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || "your-anon-key";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bunny.net CDN URL Resolver
export const getBunnyCdnUrl = (path: string): string => {
  const BUNNY_STORAGE_ZONE_URL = "https://yourzone.b-cdn.net"; // Apne Bunny CDN se replace karein
  if (path.startsWith('http')) return path;
  return `${BUNNY_STORAGE_ZONE_URL}/${path.replace(/^\//, '')}`;
};

// LocalStorage Helper
export const ls = {
  get: (key: string, defaultValue: any) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error setting localStorage", e);
    }
  }
};

// Database/API Mock Fallbacks (Real project mein inme Supabase queries hongi)
export const fetchVideosFromDB = async (): Promise<Video[]> => {
  try {
    const { data, error } = await supabase.from('videos').select('*');
    if (error) throw error;
    return data || [];
  } catch (err) {
    // Fallback data agar table na bani ho
    return [
      { id: 1, title: "Cinematic Workspace", description: "Premium editing setup goals.", category: "Tech", duration: "0:15", isPremium: false, thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500", videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-keyboard-under-neon-lights-41951-large.mp4", source: "direct" },
      { id: 2, title: "Luxury Ride Inside", description: "Exclusive member-only walkaround.", category: "Automotive", duration: "0:20", isPremium: true, thumbnail: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500", videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-dashboard-of-a-car-at-night-42023-large.mp4", source: "bunny" }
    ];
  }
};

// =========================================================================
// AUTH CONTEXT PROVIDER
// =========================================================================
const AuthContext = createContext<{
  user: any;
  isSubscribed: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}>({ user: null, isSubscribed: false, loading: true, signOut: async () => {} });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkSubscription(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkSubscription(session.user.id);
      else setIsSubscribed(false);
      setLoading(false);
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
    setUser(null);
    setIsSubscribed(false);
  };

  return (
    <AuthContext.Provider value={{ user, isSubscribed, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// =========================================================================
// SYSTEM 1: GUEST ROUTE & ANON PASS SYSTEM
// =========================================================================
export function GuestRoute({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!localStorage.getItem('rr_guest_id')) {
      localStorage.setItem('rr_guest_id', `guest_${Math.random().toString(36).slice(2, 11)}`);
    }
  }, []);
  return <>{children}</>;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5 pb-10">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 justify-center mb-4">
            <svg width={36} height={36} viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="#c5a26f" strokeWidth="3"/>
              <circle cx="32" cy="32" r="18" stroke="#c5a26f" strokeWidth="2"/>
              <path d="M24 22 L24 42 M24 22 L36 22 C40 22 42 25 42 28 C42 32 39 34 35 34 L24 34 M35 34 L42 42" stroke="#f4f4f5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M38 27 L38 37 L45 32 Z" fill="#c5a26f"/>
            </svg>
            <span className="font-semibold tracking-[-1.5px] text-2xl text-white">ReelRamp</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Sign In</h1>
          <p className="text-[#a1a1aa] mt-1 text-sm">or <button onClick={() => navigate('/')} className="text-[#c5a26f] underline">continue as guest</button></p>
        </div>
        <AuthForms onSuccess={() => navigate('/', { replace: true })} />
        <p className="text-center text-xs text-[#555] mt-6">
          <button onClick={() => navigate('/')} className="hover:text-white transition"> ← Back to app without signing in </button>
        </p>
      </motion.div>
    </div>
  );
}

export function AuthForms({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => { setError(''); setSuccessMsg(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);
    try {
      if (mode === 'register') {
        const { data: up, error: upErr } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (upErr) throw upErr;
        if (up?.user) {
          await supabase.from('profiles').upsert({ id: up.user.id, full_name: name, email, created_at: new Date().toISOString() });
        }
        await supabase.auth.signInWithPassword({ email, password });
        onSuccess?.();
      } else if (mode === 'login') {
        const { error: inErr } = await supabase.auth.signInWithPassword({ email, password });
        if (inErr) throw inErr;
        onSuccess?.();
      } else {
        const { error: rErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
        if (rErr) throw rErr;
        setSuccessMsg('Reset link sent! Check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/profile` } });
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-3xl p-6 sm:p-8 w-full">
      {mode !== 'forgot' && (
        <div className="flex bg-[#1a1a1a] rounded-2xl p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); reset(); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === m ? 'bg-[#c5a26f] text-black' : 'text-[#666]'}`}>
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>
      )}
      {mode !== 'forgot' && (
        <>
          <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-black rounded-2xl font-medium text-sm mb-4 hover:bg-[#f0f0f0] transition-all">
            <Chrome size={18} /> Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4"><div className="flex-1 h-px bg-[#2a2a2a]" /><span className="text-[#444] text-xs">or</span><div className="flex-1 h-px bg-[#2a2a2a]" /></div>
        </>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'register' && (
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none text-white" />
        )}
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none text-white" />
        {mode !== 'forgot' && (
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required minLength={6} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none text-white" />
        )}
        {error && <p className="text-[#e11d48] text-xs px-1">{error}</p>}
        {successMsg && <p className="text-[#22c55e] text-xs px-1">{successMsg}</p>}
        <button type="submit" disabled={loading} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
          {loading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
          {mode === 'login' && <><LogIn size={16}/> Login</>}
          {mode === 'register' && <><UserPlus size={16}/> Create Account</>}
          {mode === 'forgot' && <><KeyRound size={16}/> Send Reset Link</>}
        </button>
      </form>
    </div>
  );
}

// =========================================================================
// SYSTEM 2: ULTRA-PREMIUM TIKTOK/KUKU-STYLE PLAYER
// =========================================================================
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export function PremiumVideoPlayer({ video, isPlaying, onPlayPause, onEnded, onProgress }: {
  video: Video; isPlaying: boolean; onPlayPause: () => void; onEnded: () => void; onProgress?: (pct: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeedHUD, setShowSpeedHUD] = useState(false);
  const [tapSide, setTapSide] = useState<'left' | 'right' | null>(null);
  const [heartBursts, setHeartBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTap = useRef<{ time: number; side: 'left' | 'right' }>({ time: 0, side: 'left' });
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const burstId = useRef(0);

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    isPlaying ? v.play().catch(() => {}) : v.pause();
  }, [isPlaying]);

  useEffect(() => { if (videoRef.current) videoRef.current.muted = isMuted; }, [isMuted]);
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (speedMenuRef.current?.contains(e.target as Node)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left; const tapY = e.clientY - rect.top;
    const isLeft = tapX < rect.width / 2; const side = isLeft ? 'left' : 'right';
    const now = Date.now(); const delta = now - lastTap.current.time;

    if (delta < 300 && lastTap.current.side === side) {
      const v = videoRef.current;
      if (v) v.currentTime = isLeft ? Math.max(0, v.currentTime - 10) : Math.min(v.duration, v.currentTime + 10);
      setTapSide(side); setTimeout(() => setTapSide(null), 650);
      if (!isLeft) {
        const id = burstId.current++; setHeartBursts(prev => [...prev, { id, x: tapX, y: tapY }]);
        setTimeout(() => setHeartBursts(prev => prev.filter(b => b.id !== id)), 900);
      }
    } else {
      setTimeout(() => { if (Date.now() - now >= 290) onPlayPause(); }, 300);
    }
    lastTap.current = { time: now, side };
  };

  if (video.source === 'youtube') {
    const ytId = video.videoUrl.split('/').pop()?.split('?')[0] ?? '';
    return (
      <div className="relative w-full h-full bg-black">
        <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}?autoplay=${isPlaying ? 1 : 0}&controls=1&modestbranding=1&rel=0&playsinline=1`} title={video.title} frameBorder="0" allowFullScreen onLoad={() => setLoaded(true)} />
      </div>
    );
  }

  const resolvedUrl = video.source === 'bunny' ? getBunnyCdnUrl(video.videoUrl) : video.videoUrl;

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      <video ref={videoRef} src={resolvedUrl} className="w-full h-full object-cover" playsInline autoPlay={isPlaying} onEnded={onEnded} 
             onLoadedData={() => { setLoaded(true); setDuration(videoRef.current?.duration ?? 0); }} 
             onTimeUpdate={() => {
               if (!videoRef.current) return;
               const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
               setProgress(pct); setCurrentTime(videoRef.current.currentTime); onProgress?.(pct);
             }} />
      <div className="absolute inset-0 z-10" onClick={handleTap} />
      <AnimatePresence>
        {!isPlaying && loaded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="w-[72px] h-[72px] rounded-full bg-white/90 flex items-center justify-center shadow-2xl"><Play size={34} className="text-black ml-1" /></div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {tapSide && (
          <motion.div key={`flash-${tapSide}`} initial={{ opacity: 0.95, scale: 0.75 }} animate={{ opacity: 0, scale: 1.25 }} exit={{ opacity: 0 }} className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none w-[90px] h-[90px] rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ${tapSide === 'left' ? 'left-8' : 'right-8'}`}>
            <span className="text-white text-xl font-bold font-mono">{tapSide === 'left' ? '−10s' : '+10s'}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {heartBursts.map(b => (
          <motion.div key={b.id} initial={{ opacity: 1, scale: 0.4, x: b.x - 20, y: b.y - 20 }} animate={{ opacity: 0, scale: 1.8, y: b.y - 100 }} exit={{ opacity: 0 }} transition={{ duration: 0.85 }} className="absolute z-40 pointer-events-none text-[#e11d48] text-4xl" style={{ left: 0, top: 0 }}>❤️</motion.div>
        ))}
      </AnimatePresence>
      {/* HUD Controls */}
      <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">
        <button onClick={e => { e.stopPropagation(); setIsMuted(m => !m); }} className="p-2.5 bg-black/55 backdrop-blur-lg rounded-2xl border border-white/10 text-white">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <div className="relative" ref={speedMenuRef}>
          <button onClick={e => { e.stopPropagation(); setShowSpeedHUD(s => !s); }} className="px-3 py-2 bg-black/55 backdrop-blur-lg rounded-2xl border border-white/10 text-white text-xs font-mono font-bold">
            {speed}×
          </button>
          <AnimatePresence>
            {showSpeedHUD && (
              <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }} className="absolute right-0 top-11 z-50 bg-[#0d0d0d]/96 backdrop-blur-2xl border border-[#333] rounded-2xl w-[86px]">
                {PLAYBACK_SPEEDS.map(s => (
                  <button key={s} onClick={() => { setSpeed(s); setShowSpeedHUD(false); }} className={`w-full py-2.5 text-center text-sm font-mono ${speed === s ? 'bg-[#c5a26f] text-black font-bold' : 'text-white'}`}>
                    {s}×
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 cursor-pointer" onClick={e => {
        e.stopPropagation(); if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * videoRef.current.duration;
      }}>
        <div className="relative bg-white/15 h-[3px]">
          <div className="absolute left-0 top-0 h-full bg-[#c5a26f]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SHORTS FEED PAGE (TikTok Vertical Layout)
// =========================================================================
export function ShortsPlayerPage() {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate();
  const { isSubscribed } = useAuth();
  const [feedVideos, setFeedVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [library, setLibrary] = useState<number[]>([]);
  const [userRating, setUserRating] = useState(0);

  const feedRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const touchStartY = useRef(0);

  useEffect(() => {
    fetchVideosFromDB().then((vids) => {
      setFeedVideos(vids);
      const idx = vids.findIndex(v => v.id === parseInt(id ?? '1', 10));
      setCurrentIndex(idx !== -1 ? idx : 0);
    });
    setLibrary(ls.get('reelramp_library', []));
  }, [id]);

  const currentShort = feedVideos[currentIndex];

  useEffect(() => {
    if (!currentShort) return;
    const history = ls.get('reelramp_history', []);
    if (!history.some((h: any) => h.videoId === currentShort.id)) {
      ls.set('reelramp_history', [...history, { videoId: currentShort.id, watchedAt: new Date().toISOString(), progress: 0 }]);
    }
    const ratings = ls.get('reelramp_ratings', {});
    setUserRating(ratings[currentShort.id] ?? 0);
    setIsLiked(false);
  }, [currentIndex, currentShort]);

  const scrollToIndex = (idx: number) => {
    const el = itemRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const checkPremium = (video: Video): boolean => {
    if (video.isPremium && !isSubscribed) { setShowPaywall(true); setIsPlaying(false); return false; }
    return true;
  };

  const goNext = () => {
    if (currentIndex < feedVideos.length - 1 && checkPremium(feedVideos[currentIndex + 1])) {
      setCurrentIndex(p => p + 1); scrollToIndex(currentIndex + 1); setIsPlaying(true);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) { setCurrentIndex(p => p - 1); scrollToIndex(currentIndex - 1); setIsPlaying(true); }
  };

  if (!currentShort) return <div className="fixed inset-0 bg-black flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden" style={{ touchAction: 'none' }}
         onTouchStart={e => touchStartY.current = e.touches[0].clientY}
         onTouchEnd={e => { const delta = touchStartY.current - e.changedTouches[0].clientY; if (Math.abs(delta) > 55) delta > 0 ? goNext() : goPrev(); }}>
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-5 pt-10 pb-3 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={() => navigate(-1)} className="p-3 bg-black/40 rounded-2xl text-white backdrop-blur-md"><ArrowLeft size={22} /></button>
        <div className="text-xs tracking-[3px] text-white/60 font-medium">{currentShort.category.toUpperCase()} • {currentShort.duration}</div>
        <div className="text-sm px-3 py-1 bg-white/10 text-white rounded-full font-mono">{currentIndex + 1}/{feedVideos.length}</div>
      </div>

      {/* Snap Container Feed */}
      <div ref={feedRef} className="w-full h-full overflow-y-scroll" style={{ scrollSnapType: 'y mandatory', scrollbarWidth: 'none' }}>
        {feedVideos.map((video, idx) => (
          <div key={video.id} ref={el => itemRefs.current[idx] = el} className="relative w-full flex items-center justify-center bg-black" style={{ height: '100dvh', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
            {Math.abs(idx - currentIndex) <= 1 && (
              <div className="relative w-full max-w-[480px] h-full">
                <PremiumVideoPlayer video={video} isPlaying={isPlaying && idx === currentIndex} onPlayPause={() => { if (idx === currentIndex && checkPremium(video)) setIsPlaying(p => !p); }} onEnded={goNext} />
                
                {/* Bottom Overlay Info */}
                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-5 pb-[76px] pt-20 pointer-events-none">
                  <h2 className="text-[1.65rem] font-semibold tracking-[-1px] text-white leading-tight mb-1.5">{video.title}</h2>
                  <p className="text-sm text-white/65 line-clamp-2 pr-16">{video.description}</p>
                </div>

                {/* Right Action Menu */}
                {idx === currentIndex && (
                  <div className="absolute right-4 bottom-[90px] z-30 flex flex-col items-center gap-5">
                    <button onClick={() => setIsLiked(l => !l)} className="flex flex-col items-center gap-1">
                      <div className={`p-4 rounded-2xl ${isLiked ? 'bg-[#e11d48]' : 'bg-black/55 text-white'}`}><Heart size={24} className={isLiked ? 'fill-white' : ''} /></div>
                    </button>
                    <button onClick={() => {
                      const updated = library.includes(video.id) ? library.filter(x => x !== video.id) : [...library, video.id];
                      setLibrary(updated); ls.set('reelramp_library', updated);
                    }} className="flex flex-col items-center gap-1">
                      <div className="p-4 rounded-2xl bg-black/55 text-white"><Bookmark size={24} className={library.includes(video.id) ? 'fill-[#c5a26f] text-[#c5a26f]' : ''} /></div>
                    </button>
                    {video.isPremium && !isSubscribed && (
                      <button onClick={() => setShowPaywall(true)} className="p-3.5 bg-[#e11d48] rounded-2xl text-white"><Lock size={22} /></button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4" onClick={() => setShowPaywall(false)}>
            <div className="bg-[#111] w-full max-w-md rounded-3xl p-8 border border-[#333] text-center" onClick={e => e.stopPropagation()}>
              <Lock className="text-[#c5a26f] mx-auto mb-4" size={32} />
              <h3 className="text-3xl font-semibold text-white mb-2">Premium Content</h3>
              <p className="text-[#a1a1aa] mb-6">Unlock this video with a subscription.</p>
              <button onClick={() => navigate('/subscription')} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl">SUBSCRIBE NOW</button>
            </div>
          </div>
        )}
      </AnimatePresence>
      <PWAInstallBanner />
    </div>
  );
}

// =========================================================================
// PROFILE PAGE
// =========================================================================
export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isSubscribed, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'library' | 'account'>('library');
  const [library, setLibrary] = useState<Video[]>([]);

  useEffect(() => {
    fetchVideosFromDB().then((vids) => {
      const libIds = ls.get('reelramp_library', []);
      setLibrary(vids.filter(v => libIds.includes(v.id)));
    });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]"><div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto pb-28 px-4 pt-8 w-full text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-semibold text-3xl tracking-[-2px]">Profile</h1>
        <button onClick={() => navigate('/')} className="text-sm text-[#a1a1aa]">Home</button>
      </div>
      <div className="flex items-center gap-5 mb-9 border-b border-[#222] pb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] ring-1 ring-[#c5a26f]/40 flex items-center justify-center">
          {user ? <span className="text-4xl font-bold text-[#c5a26f]">{user.email?.charAt(0).toUpperCase()}</span> : <UserIcon size={32} className="text-[#555]" />}
        </div>
        <div>
          <div className="text-2xl font-semibold">{user ? user.email?.split('@')[0] : 'Guest'}</div>
          {user && <button onClick={signOut} className="text-xs text-[#e11d48] hover:underline mt-1">Logout</button>}
        </div>
      </div>
      {/* Tabs */}
      <div className="flex border-b border-[#222] mb-6">
        <button onClick={() => setActiveTab('library')} className={`px-5 pb-4 border-b-2 ${activeTab === 'library' ? 'border-[#c5a26f] text-white' : 'text-[#666]'}`}>My Library</button>
        <button onClick={() => setActiveTab('account')} className={`px-5 pb-4 border-b-2 ${activeTab === 'account' ? 'border-[#c5a26f] text-white' : 'text-[#666]'}`}>{user ? 'Account' : 'Sign In'}</button>
      </div>
      {activeTab === 'library' && (
        <div className="space-y-4">
          {library.length === 0 ? <p className="text-center text-[#555] py-10">No saved shorts yet.</p> : library.map(video => (
            <div key={video.id} className="flex gap-3 bg-[#111] p-3 rounded-2xl border border-[#222]">
              <img src={video.thumbnail} className="w-16 h-16 object-cover rounded-xl" alt="" />
              <div>
                <div className="font-medium text-sm">{video.title}</div>
                <button onClick={() => navigate(`/player/${video.id}`)} className="text-[#c5a26f] text-xs font-bold mt-2 flex items-center gap-1">PLAY <Play size={12}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'account' && (
        <div>{user ? <div className="p-6 bg-[#111] rounded-3xl border border-[#222]">Email: {user.email}</div> : <AuthForms onSuccess={() => setActiveTab('library')} />}</div>
      )}
    </div>
  );
}

// =========================================================================
// SYSTEM 6: AUTOMATIC PWA INSTALL PROMPT ENGINE
// =========================================================================
export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    if (window.matchMedia('(display-mode: standalone)').matches) setShowBanner(false);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!showBanner) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] bg-[#111]/95 backdrop-blur-xl border border-[#c5a26f]/30 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#c5a26f]/10 flex items-center justify-center text-[#c5a26f]"><Download size={20} /></div>
        <div>
          <h4 className="text-sm font-semibold text-white">Install ReelRamp App</h4>
          <p className="text-xs text-[#a1a1aa] mt-0.5">Smooth shorts on your home screen</p>
        </div>
      </div>
      <button onClick={async () => {
        if (!deferredPrompt) return; setShowBanner(false); await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') setDeferredPrompt(null);
      }} className="px-3.5 py-2 bg-[#c5a26f] text-black text-xs font-bold rounded-xl">INSTALL</button>
    </motion.div>
  );
}
