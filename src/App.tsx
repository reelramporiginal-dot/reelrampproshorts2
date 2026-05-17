import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BrowserRouter, Routes, Route, useNavigate, useParams,
  useLocation, Navigate
} from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';
import {
  Play, Pause, Heart, Bookmark, Share2, X, ArrowLeft,
  User as UserIcon, Star, CreditCard, CheckCircle, Lock, Plus, Edit2, Trash2,
  BarChart3, Users, Settings, TrendingUp, Volume2, VolumeX,
  Facebook, Instagram, Youtube, MessageCircle,
  ChevronUp, ChevronDown
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://rwtndqorpizoozbpcmca.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dG5kcW9ycGl6b296YnBjbWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDYwMjMsImV4cCI6MjA5NDE4MjAyM30.8mHW5OGBM8mNuMBp-yASHWYlwcbQkNaUhYQ-JvMl_6Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bunny.net CDN config
const BUNNY = {
  storageZone: "reelrampproshorts1",
  apiKey: "1f535aac-8943-4da5-be1b98b776cc-2d1b4330",
  readOnlyPassword: "87dca87d-6798-4940-99db04774f37-c090-444f",
  endpointUrl: "https://storage.bunnycdn.com/reelrampproshorts1",
  cdnBase: "https://reelrampproshorts1.b-cdn.net",
};

const getBunnyCdnUrl = (path: string): string =>
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

interface RevenueEntry {
  id: number;
  date: string;
  amount: number;
  type: string;
  plan: string;
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
  { id: 6, title: "The Velvet Betrayal", description: "Secrets and deception unfold in an opulent mansion with deadly consequences.", category: "Mystery", duration: "5:40", isPremium: false, thumbnail: "/images/mystery2.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", source: 'direct' },
  { id: 7, title: "Echoes by the Lake", description: "A woman confronts her past and finds unexpected clarity in solitude.", category: "Life Lessons", duration: "3:55", isPremium: false, thumbnail: "/images/life2.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", source: 'direct' },
  { id: 8, title: "The Cold Case Files", description: "Elite investigators reopen a 20-year-old murder that shakes the city.", category: "True Crime", duration: "8:21", isPremium: true, thumbnail: "/images/truecrime1.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", source: 'direct' },
  { id: 9, title: "The Cracked Mask", description: "A chilling psychological horror about identity and the monsters within us.", category: "Horror", duration: "4:15", isPremium: true, thumbnail: "/images/horror3.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", source: 'direct' },
  { id: 10, title: "The Forgotten Diary", description: "A young woman discovers an ancient diary that reveals family secrets and life wisdom.", category: "Life Lessons", duration: "5:30", isPremium: false, thumbnail: "/images/life3.jpg", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", source: 'direct' },
];

const initialAdminUsers: AdminUser[] = [
  { id: 1, name: "Alex Rivera", email: "alex.rivera@reelramp.app", phone: "+91 98765 43210", subscribed: true, joinDate: "Mar 12, 2024", totalWatched: 47 },
  { id: 2, name: "Priya Sharma", email: "priya.s@reelramp.app", phone: "+91 87654 32109", subscribed: true, joinDate: "Jan 28, 2024", totalWatched: 112 },
  { id: 3, name: "Rahul Mehta", email: "rahul.m@reelramp.app", phone: "+91 76543 21098", subscribed: false, joinDate: "Apr 05, 2024", totalWatched: 19 },
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

const defaultSubscriptionSettings: SubscriptionSettings = {
  trialOfferPrice: "₹2",
  trialOfferDuration: "1 Day",
  fullPrice: "₹699",
  fullValidity: "3 months",
  showTrialPopup: true,
};

const defaultPaymentSettings: PaymentSettings = {
  razorpayKeyId: "",
  razorpayKeySecret: "",
  upiId: "",
  stripePublishableKey: "",
  isLiveMode: false,
  activeGateway: 'razorpay',
};

const defaultPromoVideo: PromoVideoSettings = {
  videoUrl: "https://www.youtube.com/embed/9bZkp7q19f0",
  isEnabled: true,
  videoType: 'youtube',
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
  set: (key: string, value: unknown): void => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
  },
  remove: (key: string): void => localStorage.removeItem(key),
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE DATA HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fetchVideosFromDB = async (): Promise<Video[]> => {
  try {
    const { data, error } = await supabase.from('videos').select('*').order('id');
    if (!error && data && data.length > 0) {
      ls.set('reelramp_videos', data);
      return data as Video[];
    }
  } catch { /* fallback below */ }
  return ls.get<Video[]>('reelramp_videos', initialVideos);
};

const upsertVideoToDB = async (video: Video): Promise<void> => {
  try { await supabase.from('videos').upsert(video); } catch { /* noop */ }
};

const deleteVideoFromDB = async (id: number): Promise<void> => {
  try { await supabase.from('videos').delete().eq('id', id); } catch { /* noop */ }
};

const fetchSettingFromDB = async <T,>(key: string, fallback: T): Promise<T> => {
  try {
    const { data } = await supabase.from('platform_settings').select('value').eq('key', key).single();
    if (data?.value) return data.value as T;
  } catch { /* fallback below */ }
  return ls.get<T>(`reelramp_${key}`, fallback);
};

const upsertSettingToDB = async (key: string, value: unknown): Promise<void> => {
  ls.set(`reelramp_${key}`, value);
  try { await supabase.from('platform_settings').upsert({ key, value }); } catch { /* noop */ }
};

const fetchPopupsFromDB = async (): Promise<PopupAd[]> => {
  try {
    const { data } = await supabase.from('popup_ads').select('*').order('id');
    if (data && data.length > 0) {
      ls.set('reelramp_popups', data);
      return data as PopupAd[];
    }
  } catch { /* fallback below */ }
  return ls.get<PopupAd[]>('reelramp_popups', [{ id: 1, title: "Premium Unlock", imageUrl: "/images/popup-ad.jpg", redirectUrl: "/subscription", isActive: true }]);
};

const upsertPopupToDB = async (popup: PopupAd): Promise<void> => {
  try { await supabase.from('popup_ads').upsert(popup); } catch { /* noop */ }
};

const deletePopupFromDB = async (id: number): Promise<void> => {
  try { await supabase.from('popup_ads').delete().eq('id', id); } catch { /* noop */ }
};

const fetchCategoriesFromDB = async (): Promise<string[]> => {
  try {
    const { data } = await supabase.from('categories').select('name').order('name');
    if (data && data.length > 0) {
      const cats = (data as Array<{ name: string }>).map((r) => r.name);
      ls.set('reelramp_categories', cats);
      return cats;
    }
  } catch { /* fallback below */ }
  return ls.get<string[]>('reelramp_categories', ["Horror", "Mystery", "Life Lessons", "Investigative", "True Crime"]);
};

const getWatchHistory = (): WatchHistoryItem[] => ls.get<WatchHistoryItem[]>('reelramp_watch_history', []);
const saveWatchHistory = (h: WatchHistoryItem[]): void => ls.set('reelramp_watch_history', h);

const addToWatchHistory = (videoId: number, progress = 100): void => {
  const h = getWatchHistory();
  const idx = h.findIndex(i => i.videoId === videoId);
  const item: WatchHistoryItem = { videoId, watchedAt: new Date().toISOString(), progress };
  const updated = idx !== -1
    ? h.map((x, i) => i === idx ? item : x)
    : [item, ...h].slice(0, 20);
  saveWatchHistory(updated);
};

const getVideoViews = (): Record<number, number> => ls.get<Record<number, number>>('reelramp_views', {});

const incrementView = (id: number): void => {
  const v = getVideoViews();
  v[id] = (v[id] || 0) + 1;
  ls.set('reelramp_views', v);
};

const getRevenueData = (): RevenueEntry[] => ls.get<RevenueEntry[]>('reelramp_revenue', [
  { id: 1, date: "2025-04-01", amount: 2450, type: "Subscription", plan: "Monthly" },
  { id: 2, date: "2025-04-05", amount: 1499, type: "Annual", plan: "Annual" },
  { id: 3, date: "2025-04-18", amount: 699, type: "Subscription", plan: "Monthly" },
  { id: 4, date: "2025-05-01", amount: 2450, type: "Subscription", plan: "Monthly" },
]);

const getAverageRating = (videoId: number): { average: number; count: number } => {
  const ratings = ls.get<Record<number, number>>('reelramp_ratings', {});
  const r = ratings[videoId];
  if (r) return { average: r, count: 1 };
  const simulated = Math.min(5, (videoId % 5) + 3.5);
  return { average: simulated, count: 12 + (videoId % 30) };
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isSubscribed: boolean;
  setIsSubscribed: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null, session: null, loading: true,
  isSubscribed: false, setIsSubscribed: () => { /* noop */ },
  signOut: async () => { /* noop */ },
});

const useAuth = () => React.useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkSubscription = async (userId: string): Promise<void> => {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      setIsSubscribed(!!data);
    } catch {
      setIsSubscribed(ls.get<boolean>('reelramp_subscribed', false));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) void checkSubscription(s.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        void checkSubscription(s.user.id);
      } else {
        setIsSubscribed(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    ls.remove('reelramp_subscribed');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isSubscribed, setIsSubscribed, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGO
// ─────────────────────────────────────────────────────────────────────────────
const Logo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <div className={`inline-flex items-center gap-2.5 ${className}`}>
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" stroke="#c5a26f" strokeWidth="3"/>
      <circle cx="32" cy="32" r="18" stroke="#c5a26f" strokeWidth="2"/>
      <circle cx="32" cy="14" r="3" fill="#c5a26f"/>
      <circle cx="32" cy="50" r="3" fill="#c5a26f"/>
      <circle cx="14" cy="32" r="3" fill="#c5a26f"/>
      <circle cx="50" cy="32" r="3" fill="#c5a26f"/>
      <path d="M24 22 L24 42 M24 22 L36 22 C40 22 42 25 42 28 C42 32 39 34 35 34 L24 34 M35 34 L42 42" stroke="#f4f4f5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 27 L38 37 L45 32 Z" fill="#c5a26f"/>
    </svg>
    <div className="flex flex-col leading-none">
      <span className="font-semibold tracking-[-1.5px] text-2xl text-white">ReelRamp</span>
      <span className="text-[9px] text-[#c5a26f] tracking-[3px] -mt-0.5 font-medium">PRO</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// PREMIUM VIDEO PLAYER
// ─────────────────────────────────────────────────────────────────────────────
interface PremiumVideoPlayerProps {
  video: Video;
  isPlaying: boolean;
  onPlayPause: () => void;
  onEnded: () => void;
  onProgress?: (pct: number) => void;
}

function PremiumVideoPlayer({ video, isPlaying, onPlayPause, onEnded, onProgress }: PremiumVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [doubleTapSide, setDoubleTapSide] = useState<'left' | 'right' | null>(null);
  const [likeAnim, setLikeAnim] = useState(false);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) { v.play().catch(() => { /* noop */ }); }
    else { v.pause(); }
  }, [isPlaying]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  const handleTimeUpdate = (): void => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    setProgress(pct);
    setCurrentTime(v.currentTime);
    onProgress?.(pct);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>): void => {
    const v = videoRef.current;
    if (!v) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  };

  const handleTap = (e: React.MouseEvent<HTMLDivElement>): void => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const isLeft = tapX < rect.width / 2;
    const diff = now - lastTapRef.current.time;

    if (diff < 300) {
      const v = videoRef.current;
      if (v) {
        v.currentTime = isLeft ? Math.max(0, v.currentTime - 10) : Math.min(v.duration, v.currentTime + 10);
      }
      setDoubleTapSide(isLeft ? 'left' : 'right');
      if (!isLeft) setLikeAnim(true);
      setTimeout(() => { setDoubleTapSide(null); setLikeAnim(false); }, 700);
    } else {
      setTimeout(() => {
        if (Date.now() - now >= 280) onPlayPause();
      }, 300);
    }
    lastTapRef.current = { time: now, x: tapX };
  };

  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (video.source === 'youtube') {
    const videoId = video.videoUrl.split('/').pop()?.split('?')[0] ?? '';
    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          width="100%" height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&controls=1&modestbranding=1&rel=0&playsinline=1`}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          onLoad={() => setIsLoaded(true)}
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  const resolvedUrl = video.source === 'bunny' ? getBunnyCdnUrl(video.videoUrl) : video.videoUrl;

  return (
    <div className="relative w-full h-full bg-black select-none">
      <video
        ref={videoRef}
        src={resolvedUrl}
        className="w-full h-full object-cover"
        playsInline
        autoPlay={isPlaying}
        onEnded={onEnded}
        onLoadedData={() => { setIsLoaded(true); setDuration(videoRef.current?.duration ?? 0); }}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Tap zone */}
      <div className="absolute inset-0 z-10" onClick={handleTap} />

      {/* Double-tap flash */}
      <AnimatePresence>
        {doubleTapSide && (
          <motion.div
            key={doubleTapSide}
            initial={{ opacity: 0.9, scale: 0.8 }}
            animate={{ opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={`absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm ${doubleTapSide === 'left' ? 'left-8' : 'right-8'}`}
          >
            <span className="text-white text-2xl font-bold">{doubleTapSide === 'left' ? '−10s' : '+10s'}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Heart burst on double-tap right */}
      <AnimatePresence>
        {likeAnim && (
          <motion.div
            initial={{ opacity: 1, scale: 0.5, y: 0 }}
            animate={{ opacity: 0, scale: 1.8, y: -80 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute bottom-32 right-12 z-30 pointer-events-none text-[#e11d48] text-5xl"
          >
            ❤️
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading spinner */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <div className="w-10 h-10 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Pause overlay */}
      {!isPlaying && isLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-black/25 z-10 pointer-events-none"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
            <Play size={38} className="text-black ml-1" />
          </div>
        </motion.div>
      )}

      {/* Top controls: mute + speed */}
      <div className="absolute top-4 right-4 z-30 flex flex-col items-end gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); setIsMuted(m => !m); }}
          className="p-2.5 bg-black/50 backdrop-blur-md rounded-xl border border-white/10"
        >
          {isMuted ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white" />}
        </button>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowSpeedMenu(s => !s); }}
            className="px-3 py-2 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 text-white text-xs font-mono font-semibold"
          >
            {playbackSpeed}×
          </button>
          <AnimatePresence>
            {showSpeedMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute right-0 top-10 bg-[#111]/95 backdrop-blur-xl border border-[#333] rounded-2xl overflow-hidden z-50 w-24"
                onClick={e => e.stopPropagation()}
              >
                {SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setPlaybackSpeed(s); setShowSpeedMenu(false); }}
                    className={`w-full py-2.5 text-center text-sm font-mono transition ${playbackSpeed === s ? 'bg-[#c5a26f] text-black font-bold' : 'text-white hover:bg-[#222]'}`}
                  >
                    {s}×
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 px-0 pb-0 cursor-pointer group"
        onClick={e => { e.stopPropagation(); handleSeek(e); }}
      >
        <div className="relative h-[3px] bg-white/20 group-hover:h-[5px] transition-all">
          <div
            className="h-full bg-[#c5a26f] relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#c5a26f] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>
        <div className="absolute bottom-2 right-3 text-[10px] font-mono text-white/60 opacity-0 group-hover:opacity-100 transition-opacity">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();
  const isFullscreen =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/player') ||
    location.pathname === '/admin-secure-7842' ||
    location.pathname === '/rrmp-control-9x7k' ||
    location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-[100vw] overflow-x-hidden">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/player/:id" element={<ShortsPlayerPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin-secure-7842" element={<EditorPanel />} />
        <Route path="/rrmp-control-9x7k" element={<OwnerPanel />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/refund" element={<LegalPage type="refund" />} />
        <Route path="/shipping" element={<LegalPage type="shipping" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isFullscreen && (
        <>
          <Footer />
          <BottomNavigation />
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMO POPUP SCHEDULER
// ─────────────────────────────────────────────────────────────────────────────
function usePromoPopupScheduler(isSubscribed: boolean) {
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [showGlobalPopup, setShowGlobalPopup] = useState(false);

  useEffect(() => {
    if (isSubscribed) {
      setShowTrialPopup(false);
      setShowGlobalPopup(false);
      return;
    }

    let popupCount = parseInt(sessionStorage.getItem('rr_popup_count') ?? '0', 10);

    const scheduleNext = (delay: number): ReturnType<typeof setTimeout> => {
      return setTimeout(() => {
        setShowTrialPopup(true);
        popupCount++;
        sessionStorage.setItem('rr_popup_count', String(popupCount));
        scheduleNext(Math.min(90000, 8000 * Math.log(popupCount + 2)));
      }, delay);
    };

    const initialDelay = popupCount === 0 ? 1800 : 5000;
    const t1 = scheduleNext(initialDelay);

    const t2 = setTimeout(() => {
      setShowGlobalPopup(true);
    }, 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubscribed]);

  const dismissTrial = () => setShowTrialPopup(false);
  const dismissGlobal = () => setShowGlobalPopup(false);

  return { showTrialPopup, showGlobalPopup, dismissTrial, dismissGlobal };
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/profile', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            full_name: name,
            email,
            created_at: new Date().toISOString(),
          }).single();
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setSuccess('Account created! If login fails, please check your email to verify first.');
          setMode('login');
          setLoading(false);
          return;
        }

        navigate('/profile', { replace: true });

      } else if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/profile', { replace: true });

      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (resetError) throw resetError;
        setSuccess('Password reset link sent! Check your inbox.');
        setMode('login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/profile` },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5 pb-10 w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Logo size={40} className="justify-center mb-4" />
          <h1 className="text-3xl font-semibold tracking-tight">
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Reset password'}
          </h1>
          <p className="text-[#a1a1aa] mt-1 text-sm">
            {mode === 'login' ? 'Sign in to your ReelRamp account' : mode === 'register' ? 'Join ReelRamp for premium shorts' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] rounded-3xl p-6 sm:p-8">
          {mode !== 'forgot' && (
            <div className="flex bg-[#1a1a1a] rounded-2xl p-1 mb-6">
              {(['login', 'register'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === m ? 'bg-[#c5a26f] text-black' : 'text-[#666]'}`}
                >
                  {m === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>
          )}

          {mode !== 'forgot' && (
            <button
              onClick={() => void handleGoogleSignIn()}
              disabled={googleLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-black rounded-2xl font-medium text-sm mb-4 hover:bg-[#f0f0f0] transition-all disabled:opacity-60"
            >
              {googleLoading ? (
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )}
              Continue with Google
            </button>
          )}

          {mode !== 'forgot' && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#333]" />
              <span className="text-[#555] text-xs">or</span>
              <div className="flex-1 h-px bg-[#333]" />
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            {mode === 'register' && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name"
                required
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none"
            />
            {mode !== 'forgot' && (
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
                minLength={6}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none"
              />
            )}

            {error && <p className="text-[#e11d48] text-sm px-1">{error}</p>}
            {success && <p className="text-[#22c55e] text-sm px-1">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          {mode === 'login' && (
            <button
              onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
              className="w-full text-center text-xs text-[#c5a26f] mt-4 hover:underline"
            >
              Forgot password?
            </button>
          )}

          {mode === 'forgot' && (
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className="w-full text-center text-xs text-[#666] mt-4 hover:text-white transition"
            >
              ← Back to Login
            </button>
          )}
        </div>

        <p className="text-center text-xs text-[#555] mt-6">
          <button onClick={() => navigate('/')} className="hover:text-white transition">← Back to app</button>
        </p>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
function HomePage() {
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallVideo, setPaywallVideo] = useState<Video | null>(null);
  const [library, setLibrary] = useState<number[]>([]);
  const [activePopup, setActivePopup] = useState<PopupAd | null>(null);

  const { showTrialPopup, showGlobalPopup, dismissTrial, dismissGlobal } = usePromoPopupScheduler(isSubscribed);
  const subSettings = ls.get<SubscriptionSettings>('reelramp_sub_settings', defaultSubscriptionSettings);

  useEffect(() => {
    void fetchVideosFromDB().then(setAllVideos);
    void fetchCategoriesFromDB().then(setCategories);
    setLibrary(ls.get<number[]>('reelramp_library', []));

    void fetchPopupsFromDB().then(popups => {
      const active = popups.find(p => p.isActive);
      if (active) setActivePopup(active);
    });
  }, []);

  const allCats = ["All", ...categories];

  const filtered = allVideos.filter(v => {
    const matchCat = selectedCategory === "All" || v.category === selectedCategory;
    const matchSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = categories.map(cat => ({
    cat,
    videos: filtered.filter(v => v.category === cat),
  })).filter(g => g.videos.length > 0);

  const handleVideoClick = (video: Video): void => {
    addToWatchHistory(video.id, 0);
    if (video.isPremium && !isSubscribed) {
      setPaywallVideo(video);
      setShowPaywall(true);
    } else {
      navigate(`/player/${video.id}`);
    }
  };

  const toggleSave = (id: number, e: React.MouseEvent): void => {
    e.stopPropagation();
    const updated = library.includes(id) ? library.filter(x => x !== id) : [...library, id];
    setLibrary(updated);
    ls.set('reelramp_library', updated);
  };

  return (
    <div className="pb-20 md:pb-8 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img
                src={REELRAMP_LOGO}
                alt="ReelRamp"
                className="h-9 w-auto object-contain"
                onError={e => { (e.currentTarget as HTMLImageElement).src = "https://via.placeholder.com/36x36/c5a26f/0a0a0a?text=RR"; }}
              />
              <div>
                <h1 className="text-3xl font-semibold tracking-tighter">ReelRamp</h1>
                <p className="text-[10px] text-[#a1a1aa] -mt-1">SHORTS • PREMIUM</p>
              </div>
            </div>
            <button
              onClick={() => user ? navigate('/profile') : navigate('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] rounded-2xl text-sm transition-colors"
            >
              <UserIcon size={18} /> {user ? 'Profile' : 'Login'}
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search premium shorts and stories..."
              className="w-full bg-[#111] border border-[#333] rounded-3xl py-3.5 pl-12 pr-5 text-sm focus:outline-none focus:border-[#c5a26f] placeholder:text-[#666]"
            />
            <div className="absolute left-5 top-4 text-[#666]"><Star size={18} /></div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative h-[340px] md:h-[420px] overflow-hidden">
        <img src="/images/hero.jpg" alt="ReelRamp Premium" className="absolute inset-0 w-full h-full object-cover brightness-[0.65]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-[#0a0a0a]" />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-9 max-w-3xl">
          <div className="inline-block px-4 py-1 bg-[#c5a26f] text-[#0a0a0a] text-xs tracking-[3px] font-medium rounded-full mb-4">PREMIUM EXCLUSIVE</div>
          <h2 className="text-5xl md:text-6xl font-semibold tracking-[-2.5px] leading-none mb-4">Cinematic<br />Short Stories</h2>
          <p className="text-lg text-[#a1a1aa] max-w-md">High-end investigative journalism, gripping horror, and transformative life lessons.</p>
          <button
            onClick={() => navigate('/player/4')}
            className="mt-6 flex items-center gap-3 bg-white text-black px-9 py-3.5 rounded-2xl font-medium hover:bg-[#c5a26f] hover:text-white transition-all"
          >
            <Play size={19} /> Watch Premium Short
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold tracking-tight">Browse Categories</h3>
          {isSubscribed && <div className="text-xs px-3 py-1 bg-[#c5a26f] text-black rounded-full font-medium">PREMIUM MEMBER</div>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {allCats.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 whitespace-nowrap rounded-2xl text-sm font-medium transition-all border ${
                selectedCategory === cat
                  ? 'bg-[#c5a26f] text-black border-[#c5a26f]'
                  : 'bg-[#1a1a1a] border-[#333] hover:bg-[#222]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* For You */}
      <div className="max-w-7xl mx-auto px-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">For You</h3>
            <p className="text-xs text-[#666]">Personalized picks just for you</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {allVideos.slice(0, 8).map(video => (
            <div key={video.id} onClick={() => handleVideoClick(video)} className="flex-shrink-0 w-[140px] cursor-pointer group">
              <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {video.isPremium && (
                  <div className="absolute top-2 right-2 bg-[#e11d48] text-[9px] px-2 py-0.5 rounded-full font-medium">PREMIUM</div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 text-[10px] px-2 py-px rounded font-mono">{video.duration}</div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <Play size={18} className="text-black ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="mt-2 px-1">
                <div className="text-sm font-medium line-clamp-1 tracking-tight">{video.title}</div>
                <div className="text-xs text-[#666]">{video.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto px-5 pb-12">
        {selectedCategory === "All" ? (
          grouped.map(({ cat, videos }) => (
            <div key={cat} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold tracking-tight flex items-center gap-3">
                  {cat}
                  <span className="text-xs px-3 py-px bg-[#222] rounded-full text-[#666] font-normal">{videos.length}</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {videos.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isSubscribed={isSubscribed}
                    isSaved={library.includes(video.id)}
                    onClick={() => handleVideoClick(video)}
                    onSave={e => toggleSave(video.id, e)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-5 flex items-center gap-3">
              {selectedCategory}
              <span className="text-xs px-3 py-px bg-[#222] rounded-full text-[#666] font-normal">{filtered.length}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isSubscribed={isSubscribed}
                  isSaved={library.includes(video.id)}
                  onClick={() => handleVideoClick(video)}
                  onSave={e => toggleSave(video.id, e)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Paywall */}
      <AnimatePresence>
        {showPaywall && paywallVideo && (
          <PaywallModal
            video={paywallVideo}
            onClose={() => { setShowPaywall(false); setPaywallVideo(null); }}
            onSubscribe={() => { setShowPaywall(false); navigate('/subscription'); }}
          />
        )}
      </AnimatePresence>

      {/* Global Popup Ad */}
      <AnimatePresence>
        {showGlobalPopup && activePopup && !isSubscribed && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-5" onClick={dismissGlobal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-[#111] max-w-lg w-full rounded-3xl overflow-hidden border border-[#333]"
              onClick={e => e.stopPropagation()}
            >
              <img src={activePopup.imageUrl} alt={activePopup.title} className="w-full" />
              <div className="p-8 text-center">
                <h3 className="text-3xl font-semibold tracking-tight mb-1">{activePopup.title}</h3>
                <p className="text-[#a1a1aa] mb-6">Limited time offer. Unlock unlimited premium shorts.</p>
                <div className="flex gap-3">
                  <button onClick={dismissGlobal} className="flex-1 py-3.5 border border-[#444] rounded-2xl">Maybe Later</button>
                  <button onClick={() => { dismissGlobal(); navigate(activePopup.redirectUrl); }} className="flex-1 py-3.5 bg-[#c5a26f] text-black rounded-2xl font-semibold">Subscribe Now</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trial Popup */}
      <AnimatePresence>
        {showTrialPopup && subSettings.showTrialPopup && !isSubscribed && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60" onClick={dismissTrial}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.35 }}
              className="relative w-full max-w-[380px] bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={dismissTrial} className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center text-white/70 hover:text-white bg-black/40 rounded-full">
                <X size={18} />
              </button>
              <div className="pt-8 pb-4 px-8 flex justify-center">
                <Logo size={36} />
              </div>
              {(() => {
                const ps = ls.get<PromoVideoSettings>('reelramp_promo', defaultPromoVideo);
                if (!ps.isEnabled) return null;
                const rawUrl = ps.videoUrl;
                const src = rawUrl.includes('embed') ? rawUrl
                  : `https://www.youtube.com/embed/${rawUrl.includes('v=') ? rawUrl.split('v=')[1]?.split('&')[0] : rawUrl.split('/').pop()}`;
                return (
                  <div className="mx-6 rounded-2xl overflow-hidden border border-white/20 mb-6">
                    <div className="aspect-video bg-black">
                      <iframe width="100%" height="100%" src={`${src}?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0`} title="Promo" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media" allowFullScreen className="w-full h-full" />
                    </div>
                  </div>
                );
              })()}
              <div className="px-8 pb-8 text-center">
                <span className="inline-block px-5 py-1 bg-gradient-to-r from-[#c5a26f] to-[#d4b17f] text-[#0a0a0a] text-xs font-bold tracking-[3px] rounded-full mb-3">TRIAL OFFER</span>
                <div className="text-6xl font-semibold tracking-[-3px] text-white mb-1">{subSettings.trialOfferPrice}</div>
                <div className="text-xl text-[#c5a26f] font-medium">for {subSettings.trialOfferDuration}</div>
                <p className="text-[#a1a1aa] text-sm mt-3 mb-6">Unlock full premium access instantly</p>
                <button
                  onClick={() => { dismissTrial(); navigate(user ? '/subscription' : '/login'); }}
                  className="w-full py-4 bg-white text-[#0a0a0a] font-semibold text-lg tracking-wider rounded-3xl transition-all shadow-lg"
                >
                  Pay {subSettings.trialOfferPrice} — Start Trial
                </button>
                <p className="text-[10px] text-[#888] mt-4">
                  After {subSettings.trialOfferDuration}, auto-pay {subSettings.fullPrice} for {subSettings.fullValidity}. Cancel anytime.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO CARD
// ─────────────────────────────────────────────────────────────────────────────
interface VideoCardProps {
  video: Video;
  isSubscribed: boolean;
  isSaved: boolean;
  onClick: () => void;
  onSave: (e: React.MouseEvent) => void;
}

function VideoCard({ video, isSubscribed: _isSubscribed, isSaved, onClick, onSave }: VideoCardProps) {
  const rating = getAverageRating(video.id);
  return (
    <div onClick={onClick} className="group relative bg-[#1a1a1a] rounded-3xl overflow-hidden cursor-pointer border border-[#222] hover:border-[#c5a26f]/50 transition-colors">
      <div className="relative aspect-[9/16] overflow-hidden">
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
        {video.isPremium && (
          <div className="absolute top-3 right-3 bg-[#e11d48] text-[10px] px-3 py-px font-medium tracking-widest rounded-full flex items-center gap-1">
            <Lock size={10} /> PREMIUM
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-black/70 text-xs px-2.5 py-px rounded font-mono tracking-[1px]">{video.duration}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="text-black ml-0.5" size={26} />
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-[15px] tracking-[-0.2px] line-clamp-1">{video.title}</h4>
            <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-2 leading-snug">{video.description}</p>
          </div>
          <button onClick={onSave} className="mt-0.5 p-1.5 hover:bg-[#222] rounded-xl transition-colors">
            <Bookmark size={18} className={isSaved ? "fill-[#c5a26f] text-[#c5a26f]" : "text-[#666]"} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="px-2.5 py-px bg-[#222] text-[#a1a1aa] rounded">{video.category}</span>
          <div className="flex items-center gap-1 text-[#c5a26f]">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={12} className={i <= Math.round(rating.average) ? "fill-current" : ""} />
              ))}
            </div>
            <span className="text-[#666] text-[10px] ml-0.5">{rating.average.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYWALL
// ─────────────────────────────────────────────────────────────────────────────
function PaywallModal({ video, onClose, onSubscribe }: { video: Video; onClose: () => void; onSubscribe: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ ease: [0.23, 1, 0.32, 1] }}
        className="bg-[#111] w-full max-w-md rounded-3xl overflow-hidden border border-[#333]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6">
            <Lock className="text-[#c5a26f]" size={32} />
          </div>
          <h3 className="text-3xl font-semibold tracking-tight mb-2">Premium Content</h3>
          <p className="text-[#a1a1aa] mb-7 text-[15px]">
            Unlock <span className="text-white font-medium">"{video?.title}"</span> and all premium shorts with a ReelRamp subscription.
          </p>
          <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6 text-left text-sm">
            <div className="flex justify-between mb-1.5 text-[#a1a1aa]">
              <span>Duration</span><span className="font-mono text-white">{video?.duration}</span>
            </div>
            <div className="flex justify-between mb-1.5 text-[#a1a1aa]">
              <span>Category</span><span className="text-white">{video?.category}</span>
            </div>
            <div className="pt-4 border-t border-[#333] text-[#c5a26f] text-xs tracking-[1.5px]">EXCLUSIVE • INVESTIGATIVE • CINEMATIC</div>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={onSubscribe} className="w-full py-4 bg-[#c5a26f] text-[#0a0a0a] rounded-2xl font-semibold text-base tracking-wider">
              SUBSCRIBE TO UNLOCK
            </button>
            <button onClick={onClose} className="text-sm text-[#666] py-2">Maybe Later</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHORTS PLAYER PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ShortsPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSubscribed } = useAuth();
  const [feedVideos, setFeedVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [library, setLibrary] = useState<number[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [, setVideoProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number>(0);

  const currentVideoId = parseInt(id ?? "1", 10);

  useEffect(() => {
    void fetchVideosFromDB().then(vids => {
      setFeedVideos(vids);
      const idx = vids.findIndex(v => v.id === currentVideoId);
      setCurrentIndex(idx !== -1 ? idx : 0);
    });
    setLibrary(ls.get<number[]>('reelramp_library', []));
  }, [currentVideoId]);

  const currentShort = feedVideos[currentIndex];

  useEffect(() => {
    if (currentShort) {
      addToWatchHistory(currentShort.id, 0);
      incrementView(currentShort.id);
      const ratings = ls.get<Record<number, number>>('reelramp_ratings', {});
      setUserRating(ratings[currentShort.id] ?? 0);
    }
  }, [currentIndex, currentShort]);

  const checkPremium = useCallback((): boolean => {
    if (currentShort?.isPremium && !isSubscribed) {
      setShowPaywall(true);
      setIsPlaying(false);
      return false;
    }
    return true;
  }, [currentShort, isSubscribed]);

  const goNext = useCallback((): void => {
    if (currentIndex < feedVideos.length - 1 && checkPremium()) {
      setCurrentIndex(i => i + 1);
      setIsPlaying(true);
      setIsLiked(false);
      setVideoProgress(0);
    }
  }, [currentIndex, feedVideos.length, checkPremium]);

  const goPrev = useCallback((): void => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setIsPlaying(true);
      setIsLiked(false);
      setVideoProgress(0);
    }
  }, [currentIndex]);

  const handleTouchStart = (e: React.TouchEvent): void => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent): void => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 60) {
      if (delta > 0) goNext(); else goPrev();
    }
  };

  const toggleSave = (): void => {
    if (!currentShort) return;
    const updated = library.includes(currentShort.id)
      ? library.filter(x => x !== currentShort.id)
      : [...library, currentShort.id];
    setLibrary(updated);
    ls.set('reelramp_library', updated);
  };

  const handleShare = (): void => {
    const url = `${window.location.origin}/player/${currentShort?.id}`;
    if (navigator.share) {
      void navigator.share({ title: currentShort?.title, url });
    } else {
      void navigator.clipboard.writeText(url);
    }
  };

  const handleEnded = (): void => {
    if (currentShort) addToWatchHistory(currentShort.id, 100);
    goNext();
  };

  const rateVideo = (star: number): void => {
    if (!currentShort) return;
    setUserRating(star);
    const ratings = ls.get<Record<number, number>>('reelramp_ratings', {});
    ratings[currentShort.id] = star;
    ls.set('reelramp_ratings', ratings);
  };

  if (!currentShort) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col overflow-hidden"
      style={{ maxWidth: '100vw', touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-5 pt-8 pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={() => navigate(-1)} className="p-3 bg-black/40 rounded-2xl backdrop-blur">
          <ArrowLeft size={22} />
        </button>
        <div className="text-xs tracking-[3px] text-white/70 font-medium">{currentShort.category.toUpperCase()} • {currentShort.duration}</div>
        <div className="text-sm px-3 py-1 bg-white/10 rounded-full font-mono">{currentIndex + 1} / {feedVideos.length}</div>
      </div>

      {/* Player */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="relative w-full max-w-[420px] h-full flex flex-col"
          >
            <div className="relative flex-1 bg-black overflow-hidden rounded-none md:rounded-3xl shadow-2xl">
              <PremiumVideoPlayer
                video={currentShort}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(p => !p)}
                onEnded={handleEnded}
                onProgress={setVideoProgress}
              />

              {/* Bottom overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pointer-events-none">
                <div className="max-w-[320px]">
                  <h2 className="text-3xl font-semibold tracking-[-1.2px] leading-none mb-1.5">{currentShort.title}</h2>
                  <p className="text-sm text-white/70 leading-snug line-clamp-3 pr-16">{currentShort.description}</p>
                  <div className="flex items-center gap-2 mt-4 pointer-events-auto">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => rateVideo(s)} className="text-xl transition">
                          {s <= userRating ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-white/60">Rate this short</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right Action Bar */}
        <div className="absolute right-4 bottom-[110px] flex flex-col items-center gap-5 z-50">
          <button onClick={() => setIsLiked(l => !l)} className="flex flex-col items-center gap-1">
            <motion.div
              animate={{ scale: isLiked ? [1, 1.35, 1] : 1 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-2xl transition ${isLiked ? 'bg-[#e11d48]' : 'bg-black/60 backdrop-blur'}`}
            >
              <Heart size={24} className={isLiked ? "fill-white text-white" : ""} />
            </motion.div>
            <span className="text-[10px] tracking-wider">LIKE</span>
          </button>
          <button onClick={toggleSave} className="flex flex-col items-center gap-1">
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur">
              <Bookmark size={24} className={library.includes(currentShort.id) ? "fill-[#c5a26f] text-[#c5a26f]" : ""} />
            </div>
            <span className="text-[10px] tracking-wider">SAVE</span>
          </button>
          <button onClick={handleShare} className="flex flex-col items-center gap-1">
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur">
              <Share2 size={24} />
            </div>
            <span className="text-[10px] tracking-wider">SHARE</span>
          </button>
          {currentShort.isPremium && !isSubscribed && (
            <button onClick={() => setShowPaywall(true)} className="mt-2 flex flex-col items-center">
              <div className="p-3.5 bg-[#e11d48] rounded-2xl"><Lock size={22} /></div>
              <span className="text-[9px] mt-1 text-[#e11d48] font-medium">SUBSCRIBE</span>
            </button>
          )}
        </div>

        {/* Swipe hint arrows */}
        <div className="absolute left-1/2 -translate-x-1/2 top-20 z-40 flex flex-col items-center gap-1 pointer-events-none opacity-40">
          {currentIndex > 0 && <ChevronUp size={20} className="text-white animate-bounce" />}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 bottom-28 z-40 flex flex-col items-center gap-1 pointer-events-none opacity-40">
          {currentIndex < feedVideos.length - 1 && <ChevronDown size={20} className="text-white animate-bounce" />}
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-8">
          <div className="flex items-center justify-between max-w-[420px] mx-auto">
            <button onClick={goPrev} disabled={currentIndex === 0} className="p-4 disabled:opacity-30">
              <ArrowLeft size={22} />
            </button>
            <button onClick={() => { if (checkPremium()) setIsPlaying(p => !p); }} className="p-4 bg-white/10 hover:bg-white/20 transition rounded-2xl backdrop-blur-lg">
              {isPlaying ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
            </button>
            <button onClick={goNext} disabled={currentIndex === feedVideos.length - 1} className="p-4 disabled:opacity-30 text-sm font-medium">
              NEXT
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPaywall && (
          <PaywallModal
            video={currentShort}
            onClose={() => setShowPaywall(false)}
            onSubscribe={() => { setShowPaywall(false); navigate('/subscription'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION PAGE
// ─────────────────────────────────────────────────────────────────────────────
function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, isSubscribed, setIsSubscribed } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const subSettings = ls.get<SubscriptionSettings>('reelramp_sub_settings', defaultSubscriptionSettings);
  const paymentConfig = ls.get<PaymentSettings>('reelramp_payment', defaultPaymentSettings);

  const activateSubscription = async (): Promise<void> => {
    if (user) {
      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        status: 'active',
        activated_at: new Date().toISOString(),
      });
    }
    ls.set('reelramp_subscribed', true);
    setIsSubscribed(true);
    setPaymentProcessing(false);
    setShowPaymentModal(false);
    setShowTrialModal(false);
    setPaymentSuccess(true);
  };

  const processPayment = (): void => {
    setPaymentProcessing(true);
    setTimeout(() => void activateSubscription(), 1800);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={48} className="text-[#22c55e]" />
          </div>
          <h2 className="text-4xl font-semibold tracking-tight mb-3">You're Premium!</h2>
          <p className="text-[#a1a1aa] mb-10">Unlimited access to all cinematic shorts is now unlocked.</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-lg tracking-wider">
            Start Watching
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-10 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-8 text-sm text-[#a1a1aa]">
        <ArrowLeft size={18} /> Back
      </button>
      <div className="mb-10">
        <h1 className="text-6xl font-semibold tracking-[-3.2px]">Unlock<br />Everything.</h1>
        <p className="text-xl text-[#a1a1aa] mt-3">Premium access to all shorts, offline downloads, and new releases.</p>
      </div>

      {isSubscribed && (
        <div className="mb-6 p-5 bg-[#1a1a1a] border border-[#c5a26f] rounded-3xl">
          <div className="flex items-center gap-2 text-[#c5a26f] mb-1"><CheckCircle size={18} /> ACTIVE SUBSCRIPTION</div>
          <div className="text-sm text-white">Thank you for supporting ReelRamp Shorts</div>
          <button onClick={() => setShowCancelConfirm(true)} className="text-xs text-[#666] underline mt-3">Cancel Subscription</button>
        </div>
      )}

      {!isSubscribed && subSettings.showTrialPopup && (
        <div className="bg-gradient-to-br from-[#c5a26f]/20 to-transparent border border-[#c5a26f]/40 rounded-3xl p-7 mb-4 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-[#c5a26f] text-black text-[10px] px-3 py-0.5 rounded-full tracking-widest font-bold">BEST DEAL</div>
          <div className="text-xs tracking-widest text-[#c5a26f] mb-2">LIMITED TRIAL OFFER</div>
          <div className="text-5xl font-semibold tracking-tighter mb-1">{subSettings.trialOfferPrice}</div>
          <div className="text-[#a1a1aa] text-sm mb-1">for {subSettings.trialOfferDuration}</div>
          <div className="text-xs text-[#666] mb-6">Then {subSettings.fullPrice} for {subSettings.fullValidity} • Cancel anytime</div>
          <ul className="space-y-2 text-sm mb-7">
            {['All premium shorts unlocked', 'Offline downloads', 'Ad-free experience', 'New releases first'].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-[#a1a1aa]"><CheckCircle size={14} className="text-[#c5a26f]" /> {f}</li>
            ))}
          </ul>
          <button
            onClick={() => user ? setShowTrialModal(true) : navigate('/login')}
            className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider"
          >
            Start {subSettings.trialOfferDuration} Trial — {subSettings.trialOfferPrice}
          </button>
        </div>
      )}

      {!isSubscribed && (
        <div className="bg-[#111] border border-[#222] rounded-3xl p-7 mb-8">
          <div className="text-xs tracking-widest text-[#a1a1aa] mb-2">FULL ACCESS</div>
          <div className="text-5xl font-semibold tracking-tighter mb-1">{subSettings.fullPrice}</div>
          <div className="text-[#a1a1aa] text-sm mb-6">for {subSettings.fullValidity}</div>
          <ul className="space-y-2 text-sm mb-7">
            {['All premium shorts unlocked', 'Offline downloads', 'Ad-free experience', 'New releases first', 'Priority support'].map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-[#a1a1aa]"><CheckCircle size={14} className="text-[#c5a26f]" /> {f}</li>
            ))}
          </ul>
          <button
            onClick={() => user ? setShowPaymentModal(true) : navigate('/login')}
            className="w-full py-4 bg-white text-black font-semibold rounded-2xl tracking-wider"
          >
            Subscribe — {subSettings.fullPrice}
          </button>
        </div>
      )}

      <p className="text-center text-xs text-[#444] tracking-widest">
        SECURE PAYMENTS • {paymentConfig.activeGateway !== 'none' ? paymentConfig.activeGateway.toUpperCase() : 'MANUAL'} • CANCEL ANYTIME
      </p>

      {([
        { show: showPaymentModal, onClose: () => setShowPaymentModal(false), label: subSettings.fullPrice, title: "Order Summary" },
        { show: showTrialModal, onClose: () => setShowTrialModal(false), label: subSettings.trialOfferPrice, title: "Trial Order" },
      ] as const).map(({ show, onClose, label, title }) => (
        <AnimatePresence key={title}>
          {show && (
            <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-5" onClick={() => !paymentProcessing && onClose()}>
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                className="bg-[#111] w-full max-w-md rounded-3xl p-8 border border-[#222]"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-2xl tracking-tight">{title}</h3>
                  {!paymentProcessing && <button onClick={onClose}><X size={20} /></button>}
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6">
                  <div className="flex justify-between font-semibold border-t border-[#333] pt-3">
                    <span>Total</span><span className="text-[#c5a26f]">{label}</span>
                  </div>
                </div>
                <button
                  onClick={processPayment}
                  disabled={paymentProcessing}
                  className="w-full py-4 rounded-2xl bg-[#c5a26f] text-black text-lg font-semibold tracking-wide disabled:opacity-70 flex items-center justify-center gap-3"
                >
                  {paymentProcessing ? (
                    <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Processing...</>
                  ) : `Pay ${label}`}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      ))}

      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-5">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#111] w-full max-w-sm rounded-3xl p-8 border border-[#333]"
            >
              <h3 className="font-semibold text-xl mb-2">Cancel Subscription?</h3>
              <p className="text-[#a1a1aa] text-sm mb-7">You'll lose access to all premium content.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 border border-[#333] rounded-2xl text-sm">Keep Premium</button>
                <button onClick={async () => {
                  if (user) {
                    await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', user.id);
                  }
                  ls.remove('reelramp_subscribed');
                  setIsSubscribed(false);
                  setShowCancelConfirm(false);
                }} className="flex-1 py-3 bg-[#e11d48] rounded-2xl text-sm font-medium">Yes, Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ProfilePage() {
  const navigate = useNavigate();
  const { user, isSubscribed, signOut, loading } = useAuth();
  const [library, setLibrary] = useState<Video[]>([]);
  const [downloads, setDownloads] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'downloads' | 'account'>('library');
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    void fetchVideosFromDB().then(vids => {
      setAllVideos(vids);
      const libIds: number[] = ls.get<number[]>('reelramp_library', []);
      setLibrary(vids.filter(v => libIds.includes(v.id)));
      const dlIds: number[] = ls.get<number[]>('reelramp_downloads', []);
      setDownloads(vids.filter(v => dlIds.includes(v.id)));
    });
    setWatchHistory(getWatchHistory());
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = (user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const removeFromLibrary = (id: number): void => {
    const updated = library.filter(v => v.id !== id);
    setLibrary(updated);
    ls.set('reelramp_library', updated.map(v => v.id));
  };

  const removeDownload = (id: number): void => {
    const updated = downloads.filter(v => v.id !== id);
    setDownloads(updated);
    ls.set('reelramp_downloads', updated.map(v => v.id));
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 pt-8 md:pt-10 w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-semibold text-3xl md:text-5xl tracking-[-2px]">Profile</h1>
        <button onClick={() => navigate('/')} className="text-sm text-[#a1a1aa]">Home</button>
      </div>

      {/* Profile Header */}
      <div className="flex items-center gap-5 mb-9 border-b border-[#222] pb-8">
        <div className="w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-[#c5a26f]/50 bg-[#222] flex items-center justify-center">
          <div className="text-4xl font-bold text-[#c5a26f]">{initials}</div>
        </div>
        <div className="flex-1">
          <div className="text-3xl font-semibold tracking-tight">{displayName}</div>
          <div className="text-sm text-[#a1a1aa]">{user.email}</div>
          <button
            onClick={async () => { await signOut(); navigate('/'); }}
            className="text-xs text-[#e11d48] mt-1"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="mb-8 bg-[#111] border border-[#222] rounded-3xl p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="uppercase text-xs tracking-[2.5px] text-[#a1a1aa]">SUBSCRIPTION</div>
            <div className="font-semibold text-2xl md:text-3xl tracking-tight mt-1">{isSubscribed ? "Premium Active" : "Free Plan"}</div>
          </div>
          {isSubscribed ? (
            <div className="text-left md:text-right">
              <div className="text-[#22c55e] text-sm flex items-center gap-1.5"><CheckCircle size={16} /> ACTIVE</div>
              <button onClick={() => navigate('/subscription')} className="text-sm underline text-[#666] mt-1">Manage Subscription</button>
            </div>
          ) : (
            <button onClick={() => navigate('/subscription')} className="w-full md:w-auto px-8 py-3.5 bg-[#c5a26f] text-black text-sm font-semibold rounded-2xl">
              UPGRADE TO PREMIUM
            </button>
          )}
        </div>
      </div>

      {/* Watch History */}
      {watchHistory.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold tracking-tight mb-4">Continue Watching</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {watchHistory.slice(0, 6).map(item => {
              const video = allVideos.find(v => v.id === item.videoId);
              if (!video) return null;
              return (
                <div key={item.videoId} onClick={() => navigate(`/player/${video.id}`)} className="flex-shrink-0 w-[160px] cursor-pointer group">
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div className="h-full bg-[#c5a26f]" style={{ width: `${item.progress}%` }} />
                    </div>
                  </div>
                  <div className="mt-2 text-sm font-medium line-clamp-1">{video.title}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#222] mb-5 text-sm overflow-x-auto">
        {(['library', 'downloads', 'account'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 md:px-7 pb-4 border-b-2 transition whitespace-nowrap ${activeTab === tab ? 'border-[#c5a26f] text-white font-medium' : 'border-transparent text-[#666]'}`}
          >
            {tab === 'library' && 'My Library'}
            {tab === 'downloads' && 'Downloads'}
            {tab === 'account' && 'Account'}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        <div>
          {library.length === 0 ? (
            <div className="py-14 text-center text-[#666]">No saved shorts yet. Start saving from the home feed.</div>
          ) : (
            <div className="space-y-4">
              {library.map(video => (
                <div key={video.id} className="flex gap-3 bg-[#111] p-3 rounded-2xl border border-[#222]">
                  <img src={video.thumbnail} className="w-16 h-16 object-cover rounded-xl" alt="" />
                  <div className="flex-1 pt-0.5">
                    <div className="font-medium text-sm line-clamp-1">{video.title}</div>
                    <div className="text-xs text-[#666] mt-0.5">{video.duration} • {video.category}</div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <button onClick={() => navigate(`/player/${video.id}`)} className="flex items-center gap-1 text-[#c5a26f]">PLAY <Play size={13} /></button>
                      <button onClick={() => removeFromLibrary(video.id)} className="text-[#666]">REMOVE</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'downloads' && (
        <div>
          <div className="text-[#a1a1aa] text-sm mb-4">Offline viewing enabled for premium members.</div>
          {downloads.length === 0 ? (
            <div className="text-center py-14 text-[#666]">No offline downloads.</div>
          ) : (
            <div className="space-y-4">
              {downloads.map(video => (
                <div key={video.id} className="flex gap-3 bg-[#111] p-3 rounded-2xl border border-[#222]">
                  <img src={video.thumbnail} className="w-16 h-16 object-cover rounded-xl" alt="" />
                  <div className="flex-1 pt-0.5">
                    <div className="font-medium text-sm line-clamp-1">{video.title}</div>
                    <div className="text-xs text-[#666] mt-0.5">{video.duration}</div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <button onClick={() => navigate(`/player/${video.id}`)} className="flex items-center gap-1 text-[#22c55e]">PLAY <Play size={13} /></button>
                      <button onClick={() => removeDownload(video.id)} className="text-[#666]">DELETE</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'account' && (
        <div className="space-y-6 text-sm">
          <div className="p-6 bg-[#111] rounded-3xl border border-[#222]">
            <div className="font-medium mb-4">Account Settings</div>
            <div className="flex justify-between py-4 border-t border-[#222]">
              <div>Email</div><div className="text-[#a1a1aa]">{user.email}</div>
            </div>
            <div className="flex justify-between py-4 border-t border-[#222]">
              <div>User ID</div><div className="text-[#a1a1aa] font-mono text-xs">{user.id?.slice(0, 12)}…</div>
            </div>
            <div className="flex justify-between py-4 border-t border-[#222]">
              <div>Member Since</div>
              <div className="text-[#a1a1aa]">{new Date(user.created_at ?? '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
          <button
            onClick={async () => {
              if (confirm("Sign out and clear all local data?")) {
                localStorage.clear();
                await signOut();
                navigate('/');
              }
            }}
            className="text-[#e11d48] text-xs tracking-widest hover:underline"
          >
            RESET ALL DATA & SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com/reelrampofficial', label: 'ReelRamp Official' },
    { name: 'Instagram', url: 'https://instagram.com/thoda_thehro_', label: '@thoda_thehro_' },
    { name: 'YouTube', url: 'https://youtube.com/@reelramp', label: 'ReelRamp Channel' },
    { name: 'WhatsApp', url: 'https://wa.me/917307493338', label: 'Direct Chat' },
  ];

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#222] pt-14 pb-8 px-5 text-sm text-[#a1a1aa]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center pb-12 border-b border-[#222]">
          <div className="inline-block px-4 py-1 text-xs tracking-[3px] text-[#c5a26f] border border-[#c5a26f]/30 rounded-full mb-4">FROM THE DIRECTOR</div>
          <blockquote className="text-2xl md:text-3xl font-light italic leading-snug text-white mb-6">
            "Kahaniyan sirf sunayi nahi jati, mehsoos ki jati hain."
          </blockquote>
          <div className="text-[#c5a26f] font-medium">— Ayush Jivan <span className="text-[#666] font-normal">Founder &amp; Director, ReelRamp Pro</span></div>
        </div>

        <div className="pt-10 pb-8">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {socialLinks.map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-[#a1a1aa] hover:text-[#c5a26f] transition-colors group">
                <div className="text-[#c5a26f]">
                  {s.name === 'Facebook' && <Facebook size={18} />}
                  {s.name === 'Instagram' && <Instagram size={18} />}
                  {s.name === 'YouTube' && <Youtube size={18} />}
                  {s.name === 'WhatsApp' && <MessageCircle size={18} />}
                </div>
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-[#222] grid md:grid-cols-4 gap-y-10 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3 text-white">
              <div className="w-7 h-7 bg-[#c5a26f] rounded-xl flex items-center justify-center"><Play size={15} className="text-black" /></div>
              <span className="font-semibold tracking-tight">ReelRamp Shorts</span>
            </div>
            <p className="text-xs leading-snug pr-4">Premium cinematic short films and investigative stories.</p>
          </div>
          <div>
            <div className="font-medium text-white mb-4">Company</div>
            <div className="space-y-2 text-xs">
              {([['privacy', 'Privacy Policy'], ['terms', 'Terms & Conditions'], ['refund', 'Cancellation & Refund'], ['shipping', 'Shipping & Delivery']] as const).map(([path, label]) => (
                <a key={path} href={`/${path}`} className="block hover:text-white">{label}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="font-medium text-white mb-4">Support</div>
            <div className="space-y-[7px] text-xs">
              <div>reelramporiginal@gmail.com</div>
              <div>+91 7307493338</div>
            </div>
          </div>
          <div>
            <div className="font-medium text-white mb-4">Office</div>
            <div className="text-xs leading-snug">FF Shop No. 6, Arohi Arcade,<br />Munshipulia, Lucknow - 226016</div>
            <div className="mt-6 text-[10px] tracking-[1.5px]">© {new Date().getFullYear()} ReelRamp Originals Pvt. Ltd.</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────
function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Play, key: 'home' },
    { path: '/#for-you', label: 'For You', icon: Heart, key: 'foryou' },
    { path: '/subscription', label: 'Plans', icon: Star, key: 'plans' },
    { path: user ? '/profile' : '/login', label: 'Profile', icon: UserIcon, key: 'profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#222] z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = item.path === location.pathname ||
            (item.path === '/' && location.pathname.startsWith('/player'));
          return (
            <button
              key={item.key}
              onClick={() => {
                if (item.path === '/#for-you') {
                  navigate('/');
                  setTimeout(() => window.scrollTo({ top: 850, behavior: 'smooth' }), 100);
                } else {
                  navigate(item.path);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all ${isActive ? 'text-[#c5a26f]' : 'text-[#a1a1aa]'}`}
            >
              <Icon size={20} />
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL PAGES
// ─────────────────────────────────────────────────────────────────────────────
function LegalPage({ type }: { type: 'privacy' | 'terms' | 'refund' | 'shipping' }) {
  const navigate = useNavigate();
  const titles: Record<string, string> = {
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    refund: "Cancellation & Refund Policy",
    shipping: "Shipping & Delivery Policy",
  };
  const contents: Record<string, string> = {
    privacy: `At ReelRamp Shorts, we respect your privacy. This policy explains how we collect, use, and protect your personal information.\n\n1. Information We Collect: Name, email, phone number, and payment details.\n\n2. How We Use Information: To provide access to premium content, process payments, and improve the service.\n\n3. Data Security: All data is encrypted. We never share personal information with third parties except for payment processing.\n\n4. Contact: reelramporiginal@gmail.com | +91 7307493338`,
    terms: `Welcome to ReelRamp Shorts. By accessing or using our platform, you agree to these Terms & Conditions.\n\n1. Subscription: Premium access is granted upon successful payment.\n\n2. Content: All short films are proprietary. Unauthorized distribution is prohibited.\n\n3. Payment: All payments are processed securely.\n\n4. Governing Law: Laws of India apply. Disputes resolved in Lucknow courts.`,
    refund: `Cancellation & Refund Policy\n\n1. You may cancel your subscription anytime from the Profile page.\n\n2. Refunds: Full refunds are available within 7 days of purchase if you have not watched more than 2 premium shorts.\n\n3. How to Request: Email reelramporiginal@gmail.com with your transaction ID. Refunds processed within 5-7 business days.`,
    shipping: `Shipping & Delivery Policy (Digital Products)\n\nReelRamp Shorts is a digital subscription service. There is no physical shipping involved.\n\n1. Instant Access: Upon successful payment, your subscription is activated immediately.\n\n2. Delivery Confirmation: A confirmation email is sent to your registered contact.\n\n3. Support: +91 7307493338 or reelramporiginal@gmail.com`,
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 pb-28">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-5xl font-semibold tracking-[-2px] mb-3">{titles[type]}</h1>
      <div className="text-xs uppercase tracking-[3px] text-[#c5a26f] mb-8">REELRAMP ORIGINALS • LAST UPDATED MAY 2025</div>
      <div className="text-[#ccc] whitespace-pre-line leading-relaxed text-[15px]">{contents[type]}</div>
      <div className="mt-12 text-xs border-t border-[#222] pt-8 text-[#666]">
        Office: FF Shop No. 6, Arohi Arcade, Munshipulia, Lucknow - 226016<br />
        Support: reelramporiginal@gmail.com | +91 7307493338
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR PANEL
// ─────────────────────────────────────────────────────────────────────────────
function EditorPanel() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const EDITOR_PASSWORD = "editor@2025";

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5">
        <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-3xl p-9">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-[#c5a26f] rounded-2xl flex items-center justify-center mb-4"><Edit2 className="text-black" size={28} /></div>
            <h1 className="text-3xl font-semibold">Editor Access</h1>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (password === EDITOR_PASSWORD) setIsLoggedIn(true);
                else setError("Invalid password");
              }
            }}
            placeholder="Editor Password"
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none"
          />
          {error && <p className="text-[#e11d48] text-sm text-center mt-2">{error}</p>}
          <button
            onClick={() => { if (password === EDITOR_PASSWORD) setIsLoggedIn(true); else setError("Invalid password"); }}
            className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold"
          >
            LOGIN AS EDITOR
          </button>
          <div className="text-center mt-4"><button onClick={() => navigate('/')} className="text-xs text-[#666]">Back to App</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#c5a26f] rounded-xl flex items-center justify-center"><Edit2 className="text-black" size={18} /></div>
            <div><div className="font-semibold">ReelRamp • Editor Studio</div><div className="text-[10px] text-[#666]">Limited Access</div></div>
          </div>
          <button onClick={() => navigate('/')} className="text-sm px-4 py-2 bg-[#222] rounded-2xl">Exit Editor</button>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <h2 className="text-4xl font-semibold tracking-tight mb-2">Content Management</h2>
        <p className="text-[#a1a1aa] mb-8">Manage videos, popups and trial offers. Full admin available via Owner panel.</p>
        <div className="bg-[#111] rounded-3xl p-8 border border-[#222]">
          <p className="text-lg">Editor access granted. You can manage shorts and trial offers.</p>
          <button onClick={() => navigate('/admin')} className="mt-4 px-6 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium text-sm">Open Admin Panel</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OWNER PANEL
// ─────────────────────────────────────────────────────────────────────────────
function OwnerPanel() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const OWNER_PASSWORD = "owner@reelramp2025";

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5">
        <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-3xl p-9">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#c5a26f] to-[#d4b17f] rounded-2xl flex items-center justify-center mb-4"><Settings className="text-black" size={28} /></div>
            <h1 className="text-3xl font-semibold">Owner Access</h1>
          </div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (password === OWNER_PASSWORD) setIsLoggedIn(true);
                else setError("Invalid password");
              }
            }}
            placeholder="Owner Password"
            className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none"
          />
          {error && <p className="text-[#e11d48] text-sm text-center mt-2">{error}</p>}
          <button
            onClick={() => { if (password === OWNER_PASSWORD) setIsLoggedIn(true); else setError("Invalid password"); }}
            className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold"
          >
            LOGIN AS OWNER
          </button>
          <div className="text-center mt-4"><button onClick={() => navigate('/')} className="text-xs text-[#666]">Back to App</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#c5a26f] to-[#d4b17f] rounded-xl flex items-center justify-center"><Settings className="text-black" size={18} /></div>
            <div><div className="font-semibold">ReelRamp • Owner Studio</div><div className="text-[10px] text-[#c5a26f]">Full Access</div></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/admin-secure-7842')} className="text-sm px-4 py-2 bg-[#222] rounded-2xl">Editor Panel</button>
            <button onClick={() => navigate('/admin')} className="text-sm px-4 py-2 bg-[#c5a26f] text-black rounded-2xl">Admin Panel</button>
            <button onClick={() => navigate('/')} className="text-sm px-4 py-2 bg-[#e11d48] rounded-2xl">Exit</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <h2 className="text-5xl font-semibold tracking-tight mb-2">Owner Control Center</h2>
        <p className="text-[#a1a1aa] mb-8">Complete access to all settings, users, and revenue</p>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { label: "Manage All Shorts", path: '/admin' },
            { label: "Subscription Plans", path: '/admin' },
            { label: "User Management", path: '/admin' },
            { label: "Revenue & Analytics", path: '/admin' },
            { label: "Payment Settings", path: '/admin' },
            { label: "Platform Settings", path: '/admin' },
          ].map(item => (
            <div key={item.label} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex items-center justify-between">
              <span className="font-medium">{item.label}</span>
              <button onClick={() => navigate(item.path)} className="text-[#c5a26f] text-sm px-4 py-2 bg-[#1a1a1a] rounded-xl">Open →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
type AdminTab =
  | 'dashboard' | 'content' | 'users' | 'analytics' | 'popups'
  | 'settings' | 'plans' | 'payment' | 'categories' | 'promo';

function AdminPage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInAdmin, setLoggedInAdmin] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  const [adminVideos, setAdminVideos] = useState<Video[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [popups, setPopups] = useState<PopupAd[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(defaultPlatformSettings);
  const [subSettings, setSubSettings] = useState<SubscriptionSettings>(defaultSubscriptionSettings);
  const [paymentConfig, setPaymentConfig] = useState<PaymentSettings>(defaultPaymentSettings);
  const [categories, setCategoriesState] = useState<string[]>([]);
  const [promoSettings, setPromoSettings] = useState<PromoVideoSettings>(defaultPromoVideo);
  const [videoViews, setVideoViews] = useState<Record<number, number>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [editingPopup, setEditingPopup] = useState<PopupAd | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCatName, setEditingCatName] = useState<string | null>(null);
  const [editingCatValue, setEditingCatValue] = useState('');
  const [toast, setToast] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Horror', duration: '4:30',
    isPremium: true, thumbnail: '', videoUrl: '',
  });

  const showToast = (msg: string): void => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const ALLOWED_ADMINS = [
    { email: "admin@reelramp.com", password: "reelramp-pro-2025" },
    { email: "founder@reelramp.com", password: "admin2025" },
  ];

  const handleAdminLogin = (): void => {
    const valid = ALLOWED_ADMINS.find(a => a.email === adminEmail && a.password === adminPass);
    if (valid) { setLoggedInAdmin(valid.email); setIsAuthorized(true); setLoginError(''); }
    else { setLoginError("Invalid credentials."); }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    (async () => {
      setSyncing(true);
      try {
        const vids = await fetchVideosFromDB();
        setAdminVideos(vids);

        const pops = await fetchPopupsFromDB();
        setPopups(pops);

        const cats = await fetchCategoriesFromDB();
        setCategoriesState(cats);

        const ps = await fetchSettingFromDB<PlatformSettings>('settings', defaultPlatformSettings);
        setPlatformSettings(ps);

        const ss = await fetchSettingFromDB<SubscriptionSettings>('sub_settings', defaultSubscriptionSettings);
        setSubSettings(ss);

        const pc = await fetchSettingFromDB<PaymentSettings>('payment', defaultPaymentSettings);
        setPaymentConfig(pc);

        const promo = await fetchSettingFromDB<PromoVideoSettings>('promo', defaultPromoVideo);
        setPromoSettings(promo);

        try {
          const { data } = await supabase.from('profiles').select('*').order('created_at');
          if (data && data.length > 0) {
            setAdminUsers(data as unknown as AdminUser[]);
          } else {
            setAdminUsers(ls.get<AdminUser[]>('reelramp_admin_users', initialAdminUsers));
          }
        } catch {
          setAdminUsers(ls.get<AdminUser[]>('reelramp_admin_users', initialAdminUsers));
        }

        setVideoViews(getVideoViews());
      } finally {
        setSyncing(false);
      }
    })();
  }, [isAuthorized]);

  const persistVideo = async (video: Video, action: 'upsert' | 'delete'): Promise<void> => {
    setSyncing(true);
    try {
      if (action === 'upsert') {
        await upsertVideoToDB(video);
        const fresh = await fetchVideosFromDB();
        setAdminVideos(fresh);
      } else {
        await deleteVideoFromDB(video.id);
        const fresh = await fetchVideosFromDB();
        setAdminVideos(fresh);
      }
    } finally {
      setSyncing(false);
    }
  };

  const persistPopup = async (popup: PopupAd, action: 'upsert' | 'delete'): Promise<void> => {
    setSyncing(true);
    try {
      if (action === 'upsert') {
        await upsertPopupToDB(popup);
      } else {
        await deletePopupFromDB(popup.id);
      }
      const fresh = await fetchPopupsFromDB();
      setPopups(fresh);
    } finally {
      setSyncing(false);
    }
  };

  const persistSetting = async (key: string, value: unknown): Promise<void> => {
    setSyncing(true);
    try { await upsertSettingToDB(key, value); }
    finally { setSyncing(false); }
  };

  const openAddModal = (): void => {
    setFormData({ title: '', description: '', category: 'Horror', duration: '4:30', isPremium: true, thumbnail: '/images/horror1.jpg', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' });
    setEditingVideo(null);
    setShowAddModal(true);
  };

  const openEditModal = (video: Video): void => {
    setFormData({ title: video.title, description: video.description, category: video.category, duration: video.duration, isPremium: video.isPremium, thumbnail: video.thumbnail, videoUrl: video.videoUrl });
    setEditingVideo(video);
    setShowAddModal(true);
  };

  const saveVideo = async (): Promise<void> => {
    if (!formData.title.trim()) return;
    const id = editingVideo ? editingVideo.id : Math.max(0, ...adminVideos.map(v => v.id)) + 1;
    const video: Video = { ...formData, id } as Video;
    await persistVideo(video, 'upsert');
    setShowAddModal(false);
    showToast(editingVideo ? "✅ Short updated — live for all users!" : "✅ Short published — live for all users!");
  };

  const deleteVideo = async (id: number): Promise<void> => {
    const video = adminVideos.find(v => v.id === id);
    if (!video) return;
    await persistVideo(video, 'delete');
    showToast("Short deleted.");
  };

  const toggleUserSub = (userId: number): void => {
    const updated = adminUsers.map(u => u.id === userId ? { ...u, subscribed: !u.subscribed } : u);
    setAdminUsers(updated);
    ls.set('reelramp_admin_users', updated);
  };

  const togglePopupActive = async (id: number): Promise<void> => {
    for (const p of popups) {
      const updated = { ...p, isActive: p.id === id ? !p.isActive : false };
      await upsertPopupToDB(updated);
    }
    const fresh = await fetchPopupsFromDB();
    setPopups(fresh);
  };

  const premiumUsers = adminUsers.filter(u => u.subscribed).length;
  const totalPlays = adminUsers.reduce((s, u) => s + u.totalWatched, 0);
  const premiumShorts = adminVideos.filter(v => v.isPremium).length;
  const estimatedRevenue = premiumUsers * 199 + 12400;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5">
        <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-3xl p-9 text-center">
          <div className="mx-auto w-16 h-16 bg-[#c5a26f] text-black rounded-2xl flex items-center justify-center mb-6"><Settings size={32} /></div>
          <h1 className="text-4xl font-semibold tracking-[-1.5px]">Admin Portal</h1>
          <p className="text-[#a1a1aa] mt-2 mb-8">ReelRamp Shorts • Production Dashboard</p>
          <div className="space-y-3 text-left">
            <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Admin Email" className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none" />
            <input
              type="password"
              value={adminPass}
              onChange={e => setAdminPass(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdminLogin(); }}
              placeholder="Password"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none"
            />
            {loginError && <p className="text-[#e11d48] text-sm">{loginError}</p>}
          </div>
          <button onClick={handleAdminLogin} className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold tracking-wider">ACCESS ADMIN DASHBOARD</button>
          <button onClick={() => navigate('/')} className="mt-4 text-sm text-[#666]">Back to App</button>
        </div>
      </div>
    );
  }

  const TAB_ITEMS: Array<{ key: AdminTab; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'content', label: 'Content', icon: Play },
    { key: 'popups', label: 'Popup Ads', icon: Star },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
    { key: 'settings', label: 'Platform', icon: Settings },
    { key: 'plans', label: 'Plans', icon: CreditCard },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'categories', label: 'Categories', icon: Play },
    { key: 'promo', label: 'Promo Video', icon: Play },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[200] bg-[#111] border border-[#c5a26f]/40 text-white px-6 py-3 rounded-2xl text-sm shadow-xl">
          {toast}
        </div>
      )}

      {/* Sync indicator */}
      {syncing && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] bg-[#c5a26f] text-black px-5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          Syncing to Supabase…
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size={28} />
            <div>
              <div className="font-semibold text-xl tracking-tighter text-white">Admin</div>
              <div className="text-xs text-[#666] -mt-1">PRODUCTION CONTROL</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#c5a26f] hidden md:block">{loggedInAdmin}</span>
            <button onClick={() => navigate('/')} className="px-4 py-2 rounded-2xl border border-[#333] text-sm">View App</button>
            <button onClick={() => { setIsAuthorized(false); setLoggedInAdmin(''); }} className="px-4 py-2 rounded-2xl bg-[#e11d48] text-white text-sm">Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-[#222] overflow-x-auto no-scrollbar">
          {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap text-sm ${activeTab === key ? 'border-[#c5a26f] text-white' : 'border-transparent text-[#666]'}`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="flex justify-between mb-8">
              <div>
                <h2 className="text-5xl font-semibold tracking-[-2.5px]">Control Center</h2>
                <p className="text-[#a1a1aa]">Live platform metrics — synced with Supabase</p>
              </div>
              <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium text-sm">
                <Plus size={18} /> New Short
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Total Shorts", value: adminVideos.length, sub: `${premiumShorts} Premium` },
                { label: "Active Users", value: adminUsers.length, sub: `${premiumUsers} Premium` },
                { label: "Total Plays", value: totalPlays, sub: "This month" },
                { label: "Est. Revenue", value: `₹${estimatedRevenue.toLocaleString()}`, sub: "Monthly recurring" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-3xl p-7">
                  <div className="text-[#a1a1aa] text-xs tracking-widest">{stat.label}</div>
                  <div className="text-4xl font-semibold tracking-[-1.5px] mt-1">{stat.value}</div>
                  <div className="text-xs text-[#c5a26f] mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {(['content', 'users', 'analytics'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className="p-5 text-left border border-[#222] hover:border-[#c5a26f] rounded-2xl flex justify-between items-center capitalize">
                  {tab} <Play size={18} className="text-[#666]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CONTENT */}
        {activeTab === 'content' && (
          <div>
            <div className="flex justify-between mb-6">
              <h3 className="text-3xl font-semibold tracking-tight">All Shorts ({adminVideos.length})</h3>
              <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c5a26f] text-black font-medium text-sm">
                <Plus size={17} /> Add New
              </button>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-[#222] text-sm text-[#a1a1aa]">
                  <tr>
                    <th className="text-left py-4 px-6">Short</th>
                    <th className="text-left py-4">Category</th>
                    <th className="text-left py-4">Duration</th>
                    <th className="text-left py-4">Views</th>
                    <th className="text-left py-4">Access</th>
                    <th className="text-right py-4 px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {adminVideos.map(video => (
                    <tr key={video.id} className="hover:bg-[#1a1a1a]">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <img src={video.thumbnail} className="w-12 h-12 object-cover rounded-xl" alt="" />
                          <div>
                            <div className="font-medium text-sm">{video.title}</div>
                            <div className="text-xs text-[#666] line-clamp-1">{video.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-[#a1a1aa]">{video.category}</td>
                      <td className="font-mono text-sm text-[#a1a1aa]">{video.duration}</td>
                      <td className="font-mono text-sm text-[#c5a26f]">{videoViews[video.id] ?? 0}</td>
                      <td>
                        {video.isPremium
                          ? <span className="text-xs px-2 py-px bg-[#e11d48] rounded">PREMIUM</span>
                          : <span className="text-xs px-2 py-px bg-[#22c55e] text-black rounded">FREE</span>}
                      </td>
                      <td className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEditModal(video)} className="p-2 hover:bg-[#222] rounded-xl"><Edit2 size={16} /></button>
                          <button onClick={() => void deleteVideo(video.id)} className="p-2 hover:bg-[#e11d48]/10 text-[#e11d48] rounded-xl"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* POPUP ADS */}
        {activeTab === 'popups' && (
          <div>
            <div className="flex justify-between items-center mb-7">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight">Popup Ad Controller</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">Marketing popups shown on app launch (hidden for premium users).</p>
              </div>
              <button onClick={async () => {
                const np: PopupAd = { id: Date.now(), title: "New Campaign", imageUrl: "/images/popup-ad.jpg", redirectUrl: "/subscription", isActive: false };
                await upsertPopupToDB(np);
                const fresh = await fetchPopupsFromDB();
                setPopups(fresh);
                setEditingPopup(np);
              }} className="px-5 py-2.5 bg-[#c5a26f] text-black rounded-2xl flex items-center gap-2 font-medium text-sm">
                <Plus size={16} /> New Popup
              </button>
            </div>
            <div className="space-y-4">
              {popups.map(popup => (
                <div key={popup.id} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start">
                  <img src={popup.imageUrl} className="w-full md:w-64 h-36 object-cover rounded-2xl" alt="" />
                  <div className="flex-1">
                    <div className="font-semibold text-xl mb-2">{popup.title}</div>
                    <div className="text-xs text-[#666] font-mono mb-4">{popup.redirectUrl}</div>
                    <div className="flex gap-3">
                      <button onClick={() => void togglePopupActive(popup.id)} className={`px-5 py-2 rounded-2xl text-sm ${popup.isActive ? 'bg-[#22c55e] text-black' : 'bg-[#333]'}`}>
                        {popup.isActive ? "LIVE" : "HIDDEN"}
                      </button>
                      <button onClick={() => setEditingPopup({ ...popup })} className="px-5 py-2 bg-[#222] rounded-2xl text-sm">Edit</button>
                      <button onClick={() => void persistPopup(popup, 'delete')} className="px-5 py-2 bg-[#e11d48]/10 text-[#e11d48] rounded-2xl text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {editingPopup && (
              <div className="fixed inset-0 bg-black/90 z-[95] flex items-center justify-center p-6">
                <div className="bg-[#111] p-8 rounded-3xl w-full max-w-md">
                  <div className="text-xl font-medium mb-6">Edit Popup</div>
                  {([
                    { label: "Title", key: 'title' as const },
                    { label: "Image URL", key: 'imageUrl' as const },
                    { label: "Redirect URL", key: 'redirectUrl' as const },
                  ]).map(f => (
                    <div key={f.key} className="mb-4">
                      <label className="text-xs text-[#666] mb-1 block">{f.label}</label>
                      <input
                        value={editingPopup[f.key] as string}
                        onChange={e => setEditingPopup({ ...editingPopup, [f.key]: e.target.value })}
                        className="w-full bg-[#1a1a1a] px-5 py-3 rounded-2xl border border-[#333] text-sm"
                      />
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button onClick={() => setEditingPopup(null)} className="flex-1 py-3 border border-[#333] rounded-2xl">Cancel</button>
                    <button onClick={async () => {
                      await persistPopup(editingPopup, 'upsert');
                      setEditingPopup(null);
                      showToast("✅ Popup saved — live instantly!");
                    }} className="flex-1 py-3 bg-[#c5a26f] text-black rounded-2xl">Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div>
            <h3 className="text-3xl font-semibold tracking-tight mb-6">User Management • {premiumUsers} Premium</h3>
            <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="border-b border-[#222] text-[#a1a1aa]">
                  <tr>
                    <th className="py-4 px-6 text-left">User</th>
                    <th className="py-4 text-left">Joined</th>
                    <th className="py-4 text-left">Watched</th>
                    <th className="py-4 px-6 text-left">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {adminUsers.map(u => (
                    <tr key={u.id}>
                      <td className="py-5 px-6">
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-[#666]">{u.email}</div>
                      </td>
                      <td className="text-[#a1a1aa]">{u.joinDate}</td>
                      <td className="font-mono">{u.totalWatched}</td>
                      <td className="px-6">
                        <span className={`px-3 py-px rounded text-xs ${u.subscribed ? 'bg-[#c5a26f] text-black' : 'bg-[#333]'}`}>
                          {u.subscribed ? "PREMIUM" : "FREE"}
                        </span>
                      </td>
                      <td className="px-6 text-right">
                        <button onClick={() => toggleUserSub(u.id)} className="px-4 py-2 border border-[#333] rounded-xl text-xs hover:bg-[#222]">
                          {u.subscribed ? "Revoke" : "Upgrade"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ANALYTICS */}
        {activeTab === 'analytics' && (
          <div>
            <h3 className="text-3xl font-semibold tracking-tight mb-6">Revenue Dashboard</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Revenue", value: `₹${getRevenueData().reduce((s, r) => s + r.amount, 0).toLocaleString()}` },
                { label: "Monthly Recurring", value: "₹7,298" },
                { label: "Active Subscribers", value: premiumUsers },
                { label: "Trial Conversions", value: "64%" },
              ].map((m, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-3xl p-6">
                  <div className="text-xs text-[#666] tracking-wider">{m.label}</div>
                  <div className="text-4xl font-semibold tracking-tighter mt-1">{m.value}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#111] border border-[#222] rounded-3xl p-8">
              <div className="font-medium mb-6">Recent Transactions</div>
              <div className="space-y-4">
                {getRevenueData().slice().reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#222] last:border-0">
                    <div>
                      <div className="font-medium">{entry.plan}</div>
                      <div className="text-xs text-[#666]">{entry.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#c5a26f]">+₹{entry.amount}</div>
                      <div className="text-xs text-[#666]">{entry.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PLATFORM SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">Platform Settings</h3>
            <div className="space-y-4">
              {([
                { label: "App Name", key: 'appName' as const },
                { label: "Tagline", key: 'tagline' as const },
                { label: "Support Email", key: 'supportEmail' as const },
                { label: "Support Phone", key: 'supportPhone' as const },
              ]).map(f => (
                <div key={f.key}>
                  <label className="text-xs text-[#666] mb-1 block">{f.label}</label>
                  <input
                    value={platformSettings[f.key] as string}
                    onChange={e => setPlatformSettings({ ...platformSettings, [f.key]: e.target.value })}
                    className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm focus:border-[#c5a26f] outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-[#666] mb-2 block">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={platformSettings.accentColor}
                    onChange={e => setPlatformSettings({ ...platformSettings, accentColor: e.target.value })}
                    className="w-12 h-10 rounded-xl cursor-pointer"
                  />
                  <span className="font-mono text-sm text-[#a1a1aa]">{platformSettings.accentColor}</span>
                </div>
              </div>
              <button onClick={async () => {
                await persistSetting('settings', platformSettings);
                showToast("✅ Platform settings saved — live for all users!");
              }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider">
                SAVE PLATFORM SETTINGS
              </button>
            </div>
          </div>
        )}

        {/* PLAN SETTINGS */}
        {activeTab === 'plans' && (
          <div className="max-w-2xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">Plan Settings</h3>
            <div className="space-y-4">
              {([
                { label: "Trial Price", key: 'trialOfferPrice' as const },
                { label: "Trial Duration", key: 'trialOfferDuration' as const },
                { label: "Full Price", key: 'fullPrice' as const },
                { label: "Full Plan Validity", key: 'fullValidity' as const },
              ]).map(f => (
                <div key={f.key}>
                  <label className="text-xs text-[#666] mb-1 block">{f.label}</label>
                  <input
                    value={subSettings[f.key] as string}
                    onChange={e => setSubSettings({ ...subSettings, [f.key]: e.target.value })}
                    className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm focus:border-[#c5a26f] outline-none"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]">
                <div>
                  <div className="font-medium text-sm">Show Trial Popup</div>
                  <div className="text-xs text-[#666]">Display trial offer popup on launch</div>
                </div>
                <button
                  onClick={() => setSubSettings({ ...subSettings, showTrialPopup: !subSettings.showTrialPopup })}
                  className={`w-12 h-6 rounded-full transition-colors ${subSettings.showTrialPopup ? 'bg-[#c5a26f]' : 'bg-[#333]'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${subSettings.showTrialPopup ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <button onClick={async () => {
                await persistSetting('sub_settings', subSettings);
                showToast("✅ Plan settings saved — live for all users!");
              }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider">
                SAVE PLAN SETTINGS
              </button>
            </div>
          </div>
        )}

        {/* PAYMENT SETTINGS */}
        {activeTab === 'payment' && (
          <div className="max-w-2xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">Payment Settings</h3>
            <div className="space-y-4">
              <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-4">
                <div className="text-xs text-[#c5a26f] tracking-widest font-medium">ACTIVE GATEWAY</div>
                <div className="grid grid-cols-2 gap-3">
                  {(['razorpay', 'stripe', 'upi', 'none'] as const).map(gw => (
                    <button
                      key={gw}
                      onClick={() => setPaymentConfig({ ...paymentConfig, activeGateway: gw })}
                      className={`py-3 rounded-2xl text-sm font-medium border transition ${paymentConfig.activeGateway === gw ? 'border-[#c5a26f] bg-[#c5a26f]/10 text-[#c5a26f]' : 'border-[#333] text-[#666]'}`}
                    >
                      {gw === 'none' ? 'None / Manual' : gw.charAt(0).toUpperCase() + gw.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]">
                  <div>
                    <div className="font-medium text-sm">Live Mode</div>
                    <div className="text-xs text-[#e11d48]">⚠️ Only enable for real payments</div>
                  </div>
                  <button
                    onClick={() => setPaymentConfig({ ...paymentConfig, isLiveMode: !paymentConfig.isLiveMode })}
                    className={`w-12 h-6 rounded-full transition-colors ${paymentConfig.isLiveMode ? 'bg-[#22c55e]' : 'bg-[#333]'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${paymentConfig.isLiveMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1 block">Razorpay Key ID</label>
                <input
                  value={paymentConfig.razorpayKeyId}
                  onChange={e => setPaymentConfig({ ...paymentConfig, razorpayKeyId: e.target.value })}
                  className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none"
                  placeholder="rzp_test_..."
                />
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1 block">UPI ID</label>
                <input
                  value={paymentConfig.upiId}
                  onChange={e => setPaymentConfig({ ...paymentConfig, upiId: e.target.value })}
                  className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none"
                  placeholder="yourname@upi"
                />
              </div>
              <button onClick={async () => {
                await persistSetting('payment', paymentConfig);
                showToast("✅ Payment settings saved!");
              }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider">
                SAVE PAYMENT SETTINGS
              </button>
            </div>
          </div>
        )}

        {/* CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">Categories</h3>
            <div className="flex gap-3 mb-6">
              <input
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={async e => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    const updated = [...categories, newCategoryName.trim()];
                    setCategoriesState(updated);
                    ls.set('reelramp_categories', updated);
                    try { await supabase.from('categories').insert({ name: newCategoryName.trim() }); } catch { /* noop */ }
                    setNewCategoryName('');
                    showToast("✅ Category added!");
                  }
                }}
                placeholder="New category name"
                className="flex-1 bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm focus:border-[#c5a26f] outline-none"
              />
              <button onClick={async () => {
                if (newCategoryName.trim()) {
                  const updated = [...categories, newCategoryName.trim()];
                  setCategoriesState(updated);
                  ls.set('reelramp_categories', updated);
                  try { await supabase.from('categories').insert({ name: newCategoryName.trim() }); } catch { /* noop */ }
                  setNewCategoryName('');
                  showToast("✅ Category added!");
                }
              }} className="px-5 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium flex items-center gap-2 text-sm">
                <Plus size={16} /> Add
              </button>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden">
              <div className="divide-y divide-[#222]">
                {categories.map(cat => (
                  <div key={cat} className="flex items-center gap-4 px-6 py-4">
                    {editingCatName === cat ? (
                      <>
                        <input
                          value={editingCatValue}
                          onChange={e => setEditingCatValue(e.target.value)}
                          className="flex-1 bg-[#1a1a1a] px-4 py-2 rounded-xl border border-[#c5a26f] text-sm"
                          autoFocus
                        />
                        <button onClick={async () => {
                          const updated = categories.map(c => c === cat ? editingCatValue : c);
                          setCategoriesState(updated);
                          ls.set('reelramp_categories', updated);
                          try {
                            await supabase.from('categories').update({ name: editingCatValue }).eq('name', cat);
                          } catch { /* noop */ }
                          setEditingCatName(null);
                        }} className="px-4 py-2 bg-[#c5a26f] text-black rounded-xl text-xs">Save</button>
                        <button onClick={() => setEditingCatName(null)} className="px-4 py-2 border border-[#333] rounded-xl text-xs">Cancel</button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 font-medium">{cat}</div>
                        <button onClick={() => { setEditingCatName(cat); setEditingCatValue(cat); }} className="p-2 hover:bg-[#222] rounded-xl text-[#a1a1aa]"><Edit2 size={15} /></button>
                        <button onClick={async () => {
                          const updated = categories.filter(c => c !== cat);
                          setCategoriesState(updated);
                          ls.set('reelramp_categories', updated);
                          try { await supabase.from('categories').delete().eq('name', cat); } catch { /* noop */ }
                        }} className="p-2 hover:bg-[#e11d48]/10 text-[#e11d48] rounded-xl"><Trash2 size={15} /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROMO VIDEO */}
        {activeTab === 'promo' && (
          <div className="max-w-2xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">Promo Video</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]">
                <div>
                  <div className="font-medium text-sm">Show Promo Video</div>
                  <div className="text-xs text-[#666]">Display in trial popup</div>
                </div>
                <button
                  onClick={() => setPromoSettings({ ...promoSettings, isEnabled: !promoSettings.isEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${promoSettings.isEnabled ? 'bg-[#c5a26f]' : 'bg-[#333]'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${promoSettings.isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex gap-3">
                {(['youtube', 'direct'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setPromoSettings({ ...promoSettings, videoType: t })}
                    className={`flex-1 py-2.5 rounded-2xl text-sm font-medium border transition ${promoSettings.videoType === t ? 'border-[#c5a26f] bg-[#c5a26f]/10 text-[#c5a26f]' : 'border-[#333] text-[#666]'}`}
                  >
                    {t === 'youtube' ? 'YouTube' : 'Direct URL'}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1 block">Video URL</label>
                <input
                  value={promoSettings.videoUrl}
                  onChange={e => setPromoSettings({ ...promoSettings, videoUrl: e.target.value })}
                  className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none"
                />
              </div>
              <button onClick={async () => {
                await persistSetting('promo', promoSettings);
                showToast("✅ Promo video saved — live instantly!");
              }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider">
                SAVE PROMO VIDEO SETTINGS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Video Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
            <motion.div
              initial={{ scale: 0.96, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.96, y: 20, opacity: 0 }}
              className="bg-[#111] border border-[#333] w-full max-w-lg rounded-3xl p-9"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-7">
                <div className="text-2xl font-semibold">{editingVideo ? "Edit Short" : "Publish New Short"}</div>
                <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <input
                  placeholder="Short Title"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none"
                />
                <textarea
                  placeholder="Compelling description..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] resize-y text-sm focus:border-[#c5a26f] outline-none"
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    placeholder="Duration e.g. 4:45"
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className="bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none"
                  />
                </div>
                <div className="flex items-center gap-4 bg-[#1a1a1a] rounded-2xl p-5 border border-[#222]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPremium}
                      onChange={e => setFormData({ ...formData, isPremium: e.target.checked })}
                      className="accent-[#c5a26f] scale-125"
                    />
                    <div>
                      <div className="font-medium text-sm">Premium Only</div>
                      <div className="text-xs text-[#a1a1aa]">Requires active subscription</div>
                    </div>
                  </label>
                </div>
                <input
                  placeholder="Thumbnail URL"
                  value={formData.thumbnail}
                  onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm font-mono focus:border-[#c5a26f] outline-none"
                />
                <input
                  placeholder="Video URL (mp4 or Bunny.net path)"
                  value={formData.videoUrl}
                  onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm font-mono focus:border-[#c5a26f] outline-none"
                />
                {formData.videoUrl && (
                  <div className="text-xs text-[#666] px-1">
                    {formData.videoUrl.startsWith('http') ? `Direct URL` : `Bunny CDN: ${BUNNY.cdnBase}/${formData.videoUrl}`}
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 border border-[#333] rounded-2xl text-sm">Cancel</button>
                <button onClick={() => void saveVideo()} className="flex-1 py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm">
                  {editingVideo ? "Save Changes" : "Publish Short"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
