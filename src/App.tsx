import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  BrowserRouter, Routes, Route, useNavigate, useParams,
  useLocation, Navigate
} from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { createClient, User, Session } from '@supabase/supabase-js';
import {
  Play, Pause, Heart, Bookmark, Download, Share2, X, ArrowLeft,
  User as UserIcon, Clock, Star, CreditCard, CheckCircle, Lock, Plus, Edit2, Trash2,
  BarChart3, Users, Settings, TrendingUp, Volume2, VolumeX,
  Facebook, Instagram, Youtube, MessageCircle,
  ShoppingBag, Smartphone, Upload, Database, FileText,
  Home, Zap
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
  cdnBase: "https://reelrampproshorts1.b-cdn.net",
};

const getBunnyCdnUrl = (path: string) =>
  path.startsWith("http") ? path : `${BUNNY.cdnBase}/${path.replace(/^\//, "")}`;

const REELRAMP_LOGO =
  "https://drive.google.com/uc?export=view&id=1qs734lVBcgz-fJ_TitnibEG-KqX0LCVg";

// ─────────────────────────────────────────────────────────────────────────────
// GUEST ID
// ─────────────────────────────────────────────────────────────────────────────
const getOrCreateGuestId = (): string => {
  const existing = localStorage.getItem('rr_guest_id');
  if (existing) return existing;
  const id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem('rr_guest_id', id);
  return id;
};

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
  timestamp: number;
}

interface PromoVideoSettings {
  videoUrl: string;
  isEnabled: boolean;
  videoType: 'youtube' | 'direct';
}

interface RevenueEntry {
  id: number;
  date: string;
  amount: number;
  type: string;
  plan: string;
}

interface DigitalProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  category: 'workshop' | 'guide' | 'merch';
  thumbnailUrl: string;
  isPremium: boolean;
  fileUrl?: string;
  badge?: string;
}

