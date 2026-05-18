import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import {
  BrowserRouter, Routes, Route, useNavigate, useParams,
  useLocation, Navigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient, User, Session } from '@supabase/supabase-js';
import {
  Play, Pause, Heart, Bookmark, Download, Share2, X, ArrowLeft,
  User as UserIcon, Clock, Star, CreditCard, CheckCircle, Lock, Plus, Edit2, Trash2,
  BarChart3, Users, Settings, TrendingUp, Volume2, VolumeX,
  Facebook, Instagram, Youtube, MessageCircle, Download as InstallIcon, Home, Compass
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://rwtndqorpizoozbpcmca.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dG5kcW9ycGl6b296YnBjbWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDYwMjMsImV4cCI6MjA5NDE4MjAyM30.8mHW5OGBM8mNuMBp-yASHWYlwcbQkNaUhYQ-JvMl_6Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUNNY = {
  storageZone: "reelrampproshorts1",
  apiKey: "1f535aac-8943-4da5-be1b98b776cc-2d1b4330",
  readOnlyPassword: "87dca87d-6798-4940-99db04774f37-c090-444f",
  endpointUrl: "https://storage.bunnycdn.com/reelrampproshorts1",
  cdnBase: "https://reelrampproshorts1.b-cdn.net",
};

const getBunnyCdnUrl = (path: string) =>
  path.startsWith("http") ? path : `${BUNNY.cdnBase}/${path.replace(/^\//, "")}`;

const REELRAMP_LOGO =
  "https://drive.google.com/uc?export=view&id=1qs734lVBcgz-fJ_TitnibEG-KqX0LCVg";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface Video {
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
  likesCount?: number;
  bookmarksCount?: number;
  rating?: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  subscribed: boolean;
  joinDate: string;
  totalWatched: number;
}

interface PopupAd {
  id: number;
  imageUrl: string;
  redirectUrl: string;
  isActive: boolean;
  title: string;
}

interface PlatformSettings {
  appName: string;
  tagline: string;
  accentColor: string;
  supportEmail: string;
  supportPhone: string;
  razorpayKey: string;
  logoUrl: string;
  primaryColor: string;
  backgroundColor: string;
  cardBackground: string;
}

interface SubscriptionSettings {
  trialOfferPrice: string;
  trialOfferDuration: string;
  fullPrice: string;
  fullValidity: string;
  showTrialPopup: boolean;
}

interface PaymentSettings {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  upiId: string;
  stripePublishableKey: string;
  isLiveMode: boolean;
  activeGateway: 'razorpay' | 'stripe' | 'upi' | 'none';
}

interface WatchHistoryItem {
  videoId: number;
  watchedAt: string;
  progress: number;
}

