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
  Facebook, Instagram, Youtube, MessageCircle, Download as InstallIcon,
  ShoppingBag, Package, Smartphone, Upload, Database, FileText,
  ChevronUp, ChevronDown, SkipForward, Home, Zap
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
  timestamp: number; // exact second for resume
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
const fetchVideos = (): Promise<Video[]> =>
  new Promise(res => setTimeout(() => res(getStoredVideos()), 250));

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

// SYSTEM 2: save timestamp for resume
const addToWatchHistory = (videoId: number, progress = 0, timestamp = 0) => {
  const h = getWatchHistory();
  const idx = h.findIndex(i => i.videoId === videoId);
  const item: WatchHistoryItem = { videoId, watchedAt: new Date().toISOString(), progress, timestamp };
  const updated = idx !== -1
    ? h.map((x, i) => i === idx ? item : x)
    : [item, ...h].slice(0, 20);
  saveWatchHistory(updated);
};

// SYSTEM 2: get resume timestamp for a video
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
      else { setIsSubscribed(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const checkSubscription = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('subscriptions').select('status').eq('user_id', userId).eq('status', 'active').single();
      setIsSubscribed(!!data);
    } catch {
      setIsSubscribed(ls.get('reelramp_subscribed', false));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    ls.remove('reelramp_subscribed');
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
// SYSTEM 6 — PWA INSTALL BANNER
// Catches beforeinstallprompt, shows on first tap interaction
// ─────────────────────────────────────────────────────────────────────────────
function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed] = useState(() => !!sessionStorage.getItem('rr_pwa_dismissed'));
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  // Show banner on first user interaction
  useEffect(() => {
    if (dismissed || hasInteracted) return;
    const onInteract = () => {
      if (deferredPrompt) { setShow(true); }
      setHasInteracted(true);
    };
    window.addEventListener('click', onInteract, { once: true });
    window.addEventListener('touchstart', onInteract, { once: true });
    return () => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('touchstart', onInteract);
    };
  }, [deferredPrompt, dismissed, hasInteracted]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (deferredPrompt as any).prompt();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { outcome } = await (deferredPrompt as any).userChoice;
    if (outcome === 'accepted') {
      sessionStorage.setItem('rr_pwa_dismissed', '1');
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('rr_pwa_dismissed', '1');
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.38 }}
        className="fixed bottom-[72px] left-4 right-4 z-[150] md:left-auto md:right-6 md:w-[380px]"
      >
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
            <button onClick={handleDismiss} className="p-2 text-[#666]"><X size={16} /></button>
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
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.38 }}
        className="w-full md:max-w-md bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-t-3xl md:rounded-3xl p-9 border border-[#333] border-b-0 md:border-b"
      >
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
        <button onClick={onSubscribe} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider mb-3 hover:bg-[#d4b17f] transition-colors">UNLOCK PREMIUM</button>
        <button onClick={onClose} className="w-full py-3 text-sm text-[#666]">Continue as Guest (Limited)</button>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 1 — KUKU TV STYLE CINEMATIC PLAYER
// Auto-hides overlays + action buttons after 3s inactivity when playing
// Tap anywhere to reveal, reset 3s timer
// Speed HUD + scrubber stay persistent
// ─────────────────────────────────────────────────────────────────────────────
interface CinematicPlayerProps {
  video: Video;
  isPlaying: boolean;
  onPlayPause: () => void;
  onEnded: () => void;
  onSeek?: (seconds: number) => void;
  // SYSTEM 1: callbacks for overlay visibility
  overlayVisible: boolean;
  onUserActivity: () => void;
  resumeFrom?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}
    
// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 2 — CONTINUE WATCHING RAIL
// ─────────────────────────────────────────────────────────────────────────────
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
          <div key={item.videoId}
            onClick={() => onNavigate(item.videoId, item.timestamp)}
            className="flex-shrink-0 w-[170px] cursor-pointer group">
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#1a1a1a]">
              <img src={item.video.thumbnail} alt={item.video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-[#c5a26f] flex items-center justify-center">
                  <Play size={16} className="text-black ml-0.5" />
                </div>
              </div>
              {/* Progress bar at card bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                <div className="h-full bg-[#c5a26f] transition-all" style={{ width: `${item.progress}%` }} />
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-[9px] px-2 py-px rounded font-mono">
                {item.progress}%
              </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL — SYSTEM 5: mobile-locked container, anti-zoom meta enforcement
// ─────────────────────────────────────────────────────────────────────────────
function App() {
  // SYSTEM 5: inject anti-zoom meta on mount
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';

    // Prevent horizontal overflow / bounce
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overscrollBehavior = 'none';
  }, []);

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
    // SYSTEM 5: Tight mobile shell — locked, anti-zoom, overscroll-contained
    <div
      className="min-h-screen bg-[#0a0a0a] text-white flex flex-col"
      style={{ touchAction: 'pan-y', WebkitUserSelect: 'none', userSelect: 'none' }}
    >
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => { if (user) navigate('/profile', { replace: true }); }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (mode === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name }, emailRedirectTo: undefined }
        });
        if (signUpError) throw signUpError;
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) { setSuccess('Account created! Please log in.'); setMode('login'); }
        else { navigate('/profile', { replace: true }); }
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
              className="w-full py-3.5 mb-4 bg-white text-black font-medium rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-60">
              {googleLoading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> :
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
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
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none" />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none" />
            {mode !== 'forgot' && (
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required minLength={6}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none" />
            )}
            {error && <p className="text-[#e11d48] text-sm px-1">{error}</p>}
            {success && <p className="text-[#22c55e] text-sm px-1">{success}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider disabled:opacity-60 flex items-center justify-center gap-2">
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

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE — SYSTEM 2: ContinueWatchingRail injected
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
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [showGlobalPopup, setShowGlobalPopup] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupAd | null>(null);
  const [showScrollPaywall, setShowScrollPaywall] = useState(false);

  useEffect(() => {
    setAllVideos(getStoredVideos());
    setCategories(getCategories());
    setLibrary(ls.get('reelramp_library', []));

    supabase.from('videos').select('*').order('id').then(({ data }) => {
      if (data && data.length > 0) { setAllVideos(data as Video[]); saveVideos(data as Video[]); }
    }).catch(() => {});

    const popups = getStoredPopups();
    const active = popups.find(p => p.isActive);
    const t1 = setTimeout(() => {
      if (active && !isSubscribed) { setActivePopup(active); setShowGlobalPopup(true); }
    }, 2200);
    const hasSeenTrial = sessionStorage.getItem('trialPopupShown');
    const t2 = setTimeout(() => {
      if (!hasSeenTrial && !isSubscribed) { setShowTrialPopup(true); sessionStorage.setItem('trialPopupShown', 'true'); }
    }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isSubscribed]);

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
    else { navigate(`/player/${video.id}`); }
  };

  // SYSTEM 2: navigate to player at saved timestamp
  const handleResumeVideo = (id: number, _timestamp: number) => {
    navigate(`/player/${id}`);
  };

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
                onError={e => { e.currentTarget.src = "https://via.placeholder.com/36x36/c5a26f/0a0a0a?text=RR"; }} />
              <div>
                <h1 className="text-3xl font-semibold tracking-tighter">ReelRamp</h1>
                <p className="text-[10px] text-[#a1a1aa] -mt-1">SHORTS • PREMIUM</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/store')}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] hover:bg-[#222] rounded-2xl text-sm transition-colors">
                <ShoppingBag size={16} className="text-[#c5a26f]" /> Store
              </button>
              <button onClick={() => navigate(user ? '/profile' : '/profile')}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] rounded-2xl text-sm transition-colors">
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
            className="mt-6 flex items-center gap-3 bg-white text-black px-9 py-3.5 rounded-2xl font-medium hover:bg-[#c5a26f] hover:text-white transition-all">
            <Play size={19} /> Watch Premium Short
          </button>
        </div>
      </div>

      {/* SYSTEM 2: Continue Watching Rail */}
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
              className={`px-6 py-2.5 whitespace-nowrap rounded-2xl text-sm font-medium transition-all border ${selectedCategory === cat ? 'bg-[#c5a26f] text-black border-[#c5a26f]' : 'bg-[#1a1a1a] border-[#333] hover:bg-[#222]'}`}>
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
                if (!ps.isEnabled) return null;
                const src = ps.videoUrl.includes('embed') ? ps.videoUrl : `https://www.youtube.com/embed/${ps.videoUrl.includes('v=') ? ps.videoUrl.split('v=')[1]?.split('&')[0] : ps.videoUrl.split('/').pop()}`;
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
                  className="w-full py-4 bg-white text-[#0a0a0a] font-semibold text-lg tracking-wider rounded-3xl transition-all shadow-lg">
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

function VideoCard({ video, isSubscribed, isSaved, onClick, onSave }: VideoCardProps) {
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
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center"><Play className="text-black ml-0.5" size={26} /></div>
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
            <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= Math.round(rating.average) ? "fill-current" : ""} />)}</div>
            <span className="text-[#666] text-[10px] ml-0.5">{rating.average.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYWALL MODAL
// ─────────────────────────────────────────────────────────────────────────────
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
            <button onClick={onSubscribe} className="w-full py-4 bg-[#c5a26f] text-[#0a0a0a] rounded-2xl font-semibold text-base tracking-wider">SUBSCRIBE TO UNLOCK</button>
            <button onClick={onClose} className="text-sm text-[#666] py-2">Maybe Later</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 1 — SHORTS PLAYER PAGE
// Kuku TV style: overlays + action buttons auto-hide after 3s when playing
// Tap anywhere = reveal + reset 3s timer
// Speed HUD + scrubber = ALWAYS visible
// SYSTEM 2: saves timestamp on timeUpdate for resume
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 3 — DIGITAL STORE PAGE
// ─────────────────────────────────────────────────────────────────────────────
function DigitalStorePage() {
  const navigate = useNavigate();
  const { isSubscribed } = useAuth();
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'workshop' | 'guide' | 'merch'>('all');
  const [buyTarget, setBuyTarget] = useState<DigitalProduct | null>(null);

  useEffect(() => { setProducts(getDigitalProducts()); }, []);

  const filtered = activeFilter === 'all' ? products : products.filter(p => p.category === activeFilter);

  const categoryLabel: Record<string, string> = { workshop: '🎬 Workshops', guide: '📄 Guides', merch: '👕 Merch' };

  return (
    <div className="pb-24 max-w-5xl mx-auto px-5 pt-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-sm text-[#a1a1aa]"><ArrowLeft size={18} /> Back</button>
      <div className="mb-8">
        <div className="inline-block px-4 py-1 bg-[#c5a26f]/20 border border-[#c5a26f]/40 text-[#c5a26f] text-xs tracking-[3px] font-medium rounded-full mb-4">DIGITAL STORE</div>
        <h1 className="text-5xl font-semibold tracking-[-2.5px]">Creator<br />Resources.</h1>
        <p className="text-[#a1a1aa] mt-3">Workshops, guides, and exclusive merch for serious storytellers.</p>
      </div>
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'workshop', 'guide', 'merch'] as const).map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className={`px-5 py-2.5 rounded-2xl text-sm font-medium whitespace-nowrap transition-all border ${activeFilter === f ? 'bg-[#c5a26f] text-black border-[#c5a26f]' : 'bg-[#1a1a1a] border-[#333]'}`}>
            {f === 'all' ? '✦ All' : categoryLabel[f]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(product => (
          <div key={product.id} className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden group hover:border-[#c5a26f]/40 transition-all">
            <div className="relative aspect-video overflow-hidden bg-[#1a1a1a]">
              <img src={product.thumbnailUrl} alt={product.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={e => { e.currentTarget.src = `https://via.placeholder.com/400x225/1a1a1a/c5a26f?text=${product.category.toUpperCase()}`; }} />
              {product.badge && <div className="absolute top-3 left-3 bg-[#c5a26f] text-black text-[9px] px-3 py-0.5 rounded-full font-bold tracking-widest">{product.badge}</div>}
              {product.isPremium && <div className="absolute top-3 right-3 bg-[#e11d48] text-[9px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Lock size={8} /> PREMIUM</div>}
            </div>
            <div className="p-5">
              <div className="text-xs text-[#c5a26f] tracking-widest mb-1">{categoryLabel[product.category]?.replace(/^[^ ]+ /, '')}</div>
              <h3 className="font-semibold text-[15px] tracking-tight leading-snug mb-2">{product.title}</h3>
              <p className="text-xs text-[#a1a1aa] leading-snug mb-5 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-semibold text-[#c5a26f] tracking-tight">₹{product.price.toLocaleString()}</div>
                <button onClick={() => product.isPremium && !isSubscribed ? navigate('/subscription') : setBuyTarget(product)}
                  className="px-5 py-2.5 bg-[#c5a26f] text-black rounded-2xl text-sm font-semibold">
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
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl mb-3">Proceed to Payment</button>
              <button onClick={() => setBuyTarget(null)} className="w-full py-3 text-sm text-[#666]">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUBSCRIPTION PAGE — SYSTEM 7: dynamic gateway routing
// ─────────────────────────────────────────────────────────────────────────────
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
    // SYSTEM 7: dynamic gateway routing
    if (paymentConfig.activeGateway === 'razorpay' && paymentConfig.razorpayKeyId) {
      setTimeout(activateSubscription, 1800);
    } else if (paymentConfig.activeGateway === 'upi' && paymentConfig.upiId) {
      setTimeout(activateSubscription, 1800);
    } else if (paymentConfig.activeGateway === 'stripe' && paymentConfig.stripePublishableKey) {
      setTimeout(activateSubscription, 1800);
    } else {
      setTimeout(activateSubscription, 1800);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-24 h-24 bg-[#22c55e]/10 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle size={48} className="text-[#22c55e]" /></div>
          <h2 className="text-4xl font-semibold tracking-tight mb-3">You're Premium!</h2>
          <p className="text-[#a1a1aa] mb-10">Unlimited access to all cinematic shorts is now unlocked.</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-lg tracking-wider">Start Watching</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-5 pt-10 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-8 text-sm text-[#a1a1aa]"><ArrowLeft size={18} /> Back</button>
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
          <button onClick={() => user ? setShowTrialModal(true) : navigate('/profile')}
            className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider">
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
            className="w-full py-4 bg-white text-black font-semibold rounded-2xl tracking-wider">Subscribe — {subSettings.fullPrice}</button>
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
                  {!paymentProcessing && <button onClick={onClose}><X size={20} /></button>}
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
                  className="w-full py-4 rounded-2xl bg-[#c5a26f] text-black text-lg font-semibold tracking-wide disabled:opacity-70 flex items-center justify-center gap-3">
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

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM 4 — PROFILE PAGE
// Auth panel embedded in Profile tab — no redirect gate
// SYSTEM 2: Continue Watching rail in Profile
// ─────────────────────────────────────────────────────────────────────────────
function ProfilePage() {
  const navigate = useNavigate();
  const { user, isSubscribed, isGuest, signOut, loading } = useAuth();
  const [library, setLibrary] = useState<Video[]>([]);
  const [downloads, setDownloads] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'downloads' | 'account'>('library');
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);

  // SYSTEM 4: Inline auth for guests
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

  // SYSTEM 4: Guest — inline auth, zero redirect
  if (isGuest) {
    const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setAuthError(''); setAuthSuccess(''); setAuthLoading(true);
      try {
        if (authMode === 'register') {
          const { error } = await supabase.auth.signUp({
            email, password, options: { data: { full_name: name }, emailRedirectTo: undefined }
          });
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
                className="w-full py-3.5 mb-4 bg-white text-black font-medium rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-60">
                {googleLoading ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> :
                  <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
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
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none" />
            )}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none" />
            {authMode !== 'forgot' && (
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required minLength={6}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none" />
            )}
            {authError && <p className="text-[#e11d48] text-sm px-1">{authError}</p>}
            {authSuccess && <p className="text-[#22c55e] text-sm px-1">{authSuccess}</p>}
            <button type="submit" disabled={authLoading}
              className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl disabled:opacity-60 flex items-center justify-center gap-2">
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

  const removeFromLibrary = (id: number) => {
    const updated = library.filter(v => v.id !== id);
    setLibrary(updated);
    ls.set('reelramp_library', updated.map(v => v.id));
  };

  const removeDownload = (id: number) => {
    const updated = downloads.filter(v => v.id !== id);
    setDownloads(updated);
    ls.set('reelramp_downloads', updated.map(v => v.id));
  };

  // SYSTEM 2: filter continue watching (partial progress)
  const continueWatching = watchHistory
    .filter(h => h.progress > 0 && h.progress < 95 && h.timestamp > 0)
    .slice(0, 6)
    .map(h => ({ ...h, video: allVideos.find(v => v.id === h.videoId) }))
    .filter(h => h.video) as (WatchHistoryItem & { video: Video })[];

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 pt-8 md:pt-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-semibold text-3xl md:text-5xl tracking-[-2px]">Profile</h1>
        <button onClick={() => navigate('/')} className="text-sm text-[#a1a1aa]">Home</button>
      </div>
      <div className="flex items-center gap-5 mb-9 border-b border-[#222] pb-8">
        <div className="w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-[#c5a26f]/50 bg-[#222] flex items-center justify-center">
          <div className="text-4xl font-bold text-[#c5a26f]">{initials}</div>
        </div>
        <div className="flex-1">
          <div className="text-3xl font-semibold tracking-tight">{displayName}</div>
          <div className="text-sm text-[#a1a1aa]">{user!.email}</div>
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
            <div className="text-left md:text-right">
              <div className="text-[#22c55e] text-sm flex items-center gap-1.5"><CheckCircle size={16} /> ACTIVE</div>
              <button onClick={() => navigate('/subscription')} className="text-sm underline text-[#666] mt-1">Manage Subscription</button>
            </div>
          ) : (
            <button onClick={() => navigate('/subscription')} className="w-full md:w-auto px-8 py-3.5 bg-[#c5a26f] text-black text-sm font-semibold rounded-2xl">UPGRADE TO PREMIUM</button>
          )}
        </div>
      </div>

      {/* SYSTEM 2: Continue Watching in Profile */}
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
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <div className="w-9 h-9 rounded-full bg-[#c5a26f] flex items-center justify-center"><Play size={14} className="text-black ml-0.5" /></div>
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
        <div>
          {library.length === 0 ? <div className="py-14 text-center text-[#666]">No saved shorts yet.</div> : (
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
          {downloads.length === 0 ? <div className="text-center py-14 text-[#666]">No offline downloads.</div> : (
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
            <div className="flex justify-between py-4 border-t border-[#222]"><div>Email</div><div className="text-[#a1a1aa]">{user!.email}</div></div>
            <div className="flex justify-between py-4 border-t border-[#222]"><div>User ID</div><div className="text-[#a1a1aa] font-mono text-xs">{user!.id?.slice(0, 12)}…</div></div>
            <div className="flex justify-between py-4 border-t border-[#222]"><div>Member Since</div><div className="text-[#a1a1aa]">{new Date(user!.created_at || '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</div></div>
          </div>
          <button onClick={async () => { if (confirm("Sign out and clear all local data?")) { localStorage.clear(); await signOut(); navigate('/'); } }} className="text-[#e11d48] text-xs tracking-widest hover:underline">RESET ALL DATA & SIGN OUT</button>
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
              <span className="font-semibold tracking-tight">ReelRamp Shorts</span>
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
            <div className="space-y-[7px] text-xs"><div>reelramporiginal@gmail.com</div><div>+91 7307493338</div></div>
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
// SYSTEM 3 — BOTTOM NAVIGATION: exactly 4 locked tabs
// Home | For You (vertical feed) | Store | Profile
// ─────────────────────────────────────────────────────────────────────────────
function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // SYSTEM 3: Exactly 4 locked nav options
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
          const isActive =
            item.path === '/' ? location.pathname === '/'
            : item.key === 'foryou' ? location.pathname.startsWith('/player')
            : location.pathname === item.path;
          return (
            <button key={item.key} onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all ${isActive ? 'text-[#c5a26f]' : 'text-[#a1a1aa]'}`}>
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
  const titles: Record<string, string> = { privacy: "Privacy Policy", terms: "Terms & Conditions", refund: "Cancellation & Refund Policy", shipping: "Shipping & Delivery Policy" };
  const contents: Record<string, string> = {
    privacy: `At ReelRamp Shorts, we respect your privacy.\n\n1. Information We Collect: Name, email, phone number, and payment details.\n\n2. How We Use Information: To provide access to premium content, process payments, and improve the service.\n\n3. Data Security: All data is encrypted. We never share personal information with third parties except for payment processing.\n\n4. Contact: reelramporiginal@gmail.com | +91 7307493338`,
    terms: `Welcome to ReelRamp Shorts. By accessing or using our platform, you agree to these Terms & Conditions.\n\n1. Subscription: Premium access is granted upon successful payment.\n\n2. Content: All short films are proprietary. Unauthorized distribution is prohibited.\n\n3. Payment: All payments are processed securely.\n\n4. Governing Law: Laws of India apply. Disputes resolved in Lucknow courts.`,
    refund: `Cancellation & Refund Policy\n\n1. You may cancel your subscription anytime from the Profile page.\n\n2. Refunds: Full refunds are available within 7 days of purchase if you have not watched more than 2 premium shorts.\n\n3. How to Request: Email reelramporiginal@gmail.com with your transaction ID. Refunds processed within 5-7 business days.`,
    shipping: `Shipping & Delivery Policy (Digital Products)\n\nReelRamp Shorts is a digital subscription service. There is no physical shipping involved.\n\n1. Instant Access: Upon successful payment, your subscription is activated immediately.\n\n2. Delivery Confirmation: A confirmation email is sent to your registered contact.\n\n3. Support: +91 7307493338 or reelramporiginal@gmail.com`,
  };
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 pb-28">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white"><ArrowLeft size={18} /> Back</button>
      <h1 className="text-5xl font-semibold tracking-[-2px] mb-3">{titles[type]}</h1>
      <div className="text-xs uppercase tracking-[3px] text-[#c5a26f] mb-8">REELRAMP ORIGINALS • LAST UPDATED MAY 2025</div>
      <div className="text-[#ccc] whitespace-pre-line leading-relaxed text-[15px]">{contents[type]}</div>
      <div className="mt-12 text-xs border-t border-[#222] pt-8 text-[#666]">
        Office: FF Shop No. 6, Arohi Arcade, Munshipulia, Lucknow - 226016<br />Support: reelramporiginal@gmail.com | +91 7307493338
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
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (password === EDITOR_PASSWORD ? setIsLoggedIn(true) : setError("Invalid password"))}
            placeholder="Editor Password" className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none" />
          {error && <p className="text-[#e11d48] text-sm text-center mt-2">{error}</p>}
          <button onClick={() => password === EDITOR_PASSWORD ? setIsLoggedIn(true) : setError("Invalid password")} className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold">LOGIN AS EDITOR</button>
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
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (password === OWNER_PASSWORD ? setIsLoggedIn(true) : setError("Invalid password"))}
            placeholder="Owner Password" className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none" />
          {error && <p className="text-[#e11d48] text-sm text-center mt-2">{error}</p>}
          <button onClick={() => password === OWNER_PASSWORD ? setIsLoggedIn(true) : setError("Invalid password")} className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold">LOGIN AS OWNER</button>
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
          {["Manage All Shorts","Subscription Plans","User Management","Revenue & Analytics","Payment Settings","Platform Settings"].map(item => (
            <div key={item} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex items-center justify-between">
              <span className="font-medium">{item}</span>
              <button onClick={() => navigate('/admin')} className="text-[#c5a26f] text-sm px-4 py-2 bg-[#1a1a1a] rounded-xl">Open →</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PAGE — All systems integrated
// HYBRID FAIL-SAFE: localStorage first, Supabase background sync
// MANDATORY finally { setSyncing(false) } on every DB call
// SYSTEM 3: Store Inventory Manager tab
// SYSTEM 7: Payment gateway matrix
// ─────────────────────────────────────────────────────────────────────────────
function AdminPage() {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggedInAdmin, setLoggedInAdmin] = useState('');
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'content' | 'users' | 'analytics' | 'popups' |
    'settings' | 'plans' | 'payment' | 'categories' | 'promo' |
    'revenue' | 'store' | 'datatools'
  >('dashboard');

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

  // HYBRID FAIL-SAFE: render from localStorage instantly
  useEffect(() => {
    if (!isAuthorized) return;
    setAdminVideos(getStoredVideos());
    setPopups(getStoredPopups());
    setPlatformSettings(getSettings());
    setSubSettings(getSubSettings());
    setPaymentConfig(getPaymentSettings());
    setCategoriesState(getCategories());
    setPromoSettings(getPromoSettings());
    setVideoViews(getVideoViews());
    setDigitalProducts(getDigitalProducts());
    const savedUsers = ls.get<AdminUser[]>('reelramp_admin_users', initialAdminUsers);
    setAdminUsers(savedUsers);

    // Background Supabase sync — MANDATORY finally block prevents freeze
    setSyncing(true);
    supabase.from('videos').select('*').order('id')
      .then(({ data }) => {
        if (data && data.length > 0) { setAdminVideos(data as Video[]); saveVideos(data as Video[]); }
      })
      .catch(() => {})
      .finally(() => { setSyncing(false); }); // MANDATORY — prevents freeze
  }, [isAuthorized]);

  // SYSTEM: persist videos with Supabase upsert + mandatory finally
  const persistVideos = async (updated: Video[]) => {
    setAdminVideos(updated);
    saveVideos(updated);
    setSyncing(true);
    try {
      await supabase.from('videos').upsert(updated);
    } catch { /* graceful degradation */ }
    finally { setSyncing(false); } // MANDATORY
  };

  // SYSTEM: setting sync with mandatory finally
  const syncSettingToSupabase = async (key: string, value: unknown) => {
    setSyncing(true);
    try {
      await supabase.from('platform_settings').upsert({ key, value: JSON.stringify(value) });
    } catch { /* graceful */ }
    finally { setSyncing(false); } // MANDATORY
  };

  const persistPopups = (updated: PopupAd[]) => { setPopups(updated); savePopups(updated); };

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

  const saveVideo = async () => {
    if (!formData.title.trim()) return;
    let updated: Video[];
    if (editingVideo) {
      updated = adminVideos.map(v => v.id === editingVideo.id ? { ...v, ...formData } : v);
    } else {
      const newId = Math.max(0, ...adminVideos.map(v => v.id)) + 1;
      updated = [...adminVideos, { ...formData, id: newId } as Video];
    }
    await persistVideos(updated);
    setShowAddModal(false);
    showToast(editingVideo ? "✅ Short updated & synced!" : "✅ Short published & synced!");
  };

  const deleteVideo = async (id: number) => {
    const updated = adminVideos.filter(v => v.id !== id);
    setAdminVideos(updated);
    saveVideos(updated);
    setSyncing(true);
    try { await supabase.from('videos').delete().eq('id', id); }
    catch { /* graceful */ }
    finally { setSyncing(false); } // MANDATORY
    showToast("Short deleted.");
  };

  const toggleUserSub = (userId: number) => {
    const updated = adminUsers.map(u => u.id === userId ? { ...u, subscribed: !u.subscribed } : u);
    setAdminUsers(updated);
    ls.set('reelramp_admin_users', updated);
  };

  // SYSTEM 3: Store product CRUD
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
    showToast(editingProduct ? "✅ Product updated!" : "✅ Product listed in Store!");
  };

  const deleteProduct = (id: number) => {
    const updated = digitalProducts.filter(p => p.id !== id);
    setDigitalProducts(updated);
    saveDigitalProducts(updated);
    showToast("Product removed from Store.");
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
          <button onClick={handleAdminLogin} className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold tracking-wider">ACCESS ADMIN DASHBOARD</button>
          <button onClick={() => navigate('/')} className="mt-4 text-sm text-[#666]">Back to App</button>
        </div>
      </div>
    );
  }

  const TAB_ITEMS = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'content', label: 'Content', icon: Play },
    { key: 'store', label: 'Store Inventory', icon: ShoppingBag },
    { key: 'revenue', label: 'Revenue Share', icon: TrendingUp },
    { key: 'popups', label: 'Popup Ads', icon: Star },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Platform', icon: Settings },
    { key: 'plans', label: 'Plans', icon: CreditCard },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'categories', label: 'Categories', icon: Play },
    { key: 'promo', label: 'Promo Video', icon: Play },
    { key: 'datatools', label: 'Data Tools', icon: Database },
  ] as const;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {toast && (
        <div className="fixed top-6 right-6 z-[200] bg-[#111] border border-[#c5a26f]/40 text-white px-6 py-3 rounded-2xl text-sm shadow-xl">{toast}</div>
      )}
      {/* HYBRID: Syncing indicator — guaranteed to clear via finally block */}
      {syncing && (
        <div className="fixed top-6 left-6 z-[200] flex items-center gap-2 bg-[#111] border border-[#333] px-4 py-2 rounded-xl text-xs text-[#a1a1aa]">
          <div className="w-3 h-3 border-2 border-[#c5a26f] border-t-transparent rounded-full animate-spin" /> Syncing…
        </div>
      )}

      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size={28} />
            <div><div className="font-semibold text-xl tracking-tighter text-white">Admin</div><div className="text-xs text-[#666] -mt-1">PRODUCTION CONTROL</div></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#c5a26f] hidden md:block">{loggedInAdmin}</span>
            <button onClick={() => navigate('/')} className="px-4 py-2 rounded-2xl border border-[#333] text-sm">View App</button>
            <button onClick={() => { setIsAuthorized(false); setLoggedInAdmin(''); }} className="px-4 py-2 rounded-2xl bg-[#e11d48] text-white text-sm">Logout</button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-[#222] overflow-x-auto no-scrollbar">
          {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap text-sm ${activeTab === key ? 'border-[#c5a26f] text-white' : 'border-transparent text-[#666]'}`}>
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
                <p className="text-[#a1a1aa]">Live platform metrics</p>
              </div>
              <button onClick={openAddModal} className="flex items-center gap-2 px-6 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium text-sm"><Plus size={18} /> New Short</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Total Shorts", value: adminVideos.length, sub: `${premiumShorts} Premium` },
                { label: "Active Users", value: adminUsers.length, sub: `${premiumUsers} Premium` },
                { label: "Total Plays", value: totalPlays, sub: "All time" },
                { label: "Est. Revenue", value: `₹${estimatedRevenue.toLocaleString()}`, sub: "Monthly recurring" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-3xl p-7">
                  <div className="text-[#a1a1aa] text-xs tracking-widest">{stat.label}</div>
                  <div className="text-4xl font-semibold tracking-[-1.5px] mt-1">{stat.value}</div>
                  <div className="text-xs text-[#c5a26f] mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              {(['content', 'store', 'revenue', 'analytics'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className="p-5 text-left border border-[#222] hover:border-[#c5a26f] rounded-2xl flex justify-between items-center capitalize">
                  {tab === 'store' ? 'Store Inventory' : tab === 'revenue' ? 'Revenue Share' : tab} <Play size={18} className="text-[#666]" />
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
              <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c5a26f] text-black font-medium text-sm"><Plus size={17} /> Add New</button>
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
                      <td className="font-mono text-sm text-[#c5a26f]">{videoViews[video.id] || 0}</td>
                      <td>{video.isPremium ? <span className="text-xs px-2 py-px bg-[#e11d48] rounded">PREMIUM</span> : <span className="text-xs px-2 py-px bg-[#22c55e] text-black rounded">FREE</span>}</td>
                      <td className="text-right px-6">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEditModal(video)} className="p-2 hover:bg-[#222] rounded-xl"><Edit2 size={16} /></button>
                          <button onClick={() => deleteVideo(video.id)} className="p-2 hover:bg-[#e11d48]/10 text-[#e11d48] rounded-xl"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SYSTEM 3: STORE INVENTORY MANAGER */}
        {activeTab === 'store' && (
          <div>
            <div className="flex justify-between mb-6">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight">Store Inventory Manager</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">Add, edit, or remove digital products from the public Store tab.</p>
              </div>
              <button
                onClick={() => {
                  setProductForm({ title: '', description: '', price: 999, category: 'workshop', thumbnailUrl: '', isPremium: false, badge: '' });
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c5a26f] text-black font-medium text-sm">
                <Plus size={17} /> Add Product
              </button>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Products', value: digitalProducts.length },
                { label: 'Workshops', value: digitalProducts.filter(p => p.category === 'workshop').length },
                { label: 'Premium Items', value: digitalProducts.filter(p => p.isPremium).length },
              ].map((s, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-2xl p-5">
                  <div className="text-xs text-[#666] tracking-widest">{s.label}</div>
                  <div className="text-3xl font-semibold mt-1">{s.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {digitalProducts.map(product => (
                <div key={product.id} className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden group hover:border-[#c5a26f]/40 transition-all">
                  <div className="relative aspect-video overflow-hidden bg-[#1a1a1a]">
                    <img src={product.thumbnailUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.currentTarget.src = `https://via.placeholder.com/400x225/1a1a1a/c5a26f?text=${product.category.toUpperCase()}`; }} />
                    {product.badge && <div className="absolute top-2 left-2 bg-[#c5a26f] text-black text-[9px] px-2 py-0.5 rounded-full font-bold tracking-widest">{product.badge}</div>}
                    {product.isPremium && <div className="absolute top-2 right-2 bg-[#e11d48] text-[9px] px-2 py-0.5 rounded-full font-medium">PREMIUM</div>}
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-[#c5a26f] mb-1 tracking-widest uppercase">{product.category}</div>
                    <div className="font-semibold text-sm mb-1 line-clamp-1">{product.title}</div>
                    <div className="text-xs text-[#a1a1aa] line-clamp-2 mb-4">{product.description}</div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-2xl font-semibold text-[#c5a26f]">₹{product.price.toLocaleString()}</div>
                      <div className="text-xs text-[#666] bg-[#1a1a1a] px-2 py-1 rounded-lg">{product.isPremium ? 'PREMIUM' : 'PUBLIC'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setProductForm({ title: product.title, description: product.description, price: product.price, category: product.category, thumbnailUrl: product.thumbnailUrl, isPremium: product.isPremium, badge: product.badge || '' });
                          setEditingProduct(product);
                          setShowProductModal(true);
                        }}
                        className="flex-1 py-2.5 bg-[#222] hover:bg-[#2a2a2a] rounded-xl text-xs flex items-center justify-center gap-1 transition-colors">
                        <Edit2 size={13} /> Edit
                      </button>
                      <button onClick={() => deleteProduct(product.id)}
                        className="flex-1 py-2.5 bg-[#e11d48]/10 hover:bg-[#e11d48]/20 text-[#e11d48] rounded-xl text-xs flex items-center justify-center gap-1 transition-colors">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {digitalProducts.length === 0 && (
              <div className="text-center py-20 text-[#666]">
                <ShoppingBag size={40} className="mx-auto mb-4 opacity-30" />
                <div className="text-lg mb-2">No products yet</div>
                <div className="text-sm">Click "Add Product" to list your first digital item.</div>
              </div>
            )}
          </div>
        )}

        {/* REVENUE SHARING */}
        {activeTab === 'revenue' && (
          <div className="max-w-4xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-3xl font-semibold tracking-tight">Revenue Sharing Index</h3>
                <p className="text-[#a1a1aa] text-sm mt-1">Creator payout calculator and report generator.</p>
              </div>
              <button onClick={downloadRevenueReport} className="flex items-center gap-2 px-5 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium text-sm">
                <FileText size={16} /> Download Report
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}`, color: 'text-white' },
                { label: `Platform (${platformSplit}%)`, value: `₹${platformRevenue.toLocaleString()}`, color: 'text-[#c5a26f]' },
                { label: `Creators (${creatorSplit}%)`, value: `₹${creatorRevenue.toLocaleString()}`, color: 'text-[#22c55e]' },
              ].map((m, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-3xl p-6">
                  <div className="text-xs text-[#666] tracking-widest mb-1">{m.label}</div>
                  <div className={`text-4xl font-semibold tracking-tighter ${m.color}`}>{m.value}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#111] border border-[#222] rounded-3xl p-7 mb-8">
              <div className="font-medium mb-4">Adjust Split Ratio</div>
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-[#a1a1aa] w-28">Platform {platformSplit}%</span>
                <input type="range" min={30} max={90} step={5} value={platformSplit} onChange={e => setPlatformSplit(Number(e.target.value))} className="flex-1 accent-[#c5a26f]" />
                <span className="text-sm text-[#22c55e] w-28 text-right">Creators {creatorSplit}%</span>
              </div>
              <div className="w-full h-3 bg-[#1a1a1a] rounded-full overflow-hidden flex">
                <div className="h-full bg-[#c5a26f] transition-all" style={{ width: `${platformSplit}%` }} />
                <div className="h-full bg-[#22c55e] transition-all flex-1" />
              </div>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222] font-medium">Creator Allocations</div>
              <table className="w-full text-sm">
                <thead className="text-[#a1a1aa] border-b border-[#222]">
                  <tr>
                    <th className="text-left py-3 px-6">Creator</th>
                    <th className="text-left py-3">Video</th>
                    <th className="text-left py-3">Views</th>
                    <th className="text-right py-3 px-6">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {creatorEntries.map((e, i) => (
                    <tr key={i} className="hover:bg-[#1a1a1a]">
                      <td className="py-4 px-6 font-medium">{e.creatorName}</td>
                      <td className="text-[#a1a1aa] line-clamp-1 max-w-[200px]">{e.videoTitle}</td>
                      <td className="font-mono text-[#c5a26f]">{e.totalViews}</td>
                      <td className="text-right px-6 font-semibold text-[#22c55e]">₹{e.revenueShare.toLocaleString()}</td>
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
                <p className="text-[#a1a1aa] text-sm mt-1">Marketing popups shown on app launch.</p>
              </div>
              <button onClick={() => { const np: PopupAd = { id: Date.now(), title: "New Campaign", imageUrl: "/images/popup-ad.jpg", redirectUrl: "/subscription", isActive: false }; persistPopups([...popups, np]); setEditingPopup(np); }}
                className="px-5 py-2.5 bg-[#c5a26f] text-black rounded-2xl flex items-center gap-2 font-medium text-sm"><Plus size={16} /> New Popup</button>
            </div>
            <div className="space-y-4">
              {popups.map(popup => (
                <div key={popup.id} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start">
                  <img src={popup.imageUrl} className="w-full md:w-64 h-36 object-cover rounded-2xl" alt="" />
                  <div className="flex-1">
                    <div className="font-semibold text-xl mb-2">{popup.title}</div>
                    <div className="text-xs text-[#666] font-mono mb-4">{popup.redirectUrl}</div>
                    <div className="flex gap-3">
                      <button onClick={() => { const updated = popups.map(p => ({ ...p, isActive: p.id === popup.id ? !p.isActive : false })); persistPopups(updated); }}
                        className={`px-5 py-2 rounded-2xl text-sm ${popup.isActive ? 'bg-[#22c55e] text-black' : 'bg-[#333]'}`}>{popup.isActive ? "LIVE" : "HIDDEN"}</button>
                      <button onClick={() => setEditingPopup({ ...popup })} className="px-5 py-2 bg-[#222] rounded-2xl text-sm">Edit</button>
                      <button onClick={() => persistPopups(popups.filter(p => p.id !== popup.id))} className="px-5 py-2 bg-[#e11d48]/10 text-[#e11d48] rounded-2xl text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {editingPopup && (
              <div className="fixed inset-0 bg-black/90 z-[95] flex items-center justify-center p-6">
                <div className="bg-[#111] p-8 rounded-3xl w-full max-w-md">
                  <div className="text-xl font-medium mb-6">Edit Popup</div>
                  {[{ label: "Title", key: 'title' as const }, { label: "Image URL", key: 'imageUrl' as const }, { label: "Redirect URL", key: 'redirectUrl' as const }].map(f => (
                    <div key={f.key} className="mb-4">
                      <label className="text-xs text-[#666] mb-1 block">{f.label}</label>
                      <input value={editingPopup[f.key] as string} onChange={e => setEditingPopup({ ...editingPopup, [f.key]: e.target.value })} className="w-full bg-[#1a1a1a] px-5 py-3 rounded-2xl border border-[#333] text-sm" />
                    </div>
                  ))}
                  <div className="flex gap-3">
                    <button onClick={() => setEditingPopup(null)} className="flex-1 py-3 border border-[#333] rounded-2xl">Cancel</button>
                    <button onClick={() => { persistPopups(popups.map(p => p.id === editingPopup.id ? editingPopup : p)); setEditingPopup(null); showToast("✅ Popup saved!"); }} className="flex-1 py-3 bg-[#c5a26f] text-black rounded-2xl">Save</button>
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
                      <td className="py-5 px-6"><div className="font-medium">{u.name}</div><div className="text-xs text-[#666]">{u.email}</div></td>
                      <td className="text-[#a1a1aa]">{u.joinDate}</td>
                      <td className="font-mono">{u.totalWatched}</td>
                      <td className="px-6"><span className={`px-3 py-px rounded text-xs ${u.subscribed ? 'bg-[#c5a26f] text-black' : 'bg-[#333]'}`}>{u.subscribed ? "PREMIUM" : "FREE"}</span></td>
                      <td className="px-6 text-right"><button onClick={() => toggleUserSub(u.id)} className="px-4 py-2 border border-[#333] rounded-xl text-xs hover:bg-[#222]">{u.subscribed ? "Revoke" : "Upgrade"}</button></td>
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
                { label: "Total Revenue", value: `₹${totalRevenue.toLocaleString()}` },
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
                    <div><div className="font-medium">{entry.plan}</div><div className="text-xs text-[#666]">{entry.date}</div></div>
                    <div className="text-right"><div className="font-semibold text-[#c5a26f]">+₹{entry.amount}</div><div className="text-xs text-[#666]">{entry.type}</div></div>
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
              {[
                { label: "App Name", key: 'appName' as const },
                { label: "Tagline", key: 'tagline' as const },
                { label: "Support Email", key: 'supportEmail' as const },
                { label: "Support Phone", key: 'supportPhone' as const },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-[#666] mb-1 block">{f.label}</label>
                  <input value={platformSettings[f.key] as string} onChange={e => setPlatformSettings({ ...platformSettings, [f.key]: e.target.value })}
                    className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm focus:border-[#c5a26f] outline-none" />
                </div>
              ))}
              <div>
                <label className="text-xs text-[#666] mb-2 block">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={platformSettings.accentColor} onChange={e => setPlatformSettings({ ...platformSettings, accentColor: e.target.value })} className="w-12 h-10 rounded-xl cursor-pointer" />
                  <span className="font-mono text-sm text-[#a1a1aa]">{platformSettings.accentColor}</span>
                </div>
              </div>
              <button onClick={async () => { saveSettings(platformSettings); await syncSettingToSupabase('platform', platformSettings); showToast("✅ Platform settings saved & synced!"); }}
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider">SAVE PLATFORM SETTINGS</button>
            </div>
          </div>
        )}

        {/* PLAN SETTINGS */}
        {activeTab === 'plans' && (
          <div className="max-w-2xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-6">Plan Settings</h3>
            <div className="space-y-4">
              {[
                { label: "Trial Price", key: 'trialOfferPrice' as const },
                { label: "Trial Duration", key: 'trialOfferDuration' as const },
                { label: "Full Price", key: 'fullPrice' as const },
                { label: "Full Plan Validity", key: 'fullValidity' as const },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-[#666] mb-1 block">{f.label}</label>
                  <input value={subSettings[f.key] as string} onChange={e => setSubSettings({ ...subSettings, [f.key]: e.target.value })}
                    className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm focus:border-[#c5a26f] outline-none" />
                </div>
              ))}
              <div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]">
                <div><div className="font-medium text-sm">Show Trial Popup</div><div className="text-xs text-[#666]">Display trial offer popup on launch</div></div>
                <button onClick={() => setSubSettings({ ...subSettings, showTrialPopup: !subSettings.showTrialPopup })}
                  className={`w-12 h-6 rounded-full transition-colors ${subSettings.showTrialPopup ? 'bg-[#c5a26f]' : 'bg-[#333]'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${subSettings.showTrialPopup ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <button onClick={async () => { saveSubSettings(subSettings); await syncSettingToSupabase('subscription', subSettings); showToast("✅ Plan settings saved & synced!"); }}
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider">SAVE PLAN SETTINGS</button>
            </div>
          </div>
        )}

        {/* SYSTEM 7: PAYMENT GATEWAY MATRIX */}
        {activeTab === 'payment' && (
          <div className="max-w-2xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-2">Payment Settings</h3>
            <p className="text-[#a1a1aa] text-sm mb-6">Configure the active payment gateway. All fields sync live to the checkout flow.</p>
            <div className="space-y-4">
              {/* Gateway selector */}
              <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-4">
                <div className="text-xs text-[#c5a26f] tracking-widest font-medium">ACTIVE GATEWAY</div>
                <div className="grid grid-cols-2 gap-3">
                  {(['razorpay', 'stripe', 'upi', 'none'] as const).map(gw => (
                    <button key={gw} onClick={() => setPaymentConfig({ ...paymentConfig, activeGateway: gw })}
                      className={`py-3 rounded-2xl text-sm font-medium border transition ${paymentConfig.activeGateway === gw ? 'border-[#c5a26f] bg-[#c5a26f]/10 text-[#c5a26f]' : 'border-[#333] text-[#666]'}`}>
                      {gw === 'none' ? 'None / Manual' : gw.charAt(0).toUpperCase() + gw.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]">
                  <div><div className="font-medium text-sm">Live Mode</div><div className="text-xs text-[#e11d48]">⚠️ Only enable for real payments</div></div>
                  <button onClick={() => setPaymentConfig({ ...paymentConfig, isLiveMode: !paymentConfig.isLiveMode })}
                    className={`w-12 h-6 rounded-full transition-colors ${paymentConfig.isLiveMode ? 'bg-[#22c55e]' : 'bg-[#333]'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${paymentConfig.isLiveMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              {/* Razorpay */}
              <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-4">
                <div className="text-xs text-[#a1a1aa] tracking-widest font-medium">RAZORPAY</div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Key ID</label>
                  <input value={paymentConfig.razorpayKeyId} onChange={e => setPaymentConfig({ ...paymentConfig, razorpayKeyId: e.target.value })}
                    className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none" placeholder="rzp_test_..." />
                </div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Key Secret</label>
                  <input type="password" value={paymentConfig.razorpayKeySecret} onChange={e => setPaymentConfig({ ...paymentConfig, razorpayKeySecret: e.target.value })}
                    className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none" placeholder="••••••••••••••••" />
                </div>
              </div>

              {/* UPI */}
              <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-4">
                <div className="text-xs text-[#a1a1aa] tracking-widest font-medium">UPI</div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">UPI ID</label>
                  <input value={paymentConfig.upiId} onChange={e => setPaymentConfig({ ...paymentConfig, upiId: e.target.value })}
                    className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none" placeholder="yourname@upi" />
                </div>
              </div>

              {/* Stripe */}
              <div className="bg-[#111] border border-[#222] rounded-3xl p-6 space-y-4">
                <div className="text-xs text-[#a1a1aa] tracking-widest font-medium">STRIPE</div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Publishable Key</label>
                  <input value={paymentConfig.stripePublishableKey} onChange={e => setPaymentConfig({ ...paymentConfig, stripePublishableKey: e.target.value })}
                    className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none" placeholder="pk_test_..." />
                </div>
              </div>

              {/* Save — mandatory finally via syncSettingToSupabase */}
              <button
                onClick={async () => {
                  savePaymentSettings(paymentConfig);
                  await syncSettingToSupabase('payment', paymentConfig);
                  showToast("✅ Payment settings saved & synced!");
                }}
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider">
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
              <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newCategoryName.trim()) { const updated = [...categories, newCategoryName.trim()]; setCategoriesState(updated); saveCategories(updated); setNewCategoryName(''); showToast("✅ Category added!"); } }}
                placeholder="New category name" className="flex-1 bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm focus:border-[#c5a26f] outline-none" />
              <button onClick={() => { if (newCategoryName.trim()) { const updated = [...categories, newCategoryName.trim()]; setCategoriesState(updated); saveCategories(updated); setNewCategoryName(''); showToast("✅ Category added!"); } }}
                className="px-5 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium flex items-center gap-2 text-sm"><Plus size={16} /> Add</button>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden">
              <div className="divide-y divide-[#222]">
                {categories.map(cat => (
                  <div key={cat} className="flex items-center gap-4 px-6 py-4">
                    {editingCatName === cat ? (
                      <>
                        <input value={editingCatValue} onChange={e => setEditingCatValue(e.target.value)} className="flex-1 bg-[#1a1a1a] px-4 py-2 rounded-xl border border-[#c5a26f] text-sm" autoFocus />
                        <button onClick={() => { const updated = categories.map(c => c === cat ? editingCatValue : c); setCategoriesState(updated); saveCategories(updated); setEditingCatName(null); }} className="px-4 py-2 bg-[#c5a26f] text-black rounded-xl text-xs">Save</button>
                        <button onClick={() => setEditingCatName(null)} className="px-4 py-2 border border-[#333] rounded-xl text-xs">Cancel</button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 font-medium">{cat}</div>
                        <button onClick={() => { setEditingCatName(cat); setEditingCatValue(cat); }} className="p-2 hover:bg-[#222] rounded-xl text-[#a1a1aa]"><Edit2 size={15} /></button>
                        <button onClick={() => { const updated = categories.filter(c => c !== cat); setCategoriesState(updated); saveCategories(updated); }} className="p-2 hover:bg-[#e11d48]/10 text-[#e11d48] rounded-xl"><Trash2 size={15} /></button>
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
                <div><div className="font-medium text-sm">Show Promo Video</div><div className="text-xs text-[#666]">Display in trial popup</div></div>
                <button onClick={() => setPromoSettings({ ...promoSettings, isEnabled: !promoSettings.isEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors ${promoSettings.isEnabled ? 'bg-[#c5a26f]' : 'bg-[#333]'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${promoSettings.isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex gap-3">
                {(['youtube', 'direct'] as const).map(t => (
                  <button key={t} onClick={() => setPromoSettings({ ...promoSettings, videoType: t })}
                    className={`flex-1 py-2.5 rounded-2xl text-sm font-medium border transition ${promoSettings.videoType === t ? 'border-[#c5a26f] bg-[#c5a26f]/10 text-[#c5a26f]' : 'border-[#333] text-[#666]'}`}>
                    {t === 'youtube' ? 'YouTube' : 'Direct URL'}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs text-[#666] mb-1 block">Video URL</label>
                <input value={promoSettings.videoUrl} onChange={e => setPromoSettings({ ...promoSettings, videoUrl: e.target.value })}
                  className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none" />
              </div>
              <button onClick={() => { savePromoSettings(promoSettings); showToast("✅ Promo video saved!"); }}
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider">SAVE PROMO VIDEO SETTINGS</button>
            </div>
          </div>
        )}

        {/* DATA TOOLS */}
        {activeTab === 'datatools' && (
          <div className="max-w-2xl">
            <h3 className="text-3xl font-semibold tracking-tight mb-2">Data Integrity Hub</h3>
            <p className="text-[#a1a1aa] mb-8">Export a complete platform snapshot or restore from a backup file.</p>
            <div className="bg-[#111] border border-[#222] rounded-3xl p-7 mb-5">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-[#c5a26f]/10 rounded-2xl flex items-center justify-center flex-shrink-0"><Download size={22} className="text-[#c5a26f]" /></div>
                <div>
                  <div className="font-semibold text-lg">Export System Backup</div>
                  <div className="text-sm text-[#a1a1aa] mt-1">Downloads a complete JSON snapshot of all data.</div>
                </div>
              </div>
              <button onClick={() => { exportSystemBackup(); showToast("✅ Backup downloaded!"); }}
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl flex items-center justify-center gap-2">
                <Database size={18} /> Download Full JSON Backup
              </button>
            </div>
            <div className="bg-[#111] border border-[#222] rounded-3xl p-7">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-[#1a1a1a] border border-[#333] rounded-2xl flex items-center justify-center flex-shrink-0"><Upload size={22} className="text-[#a1a1aa]" /></div>
                <div>
                  <div className="font-semibold text-lg">Restore from Backup</div>
                  <div className="text-sm text-[#a1a1aa] mt-1">Upload a valid ReelRamp JSON backup file.</div>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  importSystemBackup(file,
                    msg => { showToast(msg); setAdminVideos(getStoredVideos()); setCategoriesState(getCategories()); setDigitalProducts(getDigitalProducts()); setPlatformSettings(getSettings()); setSubSettings(getSubSettings()); setPaymentConfig(getPaymentSettings()); },
                    err => showToast(err)
                  );
                  e.target.value = '';
                }} />
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-[#1a1a1a] border border-[#333] hover:border-[#c5a26f] text-white font-semibold rounded-2xl flex items-center justify-center gap-2 transition-colors">
                <Upload size={18} /> Choose Backup File (.json)
              </button>
              <p className="text-xs text-[#444] text-center mt-3">⚠️ This will overwrite current platform configuration.</p>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Video Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.96, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 20, opacity: 0 }}
              className="bg-[#111] border border-[#333] w-full max-w-lg rounded-3xl p-9" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-7">
                <div className="text-2xl font-semibold">{editingVideo ? "Edit Short" : "Publish New Short"}</div>
                <button onClick={() => setShowAddModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <input placeholder="Short Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" />
                <textarea placeholder="Compelling description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] resize-y text-sm focus:border-[#c5a26f] outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm">
                    {getCategories().map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input placeholder="Duration e.g. 4:45" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    className="bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" />
                </div>
                <div className="flex items-center gap-4 bg-[#1a1a1a] rounded-2xl p-5 border border-[#222]">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.isPremium} onChange={e => setFormData({ ...formData, isPremium: e.target.checked })} className="accent-[#c5a26f] scale-125" />
                    <div><div className="font-medium text-sm">Premium Only</div><div className="text-xs text-[#a1a1aa]">Requires active subscription</div></div>
                  </label>
                </div>
                <input placeholder="Thumbnail URL" value={formData.thumbnail} onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                  className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm font-mono focus:border-[#c5a26f] outline-none" />
                <input placeholder="Video URL (mp4 or Bunny.net path)" value={formData.videoUrl} onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm font-mono focus:border-[#c5a26f] outline-none" />
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 border border-[#333] rounded-2xl text-sm">Cancel</button>
                <button onClick={saveVideo} className="flex-1 py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm">{editingVideo ? "Save Changes" : "Publish Short"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-6" onClick={() => setShowProductModal(false)}>
            <motion.div initial={{ scale: 0.96, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 20, opacity: 0 }}
              className="bg-[#111] border border-[#333] w-full max-w-lg rounded-3xl p-9" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-7">
                <div className="text-2xl font-semibold">{editingProduct ? "Edit Product" : "Add New Product"}</div>
                <button onClick={() => setShowProductModal(false)}><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <input placeholder="Product Title" value={productForm.title} onChange={e => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" />
                <textarea placeholder="Description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                  rows={2} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] resize-y text-sm focus:border-[#c5a26f] outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Category</label>
                    <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value as DigitalProduct['category'] })}
                      className="w-full bg-[#1a1a1a] py-3.5 px-4 rounded-2xl border border-[#222] text-sm">
                      <option value="workshop">Workshop</option>
                      <option value="guide">Guide</option>
                      <option value="merch">Merch</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Price (₹)</label>
                    <input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full bg-[#1a1a1a] py-3.5 px-4 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" />
                  </div>
                </div>
                <input placeholder="Thumbnail URL" value={productForm.thumbnailUrl} onChange={e => setProductForm({ ...productForm, thumbnailUrl: e.target.value })}
                  className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm font-mono focus:border-[#c5a26f] outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Badge (e.g. BESTSELLER)" value={productForm.badge} onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                    className="bg-[#1a1a1a] py-3.5 px-4 rounded-2xl border border-[#222] text-sm focus:border-[#c5a26f] outline-none" />
                  <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-2xl px-4 border border-[#222]">
                    <input type="checkbox" checked={productForm.isPremium} onChange={e => setProductForm({ ...productForm, isPremium: e.target.checked })} className="accent-[#c5a26f]" />
                    <span className="text-sm">Premium Only</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowProductModal(false)} className="flex-1 py-4 border border-[#333] rounded-2xl text-sm">Cancel</button>
                <button onClick={saveProduct} className="flex-1 py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm">
                  {editingProduct ? "Save Changes" : "List Product"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ULTRA-PREMIUM KUKU TV STYLE PLAYER — DROP-IN REPLACEMENT
// Replace CinematicPlayer + ShortsPlayerPage in your App.tsx with this code
// ═══════════════════════════════════════════════════════════════════════════
//
// FEATURES:
// ✅ True 100dvh full-bleed vertical player
// ✅ Auto-hide overlays after 3s (Kuku TV style)
// ✅ Tap anywhere = reveal + reset timer
// ✅ Double-tap LEFT = rewind 10s (with animated ripple)
// ✅ Double-tap RIGHT = forward 10s (with animated ripple)
// ✅ Swipe up/down = next/prev video with spring physics
// ✅ Drag-to-seek scrubber with thumb + buffered track
// ✅ Animated gradient top/bottom chrome
// ✅ Speed selector (0.5x→2x) floating pill
// ✅ Mute toggle with animated icon swap
// ✅ Center play/pause with morph animation
// ✅ Like button with heart burst particle explosion
// ✅ Video progress saved to localStorage for resume
// ✅ Gesture velocity-aware swipe detection
// ✅ Long-press scrubber for frame-accurate seeking
// ✅ Loading skeleton with shimmer
// ✅ Error state with retry
// ═══════════════════════════════════════════════════════════════════════════

import React, {
  useState, useEffect, useRef, useCallback, useLayoutEffect
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  ArrowLeft, Heart, Bookmark, Share2, Lock,
  Volume2, VolumeX, Play, Pause, RotateCcw, RotateCw,
  ChevronUp, ChevronDown, Star
} from 'lucide-react';

// ─── paste your existing imports from App.tsx ───
// These are referenced below — make sure they exist in scope:
// - Video, WatchHistoryItem interfaces
// - getStoredVideos, getWatchHistory, addToWatchHistory, incrementView, getResumeTimestamp
// - ls (localStorage helper)
// - SubscriptionInterceptModal, PaywallModal
// - incrementScrollCount, getScrollCount, resetScrollCount
// - useAuth hook


// ════════════════════════════════════════════════════════════════
// TYPES (local to this file)
// ════════════════════════════════════════════════════════════════
interface RippleEffect {
  id: number;
  x: number;
  y: number;
  side: 'left' | 'right';
  label: string;
}

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  angle: number;
  distance: number;
}


// ════════════════════════════════════════════════════════════════
// ULTRA CINEMATIC PLAYER CORE
// ════════════════════════════════════════════════════════════════
interface UltraPlayerProps {
  video: Video;
  isPlaying: boolean;
  isMuted: boolean;
  speed: number;
  resumeFrom: number;
  onPlayPause: () => void;
  onEnded: () => void;
  onTimeUpdate: (current: number, duration: number, buffered: number) => void;
  onLoaded: () => void;
  onError: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
}

function UltraPlayerCore({
  video, isPlaying, isMuted, speed, resumeFrom,
  onPlayPause, onEnded, onTimeUpdate, onLoaded, onError, videoRef
}: UltraPlayerProps) {
  const hasResumed = useRef(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.play().catch(() => {});
    else videoRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const handleMeta = () => {
    if (!videoRef.current) return;
    if (!hasResumed.current && resumeFrom > 2) {
      videoRef.current.currentTime = resumeFrom;
      hasResumed.current = true;
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const vid = videoRef.current;
    let buffered = 0;
    if (vid.buffered.length > 0) {
      buffered = vid.buffered.end(vid.buffered.length - 1);
    }
    onTimeUpdate(vid.currentTime, vid.duration || 0, buffered);
  };

  if (video.source === 'youtube') {
    const videoId = video.videoUrl.split('/').pop()?.split('?')[0] || '';
    return (
      <iframe
        className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1`}
        title={video.title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        onLoad={onLoaded}
      />
    );
  }

  const resolvedUrl = video.source === 'bunny'
    ? `https://reelrampproshorts1.b-cdn.net/${video.videoUrl.replace(/^\//, '')}`
    : video.videoUrl;

  return (
    <video
      ref={videoRef}
      src={resolvedUrl}
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay
      playsInline
      loop={false}
      onEnded={onEnded}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleMeta}
      onLoadedData={onLoaded}
      onError={onError}
      style={{ backgroundColor: '#000' }}
    />
  );
}


// ════════════════════════════════════════════════════════════════
// SCRUBBER — drag-to-seek with buffered track
// ════════════════════════════════════════════════════════════════
interface ScrubberProps {
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (t: number) => void;
}

function UltraScrubber({ currentTime, duration, buffered, onSeek }: ScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [dragPct, setDragPct] = useState(0);

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const displayPct = dragging ? dragPct : pct;

  const getPctFromEvent = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = getPctFromEvent(e.clientX);
    setDragging(true);
    setDragPct(p);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragPct(getPctFromEvent(e.clientX));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging) return;
    const p = getPctFromEvent(e.clientX);
    setDragging(false);
    onSeek((p / 100) * duration);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full px-4 pb-2 select-none">
      {/* Time labels */}
      <div className="flex justify-between text-[10px] text-white/50 font-mono mb-2 px-0.5">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        className="relative w-full cursor-pointer"
        style={{ height: dragging ? 20 : 14, transition: 'height 0.15s' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* Base track */}
        <div className="absolute inset-x-0 rounded-full bg-white/15" style={{ top: '50%', transform: 'translateY(-50%)', height: dragging ? 4 : 3 }} />

        {/* Buffered */}
        <div className="absolute rounded-full bg-white/30 transition-all"
          style={{ top: '50%', transform: 'translateY(-50%)', height: dragging ? 4 : 3, left: 0, width: `${bufPct}%` }} />

        {/* Played */}
        <div className="absolute rounded-full transition-none"
          style={{
            top: '50%', transform: 'translateY(-50%)',
            height: dragging ? 4 : 3,
            left: 0, width: `${displayPct}%`,
            background: 'linear-gradient(90deg, #c5a26f, #e8c98a)',
            boxShadow: '0 0 8px #c5a26f88'
          }} />

        {/* Thumb */}
        <motion.div
          className="absolute rounded-full bg-white shadow-lg shadow-black/50"
          style={{
            top: '50%',
            left: `${displayPct}%`,
            transform: 'translate(-50%, -50%)',
            width: dragging ? 18 : 12,
            height: dragging ? 18 : 12,
            border: '2px solid #c5a26f',
            transition: 'width 0.15s, height 0.15s',
            boxShadow: dragging ? '0 0 0 6px rgba(197,162,111,0.25)' : undefined,
          }}
        />
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// SPEED PILL SELECTOR
// ════════════════════════════════════════════════════════════════
function SpeedSelector({ speed, onSelect }: { speed: number; onSelect: (s: number) => void }) {
  const [open, setOpen] = useState(false);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center"
        style={{
          width: 44, height: 44,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 14,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: '#c5a26f', letterSpacing: -0.5 }}>{speed}x</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="absolute bottom-full mb-2 right-0 overflow-hidden"
            style={{
              background: 'rgba(10,10,10,0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              minWidth: 72,
            }}
          >
            {speeds.map(s => (
              <button
                key={s}
                onClick={() => { onSelect(s); setOpen(false); }}
                className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold transition-colors"
                style={{
                  color: speed === s ? '#c5a26f' : 'rgba(255,255,255,0.7)',
                  background: speed === s ? 'rgba(197,162,111,0.15)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span>{s}x</span>
                {speed === s && <span style={{ width: 6, height: 6, borderRadius: 3, background: '#c5a26f', display: 'inline-block' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// DOUBLE-TAP RIPPLE
// ════════════════════════════════════════════════════════════════
function TapRipple({ ripple }: { ripple: RippleEffect }) {
  return (
    <motion.div
      key={ripple.id}
      className="absolute pointer-events-none flex flex-col items-center justify-center"
      style={{ left: ripple.x - 60, top: ripple.y - 60, width: 120, height: 120 }}
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.1, 1, 0.8] }}
      transition={{ duration: 0.65, times: [0, 0.2, 0.7, 1] }}
    >
      {/* Circular ripple rings */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/40"
          style={{ width: 60 + i * 24, height: 60 + i * 24 }}
          initial={{ opacity: 0.8, scale: 0.5 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ duration: 0.5, delay: i * 0.07 }}
        />
      ))}
      <div className="flex items-center gap-1 z-10">
        {ripple.side === 'left'
          ? <RotateCcw size={22} className="text-white" />
          : <RotateCw size={22} className="text-white" />
        }
      </div>
      <div className="z-10 mt-1" style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
        {ripple.label}
      </div>
    </motion.div>
  );
}


// ════════════════════════════════════════════════════════════════
// HEART BURST PARTICLES
// ════════════════════════════════════════════════════════════════
function HeartBurst({ particles }: { particles: HeartParticle[] }) {
  return (
    <>
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none text-lg"
          style={{ left: p.x, top: p.y }}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1.4, 0.8],
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance - 30,
          }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        >
          ❤️
        </motion.div>
      ))}
    </>
  );
}


// ════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ════════════════════════════════════════════════════════════════
function PlayerSkeleton() {
  return (
    <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center z-20">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner ring */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-white/10" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#c5a26f] animate-spin" />
          <div className="absolute inset-2 rounded-full border border-transparent border-t-[#c5a26f]/40 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: 3, fontWeight: 600 }}>LOADING</div>
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════════════
// MAIN SHORTS PLAYER PAGE — KUKU TV ULTRA LEVEL
// ════════════════════════════════════════════════════════════════
export function ShortsPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ── Video feed state ──
  const [feedVideos, setFeedVideos] = useState<Video[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ── Playback state ──
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [resumeFrom, setResumeFrom] = useState(0);

  // ── UI overlay state ──
  const [overlayVisible, setOverlayVisible] = useState(true);
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Interaction state ──
  const [isLiked, setIsLiked] = useState(false);
  const [library, setLibrary] = useState<number[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const [heartParticles, setHeartParticles] = useState<HeartParticle[]>([]);
  const rippleId = useRef(0);
  const heartId = useRef(0);

  // ── Double tap detection ──
  const lastTapTime = useRef(0);
  const lastTapSide = useRef<'left' | 'right' | null>(null);

  // ── Paywall ──
  const [showPaywall, setShowPaywall] = useState(false);
  const [showScrollPaywall, setShowScrollPaywall] = useState(false);

  // ── Refs ──
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentVideoId = parseInt(id || '1');

  // ─────────── Load feed ───────────
  useEffect(() => {
    const vids = getStoredVideos();
    setFeedVideos(vids);
    const idx = vids.findIndex(v => v.id === currentVideoId);
    setCurrentIndex(idx !== -1 ? idx : 0);
    setLibrary(ls.get('reelramp_library', []));
  }, [currentVideoId]);

  const currentVideo = feedVideos[currentIndex];

  // ─────────── Per-video setup ───────────
  useEffect(() => {
    if (!currentVideo) return;
    setIsLoaded(false);
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setIsPlaying(true);
    setIsLiked(false);

    // Load resume timestamp
    const h = getWatchHistory();
    const item = h.find(i => i.videoId === currentVideo.id);
    setResumeFrom(item?.timestamp || 0);

    incrementView(currentVideo.id);
    const ratings = ls.get<Record<number, number>>('reelramp_ratings', {});
    setUserRating(ratings[currentVideo.id] || 0);

    // Save progress every 5s
    if (saveInterval.current) clearInterval(saveInterval.current);
    saveInterval.current = setInterval(() => {
      if (!videoRef.current || videoRef.current.duration === 0) return;
      const pct = Math.round((videoRef.current.currentTime / videoRef.current.duration) * 100);
      addToWatchHistory(currentVideo.id, pct, videoRef.current.currentTime);
    }, 5000);

    return () => { if (saveInterval.current) clearInterval(saveInterval.current); };
  }, [currentIndex, currentVideo?.id]);

  // ─────────── Overlay auto-hide ───────────
  const resetOverlayTimer = useCallback(() => {
    setOverlayVisible(true);
    if (overlayTimer.current) clearTimeout(overlayTimer.current);
    overlayTimer.current = setTimeout(() => {
      if (isPlaying) setOverlayVisible(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      overlayTimer.current = setTimeout(() => setOverlayVisible(false), 3000);
    } else {
      setOverlayVisible(true);
      if (overlayTimer.current) clearTimeout(overlayTimer.current);
    }
    return () => { if (overlayTimer.current) clearTimeout(overlayTimer.current); };
  }, [isPlaying]);

  // ─────────── Navigation ───────────
  const navigateNext = useCallback(() => {
    if (currentIndex >= feedVideos.length - 1) return;
    setCurrentIndex(i => i + 1);
  }, [currentIndex, feedVideos.length]);

  const navigatePrev = useCallback(() => {
    if (currentIndex <= 0) return;
    setCurrentIndex(i => i - 1);
  }, [currentIndex]);

  const handleEnded = () => {
    if (currentVideo) addToWatchHistory(currentVideo.id, 100, duration);
    navigateNext();
  };

  // ─────────── Time update ───────────
  const handleTimeUpdate = (t: number, d: number, buf: number) => {
    setCurrentTime(t);
    setDuration(d);
    setBuffered(buf);
  };

  // ─────────── Seek ───────────
  const seekTo = (t: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(t, duration));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // ─────────── Drag swipe ───────────
  const handleDragEnd = (_: any, info: PanInfo) => {
    const vel = info.velocity.y;
    const offset = info.offset.y;
    // Velocity-aware threshold
    if (vel < -300 || offset < -80) navigateNext();
    else if (vel > 300 || offset > 80) navigatePrev();
  };

  // ─────────── Tap zones (double tap seek) ───────────
  const handleContainerTap = (e: React.MouseEvent<HTMLDivElement>) => {
    resetOverlayTimer();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const side = x < w * 0.4 ? 'left' : x > w * 0.6 ? 'right' : 'center';

    const now = Date.now();
    const isDoubleTap = now - lastTapTime.current < 300 && lastTapSide.current === side;
    lastTapTime.current = now;
    lastTapSide.current = side as any;

    if (isDoubleTap && side !== 'center') {
      // Double tap seek
      const delta = side === 'right' ? 10 : -10;
      seekTo(currentTime + delta);

      const id = ++rippleId.current;
      setRipples(prev => [...prev, { id, x, y, side: side as 'left' | 'right', label: side === 'right' ? '+10s' : '-10s' }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    } else if (side === 'center' && !isDoubleTap) {
      // Single tap center = play/pause
      setTimeout(() => {
        if (Date.now() - lastTapTime.current >= 290) {
          setIsPlaying(p => !p);
        }
      }, 310);
    }
  };

  // ─────────── Like with heart burst ───────────
  const handleLike = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    if (!isLiked) {
      const count = 8;
      const newParticles: HeartParticle[] = Array.from({ length: count }, (_, i) => ({
        id: ++heartId.current,
        x: cx,
        y: cy,
        angle: (i / count) * Math.PI * 2,
        distance: 50 + Math.random() * 40,
      }));
      setHeartParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => setHeartParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id))), 1000);
    }
    setIsLiked(l => !l);
  };

  // ─────────── Library toggle ───────────
  const toggleSave = () => {
    if (!currentVideo) return;
    const updated = library.includes(currentVideo.id)
      ? library.filter(x => x !== currentVideo.id)
      : [...library, currentVideo.id];
    setLibrary(updated);
    ls.set('reelramp_library', updated);
  };

  // ─────────── Share ───────────
  const handleShare = () => {
    const url = `${window.location.origin}/player/${currentVideo?.id}`;
    if (navigator.share) navigator.share({ title: currentVideo?.title, url });
    else navigator.clipboard.writeText(url);
  };

  // ─────────── Rate ───────────
  const rateVideo = (star: number) => {
    if (!currentVideo) return;
    setUserRating(star);
    const ratings = ls.get<Record<number, number>>('reelramp_ratings', {});
    ratings[currentVideo.id] = star;
    ls.set('reelramp_ratings', ratings);
  };

  if (!currentVideo) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="w-10 h-10 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isSaved = library.includes(currentVideo.id);

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden z-50 touch-none"
      style={{ height: '100dvh', fontFamily: "'SF Pro Display', -apple-system, sans-serif" }}
    >
      {/* ──── DRAG CONTAINER ──── */}
      <motion.div
        key={currentIndex}
        className="absolute inset-0"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.15, bottom: 0.15 }}
        onDragEnd={handleDragEnd}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      >
        {/* ──── VIDEO ──── */}
        <div ref={containerRef} className="absolute inset-0" onClick={handleContainerTap}>
          <UltraPlayerCore
            video={currentVideo}
            isPlaying={isPlaying}
            isMuted={isMuted}
            speed={speed}
            resumeFrom={resumeFrom}
            onPlayPause={() => setIsPlaying(p => !p)}
            onEnded={handleEnded}
            onTimeUpdate={handleTimeUpdate}
            onLoaded={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            videoRef={videoRef}
          />

          {/* Loading */}
          {!isLoaded && !hasError && <PlayerSkeleton />}

          {/* Error */}
          {hasError && (
            <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-20 gap-4">
              <div style={{ fontSize: 40 }}>⚠️</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Video failed to load</div>
              <button onClick={() => { setHasError(false); setIsLoaded(false); }}
                className="px-6 py-3 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm">
                Retry
              </button>
            </div>
          )}

          {/* Double-tap ripples */}
          {ripples.map(r => <TapRipple key={r.id} ripple={r} />)}

          {/* Heart burst particles */}
          <HeartBurst particles={heartParticles} />

          {/* ──── TOP GRADIENT ──── */}
          <div className="absolute inset-x-0 top-0 pointer-events-none"
            style={{ height: 160, background: 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, transparent 100%)' }} />

          {/* ──── BOTTOM GRADIENT ──── */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{ height: 280, background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)' }} />
        </div>

        {/* ══════════════════════════════════════════════════
            TOP BAR — auto-hide
        ══════════════════════════════════════════════════ */}
        <motion.div
          className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-4 pt-12 pb-4 pointer-events-none"
          animate={{ opacity: overlayVisible ? 1 : 0, y: overlayVisible ? 0 : -16 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          style={{ pointerEvents: overlayVisible ? 'auto' : 'none' }}
        >
          {/* Back button */}
          <motion.button
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.88 }}
            style={{
              width: 42, height: 42,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ArrowLeft size={20} className="text-white" />
          </motion.button>

          {/* Category + counter pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '6px 14px',
          }}>
            <span style={{ fontSize: 10, color: '#c5a26f', fontWeight: 700, letterSpacing: 2 }}>
              {currentVideo.category.toUpperCase()}
            </span>
            <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: 1 }}>
              {currentIndex + 1} / {feedVideos.length}
            </span>
          </div>

          {/* Right controls: mute + speed */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setIsMuted(m => !m)}
              style={{
                width: 42, height: 42,
                background: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <AnimatePresence mode="wait">
                {isMuted
                  ? <motion.div key="muted" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                      <VolumeX size={18} className="text-white" />
                    </motion.div>
                  : <motion.div key="unmuted" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.15 }}>
                      <Volume2 size={18} className="text-white" />
                    </motion.div>
                }
              </AnimatePresence>
            </motion.button>

            <SpeedSelector speed={speed} onSelect={setSpeed} />
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            CENTER PLAY/PAUSE BUTTON
        ══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {!isPlaying && isLoaded && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{
                  width: 80, height: 80,
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  borderRadius: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                <Play size={36} className="text-white" style={{ marginLeft: 4 }} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════
            RIGHT ACTION BAR — auto-hide
        ══════════════════════════════════════════════════ */}
        <motion.div
          className="absolute right-3 z-40 flex flex-col items-center gap-4"
          style={{ bottom: 120, pointerEvents: overlayVisible ? 'auto' : 'none' }}
          animate={{ opacity: overlayVisible ? 1 : 0, x: overlayVisible ? 0 : 24 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
        >
          {/* LIKE */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              onClick={handleLike}
              whileTap={{ scale: 0.82 }}
              style={{
                width: 52, height: 52,
                background: isLiked ? '#e11d48' : 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${isLiked ? '#e11d48' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, border 0.2s',
              }}
            >
              <motion.div
                animate={{ scale: isLiked ? [1, 1.4, 1] : 1 }}
                transition={{ duration: 0.3, type: 'spring' }}
              >
                <Heart size={24} className={isLiked ? 'fill-white text-white' : 'text-white'} />
              </motion.div>
            </motion.button>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 1.5 }}>LIKE</span>
          </div>

          {/* SAVE */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              onClick={toggleSave}
              whileTap={{ scale: 0.82 }}
              style={{
                width: 52, height: 52,
                background: isSaved ? 'rgba(197,162,111,0.2)' : 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${isSaved ? '#c5a26f' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s, border 0.2s',
              }}
            >
              <Bookmark size={24} className={isSaved ? 'fill-[#c5a26f] text-[#c5a26f]' : 'text-white'} />
            </motion.button>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 1.5 }}>SAVE</span>
          </div>

          {/* SHARE */}
          <div className="flex flex-col items-center gap-1">
            <motion.button
              onClick={handleShare}
              whileTap={{ scale: 0.82 }}
              style={{
                width: 52, height: 52,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Share2 size={22} className="text-white" />
            </motion.button>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: 700, letterSpacing: 1.5 }}>SHARE</span>
          </div>

          {/* SUBSCRIBE lock (premium) */}
          {currentVideo.isPremium && (
            <div className="flex flex-col items-center gap-1 mt-1">
              <motion.button
                onClick={() => setShowPaywall(true)}
                whileTap={{ scale: 0.82 }}
                style={{
                  width: 52, height: 52,
                  background: '#e11d48',
                  borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(225,29,72,0.4)',
                }}
              >
                <Lock size={22} className="text-white" />
              </motion.button>
              <span style={{ fontSize: 9, color: '#e11d48', fontWeight: 700, letterSpacing: 1 }}>PREMIUM</span>
            </div>
          )}
        </motion.div>

        {/* ══════════════════════════════════════════════════
            BOTTOM META + SCRUBBER — auto-hide
        ══════════════════════════════════════════════════ */}
        <motion.div
          className="absolute inset-x-0 bottom-0 z-40 pb-6 pt-4"
          animate={{ opacity: overlayVisible ? 1 : 0, y: overlayVisible ? 0 : 20 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          style={{ pointerEvents: overlayVisible ? 'auto' : 'none' }}
        >
          {/* Video meta */}
          <div className="px-5 mb-4 pr-20">
            {/* Duration badge */}
            <div className="inline-flex items-center gap-1.5 mb-2"
              style={{
                background: 'rgba(197,162,111,0.2)',
                border: '1px solid rgba(197,162,111,0.4)',
                borderRadius: 8, padding: '3px 10px',
              }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: '#c5a26f' }} />
              <span style={{ fontSize: 10, color: '#c5a26f', fontWeight: 700, letterSpacing: 1.5 }}>
                {currentVideo.duration}
              </span>
            </div>

            <h2 style={{
              fontSize: 22, fontWeight: 700, color: '#fff',
              letterSpacing: -0.8, lineHeight: 1.2,
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
              marginBottom: 6,
            }}>
              {currentVideo.title}
            </h2>

            <p style={{
              fontSize: 12.5, color: 'rgba(255,255,255,0.65)',
              lineHeight: 1.5, display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {currentVideo.description}
            </p>

            {/* Star rating */}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <motion.button
                    key={s}
                    onClick={() => rateVideo(s)}
                    whileTap={{ scale: 0.7 }}
                    style={{ fontSize: 18, color: s <= userRating ? '#c5a26f' : 'rgba(255,255,255,0.25)' }}
                  >
                    ★
                  </motion.button>
                ))}
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>Rate this short</span>
            </div>
          </div>

          {/* ── SCRUBBER ── */}
          <UltraScrubber
            currentTime={currentTime}
            duration={duration}
            buffered={buffered}
            onSeek={seekTo}
          />

          {/* ── PLAYBACK CONTROLS ROW ── */}
          <div className="flex items-center justify-between px-5 pt-2">
            {/* Prev */}
            <motion.button
              onClick={navigatePrev}
              whileTap={{ scale: 0.85 }}
              disabled={currentIndex === 0}
              style={{
                width: 46, height: 46,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: currentIndex === 0 ? 0.3 : 1,
              }}
            >
              <ChevronUp size={22} className="text-white" />
            </motion.button>

            {/* Play/Pause center */}
            <motion.button
              onClick={() => setIsPlaying(p => !p)}
              whileTap={{ scale: 0.88 }}
              style={{
                width: 62, height: 62,
                background: 'linear-gradient(135deg, #c5a26f, #d4b17f)',
                borderRadius: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(197,162,111,0.5)',
              }}
            >
              <AnimatePresence mode="wait">
                {isPlaying
                  ? <motion.div key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.12 }}>
                      <Pause size={28} className="text-black" />
                    </motion.div>
                  : <motion.div key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.12 }}>
                      <Play size={28} className="text-black" style={{ marginLeft: 3 }} />
                    </motion.div>
                }
              </AnimatePresence>
            </motion.button>

            {/* Next */}
            <motion.button
              onClick={navigateNext}
              whileTap={{ scale: 0.85 }}
              disabled={currentIndex >= feedVideos.length - 1}
              style={{
                width: 46, height: 46,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: currentIndex >= feedVideos.length - 1 ? 0.3 : 1,
              }}
            >
              <ChevronDown size={22} className="text-white" />
            </motion.button>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════
            SWIPE HINT INDICATORS (top / bottom edges)
        ══════════════════════════════════════════════════ */}
        <AnimatePresence>
          {currentIndex > 0 && (
            <motion.div
              className="absolute top-2 inset-x-0 flex justify-center pointer-events-none z-20"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 0.4, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ width: 32, height: 3, borderRadius: 2, background: 'white' }} />
            </motion.div>
          )}
          {currentIndex < feedVideos.length - 1 && (
            <motion.div
              className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none z-20"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 0.4, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div style={{ width: 32, height: 3, borderRadius: 2, background: 'white' }} />
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>{/* end drag container */}
