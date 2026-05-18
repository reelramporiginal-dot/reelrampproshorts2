import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Heart, Bookmark, Share2, ArrowLeft, User as UserIcon, 
  Star, CheckCircle, Lock, Volume2, VolumeX, ChevronUp, ChevronDown, 
  LogIn, UserPlus, KeyRound, Chrome, Download, Home, Compass, Award
} from 'lucide-react';

// =========================================================================
// TYPES & ARCHITECTURE PERSISTENCE
// =========================================================================
export interface Video {
  id: number; title: string; description: string; category: string;
  duration: string; isPremium: boolean; thumbnail: string; videoUrl: string;
  source?: 'direct' | 'youtube' | 'gdrive' | 'bunny'; storagePath?: string;
  likesCount?: number; bookmarksCount?: number; rating?: number;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// =========================================================================
// PRODUCTION STABLE UTILITIES
// =========================================================================
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL as string) || "https://your-supabase-url.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || "your-anon-key";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const getBunnyCdnUrl = (path: string): string => {
  const BUNNY_STORAGE_ZONE_URL = "https://yourzone.b-cdn.net"; // Replace with your real Bunny Link
  if (path.startsWith('http')) return path;
  return `${BUNNY_STORAGE_ZONE_URL}/${path.replace(/^\//, '')}`;
};

export const ls = {
  get: (key: string, defaultValue: any) => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : defaultValue; } catch { return defaultValue; }
  },
  set: (key: string, value: any) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error(e); }
  }
};

// =========================================================================
// REAL-TIME FALLBACK SYNCHRONIZATION
// =========================================================================
const AuthContext = createContext<{
  user: any; isSubscribed: boolean; loading: boolean; signOut: () => Promise<void>;
  syncInteraction: (videoId: number, type: 'like' | 'bookmark' | 'rate', value?: any) => Promise<void>;
}>({ user: null, isSubscribed: false, loading: true, signOut: async () => {}, syncInteraction: async () => {} });

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
    try {
      const { data } = await supabase.from('profiles').select('is_subscribed').eq('id', userId).single();
      setIsSubscribed(!!data?.is_subscribed);
    } catch {
      setIsSubscribed(ls.get('rr_premium_status', false));
    }
  };

  const syncInteraction = async (videoId: number, type: 'like' | 'bookmark' | 'rate', value?: any) => {
    if (!user) return;
    try {
      await supabase.from('interactions').upsert({ user_id: user.id, video_id: videoId, type, value: value ?? true });
    } catch (e) { console.error(e); }
  };

  const signOut = async () => { await supabase.auth.signOut(); localStorage.clear(); setUser(null); setIsSubscribed(false); };

  return (
    <AuthContext.Provider value={{ user, isSubscribed, loading, signOut, syncInteraction }}>
      {children}
    </AuthContext.Provider>
  );
}

// =========================================================================
// SYSTEM 1: frictionless AUTH FORMS & SYSTEM 6 BANNER
// =========================================================================
export function GuestRoute({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!localStorage.getItem('rr_guest_id')) {
      localStorage.setItem('rr_guest_id', `guest_${Math.random().toString(36).slice(2, 11)}`);
    }
  }, []);
  return <>{children}</>;
}