interface CreatorRevenueEntry {
  creatorName: string;
  videoTitle: string;
  totalViews: number;
  revenueShare: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────
const initialVideos: Video[] = [
  { id: 1, title: "The Silent Whisper", description: "A haunting tale of a woman trapped in an abandoned mansion where whispers reveal dark secrets.", category: "Horror", duration: "4:32", isPremium: true, thumbnail: "/images/horror1.jpg", videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4", source: 'direct' },
  { id: 2, title: "Midnight Rain", description: "A detective uncovers a chilling murder case in a rain-soaked alley filled with lies.", category: "Mystery", duration: "5:18", isPremium: false, thumbnail: "/images/mystery1.jpg", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", source: 'direct' },
  { id: 3, title: "The Mountain Sage", description: "An elderly mentor shares profound life lessons that transform a young woman's future.", category: "Life Lessons", duration: "6:45", isPremium: false, thumbnail: "/images/life1.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", source: 'direct' },
  { id: 4, title: "Shadows of Truth", description: "An investigative journalist risks everything to expose a powerful conspiracy.", category: "Investigative", duration: "7:12", isPremium: true, thumbnail: "/images/investigative1.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", source: 'direct' },
  { id: 5, title: "The Forest Entity", description: "A terrifying encounter in the woods reveals something ancient and malevolent.", category: "Horror", duration: "4:59", isPremium: true, thumbnail: "/images/horror2.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", source: 'direct' },
  { id: 6, title: "The Velvet Betrayal", description: "Secrets and deception unfold in an opulent mansion with deadly consequences.", category: "Mystery", duration: "5:40", isPremium: false, thumbnail: "/images/mystery1.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", source: 'direct' },
  { id: 7, title: "Echoes by the Lake", description: "A woman confronts her past and finds unexpected clarity in solitude.", category: "Life Lessons", duration: "3:55", isPremium: false, thumbnail: "/images/life2.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", source: 'direct' },
  { id: 8, title: "The Cold Case Files", description: "Elite investigators reopen a 20-year-old murder that shakes the city.", category: "True Crime", duration: "8:21", isPremium: true, thumbnail: "/images/truecrime1.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", source: 'direct' },
  { id: 9, title: "The Cracked Mask", description: "A chilling psychological horror about identity and the monsters within us.", category: "Horror", duration: "4:15", isPremium: true, thumbnail: "/images/horror3.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", source: 'direct' },
  { id: 10, title: "The Forgotten Diary", description: "A young woman discovers an ancient diary that reveals family secrets and life wisdom.", category: "Life Lessons", duration: "5:30", isPremium: false, thumbnail: "/images/life3.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", source: 'direct' },
];

const defaultPlatformSettings: PlatformSettings = {
  appName: "ReelRamp Shorts",
  tagline: "Premium Short Films & Investigative Stories",
  accentColor: "#c5a26f",
  supportEmail: "reelramporiginal@gmail.com",
  supportPhone: "+91 7307493338",
  razorpayKey: "",
  logoUrl: "",
  primaryColor: "#c5a26f",
  backgroundColor: "#0a0a0a",
  cardBackground: "#1a1a1a",
};

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const ls = {
  get: <T,>(key: string, fallback: T): T => {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  },
  remove: (key: string) => localStorage.removeItem(key),
};

const getStoredVideos = (): Video[] => ls.get('reelramp_videos', initialVideos);
const saveVideos = (v: Video[]) => ls.set('reelramp_videos', v);
const getSettings = (): PlatformSettings => ls.get('reelramp_settings', defaultPlatformSettings);
const saveSettings = (s: PlatformSettings) => ls.set('reelramp_settings', s);
const getCategories = (): string[] => ls.get('reelramp_categories', ["Horror", "Mystery", "Life Lessons", "Investigative", "True Crime"]);
const saveCategories = (c: string[]) => ls.set('reelramp_categories', c);
const getWatchHistory = (): WatchHistoryItem[] => ls.get('reelramp_watch_history', []);
const saveWatchHistory = (h: WatchHistoryItem[]) => ls.set('reelramp_watch_history', h);

const addToWatchHistory = (videoId: number, progress = 0, timestamp = 0) => {
  const h = getWatchHistory();
  const idx = h.findIndex(i => i.videoId === videoId);
  const item: WatchHistoryItem = { videoId, watchedAt: new Date().toISOString(), progress, timestamp };
  const updated = idx !== -1
    ? h.map((x, i) => i === idx ? item : x)
    : [item, ...h].slice(0, 20);
  saveWatchHistory(updated);
};

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM CONTEXT — FIX 2: Live Sync
// ─────────────────────────────────────────────────────────────────────────────
interface PlatformContextType {
  videos: Video[];
  settings: PlatformSettings;
  categories: string[];
  refreshData: () => void;
}

const PlatformContext = React.createContext<PlatformContextType | null>(null);

function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [videos, setVideos] = useState<Video[]>(() => getStoredVideos());
  const [settings, setSettings] = useState<PlatformSettings>(() => getSettings());
  const [categories, setCategories] = useState<string[]>(() => getCategories());

  const refreshData = useCallback(() => {
    setVideos(getStoredVideos());
    setSettings(getSettings());
    setCategories(getCategories());
  }, []);

  return (
    <PlatformContext.Provider value={{ videos, settings, categories, refreshData }}>
      {children}
    </PlatformContext.Provider>
  );
}

const usePlatform = () => {
  const context = React.useContext(PlatformContext);
  if (!context) throw new Error("usePlatform must be used within PlatformProvider");
  return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSubscribed: boolean;
  isGuest: boolean;
  guestId: string;
  setIsSubscribed: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null, session: null, loading: true,
  isSubscribed: false, isGuest: true, guestId: '',
  setIsSubscribed: () => {},
  signOut: async () => {},
});

const useAuth = () => React.useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [guestId] = useState<string>(getOrCreateGuestId());

