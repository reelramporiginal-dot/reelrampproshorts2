import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const initialDigitalProducts: DigitalProduct[] = [
  { id: 1, title: "Cinematic Storytelling Masterclass", description: "12-module video workshop on short-film storytelling, shot composition, and emotional pacing.", price: 1499, category: 'workshop', thumbnailUrl: "/images/workshop1.jpg", isPremium: false, badge: "BESTSELLER" },
  { id: 2, title: "Horror Script Writing Guide", description: "Complete downloadable PDF guide with 50 proven horror narrative frameworks.", price: 299, category: 'guide', thumbnailUrl: "/images/guide1.jpg", isPremium: false, badge: "PDF" },
  { id: 3, title: "ReelRamp Creator Kit", description: "Exclusive merch bundle: hoodie, notebook, lens cap set — for serious creators.", price: 1999, category: 'merch', thumbnailUrl: "/images/merch1.jpg", isPremium: true, badge: "LIMITED" },
  { id: 4, title: "Investigative Journalism Bootcamp", description: "6-week intensive video workshop on research, source protection, and story arc design.", price: 2499, category: 'workshop', thumbnailUrl: "/images/workshop2.jpg", isPremium: true, badge: "EXCLUSIVE" },
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
  set: (key: string, value: unknown) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
  },
  remove: (key: string) => localStorage.removeItem(key),
};

const getStoredVideos = (): Video[] => ls.get('reelramp_videos', initialVideos);
const saveVideos = (v: Video[]) => ls.set('reelramp_videos', v);

const getStoredPopups = (): PopupAd[] =>
  ls.get('reelramp_popups', [{ id: 1, title: "Premium Unlock", imageUrl: "/images/popup-ad.jpg", redirectUrl: "/subscription", isActive: true }]);
const savePopups = (p: PopupAd[]) => ls.set('reelramp_popups', p);

const getSettings = (): PlatformSettings => ls.get('reelramp_settings', defaultPlatformSettings);
const saveSettings = (s: PlatformSettings) => ls.set('reelramp_settings', s);

const getSubSettings = (): SubscriptionSettings => ls.get('reelramp_sub_settings', defaultSubscriptionSettings);
const saveSubSettings = (s: SubscriptionSettings) => ls.set('reelramp_sub_settings', s);

const getPaymentSettings = (): PaymentSettings => ls.get('reelramp_payment', defaultPaymentSettings);
const savePaymentSettings = (s: PaymentSettings) => ls.set('reelramp_payment', s);

const getPromoSettings = (): PromoVideoSettings => ls.get('reelramp_promo', defaultPromoVideo);
const savePromoSettings = (s: PromoVideoSettings) => ls.set('reelramp_promo', s);

const getCategories = (): string[] =>
  ls.get('reelramp_categories', ["Horror", "Mystery", "Life Lessons", "Investigative", "True Crime"]);
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

const getResumeTimestamp = (videoId: number): number => {
  const h = getWatchHistory();
  const item = h.find(i => i.videoId === videoId);
  return item?.timestamp || 0;
};

const getVideoViews = (): Record<number, number> => ls.get('reelramp_views', {});
const incrementView = (id: number) => {
  const v = getVideoViews();
  v[id] = (v[id] || 0) + 1;
  ls.set('reelramp_views', v);
};

const getRevenueData = (): RevenueEntry[] => ls.get('reelramp_revenue', [
  { id: 1, date: "2025-04-01", amount: 2450, type: "Subscription", plan: "Monthly" },
  { id: 2, date: "2025-04-05", amount: 1499, type: "Annual", plan: "Annual" },
  { id: 3, date: "2025-04-18", amount: 699, type: "Subscription", plan: "Monthly" },
  { id: 4, date: "2025-05-01", amount: 2450, type: "Subscription", plan: "Monthly" },
]);

const getDigitalProducts = (): DigitalProduct[] =>
  ls.get('reelramp_digital_products', initialDigitalProducts);
const saveDigitalProducts = (p: DigitalProduct[]) =>
  ls.set('reelramp_digital_products', p);