export function AuthForms({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [name, setName] = useState(''); const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState(''); const [loading, setLoading] = useState(false);

  const reset = () => { setError(''); setSuccessMsg(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      if (mode === 'register') {
        const { data: up, error: upErr } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
        if (upErr) throw upErr;
        if (up?.user) await supabase.from('profiles').upsert({ id: up.user.id, full_name: name, email, created_at: new Date().toISOString() });
        await supabase.auth.signInWithPassword({ email, password }); onSuccess?.();
      } else if (mode === 'login') {
        const { error: inErr } = await supabase.auth.signInWithPassword({ email, password });
        if (inErr) throw inErr; onSuccess?.();
      } else {
        const { error: rErr } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
        if (rErr) throw rErr; setSuccessMsg('Reset link sent to inbox.');
      }
    } catch (err: any) { setError(err.message || 'Auth failure.'); } finally { setLoading(false); }
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-3xl p-6 sm:p-8 w-full text-left">
      {mode !== 'forgot' && (
        <div className="flex bg-[#1a1a1a] rounded-2xl p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); reset(); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === m ? 'bg-[#c5a26f] text-black font-semibold' : 'text-[#666]'}`}>{m === 'login' ? 'Login' : 'Register'}</button>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'register' && <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none text-white" />}
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none text-white" />
        {mode !== 'forgot' && <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required minLength={6} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none text-white" />}
        {error && <p className="text-[#e11d48] text-xs px-1">{error}</p>}
        {successMsg && <p className="text-[#22c55e] text-xs px-1">{successMsg}</p>}
        <button type="submit" disabled={loading} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider flex items-center justify-center gap-2 text-sm">{loading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}{mode === 'login' && 'Sign In'}{mode === 'register' && 'Create Account'}{mode === 'forgot' && 'Reset Password'}</button>
      </form>
    </div>
  );
}

// =========================================================================
// SYSTEM 2: ULTRA-PREMIUM PLAYER FRAMEWORK
// =========================================================================
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
      <AnimatePresence>{!isPlaying && loaded && <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30"><div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl"><Play size={28} className="text-black ml-0.5" /></div></div>}</AnimatePresence>
      <AnimatePresence>{tapSide && <div className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ${tapSide === 'left' ? 'left-10' : 'right-10'}`}><span className="text-white text-sm font-bold font-mono">{tapSide === 'left' ? '−10s' : '+10s'}</span></div>}</AnimatePresence>
      {heartBursts.map(b => <motion.div key={b.id} initial={{ opacity: 1, scale: 0.5, x: b.x - 20, y: b.y - 20 }} animate={{ opacity: 0, scale: 2, y: b.y - 120 }} exit={{ opacity: 0 }} className="absolute z-40 pointer-events-none text-[#e11d48] text-4xl" style={{ left: 0, top: 0 }}>❤️</motion.div>)}
      
      {/* HUD Bar */}
      <div className="absolute top-6 right-4 z-40 flex flex-col gap-3">
        <button onClick={e => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-lg">{isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        <button onClick={e => { e.stopPropagation(); const next = speed >= 2 ? 0.5 : speed + 0.5; setSpeed(next); }} className="w-11 h-11 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white text-xs font-mono font-black shadow-lg">{speed}x</button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 z-40 h-1.5 bg-white/10"><div className="h-full bg-[#c5a26f]" style={{ width: `${progress}%` }} /></div>
    </div>
  );
}

// =========================================================================
// PRESERVED HIGH-CONVERSION SHORTS SYSTEM WITH EMBEDDED METRICS
// =========================================================================
export function ShortsPlayerPage() {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate();
  const { isSubscribed, syncInteraction } = useAuth();
  const [feedVideos, setFeedVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [likedList, setLikedList] = useState<number[]>([]);
  const [bookmarkedList, setBookmarkedList] = useState<number[]>([]);
  const [ratingsMap, setRatingsMap] = useState<Record<number, number>>({});
  const touchStartY = useRef(0); const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    fetchVideosFromDB().then((vids) => {
      setFeedVideos(vids); const idx = vids.findIndex(v => v.id === parseInt(id ?? '1', 10));
      setCurrentIndex(idx !== -1 ? idx : 0);
    });
    setLikedList(ls.get('rr_liked', [])); setBookmarkedList(ls.get('rr_bookmarks', [])); setRatingsMap(ls.get('rr_ratings', {}));
  }, [id]);

  const currentShort = feedVideos[currentIndex];

  const handleMove = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= feedVideos.length) return;
    if (feedVideos[nextIndex].isPremium && !isSubscribed) { setShowPaywall(true); setIsPlaying(false); }
    else { setCurrentIndex(nextIndex); setIsPlaying(true); }
  };

  if (feedVideos.length === 0) return <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-50"><div className="w-12 h-12 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden select-none" style={{ touchAction: 'none' }}
         onTouchStart={e => touchStartY.current = e.touches[0].clientY}
         onTouchEnd={e => { const diff = touchStartY.current - e.changedTouches[0].clientY; if (Math.abs(diff) > 60) diff > 0 ? handleMove(currentIndex + 1) : handleMove(currentIndex - 1); }}>
      
      {/* Top Floating Utility Header */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-5 pt-12 pb-4 bg-gradient-to-b from-black/85 to-transparent">
        <button onClick={() => navigate(-1)} className="p-3.5 bg-black/40 border border-white/5 rounded-2xl text-white backdrop-blur-xl"><ArrowLeft size={20} /></button>
        <div className="text-xs px-4 py-1.5 bg-black/40 border border-white/5 rounded-full text-white font-mono tracking-widest">{currentShort?.category?.toUpperCase()}</div>
        <div className="text-xs px-3.5 py-1.5 bg-white/10 text-white font-mono rounded-xl font-bold">{currentIndex + 1} / {feedVideos.length}</div>
      </div>

      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="relative w-full max-w-[460px] h-full shadow-2xl">
          <PremiumVideoPlayer video={currentShort} isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)} onEnded={() => handleMove(currentIndex + 1)} />

          {/* Bottom Metatags Info Layout Overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-5 pb-28 pt-24 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-
              