interface PromoVideoSettings {
  videoUrl: string;
  isEnabled: boolean;
  videoType: 'youtube' | 'direct';
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────
const initialVideos: Video[] = [
  { id: 1, title: "The Silent Whisper", description: "A haunting tale of a woman trapped in an abandoned mansion where whispers reveal dark secrets.", category: "Horror", duration: "4:32", isPremium: true, thumbnail: "/images/horror1.jpg", videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4", source: 'direct', likesCount: 1240, bookmarksCount: 450, rating: 4.5 },
  { id: 2, title: "Midnight Rain", description: "A detective uncovers a chilling murder case in a rain-soaked alley filled with lies.", category: "Mystery", duration: "5:18", isPremium: false, thumbnail: "/images/mystery1.jpg", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", source: 'direct', likesCount: 890, bookmarksCount: 230, rating: 4.2 },
  { id: 3, title: "The Mountain Sage", description: "An elderly mentor shares profound life lessons that transform a young woman's future.", category: "Life Lessons", duration: "6:45", isPremium: false, thumbnail: "/images/life1.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", source: 'direct', likesCount: 3400, bookmarksCount: 1200, rating: 4.9 },
  { id: 4, title: "Shadows of Truth", description: "An investigative journalist risks everything to expose a powerful conspiracy.", category: "Investigative", duration: "7:12", isPremium: true, thumbnail: "/images/investigative1.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", source: 'direct', likesCount: 2100, bookmarksCount: 880, rating: 4.7 }
];

const defaultPlatformSettings: PlatformSettings = {
  appName: "ReelRamp Shorts",
  tagline: "Premium Short Films & Investigative Stories",
  accentColor: "#c5a26f",
  supportEmail: "reelramoriginal@gmail.com",
  supportPhone: "+91 7307493338",
  razorpayKey: "",
  logoUrl: "",
  primaryColor: "#c5a26f",
  backgroundColor: "#0a0a0a",
  cardBackground: "#1a1a1a",
};

const defaultSubscriptionSettings: SubscriptionSettings = {
  trialOfferPrice: "₹2",
  trialOfferDuration: "1 Day",
  fullPrice: "₹699",
  fullValidity: "3 months",
  showTrialPopup: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const ls = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch { return fallback; }
  },
  set: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  },
  remove: (key: string) => localStorage.removeItem(key),
};

const getStoredVideos = (): Video[] => ls.get('reelramp_videos', initialVideos);
const saveVideos = (v: Video[]) => ls.set('reelramp_videos', v);
const fetchVideos = (): Promise<Video[]> => new Promise(res => setTimeout(() => res(getStoredVideos()), 250));
const getStoredPopups = (): PopupAd[] => ls.get('reelramp_popups', [{ id: 1, title: "Premium Unlock", imageUrl: "/images/popup-ad.jpg", redirectUrl: "/subscription", isActive: true }]);
const getSettings = (): PlatformSettings => ls.get('reelramp_settings', defaultPlatformSettings);
const getSubSettings = (): SubscriptionSettings => ls.get('reelramp_sub_settings', defaultSubscriptionSettings);
const getCategories = (): string[] => ls.get('reelramp_categories', ["Horror", "Mystery", "Life Lessons", "Investigative", "True Crime"]);
const getWatchHistory = (): WatchHistoryItem[] => ls.get('reelramp_watch_history', []);
const saveWatchHistory = (h: WatchHistoryItem[]) => ls.set('reelramp_watch_history', h);

const addToWatchHistory = (videoId: number, progress = 100) => {
  const h = getWatchHistory();
  const idx = h.findIndex(i => i.videoId === videoId);
  const item: WatchHistoryItem = { videoId, watchedAt: new Date().toISOString(), progress };
  const updated = idx !== -1 ? h.map((x, i) => i === idx ? item : x) : [item, ...h].slice(0, 20);
  saveWatchHistory(updated);
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT (System 1 Hybrid Core)
// ─────────────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSubscribed: boolean;
  setIsSubscribed: (v: boolean) => void;
  signOut: () => Promise<void>;
  syncInteraction: (videoId: number, type: 'like' | 'bookmark' | 'rate', value?: any) => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null, session: null, loading: true, isSubscribed: false,
  setIsSubscribed: () => {}, signOut: async () => {}, syncInteraction: async () => {}
});

const useAuth = () => React.useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) checkSubscription(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) checkSubscription(session.user.id);
      else setIsSubscribed(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSubscription = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('is_subscribed').eq('id', userId).single();
      setIsSubscribed(!!data?.is_subscribed);
    } catch {
      setIsSubscribed(ls.get('reelramp_subscribed', false));
    }
  };

  const syncInteraction = async (videoId: number, type: 'like' | 'bookmark' | 'rate', value?: any) => {
    if (!user) return; // Guest logs processed instantly local-only
    try {
      await supabase.from('interactions').upsert({
        user_id: user.id, video_id: videoId, type, value: value ?? true, updated_at: new Date().toISOString()
      });
    } catch (e) { console.error("Cloud tracking deferred", e); }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    ls.remove('reelramp_subscribed');
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isSubscribed, setIsSubscribed, signOut, syncInteraction }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 6: AUTOMATIC PWA PROMPT COMPONENT
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
    if (window.matchMedia('(display-mode: standalone)').matches) setShowBanner(false);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  if (!showBanner) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
                className="fixed bottom-28 left-4 right-4 max-w-[420px] mx-auto z-[100] bg-[#111]/95 backdrop-blur-xl border border-[#c5a26f]/40 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#c5a26f]/10 flex items-center justify-center text-[#c5a26f] shrink-0"><Download size={18} /></div>
        <div className="text-left">
          <h4 className="text-xs font-black text-white uppercase tracking-wider">Install ReelRamp App</h4>
          <p className="text-[11px] text-white/60 mt-0.5">Stream standalone fullscreen short-films</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={async () => { if (!deferredPrompt) return; setShowBanner(false); await deferredPrompt.prompt(); }} className="px-3 py-1.5 bg-[#c5a26f] text-black text-xs font-black rounded-lg uppercase">Install</button>
        <button onClick={() => { setShowBanner(false); sessionStorage.setItem('rr_pwa_dismissed', 'true'); }} className="text-white/40 hover:text-white text-xs p-1">Dismiss</button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 1: NON-BLOCKING GUEST SYSTEM WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