  useEffect(() => {
    const storedSub = ls.get('reelramp_subscribed', false);
    if (storedSub) setIsSubscribed(true);

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
      if (session?.user) { checkSubscription(session.user.id); }
      else { setIsSubscribed(ls.get('reelramp_subscribed', false)); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkSubscription = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('subscriptions').select('status').eq('user_id', userId).eq('status', 'active').maybeSingle();
      const active = !!data;
      setIsSubscribed(active);
      ls.set('reelramp_subscribed', active);
    } catch {
      setIsSubscribed(ls.get('reelramp_subscribed', false));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    ls.remove('reelramp_subscribed');
    setIsSubscribed(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isSubscribed, isGuest: !user, guestId, setIsSubscribed, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CINEMATIC PLAYER — FIX 1: ULTRA-PREMIUM LOGIC
// ─────────────────────────────────────────────────────────────────────────────
interface CinematicPlayerProps {
  video: Video;
  isPlaying: boolean;
  onPlayPause: () => void;
  onEnded: () => void;
  onSeek?: (seconds: number) => void;
  overlayVisible: boolean;
  onUserActivity: () => void;
  resumeFrom?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

function CinematicPlayer({
  video, isPlaying, onPlayPause, onEnded,
  overlayVisible, onUserActivity, resumeFrom = 0, onTimeUpdate
}: CinematicPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showHUD, setShowHUD] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTapRef = useRef(0);
  const heartIdRef = useRef(0);
  const hasResumed = useRef(false);
  const timeUpdateThrottle = useRef(0);

  // FIX 1: Robust hardware playback trigger
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    let isSubscribed = true;

    const handlePlayback = async () => {
      try {
        if (isPlaying) {
          // Many browsers require mute for autoplay without user interaction
          v.muted = true;
          const playPromise = v.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } else {
          v.pause();
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isSubscribed) {
          console.warn("Playback error handled:", err.message);
        }
      }
    };

    handlePlayback();

    return () => {
      isSubscribed = false;
    };
  }, [isPlaying, video.videoUrl]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      if (!hasResumed.current && resumeFrom > 0) {
        videoRef.current.currentTime = resumeFrom;
        hasResumed.current = true;
      }
    }
  };

  const handleTimeUpdate = () => {
    const now = Date.now();
    if (now - timeUpdateThrottle.current < 250) return;
    timeUpdateThrottle.current = now;
    const t = videoRef.current?.currentTime || 0;
    setCurrentTime(t);
    onTimeUpdate?.(t, duration);
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      let x = 0, y = 0;
      if ('touches' in e) {
        const touch = (e as React.TouchEvent).changedTouches[0];
        const rect = containerRef.current?.getBoundingClientRect();
        x = touch.clientX - (rect?.left || 0);
        y = touch.clientY - (rect?.top || 0);
      } else {
        const me = e as React.MouseEvent;
        const rect = containerRef.current?.getBoundingClientRect();
        x = me.clientX - (rect?.left || 0);
        y = me.clientY - (rect?.top || 0);
      }
      const id = ++heartIdRef.current;
      setHearts(prev => [...prev, { id, x, y }]);
      setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 1200);
      if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
    lastTapRef.current = now;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const resolvedUrl = video.source === 'bunny' ? getBunnyCdnUrl(video.videoUrl) : video.videoUrl;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none transform-gpu"
      onClick={(e) => { onUserActivity(); handleDoubleTap(e); }}
    >
      <video
        ref={videoRef}
        src={resolvedUrl}
        className="w-full h-full object-cover transform-gpu"
        playsInline
        preload="auto"
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onCanPlay={() => setIsBuffering(false)}
        onClickCapture={e => {
          if (e.detail === 1) setTimeout(() => {
            if (Date.now() - lastTapRef.current > 320) onPlayPause();
          }, 320);
        }}
      />

      {/* FIX 1: Robust Spinner */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 backdrop-blur-[2px]">
          <div className="w-12 h-12 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin shadow-2xl" />
        </div>
      )}

      {hearts.map(h => (
        <motion.div key={h.id} initial={{ opacity: 1, scale: 0.5, y: 0 }} animate={{ opacity: 0, scale: 2.2, y: -120 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="absolute pointer-events-none text-5xl z-50 drop-shadow-2xl" style={{ left: h.x - 24, top: h.y - 24 }}>
          ❤️
        </motion.div>
      ))}

      {/* Scrubber HUD */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-50">
        <div className="h-full bg-[#c5a26f]" style={{ width: `${progressPercent}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <PlatformProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </PlatformProvider>
  );
}

function AppContent() {
  const { settings } = usePlatform();
  const location = useLocation();
  const isFullscreen =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/player') ||
    location.pathname === '/login';

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: settings.backgroundColor, overscrollBehavior: 'none' }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/player/:id" element={<ShortsPlayerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin-secure-7842" element={<AdminPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      {!isFullscreen && <BottomNavigation />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE — Optimized with Live State
// ─────────────────────────────────────────────────────────────────────────────
function HomePage() {
  const navigate = useNavigate();
  const { videos, settings } = usePlatform();
  
  return (
    <div className="pb-24">
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-xl border-b border-white/5 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tighter">{settings.appName}</h1>
            <button onClick={() => navigate('/profile')} className="p-3 bg-white/5 rounded-2xl"><UserIcon size={20} /></button>
        </div>
      </header>
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {videos.map(v => (
          <div key={v.id} onClick={() => navigate(`/player/${v.id}`)} className="cursor-pointer group">
            <div className="aspect-[9/16] rounded-3xl overflow-hidden relative shadow-2xl">
              <img src={v.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-all" />
              <div className="absolute top-4 right-4 bg-[#e11d48] text-[10px] px-3 py-1 rounded-full font-bold">PREMIUM</div>
            </div>
            <h3 className="mt-4 font-bold text-lg px-2">{v.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL — FIX 2: Live Sync
// ─────────────────────────────────────────────────────────────────────────────
function AdminPage() {
  const { settings, refreshData } = usePlatform();
  const [appName, setAppName] = useState(settings.appName);
  
  const handleSave = () => {
    const updated = { ...settings, appName };
    saveSettings(updated);
    refreshData(); // Instant sync
    alert("Updated Live!");
  };

  return (
    <div className="p-10 max-w-2xl mx-auto space-y-8">
      <h2 className="text-4xl font-black italic uppercase">Editor Workspace</h2>
      <div className="space-y-4">
        <label className="text-[10px] tracking-widest text-[#c5a26f] font-black uppercase">App Name</label>
        <input value={appName} onChange={e => setAppName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xl outline-none" />
        <button onClick={handleSave} className="w-full py-6 bg-[#c5a26f] text-black font-black rounded-3xl active:scale-95 transition-all">REFLECT LIVE</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function BottomNavigation() {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#111] border-t border-white/5 flex items-center justify-around z-50">
      <button onClick={() => navigate('/')}><Home size={28} /></button>
      <button onClick={() => navigate('/admin-secure-7842')}><Settings size={28} /></button>
      <button onClick={() => navigate('/profile')}><UserIcon size={28} /></button>
    </div>
  );
}

// STUBS
function LoginPage() { return <div>Login</div>; }
function ProfilePage() { return <div>Profile</div>; }
function ShortsPlayerPage() {
  const { id } = useParams();
  const { videos } = usePlatform();
  const [isPlaying, setIsPlaying] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const timerRef = useRef<any>(null);
  const video = videos.find(v => v.id === parseInt(id || ''));

  const handleUserActivity = useCallback(() => {
    setOverlayVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOverlayVisible(false), 2500); // FIX: 2.5s Auto-hide
  }, []);

  if (!video) return null;
  return (
    <div className="fixed inset-0 bg-black" onMouseMove={handleUserActivity} onTouchStart={handleUserActivity}>
      <CinematicPlayer video={video} isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)} overlayVisible={overlayVisible} onUserActivity={handleUserActivity} onEnded={() => {}} />
      <AnimatePresence>
        {overlayVisible && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 p-8 flex flex-col justify-between pointer-events-none">
             <button onClick={() => window.history.back()} className="p-4 bg-black/40 rounded-2xl w-fit pointer-events-auto"><ArrowLeft /></button>
             <div className="pointer-events-none">
                <h2 className="text-4xl font-bold uppercase">{video.title}</h2>
                <p className="text-white/60">{video.description}</p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