const getAverageRating = (videoId: number): { average: number; count: number } => {
  const ratings = ls.get<Record<number, number>>('reelramp_ratings', {});
  const r = ratings[videoId];
  if (r) return { average: r, count: 1 };
  const simulated = Math.min(5, (videoId % 5) + 3.5);
  return { average: simulated, count: 12 + (videoId % 30) };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYWALL TRACKER
// ─────────────────────────────────────────────────────────────────────────────
const getScrollCount = (): number => parseInt(sessionStorage.getItem('rr_scroll_count') || '0');
const incrementScrollCount = () =>
  sessionStorage.setItem('rr_scroll_count', String(getScrollCount() + 1));
const resetScrollCount = () => sessionStorage.removeItem('rr_scroll_count');

// ─────────────────────────────────────────────────────────────────────────────
// DATA TOOLS
// ─────────────────────────────────────────────────────────────────────────────
const exportSystemBackup = () => {
  const backup = {
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
    categories: getCategories(),
    videos: getStoredVideos(),
    digitalProducts: getDigitalProducts(),
    platformSettings: getSettings(),
    subscriptionSettings: getSubSettings(),
    paymentSettings: getPaymentSettings(),
    promoSettings: getPromoSettings(),
    popups: getStoredPopups(),
    revenueData: getRevenueData(),
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reelramp_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const importSystemBackup = (
  file: File,
  onSuccess: (msg: string) => void,
  onError: (msg: string) => void
) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const raw = e.target?.result as string;
      const data = JSON.parse(raw);
      const required = ['categories', 'videos', 'digitalProducts'];
      const missing = required.filter(k => !(k in data));
      if (missing.length > 0) { onError(`Invalid backup: missing keys — ${missing.join(', ')}`); return; }
      if (data.categories) saveCategories(data.categories);
      if (data.videos) saveVideos(data.videos);
      if (data.digitalProducts) saveDigitalProducts(data.digitalProducts);
      if (data.platformSettings) saveSettings(data.platformSettings);
      if (data.subscriptionSettings) saveSubSettings(data.subscriptionSettings);
      if (data.paymentSettings) savePaymentSettings(data.paymentSettings);
      if (data.promoSettings) savePromoSettings(data.promoSettings);
      if (data.popups) savePopups(data.popups);
      onSuccess(`✅ Backup restored — ${data.videos?.length || 0} videos, ${data.categories?.length || 0} categories imported.`);
    } catch {
      onError('❌ Invalid JSON file. Please upload a valid ReelRamp backup.');
    }
  };
  reader.readAsText(file);
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
async function safeUpsert(table: string, data: Record<string, unknown>, conflictCol = 'id'): Promise<boolean> {
  try {
    const { error } = await supabase.from(table).upsert(data, { onConflict: conflictCol });
    return !error;
  } catch {
    return false;
  }
}

async function safeMaybeSelect<T>(table: string, filters: Record<string, unknown>): Promise<T | null> {
  try {
    let q = supabase.from(table).select('*');
    for (const [k, v] of Object.entries(filters)) q = (q as any).eq(k, v);
    const { data, error } = await (q as any).maybeSingle();
    if (error) return null;
    return data as T;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM CONTEXT (FIX: Real-time Admin Sync)
// ─────────────────────────────────────────────────────────────────────────────
interface PlatformContextValue {
  videos: Video[];
  settings: PlatformSettings;
  subSettings: SubscriptionSettings;
  paymentConfig: PaymentSettings;
  popups: PopupAd[];
  categories: string[];
  refreshAllData: () => void;
  updateVideos: (videos: Video[]) => void;
  updateSettings: (settings: PlatformSettings) => void;
  updateSubSettings: (settings: SubscriptionSettings) => void;
  updatePaymentConfig: (config: PaymentSettings) => void;
  updatePopups: (popups: PopupAd[]) => void;
  updateCategories: (categories: string[]) => void;
}

const PlatformContext = React.createContext<PlatformContextValue | null>(null);

const usePlatform = () => {
  const context = React.useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within PlatformProvider');
  }
  return context;
};

function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [videos, setVideos] = useState<Video[]>(() => getStoredVideos());
  const [settings, setSettings] = useState<PlatformSettings>(() => getSettings());
  const [subSettings, setSubSettings] = useState<SubscriptionSettings>(() => getSubSettings());
  const [paymentConfig, setPaymentConfig] = useState<PaymentSettings>(() => getPaymentSettings());
  const [popups, setPopups] = useState<PopupAd[]>(() => getStoredPopups());
  const [categories, setCategories] = useState<string[]>(() => getCategories());

  const refreshAllData = useCallback(() => {
    setVideos(getStoredVideos());
    setSettings(getSettings());
    setSubSettings(getSubSettings());
    setPaymentConfig(getPaymentSettings());
    setPopups(getStoredPopups());
    setCategories(getCategories());
  }, []);

  const updateVideos = useCallback((newVideos: Video[]) => {
    saveVideos(newVideos);
    setVideos(newVideos);
  }, []);

  const updateSettings = useCallback((newSettings: PlatformSettings) => {
    saveSettings(newSettings);
    setSettings(newSettings);
  }, []);

  const updateSubSettings = useCallback((newSubSettings: SubscriptionSettings) => {
    saveSubSettings(newSubSettings);
    setSubSettings(newSubSettings);
  }, []);

  const updatePaymentConfig = useCallback((newConfig: PaymentSettings) => {
    savePaymentSettings(newConfig);
    setPaymentConfig(newConfig);
  }, []);

  const updatePopups = useCallback((newPopups: PopupAd[]) => {
    savePopups(newPopups);
    setPopups(newPopups);
  }, []);

  const updateCategories = useCallback((newCategories: string[]) => {
    saveCategories(newCategories);
    setCategories(newCategories);
  }, []);

  const value = {
    videos,
    settings,
    subSettings,
    paymentConfig,
    popups,
    categories,
    refreshAllData,
    updateVideos,
    updateSettings,
    updateSubSettings,
    updatePaymentConfig,
    updatePopups,
    updateCategories,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
}

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
// PWA INSTALL BANNER
// ─────────────────────────────────────────────────────────────────────────────
function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [show, setShow] = useState(false);
  const dismissed = !!sessionStorage.getItem('rr_pwa_dismissed');
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (dismissed || hasInteracted) return;
    const onInteract = () => { if (deferredPrompt) setShow(true); setHasInteracted(true); };
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('touchstart', onInteract, { once: true });
    return () => { window.removeEventListener('click', onInteract); window.removeEventListener('touchstart', onInteract); };
  }, [deferredPrompt, dismissed, hasInteracted]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await (deferredPrompt as any).prompt();
    const { outcome } = await (deferredPrompt as any).userChoice;
    if (outcome === 'accepted') { sessionStorage.setItem('rr_pwa_dismissed', '1'); setShow(false); }
    setDeferredPrompt(null);
  };

  if (!show || dismissed) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
        transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.38 }}
        className="fixed bottom-[72px] left-4 right-4 z-[150] md:left-auto md:right-6 md:w-[380px]">
        <div className="bg-[#111]/95 backdrop-blur-xl border border-[#c5a26f]/40 rounded-3xl p-5 flex items-center gap-4 shadow-2xl">
          <div className="w-12 h-12 bg-[#c5a26f] rounded-2xl flex items-center justify-center flex-shrink-0">
            <Smartphone size={22} className="text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Install ReelRamp App</div>
            <div className="text-xs text-[#a1a1aa] mt-0.5">Fast, offline-ready, no browser bar</div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleInstall} className="px-4 py-2 bg-[#c5a26f] text-black text-xs font-semibold rounded-xl">Install</button>
            <button onClick={() => { sessionStorage.setItem('rr_pwa_dismissed', '1'); setShow(false); }} className="p-2 text-[#666]"><X size={16} /></button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION INTERCEPT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SubscriptionInterceptModal({ onClose, onSubscribe }: { onClose: () => void; onSubscribe: () => void }) {
  const subSettings = getSubSettings();
  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center bg-black/95 p-0 md:p-6">
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.38 }}
        className="w-full md:max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-t-3xl md:rounded-3xl p-9 border border-[#333] border-b-0 md:border-b">
        <div className="w-10 h-1 bg-[#333] rounded-full mx-auto mb-7 md:hidden" />
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#c5a26f] to-[#d4b17f] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#c5a26f]/20">
            <Lock size={28} className="text-black" />
          </div>
          <h2 className="text-4xl font-semibold tracking-[-2px] mb-2">Premium Access</h2>
          <p className="text-[#a1a1aa] text-sm">You've been watching 3 free shorts. Subscribe to continue without interruption.</p>
        </div>
        <div className="bg-[#0a0a0a] rounded-2xl p-5 mb-6 border border-[#c5a26f]/20">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-semibold tracking-tight text-[#c5a26f]">{subSettings.trialOfferPrice}</span>
            <span className="text-[#666] text-sm">/ {subSettings.trialOfferDuration} trial</span>
          </div>
          <div className="text-xs text-[#666]">Then {subSettings.full