export function GuestRoute({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!localStorage.getItem('rr_guest_id')) {
      localStorage.setItem('rr_guest_id', `guest_${Math.random().toString(36).slice(2, 11)}`);
    }
  }, []);
  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 2: CUSTOM PREMIUM ULTRA PLAYER PIPELINE
// ─────────────────────────────────────────────────────────────────────────────
const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export function PremiumVideoPlayer({ video, isPlaying, onPlayPause, onEnded, onProgress }: {
  video: Video; isPlaying: boolean; onPlayPause: () => void; onEnded: () => void; onProgress?: (pct: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [showSpeedHUD, setShowSpeedHUD] = useState(false);
  const [tapSide, setTapSide] = useState<'left' | 'right' | null>(null);
  const [heartBursts, setHeartBursts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTap = useRef<{ time: number; side: 'left' | 'right' }>({ time: 0, side: 'left' });

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    isPlaying ? v.play().catch(() => {}) : v.pause();
  }, [isPlaying, video]);

  useEffect(() => { if (videoRef.current) videoRef.current.muted = isMuted; }, [isMuted]);
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);

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
    } else {
      setTimeout(() => { if (Date.now() - now >= 290) onPlayPause(); }, 300);
    }
    lastTap.current = { time: now, side };
  };

  const resolvedUrl = video.source === 'bunny' ? getBunnyCdnUrl(video.videoUrl) : video.videoUrl;

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      <video ref={videoRef} src={resolvedUrl} className="w-full h-full object-cover" playsInline autoPlay={isPlaying} onEnded={onEnded} 
             onLoadedData={() => setLoaded(true)} 
             onTimeUpdate={() => {
               if (!videoRef.current || !videoRef.current.duration) return;
               const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
               setProgress(pct); onProgress?.(pct);
             }} />
      <div className="absolute inset-0 z-10" onClick={handleTap} />
      <AnimatePresence>
        {!isPlaying && loaded && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl"><Play size={28} className="text-black ml-0.5" /></div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {tapSide && (
          <div className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center ${tapSide === 'left' ? 'left-10' : 'right-10'}`}>
            <span className="text-white text-sm font-bold font-mono">{tapSide === 'left' ? '−10s' : '+10s'}</span>
          </div>
        )}
      </AnimatePresence>
      {heartBursts.map(b => <motion.div key={b.id} initial={{ opacity: 1, scale: 0.5, x: b.x - 20, y: b.y - 20 }} animate={{ opacity: 0, scale: 2, y: b.y - 120 }} exit={{ opacity: 0 }} className="absolute z-40 pointer-events-none text-[#e11d48] text-4xl" style={{ left: 0, top: 0 }}>❤️</motion.div>)}
      
      {/* Floating Speed & Mute Overlays HUD */}
      <div className="absolute top-6 right-4 z-40 flex flex-col gap-3">
        <button onClick={e => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-3 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white shadow-lg">
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setShowSpeedHUD(!showSpeedHUD); }} className="w-11 h-11 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 text-white text-[11px] font-mono font-black flex items-center justify-center shadow-lg">
            {speed}x
          </button>
          <AnimatePresence>
            {showSpeedHUD && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 top-13 z-50 bg-[#0d0d0d]/95 backdrop-blur-2xl border border-[#333] rounded-2xl w-20 overflow-hidden shadow-2xl">
                {PLAYBACK_SPEEDS.map(s => (
                  <button key={s} onClick={() => { setSpeed(s); setShowSpeedHUD(false); }} className={`w-full py-2.5 text-center text-xs font-mono font-bold border-b border-white/5 last:border-0 ${speed === s ? 'bg-[#c5a26f] text-black' : 'text-white/80'}`}>
                    {s}x
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {/* Micro Scrubber Timeline Track */}
      <div className="absolute bottom-0 left-0 right-0 z-40 cursor-pointer h-1.5 bg-white/10" onClick={e => {
        e.stopPropagation(); if (!videoRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * videoRef.current.duration;
      }}>
        <div className="h-full bg-[#c5a26f] transition-all duration-75" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGH CONVERSION SHORTS PLAYER OVERLAY ENGINE (TikTok Layout Intact)
// ─────────────────────────────────────────────────────────────────────────────
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
  const touchStartY = useRef(0);

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
      
      {/* Top Floating Control Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-5 pt-12 pb-4 bg-gradient-to-b from-black/85 to-transparent">
        <button onClick={() => navigate(-1)} className="p-3.5 bg-black/40 border border-white/5 rounded-2xl text-white backdrop-blur-xl"><ArrowLeft size={20} /></button>
        <div className="text-xs px-4 py-1.5 bg-black/40 border border-white/5 rounded-full text-white font-mono tracking-widest uppercase">{currentShort?.category}</div>
        <div className="text-xs px-3.5 py-1.5 bg-white/10 text-white font-mono rounded-xl font-bold">{currentIndex + 1} / {feedVideos.length}</div>
      </div>

      <div className="w-full h-full flex items-center justify-center bg-black">
        <div className="relative w-full max-w-[460px] h-full shadow-2xl">
          <PremiumVideoPlayer video={currentShort} isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)} onEnded={() => handleMove(currentIndex + 1)} />

          {/* Bottom Metatags Custom Info Layer */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-5 pb-28 pt-24 pointer-events-none">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-[#c5a26f]/10 border border-[#c5a26f]/30 text-[#c5a26f] text-[10px] font-black tracking-wider rounded-md uppercase">Originals</span>
              {currentShort?.isPremium && <span className="px-2.5 py-0.5 bg-red-600 text-white text-[10px] font-black tracking-wider rounded-md uppercase flex items-center gap-1"><Award size={10}/> Premium</span>}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">{currentShort?.title}</h2>
            <p className="text-sm text-white/70 mt-1.5 pr-20 line-clamp-2 pointer-events-auto leading-relaxed">{currentShort?.description}</p>
            
            {/* Interactive Functional Star Metric Row */}
            <div className="flex items-center gap-1.5 mt-3 pointer-events-auto">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => { const updated = { ...ratingsMap, [currentShort.id]: star }; setRatingsMap(updated); ls.set('rr_ratings', updated); syncInteraction(currentShort.id, 'rate', star); }} className="transition transform active:scale-125">
                  <Star size={16} className={(ratingsMap[currentShort.id] ?? 0) >= star ? 'fill-[#c5a26f] text-[#c5a26f]' : 'text-white/30'} />
                </button>
              ))}
              <span className="text-white/40 text-xs font-mono font-bold ml-1">(5.0)</span>
            </div>
          </div>

          {/* Right Action Stack Rails */}
          <div className="absolute right-4 bottom-32 z-30 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center">
              <button onClick={() => { const active = likedList.includes(currentShort.id); const updated = active ? likedList.filter(i => i !== currentShort.id) : [...likedList, currentShort.id]; setLikedList(updated); ls.set('rr_liked', updated); syncInteraction(currentShort.id, 'like', !active); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${likedList.includes(currentShort.id) ? 'bg-[#e11d48] border-transparent text-white' : 'bg-black/55 backdrop-blur-xl border-white/10 text-white'}`}><Heart size={22} className={likedList.includes(currentShort.id) ? 'fill-white' : ''} /></button>
              <span className="text-[11px] font-mono text-white/70 mt-1">{likedList.includes(currentShort.id) ? 1421 : 1420}</span>
            </div>
            <div className="flex flex-col items-center">
              <button onClick={() => { const active = bookmarkedList.includes(currentShort.id); const updated = active ? bookmarkedList.filter(i => i !== currentShort.id) : [...bookmarkedList, currentShort.id]; setBookmarkedList(updated); ls.set('rr_bookmarks', updated); syncInteraction(currentShort.id, 'bookmark', !active); }} className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${bookmarkedList.includes(currentShort.id) ? 'bg-[#c5a26f] border-transparent text-black' : 'bg-black/55 backdrop-blur-xl border-white/10 text-white'}`}><Bookmark size={22} className={bookmarkedList.includes(currentShort.id) ? 'fill-black' : ''} /></button>
              <span className="text-[11px] font-mono text-white/70 mt-1">{bookmarkedList.includes(currentShort.id) ? 451 : 450}</span>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link Copied to Platform Launcher!'); }} className="w-14 h-14 rounded-2xl bg-black/55 border border-white/10 flex items-center justify-center text-white"><Share2 size={22} /></button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaywall && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center px-4" onClick={() => setShowPaywall(false)}>
            <div className="bg-[#111] border border-[#c5a26f]/30 w-full max-w-sm rounded-3xl p-8 text-center" onClick={e => e.stopPropagation()}>
              <div className="w-16 h-16 bg-[#c5a26f]/10 text-[#c5a26f] rounded-2xl flex items-center justify-center mx-auto mb-4"><Lock size={28}/></div>
              <h3 className="text-2xl font-bold text-white tracking-tight">VIP Pass Required</h3>
              <button onClick={() => { setShowPaywall(false); navigate('/subscription'); }} className="w-full mt-6 py-4 bg-[#c5a26f] text-black font-black tracking-wider text-xs rounded-xl uppercase">Unlock Platform Access</button>
            </div>
          </div>
        )}
      </AnimatePresence>
      <BottomNavigation /> <PWAInstallBanner />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESERVED INTERACTIVE LAYOUT MODULES
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

function ProfilePage() {
  const navigate = useNavigate(); const { user, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'library' | 'account'>('library');
  const [videos, setVideos] = useState<Video[]>([]); const [savedIds, setSavedIds] = useState<number[]>([]);

  useEffect(() => { fetchVideosFromDB().then(setVideos); setSavedIds(ls.get('rr_bookmarks', [])); }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white"><div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-32"><div className="max-w-md mx-auto px-4 pt-12"><div className="flex items-center justify-between mb-8"><h1 className="text-3xl font-black tracking-tight">Studio Profile</h1></div><div className="bg-[#111] border border-[#222] p-5 rounded-3xl flex items-center gap-4 mb-8"><div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#c5a26f]/40 flex items-center justify-center">{user ? <span className="text-2xl font-black text-[#c5a26f]">{user.email?.charAt(0).toUpperCase()}</span> : <UserIcon size={24} className="text-white/40" />}</div><div className="flex-1 min-w-0"><h3 className="text-lg font-bold truncate">{user ? user.email?.split('@')[0] : 'Anonymous Creator'}</h3><p className="text-xs text-white/40 truncate">{user ? user.email : 'Guest Session Active'}</p></div>{user && <button onClick={signOut} className="text-xs font-black text-red-500">Exit</button>}</div><div className="flex bg-[#111] p-1.5 rounded-2xl mb-6 border border-[#222]"><button onClick={() => setActiveTab('library')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'library' ? 'bg-[#c5a26f] text-black' : 'text-white/60'}`}>Saved ({savedIds.length})</button><button onClick={() => setActiveTab('account')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${activeTab === 'account' ? 'bg-[#c5a26f] text-black' : 'text-white/60'}`}>Account Sync</button></div>{activeTab === 'library' && (<div className="space-y-3">{videos.filter(v => savedIds.includes(v.id)).length === 0 ? (<p className="text-center text-white/30 text-xs py-12">No saved clips yet.</p>) : (videos.filter(v => savedIds.includes(v.id)).map(v => (<div key={v.id} className="bg-[#111] p-3 border border-[#222] rounded-2xl flex items-center gap-3"><img src={v.thumbnail} className="w-14 h-14 object-cover rounded-xl" alt="" /><div className="flex-1 min-w-0"><h4 className="text-sm font-bold truncate">{v.title}</h4><span className="text-[10px] text-white/40 font-mono">{v.category} • {v.duration}</span></div><button onClick={() => navigate(`/player/${v.id}`)} className="p-2.5 bg-[#c5a26f]/10 border border-[#c5a26f]/20 rounded-xl text-[#c5a26f]"><Play size={14} className="fill-[#c5a26f]"/></button></div>)))}</div>)}{activeTab === 'account' && (<div>{user ? <div className="bg-[#111] p-5 border border-[#222] rounded-3xl text-center"><CheckCircle size={32} className="text-[#c5a26f] mx-auto mb-2" /><h4 className="text-sm font-bold">Cloud Synced</h4></div> : <AuthForms onSuccess={() => setActiveTab('library')} />}</div>)}</div><BottomNavigation /></div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RE-EXPORT PLACEHOLDERS TO MATCH APP CONTENT MAPPING BOUNDS
// ─────────────────────────────────────────────────────────────────────────────
function HomePage() { return <div className="p-10 text-center text-white">Home Platform Control Live Dashboard View</div>; }
function SubscriptionPage() { return <div className="p-10 text-center text-white">Subscription Gateway</div>; }
function AdminPage() { return <div className="p-10 text-center text-white">Admin Secure Node</div>; }
function EditorPanel() { return <div className="p-10 text-center text-white">Editor Configuration System</div>; }
function OwnerPanel() { return <div className="p-10 text-center text-white">Owner Production Panel</div>; }
function LegalPage({ type }: { type: string }) { return <div className="p-10 text-center text-white">Legal Docs: {type}</div>; }
function Footer() { return <footer className="p-4 border-t border-white/5 text-center text-xs text-white/40">ReelRamp System Engine</footer>; }

export default App;
export { fetchVideosFromDB };
