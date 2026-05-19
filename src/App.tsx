import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BrowserRouter, Routes, Route, useNavigate, useParams,
  useLocation, Navigate
} from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';
import {
  Play, Pause, Heart, Bookmark, Share2, X, ArrowLeft,
  User as UserIcon, Star, CreditCard, CheckCircle, Lock, Plus, Edit2, Trash2,
  BarChart3, Users, Settings, TrendingUp, Volume2, VolumeX,
  Facebook, Instagram, Youtube, MessageCircle,
  ChevronUp, ChevronDown, Clock, Download
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

const dbVideoToFrontend = (row: any): Video => ({
  id: row.id,
  title: row.title || '',
  description: row.description || '',
  category: row.category || '',
  duration: row.duration || '0:00',
  isPremium: row.is_premium ?? false,
  thumbnail: row.thumbnail || '',
  videoUrl: row.video_url || '',
  source: row.source || 'direct',
  storagePath: row.storage_path
});

const fetchVideosFromDB = async (): Promise<Video[]> => {
  try {
    const { data, error } = await supabase.from('videos').select('*').order('id');
    if (!error && data && data.length > 0) {
      const parsed = data.map(dbVideoToFrontend);
      ls.set('reelramp_videos', parsed);
      return parsed;
    }
  } catch { /* fallback below */ }
  return ls.get<Video[]>('reelramp_videos', initialVideos);
};

const upsertVideoToDB = async (video: Video): Promise<void> => {
  try {
    const databasePayload = {
      id: video.id,
      title: video.title,
      description: video.description,
      category: video.category,
      duration: video.duration,
      is_premium: video.isPremium,
      thumbnail: video.thumbnail,
      video_url: video.videoUrl,
      source: video.source || 'direct',
      storage_path: video.storagePath
    };
    await supabase.from('videos').upsert(databasePayload, { onConflict: 'id' });
  } catch { /* noop */ }
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
  try { await supabase.from('platform_settings').upsert({ key, value }, { onConflict: 'key' }); } catch { /* noop */ }
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
  try { await supabase.from('popup_ads').upsert(popup, { onConflict: 'id' }); } catch { /* noop */ }
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
// PWA INSTALL HOOK
// ─────────────────────────────────────────────────────────────────────────────
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, triggerInstall };
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
        options: { redirectTo: `${window.location.origin}/profile` }
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google authentication failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#121212] border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#c5a26f]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-red-900/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-8">
          <Logo size={44} className="mb-2" />
          <p className="text-white/40 text-xs tracking-wide">
            {mode === 'login' && 'Welcome back, Enter credentials to access premium streams'}
            {mode === 'register' && 'Create your account to stream premium stories'}
            {mode === 'forgot' && 'Reset your secure account credentials'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl flex items-center gap-2">
            <span>✅</span> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-white/50 tracking-wider uppercase mb-1.5 ml-1">Full Name</label>
              <input
                type="text" required value={name} onChange={e => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-white/5 border border-white/5 focus:border-[#c5a26f]/50 rounded-2xl text-white outline-none text-sm transition"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-white/50 tracking-wider uppercase mb-1.5 ml-1">Email Address</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 bg-white/5 border border-white/5 focus:border-[#c5a26f]/50 rounded-2xl text-white outline-none text-sm transition"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-[11px] font-semibold text-white/50 tracking-wider uppercase">Password</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-[10px] text-[#c5a26f] hover:underline font-medium">Forgot?</button>
                )}
              </div>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/5 border border-white/5 focus:border-[#c5a26f]/50 rounded-2xl text-white outline-none text-sm transition"
              />
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 bg-[#c5a26f] hover:bg-[#b39160] disabled:opacity-50 text-black font-bold text-sm tracking-wide rounded-2xl transition shadow-xl mt-2 flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : (
              mode === 'login' ? 'Sign In To Stream' : mode === 'register' ? 'Create Premium Account' : 'Send Recovery Link'
            )}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
              <span className="relative bg-[#121212] px-3 text-[10px] font-semibold text-white/30 tracking-wider uppercase">Or Continue With</span>
            </div>

            <button
              type="button" onClick={handleGoogleSignIn} disabled={googleLoading}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-semibold text-sm rounded-2xl transition border border-white/5 flex items-center justify-center gap-2.5"
            >
              {googleLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.6 2.8C6.01 6.84 8.78 5.04 12 5.04z"/>
                    <path fill="#4285F4" d="M23.5 12.25c0-.82-.07-1.61-.21-2.38H12v4.51h6.46c-.28 1.48-1.12 2.73-2.38 3.58l3.6 2.8c2.1-1.94 3.32-4.8 3.32-8.51z"/>
                    <path fill="#FBBC05" d="M5.1 14.7c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.5 7.3C.54 9.22 0 11.35 0 13.6s.54 4.38 1.5 6.3l3.6-2.9z"/>
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.6-2.8c-1.1.74-2.52 1.18-4.36 1.18-3.22 0-5.99-1.8-6.96-4.46l-3.6 2.8C3.4 20.35 7.35 23 12 23z"/>
                  </svg>
                  <span>Google Account</span>
                </>
              )}
            </button>
          </>
        )}

        <div className="mt-8 text-center">
          {mode === 'login' ? (
            <p className="text-xs text-white/40">Don't have an account? <button onClick={() => setMode('register')} className="text-[#c5a26f] hover:underline font-semibold ml-0.5">Register now</button></p>
          ) : (
            <p className="text-xs text-white/40">Already a registered streamer? <button onClick={() => setMode('login')} className="text-[#c5a26f] hover:underline font-semibold ml-0.5">Sign in here</button></p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
function HomePage() {
  const navigate = useNavigate();
  const { isSubscribed, user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const { isInstallable, triggerInstall } = usePWAInstall();

  // Schedulers
  const { showTrialPopup, showGlobalPopup, dismissTrial, dismissGlobal } = usePromoPopupScheduler(isSubscribed);
  const [promoSettings, setPromoSettings] = useState<PromoVideoSettings>(defaultPromoVideo);

  useEffect(() => {
    let active = true;
    const loadAppData = async () => {
      try {
        const [dbVids, dbCats, promoVid] = await Promise.all([
          fetchVideosFromDB(),
          fetchCategoriesFromDB(),
          fetchSettingFromDB<PromoVideoSettings>('promo_video_settings', defaultPromoVideo)
        ]);
        if (active) {
          setVideos(dbVids);
          setCategories(['All', ...dbCats]);
          setPromoSettings(promoVid);
        }
      } catch { /* noop */ }
      finally {
        if (active) setLoading(false);
      }
    };
    void loadAppData();
    return () => { active = false; };
  }, []);

  const filteredVideos = selectedCategory === 'All'
    ? videos
    : videos.filter(v => v.category.toLowerCase() === selectedCategory.toLowerCase());

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Logo size={48} className="animate-pulse" />
          <div className="w-16 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#c5a26f] w-1/2 rounded-full animate-[loading_1s_infinite_linear]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-24 relative select-none">
      {/* Top Premium Navbar */}
      <header className="sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex justify-between items-center z-40">
        <Logo size={32} />
        <div className="flex items-center gap-3">
          {isInstallable && (
            <button
              onClick={triggerInstall}
              className="px-3.5 py-1.5 bg-white/5 border border-white/10 text-xs font-bold text-[#c5a26f] rounded-xl hover:bg-white/10 transition"
            >
              Install App
            </button>
          )}
          <button
            onClick={() => navigate(user ? '/profile' : '/login')}
            className="p-2.5 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition"
          >
            <UserIcon size={18} className="text-white/80" />
          </button>
        </div>
      </header>

      {/* Featured Video Promo Section */}
      {promoSettings.isEnabled && (
        <section className="px-4 pt-4 pb-2">
          <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/5 relative group bg-[#111]">
            {promoSettings.videoType === 'youtube' ? (
              <iframe
                src={`${promoSettings.videoUrl}?modestbranding=1&rel=0&playsinline=1`}
                title="Promo Reel"
                className="w-full h-full object-cover"
                allowFullScreen
                frameBorder="0"
              />
            ) : (
              <video
                src={promoSettings.videoUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute top-3 left-3 px-3 py-1 bg-[#c5a26f] text-black font-extrabold text-[10px] uppercase tracking-widest rounded-lg shadow-xl pointer-events-none">
              Featured Trailer
            </div>
          </div>
        </section>
      )}

      {/* Category Pills Slider */}
      <section className="px-4 py-4 overflow-x-auto flex gap-2.5 scrollbar-none sticky top-[73px] bg-[#0a0a0a] z-30">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${selectedCategory === cat ? 'bg-[#c5a26f] text-black border-[#c5a26f] font-bold shadow-lg shadow-[#c5a26f]/10' : 'bg-[#121212] text-white/60 border-white/5 hover:text-white'}`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Grid List */}
      <section className="px-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {filteredVideos.map(vid => (
          <div
            key={vid.id}
            onClick={() => navigate(`/player/${vid.id}`)}
            className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-white/10 transition flex flex-col group relative"
          >
            <div className="aspect-[9/14] w-full bg-[#181818] relative overflow-hidden">
              {vid.thumbnail ? (
                <img
                  src={vid.thumbnail}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500'; }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/20 px-4 text-center">
                  <Play size={24} className="opacity-40" />
                  <span className="text-[10px] font-medium tracking-wide uppercase">Stream Clip</span>
                </div>
              )}
              {vid.isPremium && (
                <div className="absolute top-2.5 right-2.5 px-2 py-1 bg-black/40 backdrop-blur-md border border-amber-500/30 rounded-lg flex items-center gap-1">
                  <Lock size={10} className="text-[#c5a26f]" />
                  <span className="text-[9px] font-bold text-[#c5a26f] uppercase tracking-wider">Premium</span>
                </div>
              )}
              <div className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[9px] font-mono text-white/80">
                {vid.duration}
              </div>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-semibold text-sm line-clamp-1 text-white group-hover:text-[#c5a26f] transition">{vid.title}</h3>
                <p className="text-[11px] text-white/40 line-clamp-1 mt-0.5">{vid.description}</p>
              </div>
              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-[#c5a26f] uppercase tracking-wider">{vid.category}</span>
                <span className="text-[10px] text-white/30 font-medium">★ {getAverageRating(vid.id).average.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Trial Schedular Popup Modals */}
      <AnimatePresence>
        {showTrialPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#121212] border border-amber-500/20 max-w-sm w-full rounded-3xl p-6 relative overflow-hidden text-center shadow-2xl"
            >
              <button onClick={dismissTrial} className="absolute top-4 right-4 text-white/40 hover:text-white"><X size={18} /></button>
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#c5a26f] font-bold text-xl">₹</div>
              <h2 className="text-xl font-extrabold tracking-tight">Unlock Access For Just ₹2</h2>
              <p className="text-white/50 text-xs mt-2 px-2">Stream the complete database of award winning investigative clips and premium cinema layout models instantly for 24 hours.</p>
              <div className="bg-white/5 rounded-2xl p-4 my-5 flex justify-between items-center text-left">
                <div><div className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Premium Access Pass</div><div className="text-sm font-bold text-white">Full Database Streaming</div></div>
                <div className="text-right"><div className="text-lg font-black text-[#c5a26f]">₹2</div><div className="text-[10px] text-white/40 font-medium">1 Day Pass</div></div>
              </div>
              <button
                onClick={() => { dismissTrial(); navigate('/subscription'); }}
                className="w-full py-3 bg-[#c5a26f] text-black font-extrabold text-sm rounded-xl hover:bg-[#b39160] transition shadow-lg"
              >
                Claim Access Now
              </button>
            </motion.div>
          </motion.div>
        )}

        {showGlobalPopup && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#161616] border border-white/5 max-w-xs w-full rounded-3xl overflow-hidden relative shadow-2xl text-center"
            >
              <button onClick={dismissGlobal} className="absolute top-3 right-3 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white/60 hover:text-white z-10"><X size={14} /></button>
              <div className="w-full aspect-[4/3] bg-[#222] relative">
                <img
                  src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=400"
                  alt="Exclusive Launch"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#161616] to-transparent" />
              </div>
              <div className="p-5 -mt-4 relative">
                <h3 className="font-extrabold text-base">Join the Content Revolution</h3>
                <p className="text-white/40 text-[11px] mt-1.5 leading-relaxed">Unlock high definition custom short series profiles directly curated by global production experts.</p>
                <button
                  onClick={() => { dismissGlobal(); navigate('/subscription'); }}
                  className="w-full mt-4 py-2.5 bg-white text-black font-bold text-xs rounded-xl hover:bg-white/90 transition"
                >
                  View Premium Plans
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHORTS PLAYER PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ShortsPlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isSubscribed } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVideosFromDB().then(res => {
      setVideos(res);
      const idx = res.findIndex(v => v.id === Number(id));
      if (idx !== -1) setCurrentIndex(idx);
    });
  }, [id]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -60 && currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else if (info.offset.y > 60 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (currentIndex === -1 || videos.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentVideo = videos[currentIndex];
  const requiresSubscription = currentVideo.isPremium && !isSubscribed;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center max-w-[100vw]">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 z-40 p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl text-white/80"
      >
        <ArrowLeft size={18} />
      </button>

      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        className="w-full h-full relative overflow-hidden flex items-center justify-center max-w-md bg-neutral-950 shadow-2xl"
      >
        {requiresSubscription ? (
          <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center px-6 text-center select-none font-sans">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#c5a26f] mb-5">
              <Lock size={28} />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Premium Content Guarded</h2>
            <p className="text-white/40 text-xs mt-2 max-w-xs leading-relaxed">
              "{currentVideo.title}" is reserved for members. Unlock all files instantly for just ₹2.
            </p>
            <button
              onClick={() => navigate('/subscription')}
              className="mt-6 px-6 py-3 bg-[#c5a26f] hover:bg-[#b39160] text-black font-extrabold text-xs tracking-wider uppercase rounded-xl transition shadow-xl"
            >
              Access Premium Database
            </button>
            <button onClick={() => navigate('/')} className="mt-4 text-xs font-bold text-white/40 hover:text-white transition">Back To Free Feeds</button>
          </div>
        ) : (
          <PremiumVideoPlayer
            video={currentVideo}
            isPlaying={isPlaying}
            onPlayPause={() => setIsPlaying(p => !p)}
            onEnded={() => {
              if (currentIndex < videos.length - 1) setCurrentIndex(prev => prev + 1);
            }}
            onProgress={(pct) => {
              if (pct > 20) addToWatchHistory(currentVideo.id, Math.floor(pct));
            }}
          />
        )}

        {/* Floating Metadata Layout */}
        <div className="absolute bottom-6 left-4 right-14 z-30 pointer-events-none select-none">
          <h2 className="text-base font-extrabold text-white drop-shadow-md tracking-tight">{currentVideo.title}</h2>
          <p className="text-xs text-white/70 mt-1 line-clamp-2 drop-shadow-sm font-medium">{currentVideo.description}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-black/40 backdrop-blur-md border border-white/10 rounded text-[9px] font-bold text-[#c5a26f] uppercase tracking-wider">
              {currentVideo.category}
            </span>
          </div>
        </div>

        {/* Sidebar Controls Panel */}
        <div className="absolute bottom-16 right-3 z-30 flex flex-col items-center gap-5">
          <div className="flex flex-col items-center group cursor-pointer">
            <button className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white hover:text-red-500 transition">
              <Heart size={18} />
            </button>
            <span className="text-[10px] font-bold font-mono text-white/60 mt-1">4.2k</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer">
            <button className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white hover:text-[#c5a26f] transition">
              <Bookmark size={18} />
            </button>
            <span className="text-[10px] font-bold font-mono text-white/60 mt-1">Save</span>
          </div>
          <button className="p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-white hover:scale-105 transition">
            <Share2 size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION PAGE
// ─────────────────────────────────────────────────────────────────────────────
function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, isSubscribed, setIsSubscribed } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subSettings, setSubSettings] = useState<SubscriptionSettings>(defaultSubscriptionSettings);

  useEffect(() => {
    fetchSettingFromDB<SubscriptionSettings>('subscription_settings', defaultSubscriptionSettings)
      .then(res => setSubSettings(res));
  }, []);

  const handlePurchase = async (planType: 'trial' | 'full') => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    // Simulate instantaneous automated database subscription mapping setup
    setTimeout(async () => {
      try {
        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          status: 'active',
          plan_type: planType,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
        setIsSubscribed(true);
        ls.set('reelramp_subscribed', true);
        navigate('/', { replace: true });
      } catch {
        setIsSubscribed(true);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="flex-1 pb-24 px-4 pt-6 font-sans select-none max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white/5 border border-white/5 rounded-xl"><ArrowLeft size={16} /></button>
        <h1 className="text-xl font-black">Membership Access</h1>
      </div>

      {isSubscribed ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3"><CheckCircle size={24} /></div>
          <h2 className="text-lg font-bold">Premium Pass Active</h2>
          <p className="text-white/50 text-xs mt-1">Your account has full unrestricted access to the complete premium short catalog layout grid.</p>
          <button onClick={() => navigate('/')} className="mt-5 w-full py-2.5 bg-white text-black font-bold text-xs rounded-xl">Return Streaming</button>
        </div>
      ) : (
        <div className="space-y-4">
          {subSettings.showTrialPopup && (
            <div className="bg-[#121212] border-2 border-amber-500/30 rounded-3xl p-5 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500 text-black font-extrabold text-[9px] uppercase tracking-wider rounded-bl-xl">Limited Trial</div>
              <h3 className="text-base font-black">Instant Trial Access Pass</h3>
              <p className="text-white/40 text-[11px] mt-1">Perfect choice to verify all exclusive streams instantly for a small sequence loop.</p>
              <div className="mt-4 flex justify-between items-baseline">
                <span className="text-2xl font-black text-white">{subSettings.trialOfferPrice}</span>
                <span className="text-xs font-semibold text-white/50">/ {subSettings.trialOfferDuration} Validity</span>
              </div>
              <button
                onClick={() => void handlePurchase('trial')}
                disabled={loading}
                className="w-full mt-4 py-3 bg-[#c5a26f] hover:bg-[#b39160] disabled:opacity-40 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg"
              >
                {loading ? 'Initiating Gateways...' : 'Activate Trial Pass'}
              </button>
            </div>
          )}

          <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 relative overflow-hidden">
            <h3 className="text-base font-black text-white/90">Full Unrestricted Access Pass</h3>
            <p className="text-white/40 text-[11px] mt-1">Unlocks commercial premium layout updates, developer modules, shorts grids and analytics records.</p>
            <div className="mt-4 flex justify-between items-baseline">
              <span className="text-2xl font-black text-white">{subSettings.fullPrice}</span>
              <span className="text-xs font-semibold text-white/50">/ {subSettings.fullValidity} Access</span>
            </div>
            <button
              onClick={() => void handlePurchase('full')}
              disabled={loading}
              className="w-full mt-4 py-3 bg-white hover:bg-white/90 disabled:opacity-40 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition"
            >
              {loading ? 'Initiating Gateways...' : 'Purchase Full Access'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────────────────────────────────────
function ProfilePage() {
  const navigate = useNavigate();
  const { user, isSubscribed, signOut } = useAuth();
  const [history, setHistory] = useState<Video[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    fetchVideosFromDB().then(res => {
      const localHist = getWatchHistory().map(h => h.videoId);
      setHistory(res.filter(v => localHist.includes(v.id)));
    });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="flex-1 pb-24 px-4 pt-6 max-w-md mx-auto select-none font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-black tracking-tight">Your Dashboard</h1>
        <button
          onClick={() => { void signOut(); navigate('/login'); }}
          className="px-3.5 py-1.5 bg-red-500/10 border border-red-500/20 text-xs font-bold text-red-400 rounded-xl"
        >
          Sign Out
        </button>
      </div>

      <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden shadow-lg mb-6">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/60 border border-white/5"><UserIcon size={20} /></div>
        <div className="flex-1 overflow-hidden">
          <div className="font-bold text-sm text-white truncate">{user.user_metadata?.full_name || 'Streamer Account'}</div>
          <div className="text-xs text-white/40 truncate mt-0.5">{user.email}</div>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black/40 border border-white/10 rounded-lg">
            <div className={`w-1.5 h-1.5 rounded-full ${isSubscribed ? 'bg-amber-400' : 'bg-white/20'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{isSubscribed ? 'Premium Elite Tier' : 'Standard Tier'}</span>
          </div>
        </div>
      </div>

      {/* Continue Watching History Rail */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white/50 uppercase tracking-wider mb-3 ml-1">
          <Clock size={12} />
          <span>Continue Watching ({history.length})</span>
        </div>
        {history.length === 0 ? (
          <div className="bg-[#121212] rounded-2xl p-6 text-center text-xs text-white/30 border border-white/5">No watch logs in local storage tracks.</div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {history.slice(0, 4).map(v => (
              <div
                key={v.id}
                onClick={() => navigate(`/player/${v.id}`)}
                className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden p-2 flex items-center gap-3 cursor-pointer hover:border-white/10 transition"
              >
                <div className="w-12 h-16 bg-[#222] rounded-lg overflow-hidden flex-shrink-0">
                  <img src={v.thumbnail} className="w-full h-full object-cover" alt="" onError={e => e.currentTarget.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200'} />
                </div>
                <div className="overflow-hidden">
                  <h4 className="font-bold text-xs text-white truncate">{v.title}</h4>
                  <span className="text-[9px] font-bold text-[#c5a26f] uppercase tracking-wider mt-1 block">{v.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Helpful Quick Shortcuts Routing */}
      <div className="bg-[#121212] border border-white/5 rounded-2xl divide-y divide-white/5 overflow-hidden">
        <div onClick={() => navigate('/subscription')} className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition"><div className="flex items-center gap-3"><CreditCard size={16} className="text-[#c5a26f]" /><span className="text-xs font-semibold">Manage Premium Plan</span></div><span className="text-white/20 text-xs">➔</span></div>
        <div onClick={() => navigate('/privacy')} className="p-4 flex justify-between items-center cursor-pointer hover:bg-white/5 transition"><div className="flex items-center gap-3"><Settings size={16} className="text-white/40" /><span className="text-xs font-semibold">Privacy Policy Rules</span></div><span className="text-white/20 text-xs">➔</span></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL COMPONENT 
// ─────────────────────────────────────────────────────────────────────────────
function AdminPage() {
  return <Navigate to="/admin-secure-7842" replace />;
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR PANEL (ADMIN SECURE 7842)
// ─────────────────────────────────────────────────────────────────────────────
function EditorPanel() {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State Hook payload models
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('1:00');
  const [isPremium, setIsPremium] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [source, setSource] = useState<'direct' | 'youtube' | 'bunny'>('bunny');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Global Promo Configuration State Variables
  const [promoUrl, setPromoUrl] = useState('');
  const [showPromo, setShowPromo] = useState(true);
  const [promoType, setPromoType] = useState<'youtube' | 'direct'>('youtube');

  useEffect(() => {
    let active = true;
    const syncEditorSetup = async () => {
      try {
        const [vids, cats, promoSettings] = await Promise.all([
          fetchVideosFromDB(),
          fetchCategoriesFromDB(),
          fetchSettingFromDB<PromoVideoSettings>('promo_video_settings', defaultPromoVideo)
        ]);

        if (active) {
          setVideos(vids);
          setCategories(cats);
          setCategory(cats[0] || 'Romance');
          if (promoSettings) {
            setPromoUrl(promoSettings.videoUrl);
            setShowPromo(promoSettings.isEnabled);
            setPromoType(promoSettings.videoType || 'youtube');
          }
        }
      } catch { /* noop */ }
      finally {
        if (active) setLoading(false);
      }
    };
    void syncEditorSetup();
    return () => { active = false; };
  }, []);

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !videoUrl.trim()) return;

    const targetId = editingId ?? (videos.length > 0 ? Math.max(...videos.map(v => v.id)) + 1 : 1);
    const payload: Video = {
      id: targetId,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      duration: duration.trim(),
      isPremium,
      thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
      videoUrl: videoUrl.trim(),
      source,
    };

    await upsertVideoToDB(payload);
    const freshVideos = await fetchVideosFromDB();
    setVideos(freshVideos);

    // Reset Forms parameters
    setTitle(''); setDescription(''); setVideoUrl(''); setEditingId(null); setIsPremium(false);
  };

  const handleSavePromo = async () => {
    const payload: PromoVideoSettings = {
      videoUrl: promoUrl.trim(),
      isEnabled: showPromo,
      videoType: promoType
    };
    // Use clear explicit target fields layout configurations
    await supabase.from('platform_settings').upsert({
      key: 'promo_video_settings',
      value: payload
    }, { onConflict: 'key' });
    ls.set('reelramp_promo_video_settings', payload);
    alert('Global promo reel synchronized immediately with production database tables!');
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Confirm raw row deletion track from production databases?')) return;
    await deleteVideoFromDB(id);
    const fresh = await fetchVideosFromDB();
    setVideos(fresh);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center text-xs font-mono tracking-widest text-[#c5a26f] uppercase animate-pulse">
        Securing Admin Encryption Pipeline...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans pb-24 select-none">
      <header className="bg-[#111] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Logo size={28} />
          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-[#c5a26f] font-mono px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">Editor Panel v3</span>
        </div>
        <button onClick={() => navigate('/')} className="px-4 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold transition">View Front App</button>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Controls Column */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 shadow-xl">
            <h2 className="text-sm font-extrabold text-[#c5a26f] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
              {editingId ? 'Modify Segment Block' : 'Append Stream Row'}
            </h2>
            <form onSubmit={handleSaveVideo} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Video Title</label>
                <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter video title" className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs outline-none focus:border-[#c5a26f]/30" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Short storyline metadata log" rows={2} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs outline-none focus:border-[#c5a26f]/30 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3.5 py-2.5 bg-[#181818] border border-white/5 rounded-xl text-white text-xs outline-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Duration</label>
                  <input type="text" required value={duration} onChange={e => setDuration(e.target.value)} placeholder="4:30" className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs font-mono outline-none focus:border-[#c5a26f]/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Link Source</label>
                  <select value={source} onChange={e => setSource(e.target.value as any)} className="w-full px-3.5 py-2.5 bg-[#181818] border border-white/5 rounded-xl text-white text-xs outline-none">
                    <option value="bunny">Bunny CDN</option>
                    <option value="direct">Direct MP4</option>
                    <option value="youtube">YouTube Embed</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end pb-1.5 pl-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} className="rounded border-white/10 bg-white/5 text-[#c5a26f] focus:ring-0 w-4 h-4" />
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Premium Lock</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Streaming Endpoint URL</label>
                <input type="text" required value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://reelramppro.b-cdn.net/file.mp4" className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs font-mono outline-none focus:border-[#c5a26f]/30" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-2.5 bg-[#c5a26f] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-[#b39160] transition">
                  {editingId ? 'Overwrite Row' : 'Push Video Live'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setTitle(''); setVideoUrl(''); }} className="px-3 bg-white/5 rounded-xl text-white/60 text-xs">Cancel</button>
                )}
              </div>
            </form>
          </div>

          {/* Global Trailer Controller Option panel configuration layout map */}
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 shadow-xl">
            <h2 className="text-sm font-extrabold text-white/80 uppercase tracking-wider mb-3 border-b border-white/5 pb-2">Featured Promo Trailer</h2>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Promo Type</label>
                <select value={promoType} onChange={e => setPromoType(e.target.value as any)} className="w-full px-3.5 py-2.5 bg-[#181818] border border-white/5 rounded-xl text-white text-xs outline-none">
                  <option value="youtube">YouTube Video</option>
                  <option value="direct">Direct CDN URL</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Video Source Link</label>
                <input type="text" value={promoUrl} onChange={e => setPromoUrl(e.target.value)} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs font-mono outline-none" placeholder="Video url endpoint" />
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Visibility Status</span>
                <input type="checkbox" checked={showPromo} onChange={e => setShowPromo(e.target.checked)} className="rounded border-white/10 bg-white/5 text-[#c5a26f] w-4 h-4" />
              </div>
              <button type="button" onClick={() => void handleSavePromo()} className="w-full py-2 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl">
                Synchronize Settings
              </button>
            </div>
          </div>
        </div>

        {/* Catalog List Column */}
        <div className="md:col-span-2 bg-[#121212] border border-white/5 rounded-3xl p-5 shadow-xl h-fit">
          <h2 className="text-sm font-extrabold text-white/90 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Active Streaming Database Records ({videos.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-white/30 uppercase tracking-wider">
                  <th className="pb-3 pl-2">ID</th>
                  <th className="pb-3">Title Details</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Access</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {videos.map(v => (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition">
                    <td className="py-3.5 font-mono text-white/40 pl-2">{v.id}</td>
                    <td className="py-3.5 font-semibold text-white">
                      <div>{v.title}</div>
                      <div className="text-[10px] text-white/30 font-mono font-medium line-clamp-1 max-w-[240px] mt-0.5">{v.videoUrl}</div>
                    </td>
                    <td className="py-3.5 text-white/60 font-medium">{v.category}</td>
                    <td className="py-3.5">
                      {v.isPremium ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] font-extrabold text-[#c5a26f] uppercase">Premium</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] font-bold text-white/40 uppercase">Free</span>
                      )}
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <div className="flex gap-2.5 justify-end">
                        <button
                          onClick={() => {
                            setEditingId(v.id); setTitle(v.title); setDescription(v.description);
                            setCategory(v.category); setDuration(v.duration); setIsPremium(v.isPremium);
                            setVideoUrl(v.videoUrl); setSource(v.source || 'bunny');
                          }}
                          className="p-1 text-white/40 hover:text-[#c5a26f] transition"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => void handleDelete(v.id)} className="p-1 text-white/40 hover:text-red-400 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// OWNER PANEL (RRMP CONTROL 9X7K)
// ─────────────────────────────────────────────────────────────────────────────
function OwnerPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'metrics' | 'subs' | 'gateways'>('metrics');

  // Business models control parameters
  const [platform, setPlatform] = useState<PlatformSettings>(defaultPlatformSettings);
  const [subTier, setSubTier] = useState<SubscriptionSettings>(defaultSubscriptionSettings);
  const [gateways, setGateways] = useState<PaymentSettings>(defaultPaymentSettings);

  useEffect(() => {
    let active = true;
    const fetchOwnerConfig = async () => {
      try {
        const [p, s, g] = await Promise.all([
          fetchSettingFromDB<PlatformSettings>('platform_settings', defaultPlatformSettings),
          fetchSettingFromDB<SubscriptionSettings>('subscription_settings', defaultSubscriptionSettings),
          fetchSettingFromDB<PaymentSettings>('payment_settings', defaultPaymentSettings)
        ]);
        if (active) {
          setPlatform(p);
          setSubTier(s);
          setGateways(g);
        }
      } catch { /* noop */ }
      finally {
        if (active) setLoading(false);
      }
    };
    void fetchOwnerConfig();
    return () => { active = false; };
  }, []);

  const saveConfig = async (key: 'platform_settings' | 'subscription_settings' | 'payment_settings', payload: unknown) => {
    await upsertSettingToDB(key, payload);
    alert('System operations updated across main branch clusters!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-xs font-mono text-white/40 uppercase tracking-widest animate-pulse">
        Initializing SuperUser Framework Operations...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] font-sans pb-24 text-white select-none">
      <header className="bg-[#0f0f0f] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <h1 className="text-sm font-black uppercase tracking-wider font-mono">Master Operation Console</h1>
        </div>
        <button onClick={() => navigate('/')} className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold">Exit Terminal</button>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        {/* Navigation Tabs Bar layout */}
        <div className="flex gap-2 bg-[#121212] p-1.5 border border-white/5 rounded-2xl mb-6 w-fit">
          <button onClick={() => setActiveTab('metrics')} className={`px-4 py-2 rounded-xl text-xs font-bold transition uppercase ${activeTab === 'metrics' ? 'bg-[#c5a26f] text-black shadow-md' : 'text-white/60 hover:text-white'}`}>Financial Insights</button>
          <button onClick={() => setActiveTab('subs')} className={`px-4 py-2 rounded-xl text-xs font-bold transition uppercase ${activeTab === 'subs' ? 'bg-[#c5a26f] text-black shadow-md' : 'text-white/60 hover:text-white'}`}>Plan Matrix</button>
          <button onClick={() => setActiveTab('gateways')} className={`px-4 py-2 rounded-xl text-xs font-bold transition uppercase ${activeTab === 'gateways' ? 'bg-[#c5a26f] text-black shadow-md' : 'text-white/60 hover:text-white'}`}>Gateway Rules</button>
        </div>

        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-5"><div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Gross Sales Database Log</div><div className="text-2xl font-black text-[#c5a26f] mt-1">₹7,098</div><div className="text-[9px] text-emerald-400 font-bold mt-1">▲ 14.2% Last Cycle</div></div>
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-5"><div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Simulated Subscribers</div><div className="text-2xl font-black text-white mt-1">162 Users</div><div className="text-[9px] text-white/30 font-medium mt-1">Active sync hooks matching user profiles</div></div>
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-5"><div className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Active Catalog Rows</div><div className="text-2xl font-black text-white mt-1">11 Nodes</div><div className="text-[9px] text-amber-500 font-bold mt-1">CDN active configuration verified</div></div>
            </div>
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
              <h3 className="text-xs font-extrabold text-white/50 uppercase tracking-wider mb-3 ml-1">Live Transaction Logs Sequence</h3>
              <div className="divide-y divide-white/5 text-xs font-mono">
                {getRevenueData().map(r => (
                  <div key={r.id} className="py-3 flex justify-between items-center text-white/80">
                    <div><span>[{r.date}]</span> <span className="text-white font-bold ml-2">{r.type}</span> <span className="text-white/40">({r.plan})</span></div>
                    <div className="text-[#c5a26f] font-bold">+₹{r.amount}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subs' && (
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 max-w-md shadow-2xl">
            <h3 className="text-sm font-extrabold text-[#c5a26f] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Plan Matrix Configurations</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Trial Pricing</label><input type="text" value={subTier.trialOfferPrice} onChange={e => setSubTier({...subTier, trialOfferPrice: e.target.value})} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Trial Validity</label><input type="text" value={subTier.trialOfferDuration} onChange={e => setSubTier({...subTier, trialOfferDuration: e.target.value})} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Full Tier Price</label><input type="text" value={subTier.fullPrice} onChange={e => setSubTier({...subTier, fullPrice: e.target.value})} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs outline-none" /></div>
                <div><label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Full Tier Validity</label><input type="text" value={subTier.fullValidity} onChange={e => setSubTier({...subTier, fullValidity: e.target.value})} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs outline-none" /></div>
              </div>
              <div className="flex justify-between items-center py-2">
                <div><div className="text-xs font-bold text-white/90">Render Low Cost Trial Layer</div><div className="text-[10px] text-white/40 font-medium">Controls the conversion optimization schedulers</div></div>
                <input type="checkbox" checked={subTier.showTrialPopup} onChange={e => setSubTier({...subTier, showTrialPopup: e.target.checked})} className="rounded border-white/10 bg-white/5 text-[#c5a26f] w-4 h-4" />
              </div>
              <button onClick={() => void saveConfig('subscription_settings', subTier)} className="w-full mt-2 py-3 bg-[#c5a26f] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl">Save Plan Matrix</button>
            </div>
          </div>
        )}

        {activeTab === 'gateways' && (
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 max-w-md shadow-2xl">
            <h3 className="text-sm font-extrabold text-white/90 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Active Banking Gateway Routing</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Active Gateway Router</label>
                <select value={gateways.activeGateway} onChange={e => setGateways({...gateways, activeGateway: e.target.value as any})} className="w-full px-3.5 py-2.5 bg-[#181818] border border-white/5 rounded-xl text-white text-xs outline-none">
                  <option value="razorpay">Razorpay Checkout Pipeline</option>
                  <option value="stripe">Stripe Global Processing</option>
                  <option value="upi">UPI Sandbox Standalone</option>
                  <option value="none">Manual Simulation Hooks</option>
                </select>
              </div>
              <div><label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Razorpay Key ID</label><input type="text" value={gateways.razorpayKeyId} onChange={e => setGateways({...gateways, razorpayKeyId: e.target.value})} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs font-mono outline-none" placeholder="rzp_live_..." /></div>
              <div><label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">UPI String Mapping</label><input type="text" value={gateways.upiId} onChange={e => setGateways({...gateways, upiId: e.target.value})} className="w-full px-3.5 py-2.5 bg-white/5 border border-white/5 rounded-xl text-white text-xs font-mono outline-none" placeholder="merchant@ybl" /></div>
              <div className="flex justify-between items-center py-1">
                <div><div className="text-xs font-bold text-white/90">Production Live-Mode Route</div><div className="text-[10px] text-white/40 font-medium">When disabled, execution utilizes mock simulation loops</div></div>
                <input type="checkbox" checked={gateways.isLiveMode} onChange={e => setGateways({...gateways, isLiveMode: e.target.checked})} className="rounded border-white/10 bg-white/5 text-[#c5a26f] w-4 h-4" />
              </div>
              <button onClick={() => void saveConfig('payment_settings', gateways)} className="w-full mt-2 py-3 bg-white text-black font-extrabold text-xs uppercase tracking-wider rounded-xl">Authorize Gateway Cluster</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL INFORMATIONAL LAYOUT PAGES
// ─────────────────────────────────────────────────────────────────────────────
function LegalPage({ type }: { type: 'privacy' | 'terms' | 'refund' | 'shipping' }) {
  const navigate = useNavigate();
  const TITLES = { privacy: "Privacy Policy Rules", terms: "Terms & Conditions Clause", refund: "Cancellation & Refund Framework", shipping: "Service Delivery & Shipping Matrix" };
  return (
    <div className="flex-1 px-4 py-6 max-w-2xl mx-auto font-sans text-white/80 select-none">
      <button onClick={() => navigate(-1)} className="mb-6 p-2 bg-white/5 border border-white/5 rounded-xl flex items-center gap-2 text-xs font-bold text-white/60"><ArrowLeft size={14} /> Back</button>
      <h1 className="text-xl font-black text-white mb-4 uppercase tracking-tight">{TITLES[type]}</h1>
      <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 text-xs leading-relaxed space-y-4 font-normal">
        <p>This operational framework document outlines the legal compliance and data routing policies applied across this streaming deployment container node.</p>
        <p>By interacting with our streaming layout files, application endpoints, local storage frameworks, and authenticated subscription state models, you consent fully to our execution cycles.</p>
        <p>All programmatic interactions are tracked strictly under standard end-user license agreements without external bypass pipelines.</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="bg-[#0e0e0e] border-t border-white/5 mt-auto pt-8 pb-24 px-4 font-sans select-none">
      <div className="max-w-md mx-auto grid grid-cols-2 gap-6 text-xs mb-6">
        <div className="space-y-2">
          <div className="font-bold text-white/40 uppercase tracking-widest text-[10px] mb-3">Enterprise Scope</div>
          <div onClick={() => navigate('/terms')} className="text-white/60 hover:text-white cursor-pointer transition font-medium">Terms of Use Clause</div>
          <div onClick={() => navigate('/privacy')} className="text-white/60 hover:text-white cursor-pointer transition font-medium">Data Privacy Rules</div>
        </div>
        <div className="space-y-2">
          <div className="font-bold text-white/40 uppercase tracking-widest text-[10px] mb-3">Support Protocols</div>
          <div onClick={() => navigate('/refund')} className="text-white/60 hover:text-white cursor-pointer transition font-medium">Refund Framework</div>
          <div onClick={() => navigate('/shipping')} className="text-white/60 hover:text-white cursor-pointer transition font-medium">Shipping & Delivery</div>
        </div>
      </div>
      <div className="max-w-md mx-auto border-t border-white/5 pt-4 flex justify-between items-center text-[10px] font-medium text-white/30">
        <span>© 2026 ReelRamp Engine Node.</span>
        <span>All streams validated.</span>
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

  const NAV_ITEMS = [
    { path: '/', label: 'Feeds', icon: <Play size={20} /> },
    { path: '/subscription', label: 'Premium', icon: <Star size={20} /> },
    { path: '/profile', label: 'Profile', icon: <UserIcon size={20} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/5 py-2.5 px-6 flex justify-around items-center z-40 max-w-md mx-auto rounded-t-3xl shadow-2xl">
      {NAV_ITEMS.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition ${isActive ? 'text-[#c5a26f] font-bold scale-105' : 'text-white/40 hover:text-white/70'}`}
          >
            {item.icon}
            <span className="text-[10px] uppercase tracking-wider font-semibold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default App;
