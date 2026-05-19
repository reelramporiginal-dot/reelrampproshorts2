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

// ============================================================
// PRODUCTION CREDENTIALS
// ============================================================
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

const getOrCreateGuestId = (): string => {
  const existing = localStorage.getItem('rr_guest_id');
  if (existing) return existing;
  const id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem('rr_guest_id', id);
  return id;
};

// ============================================================
// TYPES
// ============================================================
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

// ============================================================
// INITIAL DATA
// ============================================================
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

// ============================================================
// LOCAL STORAGE HELPERS
// ============================================================
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
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
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

const getScrollCount = (): number => parseInt(sessionStorage.getItem('rr_scroll_count') || '0');
const incrementScrollCount = () =>
  sessionStorage.setItem('rr_scroll_count', String(getScrollCount() + 1));
const resetScrollCount = () => sessionStorage.removeItem('rr_scroll_count');

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

// ============================================================
// SUPABASE HELPERS
// ============================================================
async function safeUpsert(table: string, data: Record<string, unknown>, conflictCol = 'id'): Promise<boolean> {
  try {
    const { error } = await supabase.from(table).upsert(data, { onConflict: conflictCol });
    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// PLATFORM CONTEXT (FOR REAL-TIME SYNC)
// ============================================================
interface PlatformContextValue {
  videos: Video[];
  settings: PlatformSettings;
  subSettings: SubscriptionSettings;
  paymentConfig: PaymentSettings;
  popups: PopupAd[];
  categories: string[];
  refreshAllData: () => void;
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

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('reelramp_')) {
        refreshAllData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshAllData]);

  return (
    <PlatformContext.Provider value={{ videos, settings, subSettings, paymentConfig, popups, categories, refreshAllData }}>
      {children}
    </PlatformContext.Provider>
  );
}

// ============================================================
// AUTH CONTEXT
// ============================================================
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

// ============================================================
// LOGO
// ============================================================
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

// ============================================================
// PWA INSTALL BANNER
// ============================================================
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

// ============================================================
// SUBSCRIPTION INTERCEPT MODAL
// ============================================================
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
          <div className="text-xs text-[#666]">Then {subSettings.fullPrice} for {subSettings.fullValidity}</div>
          <ul className="mt-4 space-y-1.5 text-sm text-[#a1a1aa]">
            {['Unlimited premium shorts', 'Ad-free experience', 'Offline downloads', 'New releases first'].map((f, i) => (
              <li key={i} className="flex items-center gap-2"><CheckCircle size={13} className="text-[#c5a26f]" /> {f}</li>
            ))}
          </ul>
        </div>
        <button onClick={onSubscribe} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider mb-3 active:scale-[0.98] transition-transform">UNLOCK PREMIUM</button>
        <button onClick={onClose} className="w-full py-3 text-sm text-[#666]">Continue as Guest (Limited)</button>
      </motion.div>
    </div>
  );
}

