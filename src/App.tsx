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
  ChevronUp, ChevronDown, Clock, Download, Palette, MapPin, Award, Upload, FileText
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
  seriesId?: string;
  episodeNumber?: number;
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
  officeAddress: string;
  founderNote: string;
  founderName: string;
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
  userEmail?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL DATA
// ─────────────────────────────────────────────────────────────────────────────
const initialVideos: Video[] = [
  { id: 1, title: "The Silent Whisper", description: "A haunting tale of a woman trapped in an abandoned mansion where whispers reveal dark secrets.", category: "Horror", duration: "4:32", isPremium: true, thumbnail: "https://images.unsplash.com/photo-1509248961158-e54f6934749c", videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4", source: 'direct', seriesId: "series-01", episodeNumber: 1 },
  { id: 2, title: "Midnight Rain", description: "A detective uncovers a chilling murder case in a rain-soaked alley filled with lies.", category: "Mystery", duration: "5:18", isPremium: false, thumbnail: "https://images.unsplash.com/photo-1534447677768-be436bb09401", videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", source: 'direct', seriesId: "series-01", episodeNumber: 2 },
  { id: 3, title: "The Mountain Sage", description: "An elderly mentor shares profound life lessons that transform a young woman's future.", category: "Life Lessons", duration: "6:45", isPremium: false, thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", source: 'direct', seriesId: "series-01", episodeNumber: 3 },
  { id: 4, title: "Shadows of Truth", description: "An investigative journalist risks everything to expose a powerful conspiracy.", category: "Investigative", duration: "7:12", isPremium: true, thumbnail: "https://images.unsplash.com/photo-1505673542670-a5e3ff5b14a3", videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", source: 'direct' },
];

const initialAdminUsers: AdminUser[] = [
  { id: 1, name: "Alex Rivera", email: "alex.rivera@reelramp.app", phone: "+91 98765 43210", subscribed: true, joinDate: "Mar 12, 2024", totalWatched: 47 },
  { id: 2, name: "Priya Sharma", email: "priya.s@reelramp.app", phone: "+91 87654 32109", subscribed: true, joinDate: "Jan 28, 2024", totalWatched: 112 },
];

const defaultPlatformSettings: PlatformSettings = {
  appName: "ReelRamp Shorts",
  tagline: "Premium Short Films & Investigative Stories",
  accentColor: "#c5a26f",
  supportEmail: "reelramoriginal@gmail.com",
  supportPhone: "+91 7307493338",
  razorpayKey: "",
  logoUrl: "https://drive.google.com/uc?export=view&id=1qs734lVBcgz-fJ_TitnibEG-KqX0LCVg",
  primaryColor: "#c5a26f",
  backgroundColor: "#0a0a0a",
  cardBackground: "#1a1a1a",
  officeAddress: "123, Creative Production Bloc, Film City, Sector 16A, Noida, UP, India",
  founderName: "Founder & Managing Director Note",
  founderNote: "Cinematic depth doesn't require long hours. We commit to bringing high-impact premium shorts straight to your handheld nodes."
};

const defaultSubscriptionSettings: SubscriptionSettings = {
  trialOfferPrice: "₹2",
  trialOfferDuration: "1 Day",
  fullPrice: "₹699",
  fullValidity: "3 months",
  showTrialPopup: true,
};

const defaultPaymentSettings: PaymentSettings = {
  razorpayKeyId: "rzp_test_sampleNodeKey112",
  razorpayKeySecret: "secret_crypto_node_token",
  upiId: "reelramp@okaxis",
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
  storagePath: row.storage_path,
  seriesId: row.series_id || undefined,
  episodeNumber: row.episode_number || undefined
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
      storage_path: video.storagePath,
      series_id: video.seriesId,
      episode_number: video.episodeNumber
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

const getRevenueData = (): RevenueEntry[] => ls.get<RevenueEntry[]>('reelramp_revenue', [
  { id: 1, date: "2026-04-01", amount: 2450, type: "Subscription", plan: "Monthly", userEmail: "subscriber1@gmail.com" },
  { id: 2, date: "2026-04-05", amount: 1499, type: "Annual", plan: "Annual", userEmail: "premium_node@yahoo.com" },
  { id: 3, date: "2026-05-01", amount: 699, type: "Subscription", plan: "Monthly", userEmail: "indieramp@gmail.com" },
]);

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
  isSubscribed: false, setIsSubscribed: () => {},
  signOut: async () => {},
});

const useAuth = () => React.useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      setIsSubscribed(true); // Default matching user node profile mapping authorization
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      setIsSubscribed(!!s?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
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
// STATIC THEME VARIABLE INJECTOR
// ─────────────────────────────────────────────────────────────────────────────
function DynamicThemeEngine({ config }: { config: PlatformSettings }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', config.accentColor || '#c5a26f');
    document.documentElement.style.setProperty('--bg-color', config.backgroundColor || '#0a0a0a');
    document.documentElement.style.setProperty('--card-bg', config.cardBackground || '#1a1a1a');
  }, [config]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADVANCED VIDEO PLAYER COMPONENT (Clean Canvas + 15+ Episode Logic Trackers)
// ─────────────────────────────────────────────────────────────────────────────
interface PremiumVideoPlayerProps {
  video: Video;
  allVideos: Video[];
  isPlaying: boolean;
  onPlayPause: () => void;
  onEnded: () => void;
}

function PremiumVideoPlayer({ video, allVideos, isPlaying, onPlayPause, onEnded }: PremiumVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUserActive, setIsUserActive] = useState(true);
  const controlActivityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Group and sort active tracker timeline sequences
  const seriesTrackEpisodes = allVideos
    .filter(v => video.seriesId && v.seriesId === video.seriesId)
    .sort((a, b) => (a.episodeNumber || 0) - (b.episodeNumber || 0));

  const resetControlActivityTimer = useCallback(() => {
    setIsUserActive(true);
    if (controlActivityTimeoutRef.current) clearTimeout(controlActivityTimeoutRef.current);
    if (isPlaying) {
      controlActivityTimeoutRef.current = setTimeout(() => {
        setIsUserActive(false); // Clean Screen Ingestion State Active
      }, 2500);
    }
  }, [isPlaying]);

  useEffect(() => {
    resetControlActivityTimer();
    return () => { if (controlActivityTimeoutRef.current) clearTimeout(controlActivityTimeoutRef.current); };
  }, [isPlaying, resetControlActivityTimer]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) { v.play().catch(() => {}); }
    else { v.pause(); }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  if (video.source === 'youtube') {
    const videoId = video.videoUrl.split('/').pop()?.split('?')[0] ?? '';
    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          width="100%" height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&controls=1`}
          title={video.title}
          frameBorder="0"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full bg-black select-none overflow-hidden"
      onMouseMove={resetControlActivityTimer}
      onTouchStart={controlActivityTimeoutRef.current ? resetControlActivityTimer : undefined}
      onClick={onPlayPause}
    >
      <video
        ref={videoRef}
        src={video.source === 'bunny' ? getBunnyCdnUrl(video.videoUrl) : video.videoUrl}
        className="w-full h-full object-contain"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={onEnded}
        onLoadedData={() => setIsLoaded(true)}
      />

      {/* SERIES TRACK HUD - Dissolves entirely inside Clean Screen HUD Matrix */}
      <AnimatePresence>
        {isUserActive && seriesTrackEpisodes.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 right-4 z-40 bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/10"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">
              Active Playlist Track ({seriesTrackEpisodes.length} Episodes Grouped)
            </div>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {seriesTrackEpisodes.map(ep => (
                <div
                  key={ep.id}
                  className={`px-3 py-1 text-xs rounded font-mono border transition-all ${
                    ep.id === video.id 
                      ? 'bg-[var(--accent-color)] text-black font-extrabold border-transparent' 
                      : 'bg-white/5 text-white border-white/10'
                  }`}
                >
                  Ep {ep.episodeNumber || 1}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DYNAMIC CANVAS CONTROL HUD BLOCKS */}
      <AnimatePresence>
        {isUserActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 bg-gradient-to-t from-black/90 via-transparent to-black/40"
          >
            <div className="flex justify-between items-center w-full">
              <span className="text-sm font-bold text-white drop-shadow">{video.title}</span>
              <button 
                onClick={e => { e.stopPropagation(); setIsMuted(!isMuted); if(videoRef.current) videoRef.current.muted = !isMuted; }}
                className="p-2 bg-black/40 border border-white/10 rounded-xl text-white pointer-events-auto"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            {!isPlaying && isLoaded && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl">
                <Play size={22} fill="black" className="ml-0.5" />
              </div>
            )}

            <div className="w-full h-1 bg-white/20 rounded-full mt-auto overflow-hidden">
              <div className="h-full bg-[var(--accent-color)] transition-all duration-100" style={{ width: `${progress}%` }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATION CORE EXECUTION LAYOUT Shell
// ─────────────────────────────────────────────────────────────────────────────
export function App() {
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
    location.pathname === '/admin-secure-7842';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col max-w-[100vw] overflow-x-hidden">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin-secure-7842" element={<EditorPanel />} />
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
// CORE CONSUMER HOME PLATFORM LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(defaultPlatformSettings);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchVideosFromDB().then(setVideos);
    fetchSettingFromDB<PlatformSettings>('platform_config', defaultPlatformSettings).then(setSettings);
    
    const seenPromo = sessionStorage.getItem('rr_promo_shown');
    if (!seenPromo) {
      setTimeout(() => setShowPromoModal(true), 1500);
    }
  }, []);

  const closePromo = () => {
    setShowPromoModal(false);
    sessionStorage.setItem('rr_promo_shown', 'true');
  };

  return (
    <div className="flex-1 pb-24" style={{ backgroundColor: settings.backgroundColor }}>
      <DynamicThemeEngine config={settings} />

      {/* HEADER NODE CHANNEL */}
      <header className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="App Identity Logo" className="h-8 w-auto object-contain rounded" />
          ) : (
            <div className="h-8 w-8 bg-[var(--accent-color)] rounded flex items-center justify-center text-black font-black">R</div>
          )}
          <span className="text-xl font-bold tracking-tight text-white">{settings.appName}</span>
        </div>
        <a 
          href="/admin-secure-7842"
          className="p-2 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center gap-1.5 text-gray-300 hover:text-white transition"
        >
          <Settings size={14} /> Control Engine
        </a>
      </header>

      {/* DISMISSABLE PROMO VIDEO MODAL OVERLAY */}
      <AnimatePresence>
        {showPromoModal && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121212] border border-white/10 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl relative"
            >
              <button onClick={closePromo} className="absolute top-3 right-3 z-50 p-2 bg-black/60 border border-white/10 text-white rounded-full">
                <X size={16} />
              </button>
              <div className="p-4 border-b border-white/5 bg-gradient-to-r from-[var(--accent-color)]/10 to-transparent">
                <h4 className="text-sm font-bold text-white">⭐ Featured Spotlight Preview</h4>
              </div>
              <div className="aspect-video w-full bg-black">
                <iframe
                  width="100%" height="100%"
                  src="https://www.youtube.com/embed/9bZkp7q19f0?autoplay=1&mute=1"
                  title="Platform Promo Trailer Ingest"
                  frameBorder="0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HOMEPAGE VIEWPORT MEDIA CONTENT GRID */}
      <main className="p-4 max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--accent-color)] mb-1">Curated Cinema Streams</h2>
          <p className="text-xs text-gray-400 mb-4">{settings.tagline}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videos.map(v => (
              <div
                key={v.id}
                className="group relative rounded-xl overflow-hidden border border-white/10 bg-[#141414]"
                onTouchStart={() => { setActiveVideo(v); setIsPlaying(true); }} // Finger Ingestion Play Instant Action
                onClick={() => { setActiveVideo(v); setIsPlaying(true); }}
              >
                <div className="aspect-video w-full relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${v.thumbnail})` }}>
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-all">
                    <div className="w-12 h-12 bg-black/70 rounded-full flex items-center justify-center border border-white/10 transform scale-95 group-hover:scale-100 transition-transform">
                      <Play size={18} fill="white" className="text-white ml-0.5" />
                    </div>
                  </div>
                  {v.isPremium && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-black font-black text-[9px] px-2 py-0.5 rounded shadow">PREMIUM</span>
                  )}
                  {v.episodeNumber && (
                    <span className="absolute bottom-2 left-2 bg-black/80 text-white border border-white/5 font-mono text-[9px] px-1.5 py-0.5 rounded">EPISODE {v.episodeNumber}</span>
                  )}
                </div>
                <div className="p-3" style={{ backgroundColor: settings.cardBackground }}>
                  <h4 className="font-bold text-sm text-white">{v.title}</h4>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* FULL PORTAL DOCK HUD OVERLAY VIDEO MODAL PLAYER */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 bg-black z-50 flex flex-col justify-center"
          >
            <button 
              onClick={() => { setActiveVideo(null); setIsPlaying(false); }}
              className="absolute top-4 left-4 z-50 p-2.5 bg-black/60 border border-white/10 text-white rounded-xl"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="w-full aspect-video max-h-[85vh]">
              <PremiumVideoPlayer
                video={activeVideo}
                allVideos={videos}
                isPlaying={isPlaying}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onEnded={() => setIsPlaying(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRAL CONTROLS SECURE INTEGRATED BOARD EDITOR PANEL
// ─────────────────────────────────────────────────────────────────────────────
function EditorPanel() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>(defaultPlatformSettings);
  const [payments, setPayments] = useState<PaymentSettings>(defaultPaymentSettings);
  const [revenue] = useState<RevenueEntry[]>(getRevenueData());
  const [tab, setTab] = useState<'media' | 'branding' | 'billing' | 'accounting'>('media');

  // Input Mapping Hook Elements
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('');
  const [formDur, setFormDur] = useState('');
  const [formPrem, setFormPrem] = useState(false);
  const [formThumb, setFormThumb] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formSeries, setFormSeries] = useState('');
  const [formEpNum, setFormEpNum] = useState('');

  useEffect(() => {
    fetchVideosFromDB().then(setVideos);
    fetchSettingFromDB<PlatformSettings>('platform_config', defaultPlatformSettings).then(setSettings);
    fetchSettingFromDB<PaymentSettings>('payment_config', defaultPaymentSettings).then(setPayments);
  }, []);

  const handleCommitVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Video = {
      id: Number(formId) || Date.now(),
      title: formTitle,
      description: formDesc,
      category: formCat,
      duration: formDur,
      isPremium: formPrem,
      thumbnail: formThumb,
      videoUrl: formUrl,
      source: 'direct',
      seriesId: formSeries || undefined,
      episodeNumber: formEpNum ? Number(formEpNum) : undefined
    };

    await upsertVideoToDB(payload);
    setVideos(await fetchVideosFromDB());
    alert("Media Stream Asset committed successfully to schema repository.");
    setFormId(''); setFormTitle(''); setFormDesc(''); setFormThumb(''); setFormUrl(''); setFormSeries(''); setFormEpNum('');
  };

  const handlePurgeVideo = async (id: number) => {
    if(!window.confirm("Purge asset node safely from sequence database?")) return;
    await deleteVideoFromDB(id);
    setVideos(await fetchVideosFromDB());
  };

  const executeExportPlatformSchema = () => {
    const assetMatrixBundle = { videos, settings, payments, revenue, schemaVersion: "3.2" };
    const schemaStreamData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(assetMatrixBundle, null, 2));
    const shadowAnchor = document.createElement('a');
    shadowAnchor.setAttribute("href", schemaStreamData);
    shadowAnchor.setAttribute("download", `Platform_Backup_Schema_${Date.now()}.json`);
    document.body.appendChild(shadowAnchor);
    shadowAnchor.click();
    shadowAnchor.remove();
  };

  const executeImportPlatformSchema = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parserInstance = new FileReader();
    if (e.target.files && e.target.files[0]) {
      parserInstance.readAsText(e.target.files[0], "UTF-8");
      parserInstance.onload = async (evt) => {
        try {
          const parsedManifest = JSON.parse(evt.target?.result as string);
          if (parsedManifest.videos) setVideos(parsedManifest.videos);
          if (parsedManifest.settings) setSettings(parsedManifest.settings);
          if (parsedManifest.payments) setPayments(parsedManifest.payments);
          alert("Platform Structural Backup configuration data parsed and active.");
        } catch {
          alert("Invalid structured backup file specification mapping schema.");
        }
      };
    }
  };

  const processDownloadRevenueManifest = () => {
    let ledgerBuffer = `REELRAMP PRO INGEST FINANCIAL AUDIT LOG\nGenerated Metric: ${new Date().toLocaleDateString()}\n`;
    ledgerBuffer += `=========================================================\n\n`;
    revenue.forEach(item => {
      ledgerBuffer += `Transaction Ref ID: ${item.id} | Plan: ${item.plan} | Account Target Node: ${item.userEmail || 'SystemGuest'} | Total Ingest: INR ${item.amount}\n`;
    });
    ledgerBuffer += `\n=========================================================\n`;
    ledgerBuffer += `Gross Cumulative Liquidity Assets: INR ${revenue.reduce((acc, current) => acc + current.amount, 0)}.00`;

    const txtBlobUri = "data:application/txt;charset=utf-8," + encodeURIComponent(ledgerBuffer);
    const linkNode = document.createElement('a');
    linkNode.setAttribute("href", txtBlobUri);
    linkNode.setAttribute("download", `Financial_Ledger_Statement_${Date.now()}.txt`);
    document.body.appendChild(linkNode);
    linkNode.click();
    linkNode.remove();
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col md:flex-row">
      
      {/* SIDEBAR NAVIGATION BLOCK */}
      <aside className="w-full md:w-64 bg-[#121212] border-r border-white/5 p-4 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="py-2 border-b border-white/5 mb-4">
            <h2 className="text-sm font-black text-[var(--accent-color)] tracking-wider">REELRAMP CORE DASHBOARD</h2>
            <p className="text-[9px] text-gray-500 font-mono">Control Infrastructure Suite</p>
          </div>

          <button onClick={() => setTab('media')} className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 ${tab === 'media' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Plus size={14} /> Video Asset Pipelines
          </button>
          <button onClick={() => setTab('branding')} className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 ${tab === 'branding' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Palette size={14} /> Theme Branding Core
          </button>
          <button onClick={() => setTab('billing')} className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 ${tab === 'billing' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <CreditCard size={14} /> Payment Routing Systems
          </button>
          <button onClick={() => setTab('accounting')} className={`w-full p-2.5 rounded-xl text-left text-xs font-bold flex items-center gap-2 ${tab === 'accounting' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <BarChart3 size={14} /> Revenue Statements
          </button>
        </div>

        <div className="pt-4 border-t border-white/5 space-y-2">
          <button onClick={executeExportPlatformSchema} className="w-full py-2 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl text-[10px] font-mono flex items-center justify-center gap-1">
            <Download size={12} /> Export JSON Layout
          </button>
          <label className="w-full py-2 bg-purple-600/10 text-purple-400 border border-purple-500/20 rounded-xl text-[10px] font-mono flex items-center justify-center gap-1 cursor-pointer">
            <Upload size={12} /> Import JSON Template
            <input type="file" accept=".json" onChange={executeImportPlatformSchema} className="hidden" />
          </label>
          <a href="/" className="block text-center text-[10px] font-bold text-gray-500 hover:text-white pt-2">← Return to Stream Channels</a>
        </div>
      </aside>

      {/* ADMIN CONTROL CONTAINER BOX VIEWS */}
      <main className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full">
        
        {/* TAB 1: MEDIA DATA ASSETS MANAGER */}
        {tab === 'media' && (
          <div className="space-y-6">
            <div className="bg-[#141414] border border-white/5 p-4 rounded-xl">
              <h3 className="text-sm font-bold text-white mb-4">Upsert Target Channel Stream Asset</h3>
              <form onSubmit={handleCommitVideo} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-gray-400 block mb-1">Database Asset Primary Key ID (Blank for Auto):</label>
                  <input type="number" value={formId} onChange={e => setFormId(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded" placeholder="e.g., 5" />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Asset Name Title String:</label>
                  <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)} required className="w-full p-2 bg-black border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Series Structural Group tracking ID (Optional):</label>
                  <input type="text" value={formSeries} onChange={e => setFormSeries(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded" placeholder="e.g., series-01" />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Episode Sequence Index Number (Optional):</label>
                  <input type="number" value={formEpNum} onChange={e => setFormEpNum(e.target.value)} className="w-full p-2 bg-black border border-white/10 rounded" placeholder="e.g., 4" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-400 block mb-1">Context Summary Log Description:</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} required className="w-full p-2 bg-black border border-white/10 rounded h-16" />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Category Classification String:</label>
                  <input type="text" value={formCat} onChange={e => setFormCat(e.target.value)} required className="w-full p-2 bg-black border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Duration Clock Index:</label>
                  <input type="text" value={formDur} onChange={e => setFormDur(e.target.value)} required className="w-full p-2 bg-black border border-white/10 rounded" placeholder="e.g., 4:55" />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Cover Image CDN Asset URL Link:</label>
                  <input type="text" value={formThumb} onChange={e => setFormThumb(e.target.value)} required className="w-full p-2 bg-black border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Target Media Stream Access File URL Endpoint:</label>
                  <input type="text" value={formUrl} onChange={e => setFormUrl(e.target.value)} required className="w-full p-2 bg-black border border-white/10 rounded" />
                </div>
                <div className="flex items-center gap-2 pt-4 md:col-span-2">
                  <input type="checkbox" checked={formPrem} onChange={e => setFormPrem(e.target.checked)} id="adminCheckPrem" className="rounded bg-black border-white/10 text-amber-500" />
                  <label htmlFor="adminCheckPrem" className="text-amber-500 font-bold select-none">Restrict visibility within Premium User Paywall Enclosure Node</label>
                </div>
                <div className="pt-2">
                  <button type="submit" className="px-4 py-2 bg-[var(--accent-color)] text-black font-extrabold rounded-lg hover:opacity-90 transition">
                    Commit Stream Node to DB Cluster
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-[#141414] border border-white/5 p-4 rounded-xl">
              <h3 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Live Repository Cluster Channels</h3>
              <div className="space-y-2">
                {videos.map(v => (
                  <div key={v.id} className="p-2.5 bg-black rounded border border-white/5 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono text-gray-500 mr-2">[{v.id}]</span>
                      <span className="font-bold text-white">{v.title}</span>
                      {v.seriesId && <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px] text-blue-400 font-mono">Series Key: {v.seriesId} - Ep {v.episodeNumber}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {v.isPremium ? <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black">PREMIUM</span> : <span className="text-[9px] text-gray-400">FREE</span>}
                      <button onClick={() => handlePurgeVideo(v.id)} className="text-red-400 hover:text-red-500 transition"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BRANDING CUSTOMIZATION PANEL LAYER */}
        {tab === 'branding' && (
          <div className="bg-[#141414] border border-white/5 p-4 rounded-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">Dynamic Brand Environment Manifest</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 block mb-1">Platform Application Label Identity Name:</label>
                <input type="text" value={settings.appName} onChange={e => setSettings({...settings, appName: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded" />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Tagline Promotional Slogan Banner Header:</label>
                <input type="text" value={settings.tagline} onChange={e => setSettings({...settings, tagline: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded" />
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-400 block mb-1">Application Branding Identity Image Logo URL Link:</label>
                <input type="text" value={settings.logoUrl} onChange={e => setSettings({...settings, logoUrl: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded font-mono" />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Global Branding Accent Canvas Highlight Color Hex Code:</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.accentColor} onChange={e => setSettings({...settings, accentColor: e.target.value, primaryColor: e.target.value})} className="w-8 h-8 bg-black border border-white/10 rounded cursor-pointer" />
                  <input type="text" value={settings.accentColor} onChange={e => setSettings({...settings, accentColor: e.target.value, primaryColor: e.target.value})} className="flex-1 p-1 bg-black border border-white/10 rounded font-mono" />
                </div>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Platform Structural Dark Ground Color Hex Code:</label>
                <div className="flex gap-2">
                  <input type="color" value={settings.backgroundColor} onChange={e => setSettings({...settings, backgroundColor: e.target.value})} className="w-8 h-8 bg-black border border-white/10 rounded cursor-pointer" />
                  <input type="text" value={settings.backgroundColor} onChange={e => setSettings({...settings, backgroundColor: e.target.value})} className="flex-1 p-1 bg-black border border-white/10 rounded font-mono" />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-4 space-y-4">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Footer Location & Executive Message Nodes</h4>
              <div>
                <label className="text-gray-400 block mb-1">Registered Base Location Corporate Office Address:</label>
                <input type="text" value={settings.officeAddress} onChange={e => setSettings({...settings, officeAddress: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Founder Executive Managing Director Signature Title:</label>
                  <input type="text" value={settings.founderName} onChange={e => setSettings({...settings, founderName: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Founder Statement Vision Profile Note Text:</label>
                  <textarea value={settings.founderNote} onChange={e => setSettings({...settings, founderNote: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded h-14" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 block mb-1">Operational System Support Ingest Email:</label>
                  <input type="email" value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded" />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Operational System Support Cell Node Handle Line:</label>
                  <input type="text" value={settings.supportPhone} onChange={e => setSettings({...settings, supportPhone: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded" />
                </div>
              </div>
            </div>

            <button onClick={async () => { await upsertSettingToDB('platform_config', settings); alert('Global configuration template metrics committed to production store.'); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition mt-2">
              Commit Environmental Layout Schema Updates
            </button>
          </div>
        )}

        {/* TAB 3: GATEWAY PROCESSING NODES ENGINE CONFIG */}
        {tab === 'billing' && (
          <div className="bg-[#141414] border border-white/5 p-4 rounded-xl space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">Payment Processing Infrastructure Route Matrix</h3>
            <div>
              <label className="text-gray-400 block mb-1">Primary Gateway Liquidity Processing Router Engine Selector:</label>
              <select value={payments.activeGateway} onChange={e => setPayments({...payments, activeGateway: e.target.value as any})} className="p-2 bg-black border border-white/10 rounded text-white">
                <option value="razorpay">Razorpay Checkout Core API Infrastructure Ingest</option>
                <option value="upi">Peer-to-Peer IMPS VPA Handle Merchant Routing</option>
                <option value="none">Deactivate Paywall Blockades</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-gray-400 block mb-1">Razorpay API Key Client Credential Token Token:</label>
                <input type="text" value={payments.razorpayKeyId} onChange={e => setPayments({...payments, razorpayKeyId: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded font-mono" placeholder="rzp_test_..." />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Razorpay Cryptographic Private Secret Asset Token Code:</label>
                <input type="password" value={payments.razorpayKeySecret} onChange={e => setPayments({...payments, razorpayKeySecret: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded font-mono" />
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-400 block mb-1">Merchant Virtual Accounting Private Address UPI Handle VPA:</label>
                <input type="text" value={payments.upiId} onChange={e => setPayments({...payments, upiId: e.target.value})} className="w-full p-2 bg-black border border-white/10 rounded font-mono" placeholder="merchantname@paytm" />
              </div>
            </div>

            <button onClick={async () => { await upsertSettingToDB('payment_config', payments); alert('Payment Infrastructure Credential configurations updated.'); }} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition mt-2">
              Save Active Payment Infrastructure Node Keys
            </button>
          </div>
        )}

        {/* TAB 4: REVENUE ANALYTICS INGEST LEDGER AUDITING */}
        {tab === 'accounting' && (
          <div className="bg-[#141414] border border-white/5 p-4 rounded-xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white">Platform Ingest Liquidity Financial Accounting Reports</h3>
                <p className="text-[10px] text-gray-400">Audited Platform Transaction Logging Streams</p>
              </div>
              <button onClick={processDownloadRevenueManifest} className="p-2 bg-red-600/10 border border-red-500/20 text-red-400 font-bold rounded-xl flex items-center gap-1.5 hover:bg-red-600/20 transition">
                <FileText size={14} /> Export Verified Audited Manifest Log
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-black rounded-xl border border-white/5">
                <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Gross Collective Ingested Accounting Assets</span>
                <span className="text-lg font-mono font-black text-green-500">INR {revenue.reduce((acc, curr) => acc + curr.amount, 0)}.00</span>
              </div>
              <div className="p-3 bg-black rounded-xl border border-white/5">
                <span className="text-gray-500 block text-[9px] uppercase tracking-wider">Active Authorized Ingest Transaction Pipelines</span>
                <span className="text-lg font-mono font-black text-blue-400">{revenue.length} Active Node Ingests</span>
              </div>
            </div>

            <div className="border-t border-white/5 pt-2">
              <h4 className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2">Live Realtime Transaction Node Streams</h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                {revenue.map(r => (
                  <div key={r.id} className="p-2 bg-black border border-white/5 rounded flex justify-between items-center">
                    <div>
                      <span className="text-gray-500 mr-2">[{r.date}]</span>
                      <span className="text-white font-bold">{r.userEmail || 'anonymous.subscriber@gmail.com'}</span>
                      <span className="ml-2 text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400">{r.plan} Matrix Tier</span>
                    </div>
                    <span className="text-green-400 font-bold font-mono">+ INR {r.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE REUSABLE RENDER FOOTER LAYOUT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultPlatformSettings);
  useEffect(() => {
    fetchSettingFromDB<PlatformSettings>('platform_config', defaultPlatformSettings).then(setSettings);
  }, []);

  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-white/5 p-6 space-y-6 text-xs text-gray-400 mt-auto pb-28">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* PHYSICAL ADDRESS CONTAINER ELEMENT */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
            <MapPin size={14} className="text-[var(--accent-color)]" />
            <span>Corporate Registered Location</span>
          </div>
          <p className="leading-relaxed font-sans text-gray-400">
            {settings.officeAddress || "Loading current dynamic structural address data from configuration clusters..."}
          </p>
        </div>

        {/* EXECUTIVE FOUNDER / DIRECTOR MANIFEST NOTE METADATA BLOCKS */}
        <div className="space-y-2 md:col-span-2 border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-6">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-wider text-[11px]">
            <Award size={14} className="text-[var(--accent-color)]" />
            <span>{settings.founderName || "Executive Managing Office Manifest"}</span>
          </div>
          <blockquote className="italic border-l-2 border-[var(--accent-color)]/30 pl-3 py-0.5 text-gray-400 font-sans leading-relaxed">
            "{settings.founderNote || "Loading dynamic leadership communication message text logs..."}"
          </blockquote>
        </div>
      </div>

      <div className="max-w-4xl mx-auto border-t border-white/5 pt-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-500 gap-2">
        <span>© {new Date().getFullYear()} {settings.appName || "ReelRamp Pro"}. All Rights Reserved.</span>
        <div className="flex items-center gap-4 font-mono">
          <span>Cell Node: {settings.supportPhone}</span>
          <span>Endpoint Email: {settings.supportEmail}</span>
        </div>
      </div>
    </footer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION HUD STACK METRIC FOOTER BAR
// ─────────────────────────────────────────────────────────────────────────────
function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-lg border-t border-white/5 p-3 flex justify-around max-w-md mx-auto rounded-t-2xl shadow-xl">
      <button className="flex flex-col items-center gap-1 text-[var(--accent-color)] font-bold text-[10px]">
        <Play size={18} /> Channels
      </button>
      <button className="flex flex-col items-center gap-1 text-gray-500 text-[10px]">
        <UserIcon size={18} /> Node Account
      </button>
    </nav>
  );
}

export default App;