// ============================================================
// CINEMATIC PLAYER (FIXED - NO SPINNER HANG)
// ============================================================
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
  onUserActivity, resumeFrom = 0, onTimeUpdate
}: CinematicPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showHUD, setShowHUD] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTapRef = useRef(0);
  const heartIdRef = useRef(0);
  const hasResumed = useRef(false);
  const timeUpdateThrottle = useRef(0);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();

  const handleCanPlay = () => {
    setIsLoaded(true);
    setIsBuffering(false);
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleWaiting = () => {
    setIsBuffering(true);
  };

  const handlePlaying = () => {
    setIsBuffering(false);
    setIsLoaded(true);
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(false);
    setIsBuffering(false);
    
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
        setHasError(false);
      }
    }, 3000);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isLoaded) return;

    if (isPlaying) {
      v.play().catch(() => {
        setIsBuffering(true);
        setTimeout(() => {
          if (videoRef.current && isPlaying) {
            videoRef.current.play().catch(() => {});
          }
        }, 500);
      });
    } else {
      v.pause();
      setIsBuffering(false);
    }
  }, [isPlaying, isLoaded]);

  useEffect(() => {
    const v = videoRef.current;
    if (v && resumeFrom > 0 && !hasResumed.current && isLoaded) {
      v.currentTime = resumeFrom;
      hasResumed.current = true;
    }
  }, [resumeFrom, isLoaded]);

  useEffect(() => {
    loadTimeoutRef.current = setTimeout(() => {
      if (!isLoaded && !hasError) {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }
    }, 10000);

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [video.videoUrl]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      if (resumeFrom > 0 && !hasResumed.current) {
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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!videoRef.current) return;
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + (e.deltaY < 0 ? 5 : -5));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; onUserActivity(); };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 60 && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + (delta > 0 ? 10 : -10));
    }
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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  if (video.source === 'youtube') {
    const videoId = video.videoUrl.split('/').pop()?.split('?')[0] || '';
    return (
      <div className="relative w-full h-full bg-black" onClick={onUserActivity}>
        <iframe width="100%" height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&controls=1&modestbranding=1&rel=0&playsinline=1`}
          title={video.title} frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen className="w-full h-full" />
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-50">
          <div className="h-full bg-[#c5a26f]" style={{ width: '0%' }} />
        </div>
      </div>
    );
  }

  const resolvedUrl = video.source === 'bunny' ? getBunnyCdnUrl(video.videoUrl) : video.videoUrl;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black select-none transform-gpu"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={(e) => { onUserActivity(); handleDoubleTap(e); }}
      onMouseDown={e => { if (e.detail === 2) handleDoubleTap(e); }}
    >
      <video
        ref={videoRef}
        src={resolvedUrl}
        className="w-full h-full object-cover transform-gpu"
        autoPlay={isPlaying}
        playsInline
        preload="auto"
        onEnded={onEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onPlaying={handlePlaying}
        onWaiting={handleWaiting}
        onError={handleError}
        onClickCapture={e => {
          if (e.detail === 1) setTimeout(() => {
            if (Date.now() - lastTapRef.current > 320) onPlayPause();
          }, 320);
        }}
      />

      {(!isLoaded || isBuffering) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="w-9 h-9 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center">
            <div className="text-[#e11d48] text-4xl mb-3">⚠️</div>
            <div className="text-white text-sm mb-4">Unable to load video</div>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoaded(false);
                if (videoRef.current) videoRef.current.load();
              }}
              className="px-5 py-2.5 bg-[#c5a26f] text-black rounded-xl text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {hearts.map(h => (
        <motion.div key={h.id} initial={{ opacity: 1, scale: 0.5, y: 0 }} animate={{ opacity: 0, scale: 1.8, y: -80 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          className="absolute pointer-events-none text-4xl z-50" style={{ left: h.x - 20, top: h.y - 20 }}>
          ❤️
        </motion.div>
      ))}

      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <button
          onPointerDown={e => { e.stopPropagation(); setIsMuted(m => !m); onUserActivity(); }}
          className="w-11 h-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-transform">
          {isMuted ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white" />}
        </button>
        <button
          onPointerDown={e => { e.stopPropagation(); setShowHUD(h => !h); onUserActivity(); }}
          className="w-11 h-11 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-transform">
          <span className="text-[11px] font-bold text-[#c5a26f]">{speed}x</span>
        </button>
        <AnimatePresence>
          {showHUD && (
            <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="absolute top-24 right-0 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
              onPointerDown={e => e.stopPropagation()}>
              {speeds.map(s => (
                <button key={s}
                  onPointerDown={() => { setSpeed(s); setShowHUD(false); onUserActivity(); }}
                  className={`block w-16 px-3 py-2.5 text-xs font-medium text-left transition ${speed === s ? 'bg-[#c5a26f] text-black' : 'text-white hover:bg-white/10'}`}>
                  {s}x
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-50 cursor-pointer group"
        onClick={e => { e.stopPropagation(); handleProgressClick(e); onUserActivity(); }}>
        <div className="h-full bg-[#c5a26f] relative" style={{ width: `${progressPercent}%` }}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#c5a26f] rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CONTINUE WATCHING RAIL
// ============================================================
function ContinueWatchingRail({ onNavigate }: { onNavigate: (id: number, timestamp: number) => void }) {
  const [items, setItems] = useState<(WatchHistoryItem & { video: Video })[]>([]);

  useEffect(() => {
    const history = getWatchHistory();
    const vids = getStoredVideos();
    const enriched = history
      .filter(h => h.progress > 0 && h.progress < 95 && h.timestamp > 0)
      .slice(0, 8)
      .map(h => {
        const video = vids.find(v => v.id === h.videoId);
        return video ? { ...h, video } : null;
      })
      .filter(Boolean) as (WatchHistoryItem & { video: Video })[];
    setItems(enriched);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto px-5 pb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-[#c5a26f] rounded-lg flex items-center justify-center">
          <Clock size={13} className="text-black" />
        </div>
        <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
        {items.map(item => (
          <div key={item.videoId} onClick={() => onNavigate(item.videoId, item.timestamp)}
            className="flex-shrink-0 w-[170px] cursor-pointer group">
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#1a1a1a]">
              <img src={item.video.thumbnail} alt={item.video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-[#c5a26f] flex items-center justify-center">
                  <Play size={16} className="text-black ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                <div className="h-full bg-[#c5a26f]" style={{ width: `${item.progress}%` }} />
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-[9px] px-2 py-px rounded font-mono">{item.progress}%</div>
            </div>
            <div className="mt-2 px-0.5">
              <div className="text-sm font-medium line-clamp-1 tracking-tight">{item.video.title}</div>
              <div className="text-[11px] text-[#c5a26f] mt-0.5">Resume →</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// APP SHELL
// ============================================================
function App() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'viewport'; document.head.appendChild(meta); }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
  }, []);

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
  const location = useLocation();
  const isFullscreen =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/player') ||
    location.pathname === '/admin-secure-7842' ||
    location.pathname === '/rrmp-control-9x7k' ||
    location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col"
      style={{ touchAction: 'pan-y', WebkitUserSelect: 'none', userSelect: 'none' }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/player/:id" element={<ShortsPlayerPage />} />
        <Route path="/subscription" element={<SubscriptionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/store" element={<DigitalStorePage />} />
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
      <PWAInstallBanner />
    </div>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================
function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { if (user) navigate('/profile', { replace: true }); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name } }
        });
        if (signUpError) throw signUpError;
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) { setSuccess('Account created! Please log in.'); setMode('login'); }
        else navigate('/profile', { replace: true });
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/profile` });
        if (resetError) throw resetError;
        setSuccess('Password reset email sent! Check your inbox.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        navigate('/profile', { replace: true });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleOAuth = async () => {
    setGoogleLoading(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/profile`, queryParams: { prompt: 'select_account' } }
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5 pb-10">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size={40} className="justify-center mb-4" />
          <h1 className="text-3xl font-semibold tracking-tight">
            {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create account' : 'Reset password'}
          </h1>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-3xl p-8">
          {mode !== 'forgot' && (
            <div className="flex bg-[#1a1a1a] rounded-2xl p-1 mb-6">
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${mode === m ? 'bg-[#c5a26f] text-black' : 'text-[#666]'}`}>
                  {m === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>
          )}
          {mode !== 'forgot' && (
            <button onClick={handleGoogleOAuth} disabled={googleLoading}
              className="w-full py-3.5 mb-4 bg-white text-black font-medium rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-60">
              {googleLoading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
          )}
          {mode !== 'forgot' && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#222]" />
              <span className="text-xs text-[#444]">or continue with email</span>
              <div className="flex-1 h-px bg-[#222]" />
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none transition-colors" />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none transition-colors" />
            {mode !== 'forgot' && (
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required minLength={6}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none transition-colors" />
            )}
            {error && <p className="text-[#e11d48] text-sm px-1">{error}</p>}
            {success && <p className="text-[#22c55e] text-sm px-1">{success}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              {loading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {mode === 'login' ? 'Login' : mode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>
          {mode === 'login' && <button onClick={() => setMode('forgot')} className="w-full text-center text-xs text-[#555] mt-4 hover:text-[#c5a26f]">Forgot password?</button>}
          {mode === 'forgot' && <button onClick={() => setMode('login')} className="w-full text-center text-xs text-[#555] mt-4 hover:text-white">← Back to Login</button>}
        </div>
        <div className="text-center mt-6 space-y-2">
          <button onClick={() => navigate('/')} className="block w-full text-xs text-[#c5a26f] font-medium hover:underline">Continue as Guest →</button>
          <button onClick={() => navigate('/')} className="text-xs text-[#555] hover:text-white">← Back to app</button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// HOME PAGE (WITH REAL-TIME SUPABASE SYNC - FIXED)
// ============================================================
function HomePage() {
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  const [allVideos, setAllVideos] = useState<Video[]>(() => getStoredVideos());
  const [categories, setCategories] = useState<string[]>(() => getCategories());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallVideo, setPaywallVideo] = useState<Video | null>(null);
  const [library, setLibrary] = useState<number[]>(() => ls.get('reelramp_library', []));
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [showGlobalPopup, setShowGlobalPopup] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupAd | null>(null);
  const [showScrollPaywall, setShowScrollPaywall] = useState(false);

  // 🔥 CRITICAL FIX: Real-time Supabase subscription
  useEffect(() => {
    // Initial fetch from Supabase
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('id');
      
      if (data && data.length > 0) {
        setAllVideos(data as Video[]);
        saveVideos(data as Video[]);
      }
    };
    
    fetchVideos();

    // REAL-TIME SUBSCRIPTION - Admin changes will reflect instantly
    const channel = supabase
      .channel('videos_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'videos' },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchVideos(); // Refetch videos when any change happens
        }
      )
      .subscribe();

    // Fetch categories
    const fetchCategories = async () => {
      const stored = getCategories();
      setCategories(stored);
    };
    fetchCategories();

    // Popup logic
    const popups = getStoredPopups();
    const active = popups.find(p => p.isActive);
    const t1 = setTimeout(() => {
      if (active && !isSubscribed) { setActivePopup(active); setShowGlobalPopup(true); }
    }, 2200);
    const hasSeenTrial = sessionStorage.getItem('trialPopupShown');
    const t2 = setTimeout(() => {
      if (!hasSeenTrial && !isSubscribed) { setShowTrialPopup(true); sessionStorage.setItem('trialPopupShown', 'true'); }
    }, 1800);
    
    return () => { 
      clearTimeout(t1); 
      clearTimeout(t2);
      channel.unsubscribe();
    };
  }, [isSubscribed]);

  // Listen for localStorage changes from admin
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reelramp_videos') {
        setAllVideos(getStoredVideos());
      }
      if (e.key === 'reelramp_categories') {
        setCategories(getCategories());
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const allCats = ["All", ...categories];

  const filtered = allVideos.filter(v => {
    const matchCat = selectedCategory === "All" || v.category === selectedCategory;
    const matchSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = categories.map(cat => ({
    cat, videos: filtered.filter(v => v.category === cat),
  })).filter(g => g.videos.length > 0);

  const handleVideoClick = (video: Video) => {
    addToWatchHistory(video.id, 0, 0);
    if (!isSubscribed) {
      incrementScrollCount();
      const count = getScrollCount();
      if (count % 3 === 0 && count > 0) { setShowScrollPaywall(true); return; }
    }
    if (video.isPremium && !isSubscribed) { setPaywallVideo(video); setShowPaywall(true); }
    else navigate(`/player/${video.id}`);
  };

  const handleResumeVideo = (id: number) => navigate(`/player/${id}`);

  const toggleSave = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = library.includes(id) ? library.filter(x => x !== id) : [...library, id];
    setLibrary(updated);
    ls.set('reelramp_library', updated);
  };

  const subSettings = getSubSettings();

  return (
    <div className="pb-20 md:pb-8">
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img src={REELRAMP_LOGO} alt="ReelRamp" className="h-9 w-auto object-contain"
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              <div>
                <h1 className="text-3xl font-semibold tracking-tighter">ReelRamp</h1>
                <p className="text-[10px] text-[#a1a1aa] -mt-1">SHORTS • PREMIUM</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/store')}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] active:scale-95 rounded-2xl text-sm transition-all">
                <ShoppingBag size={16} className="text-[#c5a26f]" /> Store
              </button>
              <button onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] active:scale-95 rounded-2xl text-sm transition-all">
                <UserIcon size={18} /> {user ? 'Profile' : 'Guest'}
              </button>
            </div>
          </div>
          <div className="relative">
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search premium shorts and stories..."
              className="w-full bg-[#111] border border-[#333] rounded-3xl py-3.5 pl-12 pr-5 text-sm focus:outline-none focus:border-[#c5a26f] placeholder:text-[#666]" />
            <div className="absolute left-5 top-4 text-[#666]"><Star size={18} /></div>
          </div>
        </div>
      </header>

      <div className="relative h-[340px] md:h-[420px] overflow-hidden">
        <img src="/images/hero.jpg" alt="ReelRamp Premium" className="absolute inset-0 w-full h-full object-cover brightness-[0.65]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-[#0a0a0a]" />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-9 max-w-3xl">
          <div className="inline-block px-4 py-1 bg-[#c5a26f] text-[#0a0a0a] text-xs tracking-[3px] font-medium rounded-full mb-4">PREMIUM EXCLUSIVE</div>
          <h2 className="text-5xl md:text-6xl font-semibold tracking-[-2.5px] leading-none mb-4">Cinematic<br />Short Stories</h2>
          <p className="text-lg text-[#a1a1aa] max-w-md">High-end investigative journalism, gripping horror, and transformative life lessons.</p>
          <button onClick={() => navigate('/player/4')}
            className="mt-6 flex items-center gap-3 bg-white text-black px-9 py-3.5 rounded-2xl font-medium hover:bg-[#c5a26f] hover:text-white active:scale-[0.98] transition-all">
            <Play size={19} /> Watch Premium Short
          </button>
        </div>
      </div>

      <div className="pt-8">
        <ContinueWatchingRail onNavigate={handleResumeVideo} />
      </div>

      <div className="max-w-7xl mx-auto px-5 pt-2 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold tracking-tight">Browse Categories</h3>
          {isSubscribed && <div className="text-xs px-3 py-1 bg-[#c5a26f] text-black rounded-full font-medium">PREMIUM MEMBER</div>}
          {!user && !isSubscribed && <div className="text-xs px-3 py-1 bg-[#1a1a1a] border border-[#333] text-[#a1a1aa] rounded-full">GUEST MODE</div>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {allCats.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2.5 whitespace-nowrap rounded-2xl text-sm font-medium transition-all border active:scale-95 ${selectedCategory === cat ? 'bg-[#c5a26f] text-black border-[#c5a26f]' : 'bg-[#1a1a1a] border-[#333] hover:bg-[#222]'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="text-xl font-semibold tracking-tight">For You</h3><p className="text-xs text-[#666]">Personalized picks just for you</p></div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          {allVideos.slice(0, 8).map(video => (
            <div key={video.id} onClick={() => handleVideoClick(video)} className="flex-shrink-0 w-[140px] cursor-pointer group">
              <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {video.isPremium && <div className="absolute top-2 right-2 bg-[#e11d48] text-[9px] px-2 py-0.5 rounded-full font-medium">PREMIUM</div>}
                <div className="absolute bottom-2 left-2 bg-black/70 text-[10px] px-2 py-px rounded font-mono">{video.duration}</div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"><Play size={18} className="text-black ml-0.5" /></div>
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

      <div className="max-w-7xl mx-auto px-5 pb-12">
        {selectedCategory === "All" ? (
          grouped.map(({ cat, videos }) => (
            <div key={cat} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold tracking-tight flex items-center gap-3">
                  {cat} <span className="text-xs px-3 py-px bg-[#222] rounded-full text-[#666] font-normal">{videos.length}</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {videos.map(video => (
                  <VideoCard key={video.id} video={video} isSubscribed={isSubscribed} isSaved={library.includes(video.id)}
                    onClick={() => handleVideoClick(video)} onSave={e => toggleSave(video.id, e)} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-5 flex items-center gap-3">
              {selectedCategory} <span className="text-xs px-3 py-px bg-[#222] rounded-full text-[#666] font-normal">{filtered.length}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map(video => (
                <VideoCard key={video.id} video={video} isSubscribed={isSubscribed} isSaved={library.includes(video.id)}
                  onClick={() => handleVideoClick(video)} onSave={e => toggleSave(video.id, e)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScrollPaywall && (
          <SubscriptionInterceptModal onClose={() => setShowScrollPaywall(false)}
            onSubscribe={() => { setShowScrollPaywall(false); resetScrollCount(); navigate('/subscription'); }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPaywall && paywallVideo && (
          <PaywallModal video={paywallVideo} onClose={() => { setShowPaywall(false); setPaywallVideo(null); }}
            onSubscribe={() => { setShowPaywall(false); navigate('/subscription'); }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGlobalPopup && activePopup && !isSubscribed && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-5" onClick={() => setShowGlobalPopup(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-[#111] max-w-lg w-full rounded-3xl overflow-hidden border border-[#333]" onClick={e => e.stopPropagation()}>
              <img src={activePopup.imageUrl} alt={activePopup.title} className="w-full" />
              <div className="p-8 text-center">
                <h3 className="text-3xl font-semibold tracking-tight mb-1">{activePopup.title}</h3>
                <p className="text-[#a1a1aa] mb-6">Limited time offer. Unlock unlimited premium shorts.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowGlobalPopup(false)} className="flex-1 py-3.5 border border-[#444] rounded-2xl">Maybe Later</button>
                  <button onClick={() => { setShowGlobalPopup(false); navigate(activePopup.redirectUrl); }} className="flex-1 py-3.5 bg-[#c5a26f] text-black rounded-2xl font-semibold">Subscribe Now</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showTrialPopup && subSettings.showTrialPopup && !isSubscribed && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60" onClick={() => setShowTrialPopup(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.35 }}
              className="relative w-full max-w-[380px] bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowTrialPopup(false)} className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center text-white/70 hover:text-white bg-black/40 rounded-full"><X size={18} /></button>
              <div className="pt-8 pb-4 px-8 flex justify-center"><Logo size={36} /></div>
              {(() => {
                const ps = getPromoSettings();
                if (!ps.isEnabled || !ps.videoUrl) return null;
                const src = ps.videoUrl.includes('embed') ? ps.videoUrl
                  : `https://www.youtube.com/embed/${ps.videoUrl.includes('v=') ? ps.videoUrl.split('v=')[1]?.split('&')[0] : ps.videoUrl.split('/').pop()}`;
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
                <button onClick={() => { setShowTrialPopup(false); navigate('/subscription'); }}
                  className="w-full py-4 bg-white text-[#0a0a0a] font-semibold text-lg tracking-wider rounded-3xl active:scale-[0.98] transition-transform shadow-lg">
                  Pay {subSettings.trialOfferPrice} — Start Trial
                </button>
                <p className="text-[10px] text-[#888] mt-4">After {subSettings.trialOfferDuration}, auto-pay {subSettings.fullPrice} for {subSettings.fullValidity}. Cancel anytime.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// VIDEO CARD
// ============================================================
interface VideoCardProps {
  video: Video;
  isSubscribed: boolean;
  isSaved: boolean;
  onClick: () => void;
  onSave: (e: React.MouseEvent) => void;
}

function VideoCard({ video, isSubscribed, isSaved, onClick, onSave }: VideoCardProps) {
  const rating = getAverageRating(video.id);
  return (
    <div onClick={onClick} className="group relative bg-[#1a1a1a] rounded-3xl overflow-hidden cursor-pointer border border-[#222] hover:border-[#c5a26f]/50 active:scale-[0.97] transition-all">
      <div className="relative aspect-[9/16] overflow-hidden">
        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" />
        {video.isPremium && (
          <div className="absolute top-3 right-3 bg-[#e11d48] text-[10px] px-3 py-px font-medium tracking-widest rounded-full flex items-center gap-1">
            <Lock size={10} /> PREMIUM
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-black/70 text-xs px-2.5 py-px rounded font-mono tracking-[1px]">{video.duration}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center"><Play className="text-black ml-0.5" size={26} /></div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-[15px] tracking-[-0.2px] line-clamp-1">{video.title}</h4>
            <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-2 leading-snug">{video.description}</p>
          </div>
          <button onClick={onSave} className="mt-0.5 p-1.5 hover:bg-[#222] active:scale-90 rounded-xl transition-all">
            <Bookmark size={18} className={isSaved ? "fill-[#c5a26f] text-[#c5a26f]" : "text-[#666]"} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="px-2.5 py-px bg-[#222] text-[#a1a1aa] rounded">{video.category}</span>
          <div className="flex items-center gap-1 text-[#c5a26f]">
            <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= Math.round(rating.average) ? "fill-current" : ""} />)}</div>
            <span className="text-[#666] text-[10px] ml-0.5">{rating.average.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAYWALL MODAL
// ============================================================
function PaywallModal({ video, onClose, onSubscribe }: { video: Video; onClose: () => void; onSubscribe: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ ease: [0.23, 1, 0.32, 1] }}
        className="bg-[#111] w-full max-w-md rounded-3xl overflow-hidden border border-[#333]" onClick={e => e.stopPropagation()}>
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6"><Lock className="text-[#c5a26f]" size={32} /></div>
          <h3 className="text-3xl font-semibold tracking-tight mb-2">Premium Content</h3>
          <p className="text-[#a1a1aa] mb-7 text-[15px]">Unlock <span className="text-white font-medium">"{video?.title}"</span> and all premium shorts with a ReelRamp subscription.</p>
          <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6 text-left text-sm">
            <div className="flex justify-between mb-1.5 text-[#a1a1aa]"><span>Duration</span><span className="font-mono text-white">{video?.duration}</span></div>
            <div className="flex justify-between mb-1.5 text-[#a1a1aa]"><span>Category</span><span className="text-white">{video?.category}</span></div>
            <div className="pt-4 border-t border-[#333] text-[#c5a26f] text-xs tracking-[1.5px]">EXCLUSIVE • INVESTIGATIVE • CINEMATIC</div>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={onSubscribe} className="w-full py-4 bg-[#c5a26f] text-[#0a0a0a] rounded-2xl font-semibold text-base tracking-wider active:scale-[0.98] transition-transform">SUBSCRIBE TO UNLOCK</button>
            <button onClick={onClose} className="text-sm text-[#666] py-2">Maybe Later</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================
// SHORTS PLAYER PAGE
// ============================================================
function ShortsPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSubscribed } = useAuth();
  const [feedVideos, setFeedVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [library, setLibrary] = useState<number[]>(() => ls.get('reelramp_library', []));
  const [userRating, setUserRating] = useState(0);
  const [showScrollPaywall, setShowScrollPaywall] = useState(false);

  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [resumeTimestamp, setResumeTimestamp] = useState(0);

  const currentVideoId = parseInt(id || "1");

  const handleUserActivity = useCallback(() => {
    setOverlayVisible(true);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => setOverlayVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      overlayTimerRef.current = setTimeout(() => setOverlayVisible(false), 3000);
    } else {
      setOverlayVisible(true);
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    }
    return () => { if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current); };
  }, [isPlaying]);

  useEffect(() => {
    const vids = getStoredVideos();
    setFeedVideos(vids);
    const idx = vids.findIndex(v => v.id === currentVideoId);
    setCurrentIndex(idx !== -1 ? idx : 0);
    setResumeTimestamp(getResumeTimestamp(currentVideoId));
  }, [currentVideoId]);

  const currentShort = feedVideos[currentIndex];

  useEffect(() => {
    if (currentShort) {
      incrementView(currentShort.id);
      const ratings = ls.get<Record<number, number>>('reelramp_ratings', {});
      setUserRating(ratings[currentShort.id] || 0);
      setResumeTimestamp(getResumeTimestamp(currentShort.id));
    }
  }, [currentIndex, currentShort]);

  const checkPremium = useCallback((): boolean => {
    if (currentShort?.isPremium && !isSubscribed) { setShowPaywall(true); setIsPlaying(false); return false; }
    return true;
  }, [currentShort, isSubscribed]);

  const tryNavigateNext = () => {
    if (!isSubscribed) {
      incrementScrollCount();
      const count = getScrollCount();
      if (count % 3 === 0 && count > 0) { setShowScrollPaywall(true); return; }
    }
    if (currentIndex < feedVideos.length - 1 && checkPremium()) {
      setCurrentIndex(i => i + 1); setIsPlaying(true); setIsLiked(false); setOverlayVisible(true);
    }
  };

  const tryNavigatePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1); setIsPlaying(true); setIsLiked(false); setOverlayVisible(true);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -90) tryNavigateNext();
    else if (info.offset.y > 90) tryNavigatePrev();
  };

  const toggleSave = () => {
    if (!currentShort) return;
    const updated = library.includes(currentShort.id) ? library.filter(x => x !== currentShort.id) : [...library, currentShort.id];
    setLibrary(updated);
    ls.set('reelramp_library', updated);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/player/${currentShort?.id}`;
    if (navigator.share) navigator.share({ title: currentShort?.title, url });
    else navigator.clipboard.writeText(url);
  };

  const handleEnded = () => {
    if (currentShort) addToWatchHistory(currentShort.id, 100, 0);
    tryNavigateNext();
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    if (!currentShort || duration === 0) return;
    const progress = Math.round((currentTime / duration) * 100);
    if (Math.round(currentTime) % 5 === 0) {
      addToWatchHistory(currentShort.id, progress, currentTime);
    }
  };

  const rateVideo = (star: number) => {
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
    <div className="fixed inset-0 bg-black z-50 overflow-hidden transform-gpu" style={{ height: '100dvh' }}>
      <motion.div animate={{ opacity: overlayVisible ? 1 : 0, y: overlayVisible ? 0 : -20 }} transition={{ duration: 0.25 }}
        className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-5 pt-8 pb-2 bg-gradient-to-b from-black/70 to-transparent"
        style={{ pointerEvents: overlayVisible ? 'auto' : 'none' }}>
        <button onClick={() => navigate(-1)} className="p-3 bg-black/40 rounded-2xl backdrop-blur active:scale-90 transition-transform"><ArrowLeft size={22} /></button>
        <div className="text-xs tracking-[3px] text-white/70 font-medium">{currentShort.category.toUpperCase()} • {currentShort.duration}</div>
        <div className="text-sm px-3 py-1 bg-white/10 rounded-full font-mono">{currentIndex + 1} / {feedVideos.length}</div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div key={currentIndex} className="absolute inset-0 flex flex-col transform-gpu"
          drag="y" dragConstraints={{ top: -120, bottom: 120 }} onDragEnd={handleDragEnd} dragElastic={0.15}
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
          transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.25 }}>
          <div className="relative w-full" style={{ height: '100dvh' }}>
            <CinematicPlayer
              video={currentShort}
              isPlaying={isPlaying}
              onPlayPause={() => checkPremium() && setIsPlaying(p => !p)}
              onEnded={handleEnded}
              overlayVisible={overlayVisible}
              onUserActivity={handleUserActivity}
              resumeFrom={resumeTimestamp}
              onTimeUpdate={handleTimeUpdate}
            />

            {!isPlaying && (
              <div onClick={() => { checkPremium() && setIsPlaying(true); handleUserActivity(); }}
                className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                  <Play size={38} className="text-black ml-1" />
                </div>
              </div>
            )}

            <motion.div animate={{ opacity: overlayVisible ? 1 : 0, y: overlayVisible ? 0 : 30 }} transition={{ duration: 0.25 }}
              className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pb-20"
              style={{ pointerEvents: overlayVisible ? 'auto' : 'none' }}>
              <h2 className="text-3xl font-semibold tracking-[-1.2px] leading-none mb-1.5">{currentShort.title}</h2>
              <p className="text-sm text-white/70 leading-snug line-clamp-3 pr-16">{currentShort.description}</p>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={() => rateVideo(s)} className="text-2xl transition active:scale-125">
                      {s <= userRating ? '★' : '☆'}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-white/60">Rate this short</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <motion.div animate={{ opacity: overlayVisible ? 1 : 0, x: overlayVisible ? 0 : 30 }} transition={{ duration: 0.25 }}
        className="absolute right-4 bottom-[110px] flex flex-col items-center gap-5 z-50"
        style={{ pointerEvents: overlayVisible ? 'auto' : 'none' }}>
        <button onClick={() => { setIsLiked(l => !l); handleUserActivity(); }} className="flex flex-col items-center gap-1">
          <div className={`p-4 rounded-2xl transition active:scale-90 ${isLiked ? 'bg-[#e11d48]' : 'bg-black/60 backdrop-blur'}`}>
            <Heart size={24} className={isLiked ? "fill-white text-white" : ""} />
          </div>
          <span className="text-[10px] tracking-wider">LIKE</span>
        </button>
        <button onClick={() => { toggleSave(); handleUserActivity(); }} className="flex flex-col items-center gap-1">
          <div className="p-4 rounded-2xl bg-black/60 backdrop-blur active:scale-90 transition">
            <Bookmark size={24} className={library.includes(currentShort.id) ? "fill-[#c5a26f] text-[#c5a26f]" : ""} />
          </div>
          <span className="text-[10px] tracking-wider">SAVE</span>
        </button>
        <button onClick={() => { handleShare(); handleUserActivity(); }} className="flex flex-col items-center gap-1">
          <div className="p-4 rounded-2xl bg-black/60 backdrop-blur active:scale-90 transition"><Share2 size={24} /></div>
          <span className="text-[10px] tracking-wider">SHARE</span>
        </button>
        {currentShort.isPremium && !isSubscribed && (
          <button onClick={() => { setShowPaywall(true); handleUserActivity(); }} className="mt-2 flex flex-col items-center active:scale-90 transition">
            <div className="p-3.5 bg-[#e11d48] rounded-2xl"><Lock size={22} /></div>
            <span className="text-[9px] mt-1 text-[#e11d48] font-medium">SUBSCRIBE</span>
          </button>
        )}
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between max-w-[420px] mx-auto">
          <button onClick={() => { tryNavigatePrev(); handleUserActivity(); }} disabled={currentIndex === 0}
            className="p-4 disabled:opacity-30 active:scale-90 transition-transform"><ArrowLeft size={22} /></button>
          <button onClick={() => { checkPremium() && setIsPlaying(p => !p); handleUserActivity(); }}
            className="p-4 bg-white/10 hover:bg-white/20 active:scale-90 transition-all rounded-2xl backdrop-blur-lg">
            {isPlaying ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
          </button>
          <button onClick={() => { tryNavigateNext(); handleUserActivity(); }} disabled={currentIndex === feedVideos.length - 1}
            className="p-4 disabled:opacity-30 active:scale-90 transition-transform text-sm font-medium">NEXT</button>
        </div>
      </div>

      <AnimatePresence>
        {showScrollPaywall && (
          <SubscriptionInterceptModal onClose={() => setShowScrollPaywall(false)}
            onSubscribe={() => { setShowScrollPaywall(false); resetScrollCount(); navigate('/subscription'); }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showPaywall && (
          <PaywallModal video={currentShort} onClose={() => setShowPaywall(false)}
            onSubscribe={() => { setShowPaywall(false); navigate('/subscription'); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// DIGITAL STORE PAGE
// ============================================================
function DigitalStorePage() {
  const navigate = useNavigate();
  const { isSubscribed } = useAuth();
  const [products, setProducts] = useState<DigitalProduct[]>(() => getDigitalProducts());
  const [activeFilter, setActiveFilter] = useState<'all' | 'workshop' | 'guide' | 'merch'>('all');
  const [buyTarget, setBuyTarget] = useState<DigitalProduct | null>(null);

  const filtered = activeFilter === 'all' ? products : products.filter(p => p.category === activeFilter);
  const categoryLabel: Record<string, string> = { workshop: '🎬 Workshops', guide: '📄 Guides', merch: '👕 Merch' };

  return (
    <div className="pb-24 max-w-5xl mx-auto px-4 pt-8 w-full overflow-x-hidden">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-sm text-[#a1a1aa] active:scale-95 transition-transform"><ArrowLeft size={18} /> Back</button>
      <div className="mb-8">
        <div className="inline-block px-4 py-1 bg-[#c5a26f]/20 border border-[#c5a26f]/40 text-[#c5a26f] text-xs tracking-[3px] font-medium rounded-full mb-4">DIGITAL STORE</div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-2px]">Creator<br />Resources.</h1>
        <p className="text-[#a1a1aa] mt-3 text-sm sm:text-base">Workshops, guides, and exclusive merch for serious storytellers.</p>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
        {(['all', 'workshop', 'guide', 'merch'] as const).map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all border active:scale-95 flex-shrink-0 ${activeFilter === f ? 'bg-[#c5a26f] text-black border-[#c5a26f]' : 'bg-[#1a1a1a] border-[#333]'}`}>
            {f === 'all' ? '✦ All' : categoryLabel[f]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(product => (
          <div key={product.id} className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden group hover:border-[#c5a26f]/40 active:scale-[0.98] transition-all">
            <div className="relative aspect-video overflow-hidden bg-[#1a1a1a]">
              <img src={product.thumbnailUrl} alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={e => { e.currentTarget.src = `https://via.placeholder.com/400x225/1a1a1a/c5a26f?text=${product.category.toUpperCase()}`; }} />
              {product.badge && <div className="absolute top-3 left-3 bg-[#c5a26f] text-black text-[9px] px-3 py-0.5 rounded-full font-bold tracking-widest">{product.badge}</div>}
              {product.isPremium && <div className="absolute top-3 right-3 bg-[#e11d48] text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Lock size={8} /> PREMIUM</div>}
            </div>
            <div className="p-4 sm:p-5">
              <div className="text-xs text-[#c5a26f] tracking-widest mb-1">{categoryLabel[product.category]?.replace(/^[^ ]+ /, '')}</div>
              <h3 className="font-semibold text-[15px] tracking-tight leading-snug mb-2">{product.title}</h3>
              <p className="text-xs text-[#a1a1aa] leading-snug mb-4 line-clamp-2">{product.description}</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-2xl font-semibold text-[#c5a26f] tracking-tight">₹{product.price.toLocaleString()}</div>
                <button
                  onClick={() => product.isPremium && !isSubscribed ? navigate('/subscription') : setBuyTarget(product)}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#c5a26f] text-black rounded-2xl text-sm font-semibold active:scale-95 transition-transform">
                  {product.isPremium && !isSubscribed ? 'Unlock' : 'Buy Now'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {buyTarget && (
          <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-5" onClick={() => setBuyTarget(null)}>
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#111] w-full max-w-sm rounded-3xl p-8 border border-[#333]" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">{buyTarget.category === 'workshop' ? '🎬' : buyTarget.category === 'guide' ? '📄' : '👕'}</div>
                <h3 className="text-2xl font-semibold tracking-tight">{buyTarget.title}</h3>
                <div className="text-[#c5a26f] text-3xl font-semibold mt-3">₹{buyTarget.price.toLocaleString()}</div>
              </div>
              <button onClick={() => { alert('Payment gateway integration required. Connect Razorpay/Stripe in Admin → Payment Settings.'); setBuyTarget(null); }}
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl mb-3 active:scale-[0.98] transition-transform">Proceed to Payment</button>
              <button onClick={() => setBuyTarget(null)} className="w-full py-3 text-sm text-[#666]">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// SUBSCRIPTION PAGE
// ============================================================
function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, isSubscribed, setIsSubscribed } = useAuth();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const subSettings = getSubSettings();
  const paymentConfig = getPaymentSettings();

  const activateSubscription = () => {
    ls.set('reelramp_subscribed', true);
    setIsSubscribed(true);
    setPaymentProcessing(false);
    setShowPaymentModal(false);
    setShowTrialModal(false);
    setPaymentSuccess(true);
    resetScrollCount();
  };

  const processPayment = () => {
    setPaymentProcessing(true);
    setTimeout(activateSubscription, 1800);
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle size={48} className="text-[#22c55e]" /></div>
          <h2 className="text-4xl font-semibold tracking-tight mb-3">You're Premium!</h2>
          <p className="text-[#a1a1aa] mb-10">Unlimited access to all cinematic shorts is now unlocked.</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-lg tracking-wider active:scale-[0.98] transition-transform">Start Watching</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-10 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-8 text-sm text-[#a1a1aa] active:scale-95 transition-transform"><ArrowLeft size={18} /> Back</button>
      <div className="mb-10">
        <h1 className="text-5xl sm:text-6xl font-semibold tracking-[-3.2px]">Unlock<br />Everything.</h1>
        <p className="text-lg text-[#a1a1aa] mt-3">Premium access to all shorts, offline downloads, and new releases.</p>
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
          <button onClick={() => user ? setShowTrialModal(true) : navigate('/profile')}
            className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider active:scale-[0.98] transition-transform">
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
          <button onClick={() => user ? setShowPaymentModal(true) : navigate('/profile')}
            className="w-full py-4 bg-white text-black font-semibold rounded-2xl tracking-wider active:scale-[0.98] transition-transform">Subscribe — {subSettings.fullPrice}</button>
        </div>
      )}
      <p className="text-center text-xs text-[#444] tracking-widest">
        SECURE PAYMENTS • {paymentConfig.activeGateway !== 'none' ? paymentConfig.activeGateway.toUpperCase() : 'MANUAL'} • CANCEL ANYTIME
      </p>

      {[
        { show: showPaymentModal, onClose: () => setShowPaymentModal(false), label: subSettings.fullPrice, title: "Order Summary" },
        { show: showTrialModal, onClose: () => setShowTrialModal(false), label: subSettings.trialOfferPrice, title: "Trial Order" },
      ].map(({ show, onClose, label, title }) => (
        <AnimatePresence key={title}>
          {show && (
            <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-5" onClick={() => !paymentProcessing && onClose()}>
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                className="bg-[#111] w-full max-w-md rounded-3xl p-8 border border-[#222]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-2xl tracking-tight">{title}</h3>
                  {!paymentProcessing && <button onClick={onClose} className="active:scale-90 transition-transform"><X size={20} /></button>}
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6">
                  <div className="flex justify-between font-semibold border-t border-[#333] pt-3">
                    <span>Total</span><span className="text-[#c5a26f]">{label}</span>
                  </div>
                </div>
                {paymentConfig.activeGateway !== 'none' && (
                  <div className="text-xs text-center text-[#666] mb-4">
                    Paying via <span className="text-[#c5a26f] font-medium">{paymentConfig.activeGateway.toUpperCase()}</span>
                    {paymentConfig.isLiveMode ? ' (LIVE)' : ' (TEST)'}
                  </div>
                )}
                <button onClick={processPayment} disabled={paymentProcessing}
                  className="w-full py-4 rounded-2xl bg-[#c5a26f] text-black text-lg font-semibold tracking-wide disabled:opacity-70 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
                  {paymentProcessing ? <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Processing...</> : `Pay ${label}`}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      ))}

      <AnimatePresence>
        {showCancelConfirm && (
          <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-5">
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#111] w-full max-w-sm rounded-3xl p-8 border border-[#333]">
              <h3 className="font-semibold text-xl mb-2">Cancel Subscription?</h3>
              <p className="text-[#a1a1aa] text-sm mb-7">You'll lose access to all premium content.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 border border-[#333] rounded-2xl text-sm">Keep Premium</button>
                <button onClick={() => { ls.remove('reelramp_subscribed'); setIsSubscribed(false); setShowCancelConfirm(false); }} className="flex-1 py-3 bg-[#e11d48] rounded-2xl text-sm font-medium">Yes, Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// PROFILE PAGE
// ============================================================
function ProfilePage() {
  const navigate = useNavigate();
  const { user, isSubscribed, isGuest, signOut, loading } = useAuth();
  const [library, setLibrary] = useState<Video[]>([]);
  const [downloads, setDownloads] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'downloads' | 'account'>('library');
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState('');

  useEffect(() => {
    if (!user) return;
    const vids = getStoredVideos();
    setAllVideos(vids);
    const libIds: number[] = ls.get('reelramp_library', []);
    setLibrary(vids.filter(v => libIds.includes(v.id)));
    const dlIds: number[] = ls.get('reelramp_downloads', []);
    setDownloads(vids.filter(v => dlIds.includes(v.id)));
    setWatchHistory(getWatchHistory());
  }, [user]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );

  if (isGuest) {
    const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(''); setAuthSuccess(''); setAuthLoading(true);
      try {
        if (authMode === 'register') {
          const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
          if (error) throw error;
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) { setAuthSuccess('Account created! Please log in.'); setAuthMode('login'); }
        } else if (authMode === 'forgot') {
          const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/profile` });
          if (error) throw error;
          setAuthSuccess('Reset link sent to your email!');
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }
      } catch (err: unknown) {
        setAuthError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setAuthLoading(false);
      }
    };

    const handleGoogleOAuth = async () => {
      setGoogleLoading(true); setAuthError('');
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/profile`, queryParams: { prompt: 'select_account' } }
        });
        if (error) throw error;
      } catch (err: unknown) {
        setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
        setGoogleLoading(false);
      }
    };

    return (
      <div className="max-w-md mx-auto px-5 pt-10 pb-24">
        <div className="text-center mb-8">
          <Logo size={36} className="justify-center mb-4" />
          <h1 className="text-3xl font-semibold tracking-tight mb-1">Your Profile</h1>
          <p className="text-sm text-[#a1a1aa]">Sign in to unlock your library, history, and premium access.</p>
        </div>
        <div className="bg-[#111] border border-[#222] rounded-3xl p-7">
          {authMode !== 'forgot' && (
            <div className="flex bg-[#1a1a1a] rounded-2xl p-1 mb-6">
              {(['login', 'register'] as const).map(m => (
                <button key={m} onClick={() => { setAuthMode(m); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${authMode === m ? 'bg-[#c5a26f] text-black' : 'text-[#666]'}`}>
                  {m === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>
          )}
          {authMode !== 'forgot' && (
            <>
              <button onClick={handleGoogleOAuth} disabled={googleLoading}
                className="w-full py-3.5 mb-4 bg-white text-black font-medium rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-60">
                {googleLoading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <GoogleIcon />}
                Continue with Google
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#222]" /><span className="text-xs text-[#444]">or</span><div className="flex-1 h-px bg-[#222]" />
              </div>
            </>
          )}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none transition-colors" />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none transition-colors" />
            {authMode !== 'forgot' && (
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required minLength={6}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none transition-colors" />
            )}
            {authError && <p className="text-[#e11d48] text-sm px-1">{authError}</p>}
            {authSuccess && <p className="text-[#22c55e] text-sm px-1">{authSuccess}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
              {authLoading && <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              {authMode === 'login' ? 'Login' : authMode === 'register' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>
          {authMode === 'login' && <button onClick={() => setAuthMode('forgot')} className="w-full text-center text-xs text-[#555] mt-4 hover:text-[#c5a26f]">Forgot password?</button>}
          {authMode === 'forgot' && <button onClick={() => setAuthMode('login')} className="w-full text-center text-xs text-[#555] mt-4 hover:text-white">← Back to Login</button>}
        </div>
        <button onClick={() => navigate('/')} className="block w-full text-center text-xs text-[#444] mt-6 hover:text-white">← Continue browsing as Guest</button>
      </div>
    );
  }

  const displayName = user!.user_metadata?.full_name || user!.email?.split('@')[0] || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  const continueWatching = watchHistory
    .filter(h => h.progress > 0 && h.progress < 95 && h.timestamp > 0)
    .slice(0, 6)
    .map(h => ({ ...h, video: allVideos.find(v => v.id === h.videoId) }))
    .filter(h => h.video) as (WatchHistoryItem & { video: Video })[];

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 pt-8 md:pt-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-semibold text-3xl md:text-5xl tracking-[-2px]">Profile</h1>
        <button onClick={() => navigate('/')} className="text-sm text-[#a1a1aa] active:scale-95 transition-transform">Home</button>
      </div>
      <div className="flex items-center gap-5 mb-9 border-b border-[#222] pb-8">
        <div className="w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-[#c5a26f]/50 bg-[#222] flex items-center justify-center flex-shrink-0">
          <div className="text-4xl font-bold text-[#c5a26f]">{initials}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">{displayName}</div>
          <div className="text-sm text-[#a1a1aa] truncate">{user!.email}</div>
          <button onClick={async () => { await signOut(); navigate('/'); }} className="text-xs text-[#e11d48] mt-1">Logout</button>
        </div>
      </div>

      <div className="mb-8 bg-[#111] border border-[#222] rounded-3xl p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="uppercase text-xs tracking-[2.5px] text-[#a1a1aa]">SUBSCRIPTION</div>
            <div className="font-semibold text-2xl md:text-3xl tracking-tight mt-1">{isSubscribed ? "Premium Active" : "Free Plan"}</div>
          </div>
          {isSubscribed ? (
            <div>
              <div className="text-[#22c55e] text-sm flex items-center gap-1.5"><CheckCircle size={16} /> ACTIVE</div>
              <button onClick={() => navigate('/subscription')} className="text-sm underline text-[#666] mt-1">Manage Subscription</button>
            </div>
          ) : (
            <button onClick={() => navigate('/subscription')}
              className="w-full md:w-auto px-8 py-3.5 bg-[#c5a26f] text-black text-sm font-semibold rounded-2xl active:scale-[0.98] transition-transform">UPGRADE TO PREMIUM</button>
          )}
        </div>
      </div>

      {continueWatching.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-[#c5a26f] rounded-lg flex items-center justify-center"><Clock size={13} className="text-black" /></div>
            <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {continueWatching.map(item => (
              <div key={item.videoId} onClick={() => navigate(`/player/${item.video.id}`)} className="flex-shrink-0 w-[160px] cursor-pointer group">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
                  <img src={item.video.thumbnail} alt={item.video.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div className="h-full bg-[#c5a26f]" style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
                <div className="mt-2 text-sm font-medium line-clamp-1">{item.video.title}</div>
                <div className="text-[11px] text-[#c5a26f]">Resume at {Math.floor(item.timestamp / 60)}:{String(Math.round(item.timestamp % 60)).padStart(2, '0')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex border-b border-[#222] mb-5 text-sm overflow-x-auto">
        {(['library', 'downloads', 'account'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 md:px-7 pb-4 border-b-2 transition whitespace-nowrap ${activeTab === tab ? 'border-[#c5a26f] text-white font-medium' : 'border-transparent text-[#666]'}`}>
            {tab === 'library' && 'My Library'}{tab === 'downloads' && 'Downloads'}{tab === 'account' && 'Account'}
          </button>
        ))}
      </div>

      {activeTab === 'library' && (
        library.length === 0 ? <div className="py-14 text-center text-[#666]">No saved shorts yet.</div> : (
          <div className="space-y-4">
            {library.map(video => (
              <div key={video.id} className="flex gap-3 bg-[#111] p-3 rounded-2xl border border-[#222]">
                <img src={video.thumbnail} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="font-medium text-sm line-clamp-1">{video.title}</div>
                  <div className="text-xs text-[#666] mt-0.5">{video.duration} • {video.category}</div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <button onClick={() => navigate(`/player/${video.id}`)} className="flex items-center gap-1 text-[#c5a26f]">PLAY <Play size={13} /></button>
                    <button onClick={() => { const updated = library.filter(v => v.id !== video.id); setLibrary(updated); ls.set('reelramp_library', updated.map(v => v.id)); }} className="text-[#666]">REMOVE</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      {activeTab === 'downloads' && (
        downloads.length === 0 ? <div className="text-center py-14 text-[#666]">No offline downloads.</div> : (
          <div className="space-y-4">
            {downloads.map(video => (
              <div key={video.id} className="flex gap-3 bg-[#111] p-3 rounded-2xl border border-[#222]">
                <img src={video.thumbnail} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" alt="" />
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="font-medium text-sm line-clamp-1">{video.title}</div>
                  <div className="text-xs text-[#666] mt-0.5">{video.duration}</div>
                  <div className="flex gap-3 mt-2 text-xs">
                    <button onClick={() => navigate(`/player/${video.id}`)} className="flex items-center gap-1 text-[#22c55e]">PLAY <Play size={13} /></button>
                    <button onClick={() => { const updated = downloads.filter(v => v.id !== video.id); setDownloads(updated); ls.set('reelramp_downloads', updated.map(v => v.id)); }} className="text-[#666]">DELETE</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
      {activeTab === 'account' && (
        <div className="space-y-6 text-sm">
          <div className="p-6 bg-[#111] rounded-3xl border border-[#222]">
            <div className="font-medium mb-4">Account Settings</div>
            <div className="flex justify-between py-4 border-t border-[#222]"><div>Email</div><div className="text-[#a1a1aa] truncate ml-4">{user!.email}</div></div>
            <div className="flex justify-between py-4 border-t border-[#222]"><div>User ID</div><div className="text-[#a1a1aa] font-mono text-xs">{user!.id?.slice(0, 12)}…</div></div>
            <div className="flex justify-between py-4 border-t border-[#222]"><div>Member Since</div><div className="text-[#a1a1aa]">{new Date(user!.created_at || '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div></div>
          </div>
          <button onClick={async () => { if (confirm("Sign out and clear all local data?")) { localStorage.clear(); await signOut(); navigate('/'); } }} className="text-[#e11d48] text-xs tracking-widest hover:underline">RESET ALL DATA & SIGN OUT</button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FOOTER
// ============================================================
function Footer() {
  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com/reelrampofficial', label: 'ReelRamp Official' },
    { name: 'Instagram', url: 'https://instagram.com/thoda_thehro_', label: '@thoda_thehro_' },
    { name: 'YouTube', url: 'https://youtube.com/@reelramp', label: 'ReelRamp Channel' },
    { name: 'WhatsApp', url: 'https://wa.me/917307493338', label: 'Direct Chat' },
  ];
  const settings = getSettings();
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#222] pt-14 pb-8 px-5 text-sm text-[#a1a1aa]">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center pb-12 border-b border-[#222]">
          <div className="inline-block px-4 py-1 text-xs tracking-[3px] text-[#c5a26f] border border-[#c5a26f]/30 rounded-full mb-4">FROM THE DIRECTOR</div>
          <blockquote className="text-2xl md:text-3xl font-light italic leading-snug text-white mb-6">"Kahaniyan sirf sunayi nahi jati, mehsoos ki jati hain."</blockquote>
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
              <span className="font-semibold tracking-tight">{settings.appName || "ReelRamp Shorts"}</span>
            </div>
            <p className="text-xs leading-snug pr-4">Premium cinematic short films and investigative stories.</p>
          </div>
          <div>
            <div className="font-medium text-white mb-4">Company</div>
            <div className="space-y-2 text-xs">
              {[['privacy','Privacy Policy'],['terms','Terms & Conditions'],['refund','Cancellation & Refund'],['shipping','Shipping & Delivery']].map(([path, label]) => (
                <a key={path} href={`/${path}`} className="block hover:text-white">{label}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="font-medium text-white mb-4">Support</div>
            <div className="space-y-[7px] text-xs">
              <div>{settings.supportEmail || "reelramporiginal@gmail.com"}</div>
              <div>{settings.supportPhone || "+91 7307493338"}</div>
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

// ============================================================
// BOTTOM NAVIGATION
// ============================================================
function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Home', icon: Home, key: 'home' },
    { path: '/player/1', label: 'For You', icon: Zap, key: 'foryou' },
    { path: '/store', label: 'Store', icon: ShoppingBag, key: 'store' },
    { path: '/profile', label: 'Profile', icon: UserIcon, key: 'profile' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#222] z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = item.path === '/' ? location.pathname === '/'
            : item.key === 'foryou' ? location.pathname.startsWith('/player')
            : location.pathname === item.path;
          return (
            <button key={item.key} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all active:scale-90 ${isActive ? 'text-[#c5a26f]' : 'text-[#a1a1aa]'}`}>
              <Icon size={20} />
              <span className="text-xs mt-0.5 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// LEGAL PAGES
// ============================================================
function LegalPage({ type }: { type: 'privacy' | 'terms' | 'refund' | 'shipping' }) {
  const navigate = useNavigate();
  const titles: Record<string, string> = { privacy: "Privacy Policy", terms: "Terms & Conditions", refund: "Cancellation & Refund Policy", shipping: "Shipping & Delivery Policy" };
  const contents: Record<string, string> = {
    privacy: `At ReelRamp Shorts, we respect your privacy.\n\n1. Information We Collect: Name, email, phone number, and payment details.\n\n2. How We Use Information: To provide access to premium content, process payments, and improve the service.\n\n3. Data Security: All data is encrypted. We never share personal information with third parties except for payment processing.\n\n4. Contact: reelramporiginal@gmail.com | +91 7307493338`,
    terms: `Welcome to ReelRamp Shorts. By accessing or using our platform, you agree to these Terms & Conditions.\n\n1. Subscription: Premium access is granted upon successful payment.\n\n2. Content: All short films are proprietary. Unauthorized distribution is prohibited.\n\n3. Payment: All payments are processed securely.\n\n4. Governing Law: Laws of India apply. Disputes resolved in Lucknow courts.`,
    refund: `Cancellation & Refund Policy\n\n1. You may cancel your subscription anytime from the Profile page.\n\n2. Refunds: Full refunds are available within 7 days of purchase if you have not watched more than 2 premium shorts.\n\n3. How to Request: Email reelramporiginal@gmail.com with your transaction ID. Refunds processed within 5-7 business days.`,
    shipping: `Shipping & Delivery Policy (Digital Products)\n\nReelRamp Shorts is a digital subscription service. There is no physical shipping involved.\n\n1. Instant Access: Upon successful payment, your subscription is activated immediately.\n\n2. Delivery Confirmation: A confirmation email is sent to your registered contact.\n\n3. Support: +91 7307493338 or reelramporiginal@gmail.com`,
  };
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 pb-28">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white active:scale-95 transition-transform"><ArrowLeft size={18} /> Back</button>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-2px] mb-3">{titles[type]}</h1>
      <div className="text-xs uppercase tracking-[3px] text-[#c5a26f] mb-8">REELRAMP ORIGINALS • LAST UPDATED MAY 2025</div>
      <div className="text-[#ccc] whitespace-pre-line leading-relaxed text-[15px]">{contents[type]}</div>
      <div className="mt-12 text-xs border-t border-[#222] pt-8 text-[#666]">
        Office: FF Shop No. 6, Arohi Arcade, Munshipulia, Lucknow - 226016<br />Support: reelramporiginal@gmail.com | +91 7307493338
      </div>
    </div>
  );
}

// ============================================================
// EDITOR PANEL
// ============================================================
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
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (password === EDITOR_PASSWORD ? setIsLoggedIn(true) : setError("Invalid password"))}
            placeholder="Editor Password" className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none" />
          {error && <p className="text-[#e11d48] text-sm text-center mt-2">{error}</p>}
          <button onClick={() => password === EDITOR_PASSWORD ? setIsLoggedIn(true) : setError("Invalid password")} className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold active:scale-[0.98] transition-transform">LOGIN AS EDITOR</button>
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
        <p className="text-[#a1a1aa] mb-8">Manage videos, popups and trial offers.</p>
        <div className="bg-[#111] rounded-3xl p-8 border border-[#222]">
          <p className="text-lg">Editor access granted. You can manage shorts and trial offers.</p>
          <button onClick={() => navigate('/admin')} className="mt-4 px-6 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium text-sm active:scale-95 transition-transform">Open Admin Panel</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OWNER PANEL
// ============================================================
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
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (password === OWNER_PASSWORD ? setIsLoggedIn(true) : setError("Invalid password"))}
            placeholder="Owner Password" className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none" />
          {error && <p className="text-[#e11d48] text-sm text-center mt-2">{error}</p>}
          <button onClick={() => password === OWNER_PASSWORD ? setIsLoggedIn(true) : setError("Invalid password")} className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold active:scale-[0.98] transition-transform">LOGIN AS OWNER</button>
          <div className="text-center mt-4"><button onClick={() => navigate('/')} className="text-xs text-[#666]">Back to App</button></div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#c5a26f] to-[#d4b17f] rounded-xl flex items-center justify-center"><Settings className="text-black" size={18} /></div>
            <div><div className="font-semibold">ReelRamp • Owner Studio</div><div className="text-[10px] text-[#c5a26f]">Full Access</div></div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => navigate('/admin-secure-7842')} className="text-sm px-4 py-2 bg-[#222] rounded-2xl">Editor Panel</button>
            <button onClick={() => navigate('/admin')} className="text-sm px-4 py-2 bg-[#c5a26f] text-black rounded-2xl">Admin Panel</button>
            <button onClick={() => navigate('/')} className="text-sm px-4 py-2 bg-[#e11d48] rounded-2xl">Exit</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2">Owner Control Center</h2>
        <p className="text-[#a1a1aa] mb-8">Complete access to all settings, users, and revenue</p>
        <div className="grid md:grid-cols-2 gap-6">
          {["Manage All Shorts","Subscription Plans","User Management","Revenue & Analytics","Payment Settings","Platform Settings"].map(item => (
            <div key={item} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex items-center justify-between">
              <span className="font-medium">{item}</span>
              <button onClick={() => navigate('/admin')} className="text-[#c5a26f] text-sm px-4 py-2 bg-[#1a1a1a] rounded-xl active:scale-95 transition-transform">Open →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PAGE (with Supabase sync)
// ============================================================
function AdminPage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInAdmin, setLoggedInAdmin] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'users' | 'analytics' | 'popups' | 'settings' | 'plans' | 'payment' | 'categories' | 'promo' | 'revenue' | 'store' | 'datatools'>('dashboard');

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
    isPremium: true, thumbnail: '', videoUrl: ''
  });
  const [digitalProducts, setDigitalProducts] = useState<DigitalProduct[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(null);
  const [productForm, setProductForm] = useState({
    title: '', description: '', price: 999,
    category: 'workshop' as DigitalProduct['category'],
    thumbnailUrl: '', isPremium: false, badge: ''
  });
  const [platformSplit, setPlatformSplit] = useState(60);
  const creatorSplit = 100 - platformSplit;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const ALLOWED_ADMINS = [
    { email: "admin@reelramp.com", password: "reelramp-pro-2025" },
    { email: "founder@reelramp.com", password: "admin2025" },
  ];

  const handleAdminLogin = () => {
    const valid = ALLOWED_ADMINS.find(a => a.email === adminEmail && a.password === adminPass);
    if (valid) { setLoggedInAdmin(valid.email); setIsAuthorized(true); setLoginError(''); }
    else setLoginError("Invalid credentials.");
  };

  useEffect(() => {
    if (!isAuthorized) return;
    loadAllData();
  }, [isAuthorized]);

  const loadAllData = () => {
    setAdminVideos(getStoredVideos());
    setPopups(getStoredPopups());
    setPlatformSettings(getSettings());
    setSubSettings(getSubSettings());
    setPaymentConfig(getPaymentSettings());
    setCategoriesState(getCategories());
    setPromoSettings(getPromoSettings());
    setVideoViews(getVideoViews());
    setDigitalProducts(getDigitalProducts());
    setAdminUsers(ls.get<AdminUser[]>('reelramp_admin_users', initialAdminUsers));
  };

  const syncVideosToSupabase = async (videos: Video[]) => {
    setSyncing(true);
    try {
      const { error } = await supabase.from('videos').upsert(videos);
      if (error) console.error('Supabase sync error:', error);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const saveVideo = async () => {
    if (!formData.title.trim()) return;
    let updated: Video[];
    if (editingVideo) {
      updated = adminVideos.map(v => v.id === editingVideo.id ? { ...v, ...formData } : v);
    } else {
      const newId = Math.max(0, ...adminVideos.map(v => v.id)) + 1;
      updated = [...adminVideos, { ...formData, id: newId } as Video];
    }
    setAdminVideos(updated);
    saveVideos(updated);
    await syncVideosToSupabase(updated);
    setShowAddModal(false);
    showToast(editingVideo ? "✅ Short updated & synced!" : "✅ Short published & synced!");
  };

  const deleteVideo = async (id: number) => {
    const updated = adminVideos.filter(v => v.id !== id);
    setAdminVideos(updated);
    saveVideos(updated);
    await syncVideosToSupabase(updated);
    showToast("Short deleted & synced!");
  };

  const openAddModal = () => {
    setFormData({ title: '', description: '', category: 'Horror', duration: '4:30', isPremium: true, thumbnail: '/images/horror1.jpg', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' });
    setEditingVideo(null);
    setShowAddModal(true);
  };

  const openEditModal = (video: Video) => {
    setFormData({ title: video.title, description: video.description, category: video.category, duration: video.duration, isPremium: video.isPremium, thumbnail: video.thumbnail, videoUrl: video.videoUrl });
    setEditingVideo(video);
    setShowAddModal(true);
  };

  const toggleUserSub = (userId: number) => {
    const updated = adminUsers.map(u => u.id === userId ? { ...u, subscribed: !u.subscribed } : u);
    setAdminUsers(updated);
    ls.set('reelramp_admin_users', updated);
  };

  const saveProduct = () => {
    if (!productForm.title.trim()) return;
    let updated: DigitalProduct[];
    if (editingProduct) {
      updated = digitalProducts.map(p => p.id === editingProduct.id ? { ...p, ...productForm } : p);
    } else {
      const newId = Math.max(0, ...digitalProducts.map(p => p.id)) + 1;
      updated = [...digitalProducts, { ...productForm, id: newId }];
    }
    setDigitalProducts(updated);
    saveDigitalProducts(updated);
    setShowProductModal(false);
    showToast(editingProduct ? "✅ Product updated!" : "✅ Product listed!");
  };

  const deleteProduct = (id: number) => {
    const updated = digitalProducts.filter(p => p.id !== id);
    setDigitalProducts(updated);
    saveDigitalProducts(updated);
    showToast("Product removed.");
  };

  const addCategory = () => {
    if (newCategoryName.trim()) {
      const updated = [...categories, newCategoryName.trim()];
      setCategoriesState(updated);
      saveCategories(updated);
      setNewCategoryName('');
      showToast("✅ Category added!");
    }
  };

  const updateCategory = (oldName: string, newName: string) => {
    const updated = categories.map(c => c === oldName ? newName : c);
    setCategoriesState(updated);
    saveCategories(updated);
    setEditingCatName(null);
    showToast("✅ Category updated!");
  };

  const deleteCategory = (catName: string) => {
    const updated = categories.filter(c => c !== catName);
    setCategoriesState(updated);
    saveCategories(updated);
    showToast("✅ Category deleted!");
  };

  const revenueData = getRevenueData();
  const totalRevenue = revenueData.reduce((s, r) => s + r.amount, 0);
  const platformRevenue = Math.round(totalRevenue * (platformSplit / 100));
  const creatorRevenue = totalRevenue - platformRevenue;

  const creatorEntries: CreatorRevenueEntry[] = adminVideos.slice(0, 5).map((v, i) => {
    const views = videoViews[v.id] || (10 + i * 7);
    const share = Math.round((views / Math.max(1, Object.values(videoViews).reduce((s, n) => s + n, 50))) * creatorRevenue);
    return { creatorName: `Creator ${i + 1}`, videoTitle: v.title, totalViews: views, revenueShare: share };
  });

  const downloadRevenueReport = () => {
    const lines = [
      '═══════════════════════════════════════════════════',
      '         REELRAMP PRO — REVENUE SHARING REPORT',
      '═══════════════════════════════════════════════════',
      `  Generated: ${new Date().toLocaleString('en-IN')}`,
      '───────────────────────────────────────────────────',
      `  Total Revenue:     ₹${totalRevenue.toLocaleString()}`,
      `  Platform (${platformSplit}%):   ₹${platformRevenue.toLocaleString()}`,
      `  Creators (${creatorSplit}%):    ₹${creatorRevenue.toLocaleString()}`,
      '───────────────────────────────────────────────────',
      ...creatorEntries.map(e => `  • ${e.creatorName.padEnd(14)} | ${String(e.totalViews).padEnd(6)} views | ₹${e.revenueShare.toLocaleString()}`),
      '───────────────────────────────────────────────────',
      ...revenueData.map(r => `  [${r.date}]  ${r.plan.padEnd(10)} ₹${r.amount}`),
      '═══════════════════════════════════════════════════',
      '  ReelRamp Originals Pvt. Ltd. | Lucknow',
      '═══════════════════════════════════════════════════',
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ReelRamp_Revenue_${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
    showToast("📄 Report downloaded!");
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
            <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="Admin Email"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none" />
            <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} placeholder="Password"
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none" />
            {loginError && <p className="text-[#e11d48] text-sm">{loginError}</p>}
          </div>
          <button onClick={handleAdminLogin} className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold tracking-wider active:scale-[0.98] transition-transform">ACCESS ADMIN DASHBOARD</button>
          <button onClick={() => navigate('/')} className="mt-4 text-sm text-[#666]">Back to App</button>
        </div>
      </div>
    );
  }

  const TAB_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'content', label: 'Content', icon: Play },
    { key: 'store', label: 'Store', icon: ShoppingBag },
    { key: 'revenue', label: 'Revenue', icon: TrendingUp },
    { key: 'popups', label: 'Popups', icon: Star },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Platform', icon: Settings },
    { key: 'plans', label: 'Plans', icon: CreditCard },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'categories', label: 'Categories', icon: Play },
    { key: 'promo', label: 'Promo', icon: Play },
    { key: 'datatools', label: 'Data', icon: Database },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {toast && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed top-6 right-6 z-[200] bg-[#111] border border-[#c5a26f]/40 text-white px-6 py-3 rounded-2xl text-sm shadow-xl">
          {toast}
        </motion.div>
      )}
      {syncing && (
        <div className="fixed top-6 left-6 z-[200] flex items-center gap-2 bg-[#111] border border-[#333] px-4 py-2 rounded-xl text-xs text-[#a1a1aa] pointer-events-none">
          <div className="w-3 h-3 border-2 border-[#c5a26f] border-t-transparent rounded-full animate-spin" /> Syncing to database...
        </div>
      )}

      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <Logo size={28} />
            <div><div className="font-semibold text-xl tracking-tighter text-white">Admin</div><div className="text-xs text-[#666] -mt-1">PRODUCTION CONTROL</div></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-[#c5a26f] hidden md:block">{loggedInAdmin}</span>
            <button onClick={() => navigate('/')} className="px-4 py-2 rounded-2xl border border-[#333] text-sm active:scale-95 transition-transform">View App</button>
            <button onClick={() => { setIsAuthorized(false); setLoggedInAdmin(''); }} className="px-4 py-2 rounded-2xl bg-[#e11d48] text-white text-sm active:scale-95 transition-transform">Logout</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-[#222] overflow-x-auto no-scrollbar">
          {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-3 border-b-2 transition whitespace-nowrap text-sm ${activeTab === key ? 'border-[#c5a26f] text-white' : 'border-transparent text-[#666]'}`}>
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        {activeTab === 'dashboard' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-4xl sm:text-5xl font-semibold tracking-[-2.5px]">Control Center</h2>
                <p className="text-[#a1a1aa]">Live platform metrics</p>
              </div>
              <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium text-sm self-start active:scale-95 transition-transform"><Plus size={18} /> New Short</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Total Shorts", value: adminVideos.length, sub: `${premiumShorts} Premium` },
                { label: "Active Users", value: adminUsers.length, sub: `${premiumUsers} Premium` },
                { label: "Total Plays", value: totalPlays, sub: "All time" },
                { label: "Est. Revenue", value: `₹${estimatedRevenue.toLocaleString()}`, sub: "Monthly recurring" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-7">
                  <div className="text-[#a1a1aa] text-xs tracking-widest">{stat.label}</div>
                  <div className="text-3xl sm:text-4xl font-semibold tracking-[-1.5px] mt-1">{stat.value}</div>
                  <div className="text-xs text-[#c5a26f] mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              {(['content', 'store', 'revenue', 'analytics'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className="p-5 text-left border border-[#222] hover:border-[#c5a26f] active:scale-95 transition-all rounded-2xl flex justify-between items-center capitalize">
                  {tab === 'store' ? 'Store' : tab === 'revenue' ? 'Revenue' : tab} <Play size={18} className="text-[#666]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div>
            <div className="flex justify-between mb-6 flex-wrap gap-3">
              <h3 className="text-3xl font-semibold tracking-tight">All Shorts ({adminVideos.length})</h3>
              <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c5a26f] text-black font-medium text-sm active:scale-95 transition-transform"><Plus size={17} /> Add New</button>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="border-b border-[#222] text-sm text-[#a1a1aa]">
                  <tr><th className="text-left py-4 px-6">Short</th><th className="text-left py-4">Category</th><th className="text-left py-4">Duration</th><th className="text-left py-4">Views</th><th className="text-left py-4">Access</th><th className="text-right py-4 px-6">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {adminVideos.map(video => (
                    <tr key={video.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-4 px-6"><div className="flex items-center gap-4"><img src={video.thumbnail} className="w-12 h-12 object-cover rounded-xl flex-shrink-0" alt="" /><div><div className="font-medium text-sm">{video.title}</div><div className="text-xs text-[#666] line-clamp-1">{video.description}</div></div></div></td>
                      <td className="text-sm text-[#a1a1aa]">{video.category}</td>
                      <td className="font-mono text-sm text-[#a1a1aa]">{video.duration}</td>
                      <td className="font-mono text-sm text-[#c5a26f]">{videoViews[video.id] || 0}</td>
                      <td>{video.isPremium ? <span className="text-xs px-2 py-px bg-[#e11d48] rounded">PREMIUM</span> : <span className="text-xs px-2 py-px bg-[#22c55e] text-black rounded">FREE</span>}</td>
                      <td className="text-right px-6"><div className="flex justify-end gap-1"><button onClick={() => openEditModal(video)} className="p-2 hover:bg-[#222] active:scale-90 transition-all rounded-xl"><Edit2 size={16} /></button><button onClick={() => deleteVideo(video.id)} className="p-2 hover:bg-[#e11d48]/10 text-[#e11d48] active:scale-90 transition-all rounded-xl"><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div>
            <div className="flex justify-between mb-6 flex-wrap gap-3">
              <div><h3 className="text-3xl font-semibold tracking-tight">Store Inventory</h3><p className="text-[#a1a1aa] text-sm mt-1">Add, edit, or remove digital products.</p></div>
              <button onClick={() => { setProductForm({ title: '', description: '', price: 999, category: 'workshop', thumbnailUrl: '', isPremium: false, badge: '' }); setEditingProduct(null); setShowProductModal(true); }} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c5a26f] text-black font-medium text-sm active:scale-95 transition-transform self-start"><Plus size={17} /> Add Product</button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[{ label: 'Total Products', value: digitalProducts.length }, { label: 'Workshops', value: digitalProducts.filter(p => p.category === 'workshop').length }, { label: 'Premium Items', value: digitalProducts.filter(p => p.isPremium).length }].map((s, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-2xl p-4 sm:p-5"><div className="text-xs text-[#666] tracking-widest">{s.label}</div><div className="text-2xl sm:text-3xl font-semibold mt-1">{s.value}</div></div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {digitalProducts.map(product => (
                <div key={product.id} className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden">
                  <div className="relative aspect-video overflow-hidden bg-[#1a1a1a]"><img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover" onError={e => { e.currentTarget.src = `https://via.placeholder.com/400x225/1a1a1a/c5a26f?text=${product.category.toUpperCase()}`; }} />{product.badge && <div className="absolute top-2 left-2 bg-[#c5a26f] text-black text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest">{product.badge}</div>}</div>
                  <div className="p-4"><div className="text-xs text-[#c5a26f] mb-1 tracking-widest uppercase">{product.category}</div><div className="font-semibold text-sm mb-1 line-clamp-1">{product.title}</div><div className="text-2xl font-semibold text-[#c5a26f] mb-3">₹{product.price.toLocaleString()}</div><div className="flex gap-2"><button onClick={() => { setProductForm({ title: product.title, description: product.description, price: product.price, category: product.category, thumbnailUrl: product.thumbnailUrl, isPremium: product.isPremium, badge: product.badge || '' }); setEditingProduct(product); setShowProductModal(true); }} className="flex-1 py-2.5 bg-[#222] rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"><Edit2 size={13} /> Edit</button><button onClick={() => deleteProduct(product.id)} className="flex-1 py-2.5 bg-[#e11d48]/10 text-[#e11d48] rounded-xl text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"><Trash2 size={13} /> Delete</button></div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="max-w-4xl">
            <div className="flex items-start justify-between mb-6 flex-wrap gap-3"><div><h3 className="text-3xl font-semibold tracking-tight">Revenue Sharing</h3><p className="text-[#a1a1aa] text-sm mt-1">Creator payout calculator.</p></div><button onClick={downloadRevenueReport} className="flex items-center gap-2 px-5 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium text-sm active:scale-95 transition-transform"><FileText size={16} /> Download Report</button></div>
            <div className="grid grid-cols-3 gap-4 mb-8">{[{ label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: 'text-white' }, { label: `Platform (${platformSplit}%)`, value: `₹${platformRevenue.toLocaleString()}`, color: 'text-[#c5a26f]' }, { label: `Creators (${creatorSplit}%)`, value: `₹${creatorRevenue.toLocaleString()}`, color: 'text-[#22c55e]' }].map((m, i) => (<div key={i} className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6"><div className="text-xs text-[#666] tracking-widest mb-1">{m.label}</div><div className={`text-2xl sm:text-4xl font-semibold tracking-tighter ${m.color}`}>{m.value}</div></div>))}</div>
            <div className="bg-[#111] border border-[#222] rounded-3xl p-7 mb-8"><div className="font-medium mb-4">Adjust Split Ratio</div><div className="flex items-center gap-4 mb-3"><span className="text-sm text-[#a1a1aa] w-24">Platform {platformSplit}%</span><input type="range" min={30} max={90} step={5} value={platformSplit} onChange={e => setPlatformSplit(Number(e.target.value))} className="flex-1 accent-[#c5a26f]" /><span className="text-sm text-[#22c55e] w-24 text-right">Creators {creatorSplit}%</span></div><div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden flex"><div className="h-full bg-[#c5a26f] transition-all" style={{ width: `${platformSplit}%` }} /><div className="h-full bg-[#22c55e] transition-all flex-1" /></div></div>
            <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden overflow-x-auto"><div className="px-6 py-4 border-b border-[#222] font-medium">Creator Allocations</div><table className="w-full text-sm min-w-[400px]"><thead className="text-[#a1a1aa] border-b border-[#222]"><tr><th className="text-left py-3 px-6">Creator</th><th className="text-left py-3">Video</th><th className="text-left py-3">Views</th><th className="text-right py-3 px-6">Payout</th></tr></thead><tbody className="divide-y divide-[#222]">{creatorEntries.map((e, i) => (<tr key={i} className="hover:bg-[#1a1a1a]"><td className="py-4 px-6 font-medium">{e.creatorName}</td><td className="text-[#a1a1aa] line-clamp-1 max-w-[160px]">{e.videoTitle}</td><td className="font-mono text-[#c5a26f]">{e.totalViews}</td><td className="text-right px-6 font-semibold text-[#22c55e]">₹{e.revenueShare.toLocaleString()}</td></tr>))}</tbody></table></div>
          </div>
        )}

        {activeTab === 'popups' && (
          <div><div className="flex justify-between items-center mb-7 flex-wrap gap-3"><div><h3 className="text-3xl font-semibold tracking-tight">Popup Ads</h3><p className="text-[#a1a1aa] text-sm mt-1">Marketing popups shown on app launch.</p></div><button onClick={() => { const np: PopupAd = { id: Date.now(), title: "New Campaign", imageUrl: "/images/popup-ad.jpg", redirectUrl: "/subscription", isActive: false }; setPopups([...popups, np]); savePopups([...popups, np]); }} className="px-5 py-2.5 bg-[#c5a26f] text-black rounded-2xl flex items-center gap-2 font-medium text-sm active:scale-95 transition-transform"><Plus size={16} /> New Popup</button></div><div className="space-y-4">{popups.map(popup => (<div key={popup.id} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start"><img src={popup.imageUrl} className="w-full md:w-64 h-36 object-cover rounded-2xl" alt="" /><div className="flex-1"><div className="font-semibold text-xl mb-2">{popup.title}</div><div className="text-xs text-[#666] font-mono mb-4">{popup.redirectUrl}</div><div className="flex gap-3 flex-wrap"><button onClick={() => { const updated = popups.map(p => ({ ...p, isActive: p.id === popup.id ? !p.isActive : false })); setPopups(updated); savePopups(updated); }} className={`px-5 py-2 rounded-2xl text-sm active:scale-95 transition-transform ${popup.isActive ? 'bg-[#22c55e] text-black' : 'bg-[#333]'}`}>{popup.isActive ? "LIVE" : "HIDDEN"}</button><button onClick={() => setEditingPopup({ ...popup })} className="px-5 py-2 bg-[#222] rounded-2xl text-sm active:scale-95 transition-transform">Edit</button><button onClick={() => { const updated = popups.filter(p => p.id !== popup.id); setPopups(updated); savePopups(updated); }} className="px-5 py-2 bg-[#e11d48]/10 text-[#e11d48] rounded-2xl text-sm active:scale-95 transition-transform">Delete</button></div></div></div>))}</div>
            <AnimatePresence>{editingPopup && (<div className="fixed inset-0 bg-black/90 z-[95] flex items-center justify-center p-6"><motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }} className="bg-[#111] p-8 rounded-3xl w-full max-w-md border border-[#333]"><div className="text-xl font-medium mb-6">Edit Popup</div>{[{ label: "Title", key: 'title' as const }, { label: "Image URL", key: 'imageUrl' as const }, { label: "Redirect URL", key: 'redirectUrl' as const }].map(f => (<div key={f.key} className="mb-4"><label className="text-xs text-[#666] mb-1 block">{f.label}</label><input value={editingPopup[f.key] as string} onChange={e => setEditingPopup({ ...editingPopup, [f.key]: e.target.value })} className="w-full bg-[#1a1a1a] px-5 py-3 rounded-2xl border border-[#333] text-sm" /></div>))}<div className="flex gap-3"><button onClick={() => setEditingPopup(null)} className="flex-1 py-3 border border-[#333] rounded-2xl">Cancel</button><button onClick={() => { const updated = popups.map(p => p.id === editingPopup.id ? editingPopup : p); setPopups(updated); savePopups(updated); setEditingPopup(null); showToast("✅ Popup saved!"); }} className="flex-1 py-3 bg-[#c5a26f] text-black rounded-2xl active:scale-95 transition-transform">Save</button></div></motion.div></div>)}</AnimatePresence>
          </div>
        )}

        {activeTab === 'users' && (
          <div><h3 className="text-3xl font-semibold tracking-tight mb-6">User Management • {premiumUsers} Premium</h3><div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden overflow-x-auto"><table className="w-full min-w-[560px] text-sm"><thead className="border-b border-[#222] text-[#a1a1aa]"><tr><th className="py-4 px-6 text-left">User</th><th className="py-4 text-left">Joined</th><th className="py-4 text-left">Watched</th><th className="py-4 px-6 text-left">Status</th><th className="py-4 px-6 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#222]">{adminUsers.map(u => (<tr key={u.id}><td className="py-5 px-6"><div className="font-medium">{u.name}</div><div className="text-xs text-[#666]">{u.email}</div></td><td className="text-[#a1a1aa]">{u.joinDate}</td><td className="font-mono">{u.totalWatched}</td><td className="px-6"><span className={`px-3 py-px rounded text-xs ${u.subscribed ? 'bg-[#c5a26f] text-black' : 'bg-[#333]'}`}>{u.subscribed ? "PREMIUM" : "FREE"}</span></td><td className="px-6 text-right"><button onClick={() => toggleUserSub(u.id)} className="px-4 py-2 border border-[#333] rounded-xl text-xs hover:bg-[#222] active:scale-95 transition-all">{u.subscribed ? "Revoke" : "Upgrade"}</button></td></tr>))}</tbody></table></div></div>
        )}

        {activeTab === 'analytics' && (
          <div><h3 className="text-3xl font-semibold tracking-tight mb-6">Revenue Dashboard</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">{[{ label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}` }, { label: "Monthly Recurring", value: "₹7,298" }, { label: "Active Subscribers", value: premiumUsers }, { label: "Trial Conversions", value: "64%" }].map((m, i) => (<div key={i} className="bg-[#111] border border-[#222] rounded-3xl p-5 sm:p-6"><div className="text-xs text-[#666] tracking-wider">{m.label}</div><div className="text-3xl sm:text-4xl font-semibold tracking-tighter mt-1">{m.value}</div></div>))}</div><div className="bg-[#111] border border-[#222] rounded-3xl p-8"><div className="font-medium mb-6">Recent Transactions</div><div className="space-y-4">{getRevenueData().slice().reverse().map((entry, i) => (<div key={i} className="flex items-center justify-between py-3 border-b border-[#222] last:border-0"><div><div className="font-medium">{entry.plan}</div><div className="text-xs text-[#666]">{entry.date}</div></div><div className="text-right"><div className="font-semibold text-[#c5a26f]">+₹{entry.amount}</div><div className="text-xs text-[#666]">{entry.type}</div></div></div>))}</div></div></div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl"><h3 className="text-3xl font-semibold tracking-tight mb-6">Platform Settings</h3><div className="space-y-4">{[{ label: "App Name", key: 'appName' as const }, { label: "Tagline", key: 'tagline' as const }, { label: "Support Email", key: 'supportEmail' as const }, { label: "Support Phone", key: 'supportPhone' as const }].map(f => (<div key={f.key}><label className="text-xs text-[#666] mb-1 block">{f.label}</label><input value={platformSettings[f.key] as string} onChange={e => setPlatformSettings({ ...platformSettings, [f.key]: e.target.value })} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm focus:border-[#c5a26f] outline-none" /></div>))}<div><label className="text-xs text-[#666] mb-2 block">Accent Color</label><div className="flex items-center gap-3"><input type="color" value={platformSettings.accentColor} onChange={e => setPlatformSettings({ ...platformSettings, accentColor: e.target.value })} className="w-12 h-10 rounded-xl cursor-pointer" /><span className="font-mono text-sm text-[#a1a1aa]">{platformSettings.accentColor}</span></div></div><button onClick={() => { saveSettings(platformSettings); showToast("✅ Platform settings saved!"); }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider active:scale-[0.98] transition-transform">SAVE PLATFORM SETTINGS</button></div></div>
        )}

        {activeTab === 'plans' && (
          <div className="max-w-2xl"><h3 className="text-3xl font-semibold tracking-tight mb-6">Plan Settings</h3><div className="space-y-4">{[{ label: "Trial Price", key: 'trialOfferPrice' as const }, { label: "Trial Duration", key: 'trialOfferDuration' as const }, { label: "Full Price", key: 'fullPrice' as const }, { label: "Full Plan Validity", key: 'fullValidity' as const }].map(f => (<div key={f.key}><label className="text-xs text-[#666] mb-1 block">{f.label}</label><input value={subSettings[f.key] as string} onChange={e => setSubSettings({ ...subSettings, [f.key]: e.target.value })} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm focus:border-[#c5a26f] outline-none" /></div>))}<div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]"><div><div className="font-medium text-sm">Show Trial Popup</div><div className="text-xs text-[#666]">Display trial offer popup on launch</div></div><button onClick={() => setSubSettings({ ...subSettings, showTrialPopup: !subSettings.showTrialPopup })} className={`w-12 h-6 rounded-full transition-colors ${subSettings.showTrialPopup ? 'bg-[#c5a26f]' : 'bg-[#333]'}`}><div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${subSettings.showTrialPopup ? 'translate-x-6' : 'translate-x-0'}`} /></button></div><button onClick={() => { saveSubSettings(subSettings); showToast("✅ Plan settings saved!"); }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider active:scale-[0.98] transition-transform">SAVE PLAN SETTINGS</button></div></div>
        )}

        {activeTab === 'payment' && (
          <div className="max-w-2xl"><h3 className="text-3xl font-semibold tracking-tight mb-2">Payment Settings</h3><p className="text-[#a1a1aa] text-sm mb-6">Active gateway routes live to checkout.</p><div className="space-y-4"><div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-4"><div className="text-xs text-[#c5a26f] tracking-widest font-medium">ACTIVE GATEWAY</div><div className="grid grid-cols-2 gap-3">{(['razorpay', 'stripe', 'upi', 'none'] as const).map(gw => (<button key={gw} onClick={() => setPaymentConfig({ ...paymentConfig, activeGateway: gw })} className={`py-3 rounded-2xl text-sm font-medium border transition active:scale-95 ${paymentConfig.activeGateway === gw ? 'border-[#c5a26f] bg-[#c5a26f]/10 text-[#c5a26f]' : 'border-[#333] text-[#666]'}`}>{gw === 'none' ? 'None / Manual' : gw.charAt(0).toUpperCase() + gw.slice(1)}</button>))}</div><div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]"><div><div className="font-medium text-sm">Live Mode</div><div className="text-xs text-[#e11d48]">⚠️ Real payments only</div></div><button onClick={() => setPaymentConfig({ ...paymentConfig, isLiveMode: !paymentConfig.isLiveMode })} className={`w-12 h-6 rounded-full transition-colors active:scale-95 ${paymentConfig.isLiveMode ? 'bg-[#22c55e]' : 'bg-[#333]'}`}><div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${paymentConfig.isLiveMode ? 'translate-x-6' : 'translate-x-0'}`} /></button></div></div>{[{ title: 'RAZORPAY', fields: [{ label: 'Key ID', key: 'razorpayKeyId' as const, placeholder: 'rzp_test_...' }, { label: 'Key Secret', key: 'razorpayKeySecret' as const, placeholder: '••••••••', type: 'password' }] }, { title: 'UPI', fields: [{ label: 'UPI ID', key: 'upiId' as const, placeholder: 'yourname@upi' }] }, { title: 'STRIPE', fields: [{ label: 'Publishable Key', key: 'stripePublishableKey' as const, placeholder: 'pk_test_...' }] }].map(section => (<div key={section.title} className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-4"><div className="text-xs text-[#a1a1aa] tracking-widest font-medium">{section.title}</div>{section.fields.map(f => (<div key={f.key}><label className="text-xs text-[#666] mb-1 block">{f.label}</label><input type={f.type || 'text'} value={paymentConfig[f.key] as string} onChange={e => setPaymentConfig({ ...paymentConfig, [f.key]: e.target.value })} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none" placeholder={f.placeholder} /></div>))}</div>))}<button onClick={() => { savePaymentSettings(paymentConfig); showToast("✅ Payment settings saved!"); }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider active:scale-[0.98] transition-transform">SAVE PAYMENT SETTINGS</button></div></div>
        )}

        {activeTab === 'categories' && (
          <div className="max-w-2xl"><h3 className="text-3xl font-semibold tracking-tight mb-6">Categories</h3><div className="flex gap-3 mb-6"><input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newCategoryName.trim()) addCategory(); }} placeholder="New category name" className="flex-1 bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm focus:border-[#c5a26f] outline-none" /><button onClick={addCategory} className="px-5 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium flex items-center gap-2 text-sm active:scale-95 transition-transform"><Plus size={16} /> Add</button></div><div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden"><div className="divide-y divide-[#222]">{categories.map(cat => (<div key={cat} className="flex items-center gap-4 px-6 py-4">{editingCatName === cat ? (<><input value={editingCatValue} onChange={e => setEditingCatValue(e.target.value)} className="flex-1 bg-[#1a1a1a] px-4 py-2 rounded-xl border border-[#c5a26f] text-sm" autoFocus /><button onClick={() => updateCategory(cat, editingCatValue)} className="px-4 py-2 bg-[#c5a26f] text-black rounded-xl text-xs active:scale-95 transition-transform">Save</button><button onClick={() => setEditingCatName(null)} className="px-4 py-2 border border-[#333] rounded-xl text-xs">Cancel</button></>) : (<><div className="flex-1 font-medium">{cat}</div><button onClick={() => { setEditingCatName(cat); setEditingCatValue(cat); }} className="p-2 hover:bg-[#222] active:scale-90 transition-all rounded-xl text-[#a1a1aa]"><Edit2 size={15} /></button><button onClick={() => deleteCategory(cat)} className="p-2 hover:bg-[#e11d48]/10 text-[#e11d48] active:scale-90 transition-all rounded-xl"><Trash2 size={15} /></button></>)}</div>))}</div></div>
          </div>
        )}

        {activeTab === 'promo' && (
          <div className="max-w-2xl"><h3 className="text-3xl font-semibold tracking-tight mb-6">Promo Video</h3><div className="space-y-4"><div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]"><div><div className="font-medium text-sm">Show Promo Video</div><div className="text-xs text-[#666]">Display in trial popup</div></div><button onClick={() => setPromoSettings({ ...promoSettings, isEnabled: !promoSettings.isEnabled })} className={`w-12 h-6 rounded-full transition-colors ${promoSettings.isEnabled ? 'bg-[#c5a26f]' : 'bg-[#333]'}`}><div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${promoSettings.isEnabled ? 'translate-x-6' : 'translate-x-0'}`} /></button></div><div className="flex gap-3">{(['youtube', 'direct'] as const).map(t => (<button key={t} onClick={() => setPromoSettings({ ...promoSettings, videoType: t })} className={`flex-1 py-2.5 rounded-2xl text-sm font-medium border transition active:scale-95 ${promoSettings.videoType === t ? 'border-[#c5a26f] bg-[#c5a26f]/10 text-[#c5a26f]' : 'border-[#333] text-[#666]'}`}>{t === 'youtube' ? 'YouTube' : 'Direct URL'}</button>))}</div><div><label className="text-xs text-[#666] mb-1 block">Video URL</label><input value={promoSettings.videoUrl} onChange={e => setPromoSettings({ ...promoSettings, videoUrl: e.target.value })} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none" /></div>{promoSettings.videoUrl && promoSettings.isEnabled && (<div className="rounded-2xl overflow-hidden border border-[#333] aspect-video bg-black"><iframe src={(() => { const u = promoSettings.videoUrl; if (u.includes('embed')) return `${u}?autoplay=0&controls=1`; const id = u.includes('v=') ? u.split('v=')[1]?.split('&')[0] : u.split('/').pop(); return `https://www.youtube.com/embed/${id}?controls=1&modestbranding=1&rel=0`; })()} className="w-full h-full" title="Promo Preview" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media" allowFullScreen /></div>)}<button onClick={() => { savePromoSettings(promoSettings); showToast("✅ Promo video saved!"); }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider active:scale-[0.98] transition-transform">SAVE PROMO VIDEO</button></div></div>
        )}

        {activeTab === 'datatools' && (
          <div className="max-w-2xl"><h3 className="text-3xl font-semibold tracking-tight mb-2">Data Integrity Hub</h3><p className="text-[#a1a1aa] mb-8">Export a complete platform snapshot or restore from a backup file.</p><div className="bg-[#111] border border-[#222] rounded-3xl p-7 mb-5"><div className="flex items-start gap-4 mb-5"><div className="w-12 h-12 bg-[#c5a26f]/10 rounded-2xl flex items-center justify-center flex-shrink-0"><Download size={22} className="text-[#c5a26f]" /></div><div><div className="font-semibold text-lg">Export System Backup</div><div className="text-sm text-[#a1a1aa] mt-1">Downloads a complete JSON snapshot of all data.</div></div></div><button onClick={() => { exportSystemBackup(); showToast("✅ Backup downloaded!"); }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"><Database size={18} /> Download Full JSON Backup</button></div><div className="bg-[#111] border border-[#222] rounded-3xl p-7"><div className="flex items-start gap-4 mb-5"><div className="w-12 h-12 bg-[#1a1a1a] border border-[#333] rounded-2xl flex items-center justify-center flex-shrink-0"><Upload size={22} className="text-[#a1a1aa]" /></div><div><div className="font-semibold text-lg">Restore from Backup</div><div className="text-sm text-[#a1a1aa] mt-1">Upload a valid ReelRamp JSON backup file.</div></div></div><input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (!file) return; importSystemBackup(file, msg => { showToast(msg); loadAllData(); }, err => showToast(err)); e.target.value = ''; }} /><button onClick={() => fileInputRef.current?.click()} className="w-full py-4 bg-[#1a1a1a] border border-[#333] hover:border-[#c5a26f] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"><Upload size={18} /> Choose Backup File (.json)</button><p className="text-xs text-[#444] text-center mt-3">⚠️ This will overwrite current platform configuration.</p></div></div>
        )}
      </div>

      {/* Add/Edit Video Modal */}
      <AnimatePresence>{showAddModal && (<div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}><motion.div initial={{ scale: 0.96, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 20, opacity: 0 }} className="bg-[#111] border border-[#333] w-full max-w-lg rounded-3xl p-9 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-7"><div className="text-2xl font-semibold">{editingVideo ? "Edit Short" : "Publish New Short"}</div><button onClick={() => setShowAddModal(false)} className="active:scale-90 transition-transform"><X size={20} /></button></div><div className="space-y-4"><input placeholder="Short Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" /><textarea placeholder="Compelling description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] resize-y text-sm focus:border-[#c5a26f] outline-none" /><div className="grid grid-cols-2 gap-4"><select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm">{categories.map(c => <option key={c} value={c}>{c}</option>)}</select><input placeholder="Duration e.g. 4:45" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} className="bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" /></div><div className="flex items-center gap-4 bg-[#1a1a1a] rounded-2xl p-5 border border-[#222]"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={formData.isPremium} onChange={e => setFormData({ ...formData, isPremium: e.target.checked })} className="accent-[#c5a26f] scale-125" /><div><div className="font-medium text-sm">Premium Only</div><div className="text-xs text-[#a1a1aa]">Requires active subscription</div></div></label></div><input placeholder="Thumbnail URL" value={formData.thumbnail} onChange={e => setFormData({ ...formData, thumbnail: e.target.value })} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm font-mono focus:border-[#c5a26f] outline-none" /><input placeholder="Video URL (mp4 or Bunny.net path)" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm font-mono focus:border-[#c5a26f] outline-none" /></div><div className="flex gap-3 mt-8"><button onClick={() => setShowAddModal(false)} className="flex-1 py-4 border border-[#333] rounded-2xl text-sm active:scale-95 transition-transform">Cancel</button><button onClick={saveVideo} className="flex-1 py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm active:scale-[0.98] transition-transform">{editingVideo ? "Save Changes" : "Publish Short"}</button></div></motion.div></div>)}</AnimatePresence>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>{showProductModal && (<div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-6" onClick={() => setShowProductModal(false)}><motion.div initial={{ scale: 0.96, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 20, opacity: 0 }} className="bg-[#111] border border-[#333] w-full max-w-lg rounded-3xl p-9 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-7"><div className="text-2xl font-semibold">{editingProduct ? "Edit Product" : "Add New Product"}</div><button onClick={() => setShowProductModal(false)} className="active:scale-90 transition-transform"><X size={20} /></button></div><div className="space-y-4"><input placeholder="Product Title" value={productForm.title} onChange={e => setProductForm({ ...productForm, title: e.target.value })} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" /><textarea placeholder="Description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} rows={2} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] resize-y text-sm focus:border-[#c5a26f] outline-none" /><div className="grid grid-cols-2 gap-4"><div><label className="text-xs text-[#666] mb-1 block">Category</label><select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value as DigitalProduct['category'] })} className="w-full bg-[#1a1a1a] py-3.5 px-4 rounded-2xl border border-[#222] text-sm"><option value="workshop">Workshop</option><option value="guide">Guide</option><option value="merch">Merch</option></select></div><div><label className="text-xs text-[#666] mb-1 block">Price (₹)</label><input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full bg-[#1a1a1a] py-3.5 px-4 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" /></div></div><input placeholder="Thumbnail URL" value={productForm.thumbnailUrl} onChange={e => setProductForm({ ...productForm, thumbnailUrl: e.target.value })} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm font-mono focus:border-[#c5a26f] outline-none" /><div className="grid grid-cols-2 gap-4"><input placeholder="Badge (e.g. BESTSELLER)" value={productForm.badge} onChange={e => setProductForm({ ...productForm, badge: e.target.value })} className="bg-[#1a1a1a] py-3.5 px-4 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" /><div className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-4 border border-[#222]"><input type="checkbox" checked={productForm.isPremium} onChange={e => setProductForm({ ...productForm, isPremium: e.target.checked })} className="accent-[#c5a26f]" /><span className="text-sm">Premium Only</span></div></div></div><div className="flex gap-3 mt-8"><button onClick={() => setShowProductModal(false)} className="flex-1 py-4 border border-[#333] rounded-2xl text-sm active:scale-95 transition-transform">Cancel</button><button onClick={saveProduct} className="flex-1 py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm active:scale-[0.98] transition-transform">{editingProduct ? "Save Changes" : "List Product"}</button></div></motion.div></div>)}</AnimatePresence>
    </div>
  );
}

export default App;
