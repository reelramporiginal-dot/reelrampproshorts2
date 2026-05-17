import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, Heart, Bookmark, Download, Share2, X, ArrowLeft, 
  User, Clock, Star, CreditCard, CheckCircle, Lock, Plus, Edit2, Trash2, 
  BarChart3, Users, Settings, TrendingUp, Volume2, VolumeX,
  Facebook, Instagram, Youtube, MessageCircle, Download as InstallIcon 
} from 'lucide-react';

// Premium Cinematic Logo Component (Film Reel + 'R')
const Logo = ({ size = 32, className = "" }: { size?: number; className?: string }) => (
  <div className={`inline-flex items-center gap-2.5 ${className}`}>
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Film Reel Circle */}
      <circle cx="32" cy="32" r="28" stroke="#c5a26f" strokeWidth="3"/>
      
      {/* Inner Circle */}
      <circle cx="32" cy="32" r="18" stroke="#c5a26f" strokeWidth="2"/>
      
      {/* Film Reel Perforations */}
      <circle cx="32" cy="14" r="3" fill="#c5a26f"/>
      <circle cx="32" cy="50" r="3" fill="#c5a26f"/>
      <circle cx="14" cy="32" r="3" fill="#c5a26f"/>
      <circle cx="50" cy="32" r="3" fill="#c5a26f"/>
      
      {/* Stylized 'R' in center */}
      <path 
        d="M24 22 L24 42 M24 22 L36 22 C40 22 42 25 42 28 C42 32 39 34 35 34 L24 34 M35 34 L42 42" 
        stroke="#f4f4f5" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Play Triangle Accent */}
      <path d="M38 27 L38 37 L45 32 Z" fill="#c5a26f"/>
    </svg>
    
    <div className="flex flex-col leading-none">
      <span className="font-semibold tracking-[-1.5px] text-2xl text-white">ReelRamp</span>
      <span className="text-[9px] text-[#c5a26f] tracking-[3px] -mt-0.5 font-medium">PRO</span>
    </div>
  </div>
);

// Types
interface Video {
  id: number;
  title: string;
  description: string;
  category: string;
  duration: string;
  isPremium: boolean;
  thumbnail: string;
  videoUrl: string;
  source?: 'direct' | 'youtube' | 'gdrive';
  storagePath?: string;
}

interface UserProfile {
  name: string;
  avatar: string;
  email: string;
  phone: string;
}

interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
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
  firebaseProjectId: string;
  // Branding & Theme
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
}

interface SubscriptionSettings {
  trialOfferPrice: string;
  trialOfferDuration: string;
  fullPrice: string;
  fullValidity: string;
  showTrialPopup: boolean;
}

interface RevenueEntry {
  id: number;
  date: string;
  amount: number;
  type: string;
  plan: string;
}

interface WatchHistoryItem {
  videoId: number;
  watchedAt: string;
  progress: number; // 0-100
}

interface Rating {
  videoId: number;
  rating: number; // 1-5
  review?: string;
}

interface PaymentSettings {
  razorpayKeyId: string;
  razorpayKeySecret: string;
  upiId: string;
  stripePublishableKey: string;
  isLiveMode: boolean;
  activeGateway: 'razorpay' | 'stripe' | 'upi' | 'none';
}

interface StorageSettings {
  storageProvider: 'firebase' | 'cloudinary' | 'bunny' | 'custom';
  firebaseStorageBucket: string;
  cdnBaseUrl: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryUploadPreset: string;
  customStorageApiUrl: string;
  customStorageApiKey: string;
  bunnyLibraryId: string;
  bunnyApiKey: string;
  bunnyCdnHostname: string;
  bunnyStorageZone: string;
  bunnyStoragePassword: string;
}

interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

interface PromoVideoSettings {
  videoUrl: string;
  isEnabled: boolean;
  videoType: 'youtube' | 'direct';
}

interface UserRating {
  rating: number; // 1-5
  review?: string;
  ratedAt: string;
}

interface VideoRating {
  videoId: number;
  rating: number;
  userId: string;
}

// Mock Video Data - Premium Short Form Content (initial seed, persisted in localStorage)
const initialVideos: Video[] = [
  {
    id: 1,
    title: "The Silent Whisper",
    description: "A haunting tale of a woman trapped in an abandoned mansion where whispers reveal dark secrets.",
    category: "Horror",
    duration: "4:32",
    isPremium: true,
    thumbnail: "/images/horror1.jpg",
    videoUrl: "https://media.w3.org/2010/05/sintel/trailer.mp4",
    source: 'direct'
  },
  {
    id: 2,
    title: "Midnight Rain",
    description: "A detective uncovers a chilling murder case in a rain-soaked alley filled with lies.",
    category: "Mystery",
    duration: "5:18",
    isPremium: false,
    thumbnail: "/images/mystery1.jpg",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    source: 'direct'
  },
  {
    id: 3,
    title: "The Mountain Sage",
    description: "An elderly mentor shares profound life lessons that transform a young woman's future.",
    category: "Life Lessons",
    duration: "6:45",
    isPremium: false,
    thumbnail: "/images/life1.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  },
  {
    id: 4,
    title: "Shadows of Truth",
    description: "An investigative journalist risks everything to expose a powerful conspiracy.",
    category: "Investigative",
    duration: "7:12",
    isPremium: true,
    thumbnail: "/images/investigative1.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
  },
  {
    id: 5,
    title: "The Forest Entity",
    description: "A terrifying encounter in the woods reveals something ancient and malevolent.",
    category: "Horror",
    duration: "4:59",
    isPremium: true,
    thumbnail: "/images/horror2.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
  },
  {
    id: 6,
    title: "The Velvet Betrayal",
    description: "Secrets and deception unfold in an opulent mansion with deadly consequences.",
    category: "Mystery",
    duration: "5:40",
    isPremium: false,
    thumbnail: "/images/mystery2.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  },
  {
    id: 7,
    title: "Echoes by the Lake",
    description: "A woman confronts her past and finds unexpected clarity in solitude.",
    category: "Life Lessons",
    duration: "3:55",
    isPremium: false,
    thumbnail: "/images/life2.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
  },
  {
    id: 8,
    title: "The Cold Case Files",
    description: "Elite investigators reopen a 20-year-old murder that shakes the city.",
    category: "True Crime",
    duration: "8:21",
    isPremium: true,
    thumbnail: "/images/truecrime1.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
  },
  {
    id: 9,
    title: "The Cracked Mask",
    description: "A chilling psychological horror about identity and the monsters within us.",
    category: "Horror",
    duration: "4:15",
    isPremium: true,
    thumbnail: "/images/horror3.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  },
  {
    id: 10,
    title: "The Forgotten Diary",
    description: "A young woman discovers an ancient diary that reveals family secrets and life wisdom.",
    category: "Life Lessons",
    duration: "5:30",
    isPremium: false,
    thumbnail: "/images/life3.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    source: 'direct'
  },
  // YouTube Shorts (Real Public Examples)
  {
    id: 11,
    title: "The Silent Investigation",
    description: "A gripping true crime short from independent creators. Smooth YouTube playback test.",
    category: "Investigative",
    duration: "0:58",
    isPremium: false,
    thumbnail: "/images/investigative1.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    source: 'direct'
  },
  {
    id: 12,
    title: "Horror Short: The Knock",
    description: "Terrifying horror short film. Perfect test for YouTube integration.",
    category: "Horror",
    duration: "1:12",
    isPremium: true,
    thumbnail: "/images/horror2.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    source: 'direct'
  },
  // Google Drive Example (Public share link format)
  {
    id: 13,
    title: "Life Lesson: The Last Letter",
    description: "Emotional short story. Google Drive playback test.",
    category: "Life Lessons",
    duration: "2:45",
    isPremium: false,
    thumbnail: "/images/life2.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    source: 'direct'
  },
  // More Free Playable Content (Immediate Play)
  {
    id: 14,
    title: "The Midnight Call",
    description: "A chilling mystery short. Free to watch instantly.",
    category: "Mystery",
    duration: "3:20",
    isPremium: false,
    thumbnail: "/images/mystery2.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    source: 'direct'
  },
  {
    id: 15,
    title: "Echoes of Wisdom",
    description: "Powerful life lesson from a village elder. Completely free.",
    category: "Life Lessons",
    duration: "4:05",
    isPremium: false,
    thumbnail: "/images/life1.jpg",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    source: 'direct'
  }
];

const getAllCategories = () => ["All", ...getCategories()];


const initialPopups: PopupAd[] = [
  {
    id: 1,
    title: "Premium Unlock",
    imageUrl: "/images/popup-ad.jpg",
    redirectUrl: "/subscription",
    isActive: true
  }
];

const defaultSettings: PlatformSettings = {
  appName: "ReelRamp Shorts",
  tagline: "Premium Short Films & Investigative Stories",
  accentColor: "#c5a26f",
  supportEmail: "reelramporiginal@gmail.com",
  supportPhone: "+91 7307493338",
  razorpayKey: "rzp_test_xxxxxxxx",
  firebaseProjectId: "reelramp-shorts-prod",
  // Branding Defaults
  logoUrl: "",
  primaryColor: "#c5a26f",
  secondaryColor: "#d4b17f",
  backgroundColor: "#0a0a0a",
  cardBackground: "#1a1a1a",
  textPrimary: "#ffffff",
  textSecondary: "#a1a1aa"
};

const defaultSubscriptionSettings: SubscriptionSettings = {
  trialOfferPrice: "₹2",
  trialOfferDuration: "1 Day",
  fullPrice: "₹699",
  fullValidity: "3 months",
  showTrialPopup: true
};

const defaultPaymentSettings: PaymentSettings = {
  razorpayKeyId: "rzp_test_xxxxxxxxxxxxxx",
  razorpayKeySecret: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  upiId: "",
  stripePublishableKey: "",
  isLiveMode: false,
  activeGateway: 'razorpay'
};

const defaultStorageSettings: StorageSettings = {
  storageProvider: 'firebase',
  firebaseStorageBucket: "", cdnBaseUrl: "",
  cloudinaryCloudName: "", cloudinaryApiKey: "", cloudinaryUploadPreset: "",
  customStorageApiUrl: "", customStorageApiKey: "",
  bunnyLibraryId: "", bunnyApiKey: "", bunnyCdnHostname: "", bunnyStorageZone: "", bunnyStoragePassword: ""
};

const getStorageSettings = (): StorageSettings => {
  const stored = localStorage.getItem('reelramp_storage_settings');
  return stored ? { ...defaultStorageSettings, ...JSON.parse(stored) } : defaultStorageSettings;
};

const saveStorageSettings = (settings: StorageSettings) => {
  localStorage.setItem('reelramp_storage_settings', JSON.stringify(settings));
};

const defaultAdminKey = "REELRAMP-ADMIN-2025";

// Official ReelRamp Logo (from Google Drive)
const REELRAMP_LOGO = "https://drive.google.com/uc?export=view&id=1qs734lVBcgz-fJ_TitnibEG-KqX0LCVg";

const initialAdminUsers: AdminUser[] = [
  { id: 1, name: "Alex Rivera", email: "alex.rivera@reelramp.app", phone: "+91 98765 43210", subscribed: true, joinDate: "Mar 12, 2024", totalWatched: 47 },
  { id: 2, name: "Priya Sharma", email: "priya.s@reelramp.app", phone: "+91 87654 32109", subscribed: true, joinDate: "Jan 28, 2024", totalWatched: 112 },
  { id: 3, name: "Rahul Mehta", email: "rahul.m@reelramp.app", phone: "+91 76543 21098", subscribed: false, joinDate: "Apr 05, 2024", totalWatched: 19 },
  { id: 4, name: "Saanvi Patel", email: "saanvi.p@reelramp.app", phone: "+91 65432 10987", subscribed: true, joinDate: "Feb 19, 2024", totalWatched: 68 },
  { id: 5, name: "Arjun Khan", email: "arjun.k@reelramp.app", phone: "+91 54321 09876", subscribed: false, joinDate: "May 01, 2024", totalWatched: 8 }
];

// Utility: Simulate Firebase Video Fetch (dynamic from localStorage)
const getStoredVideos = (): Video[] => {
  const stored = localStorage.getItem('reelramp_videos');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('reelramp_videos', JSON.stringify(initialVideos));
  return initialVideos;
};

const fetchVideos = (): Promise<Video[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(getStoredVideos()), 280);
  });
};

const saveVideosToStorage = (newVideos: Video[]) => {
  localStorage.setItem('reelramp_videos', JSON.stringify(newVideos));
};

const getStoredPopups = (): PopupAd[] => {
  const stored = localStorage.getItem('reelramp_popups');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('reelramp_popups', JSON.stringify(initialPopups));
  return initialPopups;
};

const savePopupsToStorage = (popups: PopupAd[]) => {
  localStorage.setItem('reelramp_popups', JSON.stringify(popups));
};

const getStoredSettings = (): PlatformSettings => {
  const stored = localStorage.getItem('reelramp_settings');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('reelramp_settings', JSON.stringify(defaultSettings));
  return defaultSettings;
};

const saveSettingsToStorage = (settings: PlatformSettings) => {
  localStorage.setItem('reelramp_settings', JSON.stringify(settings));
};

const getSubscriptionSettings = (): SubscriptionSettings => {
  const stored = localStorage.getItem('reelramp_subscription_settings');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('reelramp_subscription_settings', JSON.stringify(defaultSubscriptionSettings));
  return defaultSubscriptionSettings;
};

const saveSubscriptionSettings = (settings: SubscriptionSettings) => {
  localStorage.setItem('reelramp_subscription_settings', JSON.stringify(settings));
};

const getRevenueData = (): RevenueEntry[] => {
  const stored = localStorage.getItem('reelramp_revenue');
  if (stored) return JSON.parse(stored);
  
  const initialRevenue: RevenueEntry[] = [
    { id: 1, date: "2025-04-01", amount: 2450, type: "Subscription", plan: "Monthly" },
    { id: 2, date: "2025-04-05", amount: 1499, type: "Annual", plan: "Annual" },
    { id: 3, date: "2025-04-12", amount: 2, type: "Trial", plan: "1-Day Trial" },
    { id: 4, date: "2025-04-18", amount: 699, type: "Subscription", plan: "Monthly" },
    { id: 5, date: "2025-05-01", amount: 2450, type: "Subscription", plan: "Monthly" },
  ];
  localStorage.setItem('reelramp_revenue', JSON.stringify(initialRevenue));
  return initialRevenue;
};

// Watch History & Ratings Helpers
const getWatchHistory = (): WatchHistoryItem[] => {
  const stored = localStorage.getItem('reelramp_watch_history');
  return stored ? JSON.parse(stored) : [];
};

const saveWatchHistory = (history: WatchHistoryItem[]) => {
  localStorage.setItem('reelramp_watch_history', JSON.stringify(history));
};

const getRatings = (): Rating[] => {
  const stored = localStorage.getItem('reelramp_ratings');
  return stored ? JSON.parse(stored) : [];
};

const saveRatings = (ratings: Rating[]) => {
  localStorage.setItem('reelramp_ratings', JSON.stringify(ratings));
};

const getCategories = (): string[] => {
  const stored = localStorage.getItem('reelramp_categories');
  const defaultCats = ["Horror", "Mystery", "Life Lessons", "Investigative", "True Crime"];
  if (stored) return JSON.parse(stored);
  localStorage.setItem('reelramp_categories', JSON.stringify(defaultCats));
  return defaultCats;
};

const defaultCategories = getCategories();

const saveCategories = (cats: string[]) => {
  localStorage.setItem('reelramp_categories', JSON.stringify(cats));
};

const savePaymentSettings = (settings: PaymentSettings) => {
  localStorage.setItem('reelramp_payment_settings', JSON.stringify(settings));
};

const getPaymentSettings = (): PaymentSettings => {
  const stored = localStorage.getItem('reelramp_payment_settings');
  return stored ? { ...defaultPaymentSettings, ...JSON.parse(stored) } : defaultPaymentSettings;
};

// Helper to get current Razorpay config
const getRazorpayConfig = () => {
  const settings = getPaymentSettings();
  return {
    key: settings.razorpayKeyId,
    secret: settings.razorpayKeySecret,
    isLive: settings.isLiveMode,
    mode: settings.isLiveMode ? 'Live' : 'Test'
  };
};

// Firebase App Config (manually configured from Admin Panel)
const defaultFirebaseConfig: FirebaseAppConfig = {
  apiKey: "", authDomain: "", projectId: "", storageBucket: "",
  messagingSenderId: "", appId: "", measurementId: ""
};
const getFirebaseAppConfig = (): FirebaseAppConfig => {
  const s = localStorage.getItem('reelramp_firebase_config');
  return s ? { ...defaultFirebaseConfig, ...JSON.parse(s) } : defaultFirebaseConfig;
};
const saveFirebaseAppConfig = (c: FirebaseAppConfig) =>
  localStorage.setItem('reelramp_firebase_config', JSON.stringify(c));

// Promo Video Settings
const defaultPromoVideo: PromoVideoSettings = {
  videoUrl: "https://www.youtube.com/embed/9bZkp7q19f0",
  isEnabled: true,
  videoType: 'youtube'
};
const getPromoVideoSettings = (): PromoVideoSettings => {
  const s = localStorage.getItem('reelramp_promo_video');
  return s ? { ...defaultPromoVideo, ...JSON.parse(s) } : defaultPromoVideo;
};
const savePromoVideoSettings = (s: PromoVideoSettings) =>
  localStorage.setItem('reelramp_promo_video', JSON.stringify(s));

// Video Views Tracking
const getVideoViews = (): Record<number, number> => {
  const s = localStorage.getItem('reelramp_video_views');
  return s ? JSON.parse(s) : {};
};
const incrementVideoView = (id: number) => {
  const v = getVideoViews();
  v[id] = (v[id] || 0) + 1;
  localStorage.setItem('reelramp_video_views', JSON.stringify(v));
};

// Auth check helper
const isLoggedIn = (): boolean => !!localStorage.getItem('reelramp_user');

// Auth Helpers (Future Firebase Ready)
const loginUser = (user: AuthUser) => {
  localStorage.setItem('reelramp_user', JSON.stringify(user));
  return user;
};

const registerUser = (name: string, email: string, phone: string): AuthUser => {
  const newUser: AuthUser = {
    id: Date.now(),
    name,
    email,
    phone,
    createdAt: new Date().toISOString()
  };
  localStorage.setItem('reelramp_user', JSON.stringify(newUser));
  return newUser;
};

const logoutUser = () => {
  localStorage.removeItem('reelramp_user');
};

const addToWatchHistory = (videoId: number, progress: number = 100) => {
  const history = getWatchHistory();
  const existingIndex = history.findIndex(item => item.videoId === videoId);
  
  const newItem: WatchHistoryItem = {
    videoId,
    watchedAt: new Date().toISOString(),
    progress
  };

  if (existingIndex !== -1) {
    history[existingIndex] = newItem;
  } else {
    history.unshift(newItem);
  }

  // Keep only last 20 items
  const trimmed = history.slice(0, 20);
  localStorage.setItem('reelramp_watch_history', JSON.stringify(trimmed));
};

// Ratings Helpers
const getVideoRatings = (): Record<number, { rating: number; review?: string; count: number }> => {
  const stored = localStorage.getItem('reelramp_video_ratings');
  return stored ? JSON.parse(stored) : {};
};

const rateVideo = (videoId: number, rating: number, review?: string) => {
  const ratings = getVideoRatings();
  const existing = ratings[videoId] || { rating: 0, count: 0 };
  
  const newCount = existing.count + 1;
  const newAverage = ((existing.rating * existing.count) + rating) / newCount;

  ratings[videoId] = {
    rating: Math.round(newAverage * 10) / 10,
    review: review || existing.review,
    count: newCount
  };

  localStorage.setItem('reelramp_video_ratings', JSON.stringify(ratings));
};

const getAdminSecretKey = (): string => {
  return localStorage.getItem('reelramp_admin_secret_key') || defaultAdminKey;
};

const setAdminSecretKey = (newKey: string) => {
  localStorage.setItem('reelramp_admin_secret_key', newKey);
};

const categories = getCategories();

const saveToWatchHistory = (videoId: number, progress: number = 100) => {
  const history = getWatchHistory();
  const existingIndex = history.findIndex(item => item.videoId === videoId);
  
  const newItem: WatchHistoryItem = {
    videoId,
    watchedAt: new Date().toISOString(),
    progress
  };

  if (existingIndex !== -1) {
    history[existingIndex] = newItem;
  } else {
    history.unshift(newItem);
  }

  // Keep only last 12 items
  const limitedHistory = history.slice(0, 12);
  localStorage.setItem('reelramp_watch_history', JSON.stringify(limitedHistory));
};

// Ratings Helpers
const getUserRatings = (): Record<number, UserRating> => {
  const stored = localStorage.getItem('reelramp_user_ratings');
  return stored ? JSON.parse(stored) : {};
};

const saveUserRating = (videoId: number, rating: number, review?: string) => {
  const ratings = getUserRatings();
  ratings[videoId] = {
    rating,
    review,
    ratedAt: new Date().toISOString()
  };
  localStorage.setItem('reelramp_user_ratings', JSON.stringify(ratings));
};

const getAverageRating = (videoId: number): { average: number; count: number } => {
  const ratings = getUserRatings();
  const userRating = ratings[videoId];
  if (userRating) {
    return { average: userRating.rating, count: 1 };
  }
  // Simulate some community ratings for demo
  const simulated = (videoId % 5) + 3.5;
  return { average: Math.min(5, simulated), count: Math.floor(Math.random() * 40) + 12 };
};



// FUTURE-PROOF: Video Storage Helper
// When Firebase Storage is added, only update this function. No other code changes needed.
const getVideoUrl = (video: Video): string => {
  // Current: Uses direct public URL
  // Future: return `https://firebasestorage.googleapis.com/v0/b/${settings.firebaseProjectId}.appspot.com/o/${encodeURIComponent(video.storagePath || '')}?alt=media`;
  return video.videoUrl;
};

// Professional Smart Video Player (Supports YouTube, Google Drive, Direct)
interface SmartVideoPlayerProps {
  video: Video;
  isPlaying: boolean;
  onPlayPause: () => void;
  onEnded: () => void;
  onProgress?: (progress: number) => void;
}

function SmartVideoPlayer({ video, isPlaying, onPlayPause, onEnded }: SmartVideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const youtubeRef = React.useRef<any>(null);

  // YouTube Player Setup (Professional IFrame API)
  const initYouTubePlayer = (containerId: string) => {
    const videoId = video.videoUrl.split('/').pop()?.split('?')[0] || '';
    
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag?.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      new (window as any).YT.Player(containerId, {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            youtubeRef.current = event.target;
            setIsLoaded(true);
            if (isPlaying) event.target.playVideo();
          },
          onStateChange: (event: any) => {
            if (event.data === 0) onEnded(); // Ended
            if (event.data === 1) setIsLoaded(true);
          }
        }
      });
    };
  };

  React.useEffect(() => {
    if (video.source === 'youtube') {
      const container = document.getElementById(`yt-player-${video.id}`);
      if (container) {
        initYouTubePlayer(`yt-player-${video.id}`);
      }
    }
  }, [video]);

  // Direct Video Control
  React.useEffect(() => {
    if (video.source === 'direct' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, video.source]);

  const sourceType = video.source || 'direct';

  if (sourceType === 'youtube') {
    return (
      <div className="relative w-full h-full bg-black">
        <div id={`yt-player-${video.id}`} className="w-full h-full" />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  if (sourceType === 'gdrive') {
    // Google Drive direct play link
    const gdriveUrl = video.videoUrl.includes('drive.google.com') 
      ? video.videoUrl 
      : `https://drive.google.com/uc?export=download&id=${video.videoUrl}`;
    
    return (
      <div className="relative w-full h-full bg-black">
        <video
          ref={videoRef}
          src={gdriveUrl}
          className="w-full h-full object-cover"
          autoPlay={isPlaying}
          playsInline
          onEnded={onEnded}
          onClick={onPlayPause}
          onLoadedData={() => setIsLoaded(true)}
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  // Direct MP4 (Default)
  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        src={getVideoUrl(video)}
        className="w-full h-full object-cover"
        autoPlay={isPlaying}
        playsInline
        muted={false}
        onEnded={onEnded}
        onClick={onPlayPause}
        onLoadedData={() => setIsLoaded(true)}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Main App Component with Router
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminOrPlayer =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/player') ||
    location.pathname === '/admin-secure-7842' ||
    location.pathname === '/rrmp-control-9x7k';

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      <Routes>
        <Route path="/" element={<HomePage />} />
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

      {/* Hide Footer and Bottom Navigation on Admin and Player pages */}
      {!isAdminOrPlayer && (
        <>
          <Footer />
          <BottomNavigation />
        </>
      )}
    </div>
  );
}

// Footer - Legal & Contact (Play Store Ready)
function Footer() {
  const socialLinks = [
    { name: 'Facebook', url: 'https://facebook.com/reelrampofficial', label: 'ReelRamp Official' },
    { name: 'Instagram', url: 'https://instagram.com/thoda_thehro_', label: '@thoda_thehro_' },
    { name: 'YouTube', url: 'https://youtube.com/@reelramp', label: 'ReelRamp Channel' },
    { name: 'WhatsApp', url: 'https://wa.me/917307493338', label: 'Direct Chat' }
  ];

  return (
    <footer className="bg-[#0a0a0a] border-t border-[#222] pt-14 pb-8 px-5 text-sm text-[#a1a1aa]">
      <div className="max-w-7xl mx-auto">
        
        {/* Director's Note - Cinematic Elegant Section */}
        <div className="max-w-3xl mx-auto text-center pb-12 border-b border-[#222]">
          <div className="mb-6">
            <div className="inline-block px-4 py-1 text-xs tracking-[3px] text-[#c5a26f] border border-[#c5a26f]/30 rounded-full mb-4">FROM THE DIRECTOR</div>
          </div>
          
          <blockquote className="text-2xl md:text-3xl font-light italic leading-snug tracking-[-0.5px] text-white mb-6">
            "Kahaniyan sirf sunayi nahi jati, mehsoos ki jati hain.<br className="hidden md:block" /> Main wahi ehsaas aap tak lane ki ek koshish kar raha hoon."
          </blockquote>
          
          <div className="text-[#c5a26f] font-medium tracking-wide">
            — Ayush Jivan <span className="text-[#666] font-normal">Founder &amp; Director, ReelRamp Pro</span>
          </div>
        </div>

        {/* Connect with the Director - Social Links */}
        <div className="pt-10 pb-8">
          <div className="text-center mb-6">
            <div className="text-white font-medium tracking-[1px] text-sm">CONNECT WITH THE DIRECTOR</div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm">
            {socialLinks.map((social, index) => (
              <a 
                key={index}
                href={social.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[#a1a1aa] hover:text-[#c5a26f] transition-colors group"
              >
                <div className="text-[#c5a26f] group-hover:text-[#d4b17f]">
                  {social.name === 'Facebook' && <Facebook size={18} />}
                  {social.name === 'Instagram' && <Instagram size={18} />}
                  {social.name === 'YouTube' && <Youtube size={18} />}
                  {social.name === 'WhatsApp' && <MessageCircle size={18} />}
                </div>
                <span>{social.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Main Footer Grid */}
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
              <a href="/privacy" className="block hover:text-white">Privacy Policy</a>
              <a href="/terms" className="block hover:text-white">Terms &amp; Conditions</a>
              <a href="/refund" className="block hover:text-white">Cancellation &amp; Refund</a>
              <a href="/shipping" className="block hover:text-white">Shipping &amp; Delivery</a>
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

// PWA Install Prompt Component
function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show banner on every visit until app is installed
    // Use a small delay so it doesn't pop up instantly
    const timer = setTimeout(() => {
      setShowInstall(true);
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
        setDeferredPrompt(null);
        return;
      }
      setDeferredPrompt(null);
    }
    // If no native prompt (iOS / already dismissed by browser), show instructions
    alert("To install:\n📱 iOS: Tap Share → Add to Home Screen\n🤖 Android: Tap menu (⋮) → Add to Home Screen\n💻 Desktop: Click install icon in browser address bar");
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 z-50">
      <div className="bg-[#111] border border-[#c5a26f]/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
        <div className="flex-1">
          <div className="font-semibold text-sm">Install ReelRamp Shorts</div>
          <div className="text-xs text-[#666]">Get the full app experience</div>
        </div>
        <button 
          onClick={handleInstall}
          className="px-5 py-2 bg-[#c5a26f] text-black rounded-xl text-sm font-medium flex items-center gap-2 active:bg-white"
        >
          <InstallIcon size={16} /> Install
        </button>
        <button onClick={() => setShowInstall(false)} className="text-[#666] p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

// Bottom Navigation - Mobile App Feel
function BottomNavigation() {
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = React.useState('/');

  React.useEffect(() => {
    setCurrentPath(window.location.pathname);
  }, []);

  const [editorMode, setEditorMode] = React.useState(false);

  React.useEffect(() => {
    if (localStorage.getItem('editorMode') === 'true') {
      setEditorMode(true);
    }
  }, []);

  // Secret Editor Mode: Long press on logo or Ctrl+Shift+E
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        const newMode = !editorMode;
        setEditorMode(newMode);
        localStorage.setItem('editorMode', newMode.toString());
        console.info(newMode ? 'Editor Mode Enabled' : 'Editor Mode Disabled');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorMode]);

  const navItems = [
    { path: '/', label: 'Home', icon: Play, action: 'home' },
    { path: '/', label: 'For You', icon: Heart, action: 'for-you' },
    { path: '/subscription', label: 'Plans', icon: Star, action: 'plans' },
    { path: '/profile', label: 'Profile', icon: User, action: 'profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#222] z-50 md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === '/' && currentPath.startsWith('/player'));
          return (
            <button
              key={item.action}
              onClick={() => {
                if (item.action === 'for-you') {
                  navigate('/');
                  setTimeout(() => {
                    window.scrollTo({ top: 850, behavior: 'smooth' });
                  }, 100);
                } else {
                  navigate(item.path);
                }
                setCurrentPath(item.path);
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

// HOME PAGE - Premium Dashboard
function HomePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [dynamicCategories, setDynamicCategories] = useState<string[]>(defaultCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedVideoForPaywall, setSelectedVideoForPaywall] = useState<Video | null>(null);
  const [library, setLibrary] = useState<number[]>([]);
  const [showGlobalPopup, setShowGlobalPopup] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupAd | null>(null);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [ratings, setRatings] = useState<Record<number, number>>({});

  // Load from localStorage (Simulates Firebase Auth & Firestore)
  useEffect(() => {
    const savedSubscribed = localStorage.getItem('reelramp_subscribed') === 'true';
    setIsSubscribed(savedSubscribed);

    const savedLibrary = localStorage.getItem('reelramp_library');
    if (savedLibrary) setLibrary(JSON.parse(savedLibrary));

    const savedHistory = localStorage.getItem('reelramp_watch_history');
    if (savedHistory) setWatchHistory(JSON.parse(savedHistory));

    const savedRatings = localStorage.getItem('reelramp_ratings');
    if (savedRatings) setRatings(JSON.parse(savedRatings));

    // Fetch videos (Firebase simulation)
    fetchVideos().then(setAllVideos);
    setDynamicCategories(getCategories());

    // Load current user (Auth simulation)
    const savedUser = localStorage.getItem('reelramp_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Show Global Popup Ad on app open (if active)
    const popups = getStoredPopups();
    const active = popups.find(p => p.isActive);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let trialTimer: ReturnType<typeof setTimeout> | undefined;

    if (active) {
      timer = setTimeout(() => {
        setActivePopup(active);
        setShowGlobalPopup(true);
      }, 2200);
    }

    // High-converting Trial Offer Popup (once per session)
    const hasSeenTrial = sessionStorage.getItem('trialPopupShown');
    if (!hasSeenTrial) {
      trialTimer = setTimeout(() => {
        setShowTrialPopup(true);
        sessionStorage.setItem('trialPopupShown', 'true');
      }, 1800);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (trialTimer) clearTimeout(trialTimer);
    };
  }, []);

  // Load subscription settings from Firebase
  useEffect(() => {
    const loadSubscriptionSettings = async () => {
      try {
        const { getSubscriptionSettings } = await import('./services/subscriptionService');
        const settings = await getSubscriptionSettings();
        // Store in state if needed
        window.localStorage.setItem('reelramp_subscription_settings', JSON.stringify(settings));
      } catch (error) {
        console.log("Using local settings");
      }
    };
    loadSubscriptionSettings();
  }, []);

  const filteredVideos = allVideos
    .filter(video => {
      const matchesCategory = selectedCategory === "All" || video.category === selectedCategory;
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           video.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

  const groupedVideos = categories.slice(1).map(cat => ({
    category: cat,
    videos: filteredVideos.filter(v => v.category === cat)
  })).filter(group => group.videos.length > 0);

  const handleVideoClick = (video: Video) => {
    // Record watch history
    const history = JSON.parse(localStorage.getItem('reelramp_watch_history') || '[]');
    const newEntry = { id: video.id, watchedAt: new Date().toISOString() };
    const filtered = history.filter((item: any) => item.id !== video.id);
    const updated = [newEntry, ...filtered].slice(0, 20);
    localStorage.setItem('reelramp_watch_history', JSON.stringify(updated));
    setWatchHistory(updated);

    if (video.isPremium && !isSubscribed) {
      setSelectedVideoForPaywall(video);
      setShowPaywall(true);
    } else {
      navigate(`/player/${video.id}`);
    }
  };

  const toggleSaveToLibrary = (videoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLibrary = library.includes(videoId)
      ? library.filter(id => id !== videoId)
      : [...library, videoId];
    setLibrary(newLibrary);
    localStorage.setItem('reelramp_library', JSON.stringify(newLibrary));
  };

  const closePaywall = () => {
    setShowPaywall(false);
    setSelectedVideoForPaywall(null);
  };

  const goToSubscription = () => {
    closePaywall();
    navigate('/subscription');
  };

  // Track Watch History
  const addToWatchHistory = (videoId: number) => {
    const newHistory = [
      { id: videoId, watchedAt: new Date().toISOString() },
      ...watchHistory.filter(h => h.id !== videoId)
    ].slice(0, 20); // Keep last 20

    setWatchHistory(newHistory);
    localStorage.setItem('reelramp_watch_history', JSON.stringify(newHistory));
  };

  return (
    <div className="pb-20 md:pb-8">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <img 
                src={REELRAMP_LOGO} 
                alt="ReelRamp" 
                className="h-9 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/36x36/c5a26f/0a0a0a?text=RR";
                }}
              />
              <div>
                <h1 className="text-3xl font-semibold tracking-tighter">ReelRamp</h1>
                <p className="text-[10px] text-[#a1a1aa] -mt-1">SHORTS • PREMIUM</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222] rounded-2xl text-sm transition-colors"
            >
              <User size={18} /> Profile
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search premium shorts and stories..."
              className="w-full bg-[#111] border border-[#333] rounded-3xl py-3.5 pl-12 pr-5 text-sm focus:outline-none focus:border-[#c5a26f] placeholder:text-[#666]"
            />
            <div className="absolute left-5 top-4 text-[#666]">
              <Star size={18} />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative h-[340px] md:h-[420px] overflow-hidden">
        <img 
          src="/images/hero.jpg" 
          alt="ReelRamp Premium" 
          className="absolute inset-0 w-full h-full object-cover brightness-[0.65]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-[#0a0a0a]" />
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-9 max-w-3xl">
          <div className="inline px-4 py-1 bg-[#c5a26f] text-[#0a0a0a] text-xs tracking-[3px] font-medium rounded-full mb-4">PREMIUM EXCLUSIVE</div>
          <h2 className="text-5xl md:text-6xl font-semibold tracking-[-2.5px] leading-none mb-4">Cinematic<br />Short Stories</h2>
          <p className="text-lg text-[#a1a1aa] max-w-md">High-end investigative journalism, gripping horror, and transformative life lessons.</p>
          <button 
            onClick={() => navigate('/player/4')}
            className="mt-6 flex items-center gap-3 bg-white text-black px-9 py-3.5 rounded-2xl font-medium hover:bg-[#c5a26f] hover:text-white transition-all active:scale-[0.985]"
          >
            <Play size={19} /> Watch Premium Short
          </button>
        </div>
      </div>

      {/* Continue Watching - Watch History */}
      {watchHistory.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
            <button 
              onClick={() => navigate('/profile')} 
              className="text-sm text-[#c5a26f]"
            >
              View All
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 category-scroll">
            {watchHistory.map(id => {
              const video = allVideos.find(v => v.id === id);
              if (!video) return null;
              return (
                <div 
                  key={id} 
                  onClick={() => navigate(`/player/${id}`)}
                  className="flex-shrink-0 w-[140px] cursor-pointer group"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-[10px] px-2 py-px rounded font-mono">
                      {video.duration}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                      <Play size={22} className="text-white" />
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <div className="text-sm font-medium line-clamp-1 tracking-tight">{video.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Horizontal Scrolling Categories */}
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold tracking-tight">Browse Categories</h3>
          {isSubscribed && <div className="text-xs px-3 py-1 bg-[#c5a26f] text-black rounded-full font-medium">PREMIUM MEMBER</div>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 category-scroll">
          {getAllCategories().map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 whitespace-nowrap rounded-2xl text-sm font-medium transition-all border ${selectedCategory === category 
                ? 'bg-[#c5a26f] text-black border-[#c5a26f]' 
                : 'bg-[#1a1a1a] border-[#333] hover:bg-[#222]'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Continue Watching */}
      {watchHistory.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
              <p className="text-xs text-[#666]">Pick up where you left off</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 category-scroll">
            {allVideos
              .filter(v => watchHistory.includes(v.id))
              .slice(0, 6)
              .map((video) => (
                <div 
                  key={video.id} 
                  onClick={() => handleVideoClick(video)}
                  className="flex-shrink-0 w-[140px] cursor-pointer group"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute bottom-2 left-2 bg-black/70 text-[10px] px-2 py-px rounded font-mono">
                      {video.duration}
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <div className="text-sm font-medium line-clamp-1 tracking-tight">{video.title}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Continue Watching */}
      {(() => {
        const historyIds: number[] = JSON.parse(localStorage.getItem('reelramp_watch_history') || '[]');
        if (historyIds.length === 0) return null;

        const continueVideos = allVideos.filter(v => historyIds.includes(v.id)).slice(0, 6);
        if (continueVideos.length === 0) return null;

        return (
          <div className="max-w-7xl mx-auto px-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
              <button onClick={() => navigate('/profile')} className="text-sm text-[#c5a26f]">View All</button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 category-scroll">
              {continueVideos.map((video) => (
                <div 
                  key={video.id} 
                  onClick={() => handleVideoClick(video)}
                  className="flex-shrink-0 w-[160px] cursor-pointer group"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#111]">
                    <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition" alt="" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#333]">
                      <div className="h-full bg-[#c5a26f] w-[65%]" />
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-[10px] px-2 py-px rounded font-mono">
                      {video.duration}
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <div className="text-sm font-medium line-clamp-1">{video.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}



      {/* For You - Recommended Episodes */}
      <div className="max-w-7xl mx-auto px-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">For You</h3>
            <p className="text-xs text-[#666]">Personalized picks just for you</p>
          </div>
          <button 
            onClick={() => {
              setSelectedCategory("All");
              window.scrollTo({ top: 600, behavior: 'smooth' });
            }}
            className="text-sm text-[#c5a26f] flex items-center gap-1"
          >
            See All <Play size={14} />
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-4 category-scroll">
          {allVideos.slice(0, 8).map((video) => (
            <div 
              key={video.id} 
              onClick={() => handleVideoClick(video)}
              className="flex-shrink-0 w-[140px] cursor-pointer group"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[9/16]">
                <img 
                  src={video.thumbnail} 
                  alt={video.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                {video.isPremium && (
                  <div className="absolute top-2 right-2 bg-[#e11d48] text-[9px] px-2 py-0.5 rounded-full font-medium">PREMIUM</div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 text-[10px] px-2 py-px rounded font-mono">
                  {video.duration}
                </div>
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

      {/* Continue Watching - Watch History */}
      {(() => {
        const history = getWatchHistory();
        if (history.length === 0) return null;

        const continueWatchingVideos = history
          .map(h => allVideos.find(v => v.id === h.videoId))
          .filter(Boolean) as Video[];

        if (continueWatchingVideos.length === 0) return null;

        return (
          <div className="max-w-7xl mx-auto px-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
                <p className="text-xs text-[#666]">Pick up where you left off</p>
              </div>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-4 category-scroll">
              {continueWatchingVideos.map((video) => {
                const historyItem = history.find(h => h.videoId === video.id);
                return (
                  <div 
                    key={video.id} 
                    onClick={() => handleVideoClick(video)}
                    className="flex-shrink-0 w-[160px] cursor-pointer group"
                  >
                    <div className="relative rounded-2xl overflow-hidden aspect-video">
                      <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                        <div 
                          className="h-full bg-[#c5a26f]" 
                          style={{ width: `${historyItem?.progress || 0}%` }}
                        />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                          <Play size={18} className="text-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 px-1">
                      <div className="text-sm font-medium line-clamp-1 tracking-tight">{video.title}</div>
                      <div className="text-xs text-[#666] flex items-center gap-1">
                        {video.duration} • <span className="text-[#c5a26f]">Continue</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Continue Watching - Launch Ready Feature */}
      {watchHistory.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
              <p className="text-xs text-[#666]">Pick up where you left off</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 category-scroll">
            {watchHistory.slice(0, 6).map((historyItem) => {
              const video = allVideos.find(v => v.id === historyItem.id);
              if (!video) return null;
              return (
                <div 
                  key={video.id} 
                  onClick={() => navigate(`/player/${video.id}`)}
                  className="flex-shrink-0 w-[160px] cursor-pointer group"
                >
                  <div className="relative rounded-2xl overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover group-hover:scale-105 transition" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-sm font-medium text-white line-clamp-1">{video.title}</div>
                      <div className="text-[10px] text-[#c5a26f] mt-0.5">Continue →</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue Watching - Watch History */}
      {watchHistory.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
              <p className="text-xs text-[#666]">Pick up where you left off</p>
            </div>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 category-scroll">
            {watchHistory.slice(0, 6).map((historyItem: any) => {
              const video = allVideos.find(v => v.id === historyItem.id);
              if (!video) return null;
              return (
                <div 
                  key={video.id} 
                  onClick={() => handleVideoClick(video)}
                  className="flex-shrink-0 w-[160px] cursor-pointer group"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[16/9]">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#c5a26f]">
                      <div className="h-1 w-2/3 bg-white"></div>
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <div className="text-sm font-medium line-clamp-1">{video.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue Watching */}
      {watchHistory.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
              <p className="text-xs text-[#666]">Pick up where you left off</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 category-scroll">
            {watchHistory.slice(0, 6).map(id => {
              const video = allVideos.find(v => v.id === id);
              if (!video) return null;
              return (
                <div 
                  key={id} 
                  onClick={() => handleVideoClick(video)}
                  className="flex-shrink-0 w-[160px] cursor-pointer group"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-video">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-sm font-medium text-white line-clamp-1">{video.title}</div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 text-[10px] px-2 py-px rounded font-mono">
                      {video.duration}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue Watching - Watch History */}
      {getWatchHistory().length > 0 && (
        <div className="max-w-7xl mx-auto px-5 pb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight">Continue Watching</h3>
              <p className="text-xs text-[#666]">Pick up where you left off</p>
            </div>
            <button onClick={() => navigate('/profile')} className="text-sm text-[#c5a26f]">View All</button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 category-scroll">
            {getWatchHistory().slice(0, 6).map((historyItem) => {
              const video = allVideos.find(v => v.id === historyItem.videoId);
              if (!video) return null;
              
              return (
                <div 
                  key={video.id} 
                  onClick={() => navigate(`/player/${video.id}`)}
                  className="flex-shrink-0 w-[200px] cursor-pointer group"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
                      <div className="h-1 bg-[#c5a26f]" style={{ width: `${historyItem.progress}%` }} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                        <Play size={22} className="text-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <div className="text-sm font-medium line-clamp-1">{video.title}</div>
                    <div className="text-xs text-[#666]">{video.category} • {video.duration}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Video Feed - Grouped by Category or All */}
      <div className="max-w-7xl mx-auto px-5 pb-12">
        {selectedCategory === "All" ? (
          groupedVideos.map((group, index) => (
            <div key={index} className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold tracking-tight flex items-center gap-3">
                  {group.category}
                  <span className="text-xs px-3 py-px bg-[#222] rounded-full text-[#666] font-normal">{group.videos.length}</span>
                </h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {group.videos.map((video) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    isSubscribed={isSubscribed}
                    isSaved={library.includes(video.id)}
                    onClick={() => handleVideoClick(video)}
                    onSave={(e) => toggleSaveToLibrary(video.id, e)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-5 flex items-center gap-3">
              {selectedCategory} <span className="text-xs px-3 py-px bg-[#222] rounded-full text-[#666] font-normal">{filteredVideos.length}</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredVideos.map((video) => (
                <VideoCard 
                  key={video.id} 
                  video={video} 
                  isSubscribed={isSubscribed}
                  isSaved={library.includes(video.id)}
                  onClick={() => handleVideoClick(video)}
                  onSave={(e) => toggleSaveToLibrary(video.id, e)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Paywall Modal */}
      <AnimatePresence>
        {showPaywall && selectedVideoForPaywall && (
          <PaywallModal 
            video={selectedVideoForPaywall} 
            onClose={closePaywall} 
            onSubscribe={goToSubscription} 
          />
        )}
      </AnimatePresence>

      {/* Global Marketing Popup (Admin Controlled) */}
      <AnimatePresence>
        {showGlobalPopup && activePopup && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-5" onClick={() => setShowGlobalPopup(false)}>
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
                  <button onClick={() => setShowGlobalPopup(false)} className="flex-1 py-3.5 border border-[#444] rounded-2xl">Maybe Later</button>
                  <button onClick={() => { setShowGlobalPopup(false); navigate(activePopup.redirectUrl); }} className="flex-1 py-3.5 bg-[#c5a26f] text-black rounded-2xl font-semibold">Subscribe Now</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Modal - Login & Registration */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={() => setShowAuthModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#111] w-full max-w-md rounded-3xl p-8 border border-[#222]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold">{authMode === 'login' ? 'Welcome Back' : 'Create Account'}</h3>
                <button onClick={() => setShowAuthModal(false)}><X size={20} /></button>
              </div>

              {authMode === 'register' ? (
                // Registration Form
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;
                  const email = formData.get('email') as string;
                  const phone = formData.get('phone') as string;

                  if (!name || !email || !phone) return;

                  const newUser = registerUser(name, email, phone);
                  setCurrentUser(newUser);
                  setShowAuthModal(false);
                }} className="space-y-4">
                  <input name="name" type="text" placeholder="Full Name" className="w-full bg-[#1a1a1a] border border-[#333] px-5 py-3.5 rounded-2xl" required />
                  <input name="email" type="email" placeholder="Email Address" className="w-full bg-[#1a1a1a] border border-[#333] px-5 py-3.5 rounded-2xl" required />
                  <input name="phone" type="tel" placeholder="Mobile Number (+91)" className="w-full bg-[#1a1a1a] border border-[#333] px-5 py-3.5 rounded-2xl" required />
                  <button type="submit" className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-3xl mt-2">Create Account</button>
                </form>
              ) : (
                // Login Form
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const emailOrPhone = formData.get('emailOrPhone') as string;

                  // Simple login simulation
                  const savedUser = localStorage.getItem('reelramp_user');
                  if (savedUser) {
                    const user = JSON.parse(savedUser);
                    if (user.email === emailOrPhone || user.phone === emailOrPhone) {
                      setCurrentUser(user);
                      setShowAuthModal(false);
                    } else {
                      setAuthMode('register');
                    }
                  } else {
                    setAuthMode('register');
                  }
                }} className="space-y-4">
                  <input name="emailOrPhone" type="text" placeholder="Email or Mobile Number" className="w-full bg-[#1a1a1a] border border-[#333] px-5 py-3.5 rounded-2xl" required />
                  <input name="password" type="password" placeholder="Password" className="w-full bg-[#1a1a1a] border border-[#333] px-5 py-3.5 rounded-2xl" defaultValue="demo123" />
                  <button type="submit" className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-3xl mt-2">Login</button>
                </form>
              )}

              <div className="text-center mt-6">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-sm text-[#c5a26f]"
                >
                  {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Converting Trial Offer Popup (Dynamic from Admin) */}
      <AnimatePresence>
        {showTrialPopup && (() => {
          const subSettings = getSubscriptionSettings();
          if (!subSettings.showTrialPopup) return null;

          return (
            <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/60" onClick={() => setShowTrialPopup(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.35 }}
                className="relative w-full max-w-[380px] bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
                style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
              >
                {/* Close Button */}
                <button 
                  onClick={() => setShowTrialPopup(false)} 
                  className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center text-white/70 hover:text-white bg-black/40 rounded-full"
                >
                  <X size={18} />
                </button>

                {/* ReelRamp Pro Logo */}
                <div className="pt-8 pb-4 px-8 flex justify-center">
                  <div className="flex items-center gap-3">
                    <img 
                      src={REELRAMP_LOGO} 
                      alt="ReelRamp Pro" 
                      className="h-10 w-auto object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/40x40/c5a26f/0a0a0a?text=RR";
                      }}
                    />
                    <div>
                      <div className="text-white text-2xl font-semibold tracking-[-1px]">ReelRamp</div>
                      <div className="text-[#c5a26f] text-[10px] tracking-[2px] -mt-1 font-medium">PRO</div>
                    </div>
                  </div>
                </div>

                {/* Video Container - Admin Controlled Promo */}
                {(() => {
                  const ps = getPromoVideoSettings();
                  if (!ps.isEnabled) return null;
                  const src = ps.videoUrl.includes('embed')
                    ? ps.videoUrl
                    : `https://www.youtube.com/embed/${ps.videoUrl.includes('v=') ? ps.videoUrl.split('v=')[1]?.split('&')[0] : ps.videoUrl.split('/').pop()}`;
                  return (
                    <div className="mx-6 rounded-2xl overflow-hidden border border-white/20 mb-6 relative">
                      <div className="aspect-video bg-black">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`${src}?autoplay=1&mute=0&controls=1&modestbranding=1&rel=0`}
                          title="ReelRamp Pro - How it Works"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 text-[9px] px-2 py-0.5 rounded text-white/80">PROMO VIDEO</div>
                    </div>
                  );
                })()}

                {/* Pricing Content (Dynamic) */}
                <div className="px-8 pb-8 text-center">
                  <div className="mb-4">
                    <span className="inline-block px-5 py-1 bg-gradient-to-r from-[#c5a26f] via-[#d4b17f] to-[#c5a26f] text-[#0a0a0a] text-xs font-bold tracking-[3px] rounded-full mb-3">TRIAL OFFER</span>
                  </div>

                  <div className="text-6xl font-semibold tracking-[-3px] text-white mb-1">{subSettings.trialOfferPrice}</div>
                  <div className="text-xl text-[#c5a26f] font-medium tracking-tight">for {subSettings.trialOfferDuration}</div>

                  <p className="text-[#a1a1aa] text-sm mt-3 mb-6">Unlock full premium access instantly</p>

                  {/* Pay Button (Dynamic) */}
                  <button 
                    onClick={() => {
                      setShowTrialPopup(false);
                      localStorage.setItem('reelramp_subscribed', 'true');
                      localStorage.setItem('reelramp_trial_active', 'true');
                      window.location.reload();
                    }}
                    className="w-full py-4 bg-white text-[#0a0a0a] font-semibold text-lg tracking-wider rounded-3xl active:bg-[#c5a26f] active:text-white transition-all shadow-lg"
                  >
                    Pay {subSettings.trialOfferPrice} — Start Trial
                  </button>

                  <p className="text-[10px] text-[#888] mt-4 tracking-wide">
                    After {subSettings.trialOfferDuration}, auto-pay {subSettings.fullPrice} for {subSettings.fullValidity}. Cancel anytime.
                  </p>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// VideoCard Component
interface VideoCardProps {
  video: Video;
  isSubscribed: boolean;
  isSaved: boolean;
  onClick: () => void;
  onSave: (e: React.MouseEvent) => void;
}

function VideoCard({ video, isSubscribed, isSaved, onClick, onSave }: VideoCardProps) {
  return (
    <div 
      onClick={onClick}
      className="video-card group relative bg-[#1a1a1a] rounded-3xl overflow-hidden cursor-pointer border border-[#222] hover:border-[#c5a26f]/50"
    >
      <div className="relative aspect-[9/16] overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={video.title} 
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700" 
        />
        
        {/* Premium Badge */}
        {video.isPremium && (
          <div className="absolute top-3 right-3 bg-[#e11d48] text-[10px] px-3 py-px font-medium tracking-widest rounded-full flex items-center gap-1">
            <Lock size={10} /> PREMIUM
          </div>
        )}
        
        {/* Duration */}
        <div className="absolute bottom-3 left-3 bg-black/70 text-xs px-2.5 py-px rounded font-mono tracking-[1px]">
          {video.duration}
        </div>

        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="text-black ml-0.5" size={26} />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-semibold text-[15px] tracking-[-0.2px] line-clamp-1 pr-1">{video.title}</h4>
            <p className="text-xs text-[#a1a1aa] mt-1 line-clamp-2 leading-snug">{video.description}</p>
          </div>
          <button 
            onClick={onSave}
            className="mt-0.5 p-1.5 hover:bg-[#222] rounded-xl transition-colors"
          >
            <Bookmark 
              size={18} 
              className={isSaved ? "fill-[#c5a26f] text-[#c5a26f]" : "text-[#666]"} 
            />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="px-2.5 py-px bg-[#222] text-[#a1a1aa] rounded">{video.category}</span>
          
          {/* Rating Stars */}
          <div className="flex items-center gap-1 text-[#c5a26f]">
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={12} className={i <= Math.round(getAverageRating(video.id).average) ? "fill-current" : ""} />
              ))}
            </div>
            <span className="text-[#666] text-[10px] ml-0.5">{getAverageRating(video.id).average.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// PAYWALL COMPONENT - Monetization Gate
function PaywallModal({ video, onClose, onSubscribe }: { video: Video; onClose: () => void; onSubscribe: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ ease: [0.23, 1, 0.32, 1] }}
        className="paywall-modal bg-[#111] w-full max-w-md rounded-3xl overflow-hidden border border-[#333]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6">
            <Lock className="text-[#c5a26f]" size={32} />
          </div>
          
          <h3 className="text-3xl font-semibold tracking-tight mb-2">Premium Content</h3>
          <p className="text-[#a1a1aa] mb-7 text-[15px]">Unlock <span className="text-white font-medium">"{video.title}"</span> and all premium shorts with a ReelRamp subscription.</p>

          <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6 text-left text-sm">
            <div className="flex justify-between mb-1.5 text-[#a1a1aa]">
              <span>Duration</span><span className="font-mono text-white">{video.duration}</span>
            </div>
            <div className="flex justify-between mb-1.5 text-[#a1a1aa]">
              <span>Category</span><span className="text-white">{video.category}</span>
            </div>
            <div className="pt-4 border-t border-[#333] text-[#c5a26f] flex items-center gap-2 text-xs tracking-[1.5px]">EXCLUSIVE • INVESTIGATIVE • CINEMATIC</div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={onSubscribe}
              className="w-full py-4 bg-[#c5a26f] text-[#0a0a0a] rounded-2xl font-semibold text-base tracking-wider active:bg-[#d4b17f] transition-colors"
            >
              SUBSCRIBE TO UNLOCK
            </button>
            <button onClick={onClose} className="text-sm text-[#666] py-2">Maybe Later</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// SHORTS PLAYER PAGE - Vertical Swipe Feed with Premium Gate
function ShortsPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [library, setLibrary] = useState<number[]>([]);
  const [downloads, setDownloads] = useState<number[]>([]);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const youtubeRef = React.useRef<any>(null);
  const hideControlsTimeout = React.useRef<any>(null);
  const [userRating, setUserRating] = useState(0);
  const [localWatchHistory, setLocalWatchHistory] = useState<number[]>([]);

  const currentVideoId = parseInt(id || "1");
  const storedVideos = getStoredVideos();
  const currentVideo = storedVideos.find(v => v.id === currentVideoId) || storedVideos[0];
  
  // Get all videos for swipe feed
  const [feedVideos, setFeedVideos] = useState<Video[]>([]);

  useEffect(() => {
    setFeedVideos(getStoredVideos());
  }, []);

  useEffect(() => {
    const sub = localStorage.getItem('reelramp_subscribed') === 'true';
    setIsSubscribed(sub);

    const lib = localStorage.getItem('reelramp_library');
    if (lib) setLibrary(JSON.parse(lib));

    const dls = localStorage.getItem('reelramp_downloads');
    if (dls) setDownloads(JSON.parse(dls));

    // Set initial index to the selected video
    const startIdx = feedVideos.findIndex(v => v.id === currentVideoId);
    if (startIdx !== -1) setCurrentIndex(startIdx);

    // Track watch history + increment view count
    if (currentShort) {
      const history = JSON.parse(localStorage.getItem('reelramp_watch_history') || '[]');
      const newHistory = [currentShort.id, ...history.filter((id: number) => id !== currentShort.id)].slice(0, 20);
      localStorage.setItem('reelramp_watch_history', JSON.stringify(newHistory));
      incrementVideoView(currentShort.id);
    }
  }, [currentVideoId]);



  const currentShort = feedVideos[currentIndex] || getStoredVideos()[0];

  // Record Watch History
  const recordWatch = (videoId: number) => {
    const history = JSON.parse(localStorage.getItem('reelramp_watch_history') || '[]');
    const newEntry = { id: videoId, watchedAt: new Date().toISOString() };
    
    // Remove if already exists and add at the beginning
    const filtered = history.filter((item: any) => item.id !== videoId);
    const updated = [newEntry, ...filtered].slice(0, 20); // Keep last 20
    
    localStorage.setItem('reelramp_watch_history', JSON.stringify(updated));
  };

  // Track Watch History
  useEffect(() => {
    if (currentShort && !localWatchHistory.includes(currentShort.id)) {
      const newHistory = [currentShort.id, ...localWatchHistory].slice(0, 20);
      setLocalWatchHistory(newHistory);
      localStorage.setItem('reelramp_watch_history', JSON.stringify(newHistory));
    }
  }, [currentShort]);

  // Handle Premium Check
  const checkPremiumAccess = () => {
    if (currentShort.isPremium && !isSubscribed) {
      setShowPaywall(true);
      setIsPlaying(false);
      return false;
    }
    return true;
  };

  // Track Watch History
  React.useEffect(() => {
    if (currentShort?.id) {
      const history = JSON.parse(localStorage.getItem('reelramp_watch_history') || '[]');
      if (!history.includes(currentShort.id)) {
        const newHistory = [currentShort.id, ...history].slice(0, 20);
        localStorage.setItem('reelramp_watch_history', JSON.stringify(newHistory));
      }
    }
  }, [currentShort?.id]);

  // Vertical Swipe Handler using Framer Motion
  const handleDragEnd = (_: any, info: any) => {
    const threshold = 90;
    if (info.offset.y < -threshold && currentIndex < feedVideos.length - 1) {
      // Swipe UP to NEXT
      const nextIndex = currentIndex + 1;
      if (checkPremiumAccess()) {
        setCurrentIndex(nextIndex);
        setIsPlaying(true);
        setIsLiked(false);
      }
    } else if (info.offset.y > threshold && currentIndex > 0) {
      // Swipe DOWN to PREVIOUS
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setIsPlaying(true);
      setIsLiked(false);
    }
  };

  // Video Controls
  const togglePlay = () => {
    if (!checkPremiumAccess()) return;
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const toggleSave = () => {
    const newLib = library.includes(currentShort.id) 
      ? library.filter(id => id !== currentShort.id) 
      : [...library, currentShort.id];
    setLibrary(newLib);
    localStorage.setItem('reelramp_library', JSON.stringify(newLib));
  };

  const handleDownload = () => {
    if (!isSubscribed) {
      setShowPaywall(true);
      return;
    }
    if (!downloads.includes(currentShort.id)) {
      const newDownloads = [...downloads, currentShort.id];
      setDownloads(newDownloads);
      localStorage.setItem('reelramp_downloads', JSON.stringify(newDownloads));
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/player/${currentShort.id}`;
    if (navigator.share) {
      navigator.share({ title: currentShort.title, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const goToNext = () => {
    if (currentIndex < feedVideos.length - 1 && checkPremiumAccess()) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
      setIsLiked(false);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
      setIsLiked(false);
    }
  };

  // Auto play next on video end
  const handleVideoEnded = () => {
    addToWatchHistory(currentShort.id, 100);

    if (currentIndex < feedVideos.length - 1) {
      goToNext();
    } else {
      setIsPlaying(false);
    }
  };

  const addToWatchHistory = (videoId: number, progress: number) => {
    const history = getWatchHistory();
    const existingIndex = history.findIndex(h => h.videoId === videoId);
    const newItem: WatchHistoryItem = {
      videoId,
      watchedAt: new Date().toISOString(),
      progress
    };

    let updatedHistory;
    if (existingIndex !== -1) {
      updatedHistory = [...history];
      updatedHistory[existingIndex] = newItem;
    } else {
      updatedHistory = [newItem, ...history].slice(0, 20);
    }
    saveWatchHistory(updatedHistory);
  };

  // Double Tap to Seek (Kuku FM Style)
  const handleDoubleTap = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isRightSide = x > rect.width / 2;

    if (videoRef) {
      const newTime = isRightSide 
        ? Math.min(videoRef.duration, videoRef.currentTime + 10)
        : Math.max(0, videoRef.currentTime - 10);
      
      videoRef.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Show seek indicator
      const indicator = document.createElement('div');
      indicator.className = `absolute text-white text-xl font-bold px-4 py-1 rounded-full bg-black/60 flex items-center gap-1`;
      indicator.style.left = isRightSide ? '65%' : '35%';
      indicator.style.top = '45%';
      indicator.innerHTML = isRightSide ? `+10s <span class="text-[#c5a26f]">→</span>` : `<span class="text-[#c5a26f]">←</span> -10s`;
      const container = document.querySelector('.shorts-player');
      if (container) {
        container.appendChild(indicator);
        setTimeout(() => indicator.remove(), 800);
      }
    }
  };

  // Progress Bar Seeking
  const handleSeek = (e: React.MouseEvent) => {
    if (!videoRef) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * videoRef.duration;
    videoRef.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Auto hide controls
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (hideControlsTimeout.current) clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  // Playback Speed Control
  // Speed Control (kept for future)
  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef) {
      videoRef.playbackRate = speed;
    }
  };

  const closePaywall = () => setShowPaywall(false);

  const goSubscribe = () => {
    closePaywall();
    navigate('/subscription');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col shorts-player">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-5 pt-8 pb-2 bg-gradient-to-b from-black/70 to-transparent">
        <button onClick={() => navigate(-1)} className="p-3 bg-black/40 rounded-2xl backdrop-blur">
          <ArrowLeft size={22} />
        </button>
        <div className="text-xs tracking-[3px] text-white/70 font-medium">{currentShort.category.toUpperCase()} • {currentShort.duration}</div>
        <div className="text-sm px-3 py-1 bg-white/10 rounded-full font-mono">{currentIndex + 1} / {feedVideos.length}</div>
      </div>

      {/* Vertical Swipeable Video Container */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="relative w-full max-w-[420px] h-full md:h-[92vh] flex flex-col"
            drag="y"
            dragConstraints={{ top: -120, bottom: 120 }}
            onDragEnd={handleDragEnd}
            dragElastic={0.2}
            onClick={showControlsTemporarily}
            onDoubleClick={handleDoubleTap}
          >
            {/* Professional Smart Video Player */}
            <div className="relative flex-1 bg-black overflow-hidden rounded-none md:rounded-3xl shadow-2xl">
              <SmartVideoPlayer 
                video={currentShort} 
                isPlaying={isPlaying} 
                onPlayPause={togglePlay} 
                onEnded={handleVideoEnded}
              />

              {/* Ultra Thin Progress Bar (Kuku FM Style) */}
              <div 
                className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 cursor-pointer z-50"
                onClick={handleSeek}
                onMouseMove={handleSeek}
              >
                <div 
                  className="h-full bg-[#c5a26f] transition-all duration-75"
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* Play/Pause Center Button Overlay (for direct videos) */}
              {currentShort.source === 'direct' && !isPlaying && (
                <div onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                    <Play size={38} className="text-black ml-1" />
                  </div>
                </div>
              )}

              {/* Video Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20">
                <div className="max-w-[380px]">
                  <h2 className="text-3xl font-semibold tracking-[-1.2px] leading-none mb-1.5">{currentShort.title}</h2>
                  <p className="text-sm text-white/70 leading-snug line-clamp-3 pr-16">{currentShort.description}</p>

                  {/* Rating System */}
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button 
                          key={star} 
                          onClick={() => {
                            setUserRating(star);
                            // Save rating (can be expanded later)
                            const ratings = JSON.parse(localStorage.getItem('reelramp_ratings') || '{}');
                            ratings[currentShort.id] = star;
                            localStorage.setItem('reelramp_ratings', JSON.stringify(ratings));
                          }}
                          className="text-2xl transition"
                        >
                          {star <= userRating ? '★' : '☆'}
                        </button>
                      ))}
                    </div>
                    <span className="text-xs text-white/60">Rate this short</span>
                  </div>
                </div>
              </div>

              {/* Swipe Indicator */}
              <div className="absolute top-1/2 right-5 -translate-y-1/2 text-white/30 text-xs tracking-[3px] rotate-90 hidden md:block">SWIPE UP FOR NEXT</div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Right Side Action Bar - Reels Style (KukuTV/Moj Style) */}
        <div className="absolute right-4 bottom-[110px] flex flex-col items-center gap-5 z-50 text-center">
          <button onClick={toggleLike} className="flex flex-col items-center gap-1 active:scale-95 transition">
            <div className={`p-4 rounded-2xl transition ${isLiked ? 'bg-[#e11d48]' : 'bg-black/60 backdrop-blur'}`}>
              <Heart size={24} className={isLiked ? "fill-white text-white" : ""} />
            </div>
            <span className="text-[10px] tracking-wider">LIKE</span>
          </button>

          {/* Speed Control */}
          <div className="relative">
            <button onClick={() => {}} className="flex flex-col items-center gap-1 active:scale-95 transition">
              <div className="p-4 rounded-2xl bg-black/60 backdrop-blur">
                <Clock size={24} />
              </div>
              <span className="text-[10px] tracking-wider">{playbackSpeed}x</span>
            </button>
          </div>

          {/* Quality (Placeholder) */}
          <div className="relative">
            <button onClick={() => {}} className="flex flex-col items-center gap-1 active:scale-95 transition">
              <div className="p-4 rounded-2xl bg-black/60 backdrop-blur text-xs font-mono">
                1080p
              </div>
            </button>
          </div>

          <button onClick={toggleSave} className="flex flex-col items-center gap-1 active:scale-95 transition">
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur">
              <Bookmark size={24} className={library.includes(currentShort.id) ? "fill-[#c5a26f] text-[#c5a26f]" : ""} />
            </div>
            <span className="text-[10px] tracking-wider">SAVE</span>
          </button>

          <button onClick={handleDownload} className="flex flex-col items-center gap-1 active:scale-95 transition">
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur">
              <Download size={24} />
            </div>
            <span className="text-[10px] tracking-wider">DOWNLOAD</span>
          </button>

          <button onClick={handleShare} className="flex flex-col items-center gap-1 active:scale-95 transition">
            <div className="p-4 rounded-2xl bg-black/60 backdrop-blur">
              <Share2 size={24} />
            </div>
            <span className="text-[10px] tracking-wider">SHARE</span>
          </button>

          {/* Rating */}
          <div className="flex flex-col items-center gap-1 mt-2">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(star => (
                <button 
                  key={star} 
                  onClick={() => {
                    const current = getUserRatings()[currentShort.id]?.rating || 0;
                    const newRating = star === current ? 0 : star;
                    saveUserRating(currentShort.id, newRating);
                  }}
                  className="p-1"
                >
                  <Star 
                    size={18} 
                    className={star <= (getUserRatings()[currentShort.id]?.rating || 0) ? "fill-[#c5a26f] text-[#c5a26f]" : "text-[#666]"} 
                  />
                </button>
              ))}
            </div>
            <span className="text-[9px] text-[#666]">RATE</span>
          </div>

          {/* Rating Stars */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-1 bg-black/60 backdrop-blur p-2 rounded-2xl">
              {[1,2,3,4,5].map(star => (
                <button key={star} onClick={() => {
                  const ratings = JSON.parse(localStorage.getItem('reelramp_ratings') || '{}');
                  ratings[currentShort.id] = star;
                  localStorage.setItem('reelramp_ratings', JSON.stringify(ratings));
                  alert(`Thank you! Rated ${star} stars`);
                }}>
                  <Star size={18} className="text-[#c5a26f]" />
                </button>
              ))}
            </div>
            <span className="text-[10px] tracking-wider">RATE</span>
          </div>

          {/* Premium Lock Indicator */}
          {currentShort.isPremium && !isSubscribed && (
            <button onClick={() => setShowPaywall(true)} className="mt-2 flex flex-col items-center">
              <div className="p-3.5 bg-[#e11d48] rounded-2xl"><Lock size={22} /></div>
              <span className="text-[9px] mt-1 text-[#e11d48] font-medium">SUBSCRIBE</span>
            </button>
          )}
        </div>

        {/* Bottom Player Controls */}
        <div className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-8 player-controls pt-8">
          <div className="flex items-center justify-between max-w-[420px] mx-auto">
            <button onClick={goToPrev} disabled={currentIndex === 0} className="p-4 disabled:opacity-30">
              <ArrowLeft size={22} />
            </button>
            
            <button onClick={togglePlay} className="p-4 bg-white/10 hover:bg-white/20 transition rounded-2xl backdrop-blur-lg">
              {isPlaying ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
            </button>
            
            <button onClick={goToNext} disabled={currentIndex === feedVideos.length - 1} className="p-4 disabled:opacity-30">
              NEXT
            </button>
          </div>
        </div>
      </div>

      {/* Paywall Modal in Player */}
      <AnimatePresence>
        {showPaywall && (
          <PaywallModal 
            video={currentShort} 
            onClose={closePaywall} 
            onSubscribe={goSubscribe} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// SUBSCRIPTION PAGE - Admin Settings Driven
function SubscriptionPage() {
  const navigate = useNavigate();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showAuthWall, setShowAuthWall] = useState(false);
  const [awMode, setAwMode] = useState<'login' | 'register'>('login');
  const [awName, setAwName] = useState('');
  const [awEmail, setAwEmail] = useState('');
  const [awPass, setAwPass] = useState('');
  const [awError, setAwError] = useState('');
  const [pendingAction, setPendingAction] = useState<'trial' | 'full' | null>(null);

  const subSettings = getSubscriptionSettings();
  const paymentConfig = getPaymentSettings();

  useEffect(() => {
    setIsSubscribed(localStorage.getItem('reelramp_subscribed') === 'true');
  }, []);

  const activateSubscription = () => {
    localStorage.setItem('reelramp_subscribed', 'true');
    localStorage.setItem('reelramp_pro_status', 'true');
    setIsSubscribed(true);
    setPaymentProcessing(false);
    setShowPaymentModal(false);
    setShowTrialModal(false);
    setPaymentSuccess(true);
  };

  const processPayment = () => {
    setPaymentProcessing(true);
    setTimeout(activateSubscription, 1800);
  };

  const confirmCancel = () => {
    localStorage.removeItem('reelramp_subscribed');
    localStorage.removeItem('reelramp_pro_status');
    setIsSubscribed(false);
    setShowCancelConfirm(false);
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

      {/* Active Subscription Banner */}
      {isSubscribed && (
        <div className="mb-6 p-5 bg-[#1a1a1a] border border-[#c5a26f] rounded-3xl">
          <div className="flex items-center gap-2 text-[#c5a26f] mb-1"><CheckCircle size={18} /> ACTIVE SUBSCRIPTION</div>
          <div className="text-sm text-white">Thank you for supporting ReelRamp Shorts</div>
          <button onClick={() => setShowCancelConfirm(true)} className="text-xs text-[#666] underline mt-3">Cancel Subscription</button>
        </div>
      )}

      {/* Trial Plan Card */}
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
          <button onClick={() => { if (!isLoggedIn()) { setPendingAction('trial'); setShowAuthWall(true); } else { setShowTrialModal(true); } }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider active:bg-[#d4b17f] transition">
            Start {subSettings.trialOfferDuration} Trial — {subSettings.trialOfferPrice}
          </button>
        </div>
      )}

      {/* Full Plan Card */}
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
          <button onClick={() => { if (!isLoggedIn()) { setPendingAction('full'); setShowAuthWall(true); } else { setShowPaymentModal(true); } }} className="w-full py-4 bg-white text-black font-semibold rounded-2xl tracking-wider active:bg-[#c5a26f] transition">
            Subscribe — {subSettings.fullPrice}
          </button>
        </div>
      )}

      <p className="text-center text-xs text-[#444] tracking-widest">
        SECURE PAYMENTS • {(paymentConfig.activeGateway && paymentConfig.activeGateway !== 'none') ? paymentConfig.activeGateway.toUpperCase() : 'MANUAL'} • CANCEL ANYTIME
      </p>

      {/* Full Plan Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-5" onClick={() => !paymentProcessing && setShowPaymentModal(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#111] w-full max-w-md rounded-3xl p-8 border border-[#222]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-2xl tracking-tight">Order Summary</h3>
                {!paymentProcessing && <button onClick={() => setShowPaymentModal(false)}><X size={20} /></button>}
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6">
                <div className="flex justify-between text-sm text-[#a1a1aa] mb-2">
                  <span>ReelRamp Premium</span><span>{subSettings.fullPrice}</span>
                </div>
                <div className="flex justify-between text-sm text-[#a1a1aa] mb-3">
                  <span>Validity</span><span>{subSettings.fullValidity}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-[#333] pt-3">
                  <span>Total</span><span className="text-[#c5a26f]">{subSettings.fullPrice}</span>
                </div>
              </div>

              <div className="text-xs text-[#666] text-center mb-6">
                Payment via {(paymentConfig.activeGateway && paymentConfig.activeGateway !== 'none') ? paymentConfig.activeGateway.charAt(0).toUpperCase() + paymentConfig.activeGateway.slice(1) : 'Manual Payment'} • {paymentConfig.isLiveMode ? 'Live' : 'Test'} Mode
              </div>

              <button
                onClick={processPayment}
                disabled={paymentProcessing}
                className="w-full py-4 rounded-2xl bg-[#c5a26f] text-black text-lg font-semibold tracking-wide disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {paymentProcessing ? (
                  <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Processing...</>
                ) : (
                  `Pay ${subSettings.fullPrice}`
                )}
              </button>
              <p className="text-center mt-3 text-xs text-[#555]">Secure & encrypted payment</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trial Payment Modal */}
      <AnimatePresence>
        {showTrialModal && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-5" onClick={() => !paymentProcessing && setShowTrialModal(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#111] w-full max-w-md rounded-3xl p-8 border border-[#c5a26f]/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-semibold text-2xl tracking-tight">Trial Order</h3>
                {!paymentProcessing && <button onClick={() => setShowTrialModal(false)}><X size={20} /></button>}
              </div>

              <div className="bg-[#1a1a1a] rounded-2xl p-5 mb-6">
                <div className="flex justify-between text-sm text-[#a1a1aa] mb-2">
                  <span>Trial Access</span><span>{subSettings.trialOfferPrice}</span>
                </div>
                <div className="flex justify-between text-sm text-[#a1a1aa] mb-3">
                  <span>Duration</span><span>{subSettings.trialOfferDuration}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-[#333] pt-3">
                  <span>Total Today</span><span className="text-[#c5a26f]">{subSettings.trialOfferPrice}</span>
                </div>
                <div className="text-xs text-[#666] mt-2">After trial: {subSettings.fullPrice} / {subSettings.fullValidity}</div>
              </div>

              <button
                onClick={processPayment}
                disabled={paymentProcessing}
                className="w-full py-4 rounded-2xl bg-[#c5a26f] text-black text-lg font-semibold tracking-wide disabled:opacity-70 flex items-center justify-center gap-3"
              >
                {paymentProcessing ? (
                  <><span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Processing...</>
                ) : (
                  `Pay ${subSettings.trialOfferPrice} — Start Trial`
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Auth Wall Modal — Login Required Before Subscribing */}
      <AnimatePresence>
        {showAuthWall && (
          <div className="fixed inset-0 z-[75] bg-black/90 flex items-center justify-center p-5" onClick={() => setShowAuthWall(false)}>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#111] w-full max-w-md rounded-3xl p-8 border border-[#c5a26f]/30"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-2xl tracking-tight">Sign in to Subscribe</h3>
                <button onClick={() => setShowAuthWall(false)}><X size={20} /></button>
              </div>
              <p className="text-[#a1a1aa] text-sm mb-6">Create an account or login to access premium content.</p>

              <div className="flex bg-[#1a1a1a] rounded-2xl p-1 mb-5">
                <button onClick={() => setAwMode('login')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${awMode === 'login' ? 'bg-[#c5a26f] text-black' : 'text-[#666]'}`}>Login</button>
                <button onClick={() => setAwMode('register')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${awMode === 'register' ? 'bg-[#c5a26f] text-black' : 'text-[#666]'}`}>Register</button>
              </div>

              <div className="space-y-3 mb-4">
                {awMode === 'register' && (
                  <input type="text" value={awName} onChange={e => setAwName(e.target.value)} placeholder="Full Name" className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none" />
                )}
                <input type="email" value={awEmail} onChange={e => setAwEmail(e.target.value)} placeholder="Email address" className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none" />
                <input type="password" value={awPass} onChange={e => setAwPass(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') (document.querySelector('[data-aw-submit]') as HTMLElement)?.click(); }} placeholder="Password" className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-3.5 px-5 text-sm focus:border-[#c5a26f] outline-none" />
                {awError && <p className="text-[#e11d48] text-xs px-1">{awError}</p>}
              </div>

              <button
                data-aw-submit
                onClick={() => {
                  setAwError('');
                  if (!awEmail.trim() || !awPass.trim()) { setAwError('Please fill all fields'); return; }
                  if (awMode === 'register' && !awName.trim()) { setAwError('Please enter your name'); return; }
                  try {
                    if (awMode === 'register') {
                      registerUser({ name: awName, email: awEmail, password: awPass, phone: '' });
                    } else {
                      const users: UserProfile[] = JSON.parse(localStorage.getItem('reelramp_users') || '[]');
                      const found = users.find((u: any) => u.email === awEmail && u.password === awPass);
                      if (!found) { setAwError('Invalid email or password'); return; }
                      loginUser({ name: found.name, email: found.email, password: found.password || '', phone: found.phone || '' });
                    }
                    setShowAuthWall(false);
                    if (pendingAction === 'trial') setShowTrialModal(true);
                    else if (pendingAction === 'full') setShowPaymentModal(true);
                    setPendingAction(null);
                  } catch {
                    setAwError('Something went wrong. Try again.');
                  }
                }}
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider"
              >
                {awMode === 'login' ? 'Login & Continue' : 'Register & Continue'}
              </button>
              <p className="text-center text-xs text-[#555] mt-4">Your data is safe and encrypted.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Confirm Modal */}
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
              <p className="text-[#a1a1aa] text-sm mb-7">You'll lose access to all premium content. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 border border-[#333] rounded-2xl text-sm">Keep Premium</button>
                <button onClick={confirmCancel} className="flex-1 py-3 bg-[#e11d48] rounded-2xl text-sm font-medium">Yes, Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// PROFILE PAGE - Library, Downloads, Subscription Status
function ProfilePage() {
  const navigate = useNavigate();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [user, setUser] = useState<UserProfile>({ name: "Alex Rivera", avatar: "/images/life1.jpg", email: "", phone: "" });
  const [library, setLibrary] = useState<Video[]>([]);
  const [downloads, setDownloads] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<'library' | 'downloads' | 'account'>('library');

  // Simulate current user (Firebase Auth simulation)
  const currentUser = {
    uid: localStorage.getItem('current_user_uid') || "user-001",
    email: "alex.rivera@reelramp.app"
  };

  // Security: Only show Admin buttons if UID matches Admin UID
  const isAdmin = currentUser.uid === "admin-uid-001";

  useEffect(() => {
    const sub = localStorage.getItem('reelramp_subscribed') === 'true';
    setIsSubscribed(sub);

   // Load saved library safely without crashing
    let libIds: number[] = [];
    let dlIds: number[] = [];
    try {
      libIds = JSON.parse(localStorage.getItem('reelramp_library') || '[]');
      dlIds = JSON.parse(localStorage.getItem('reelramp_downloads') || '[]');
    } catch (e) {
      libIds = [];
      dlIds = [];
    }
    const storedVids = typeof getStoredVideos === 'function' ? getStoredVideos() : [];
    if (Array.isArray(storedVids)) {
      setLibrary(storedVids.filter(v => Array.isArray(libIds) && libIds.includes(v.id)));
      setDownloads(storedVids.filter(v => Array.isArray(dlIds) && dlIds.includes(v.id)));
    }

    // Load downloads
    const dlIds: number[] = JSON.parse(localStorage.getItem('reelramp_downloads') || '[]');
    setDownloads(storedVids.filter(v => dlIds.includes(v.id)));
  }, []);

  const updateName = (newName: string) => {
    const updated = { ...user, name: newName };
    setUser(updated);
    localStorage.setItem('reelramp_user', JSON.stringify(updated));
  };

  const removeFromLibrary = (id: number) => {
    const updated = library.filter(v => v.id !== id);
    setLibrary(updated);
    const ids = updated.map(v => v.id);
    localStorage.setItem('reelramp_library', JSON.stringify(ids));
  };

  const removeDownload = (id: number) => {
    const updated = downloads.filter(v => v.id !== id);
    setDownloads(updated);
    const ids = updated.map(v => v.id);
    localStorage.setItem('reelramp_downloads', JSON.stringify(ids));
  };

  const playOffline = (video: Video) => {
    // Simulate offline play: Navigate to player (videoUrl works online but offline sim)
    navigate(`/player/${video.id}`);
  };



  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 pt-8 md:pt-10 overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-semibold text-3xl md:text-5xl tracking-[-2px]">Profile</h1>
        <button onClick={() => navigate('/')} className="text-sm text-[#a1a1aa]">Home</button>
      </div>

      {/* Profile Header */}
      <div className="flex items-center gap-5 mb-9 border-b border-[#222] pb-8">
        <div className="w-20 h-20 rounded-2xl overflow-hidden ring-1 ring-[#c5a26f]/50 bg-[#222] flex items-center justify-center">
          {(() => {
            const savedUser = localStorage.getItem('reelramp_user');
            const user = savedUser ? JSON.parse(savedUser) : null;
            return user ? (
              <div className="text-4xl font-bold text-[#c5a26f]">{user.name[0]}</div>
            ) : (
              <User size={36} className="text-[#666]" />
            );
          })()}
        </div>
        <div className="flex-1">
          {(() => {
            const savedUser = localStorage.getItem('reelramp_user');
            const user = savedUser ? JSON.parse(savedUser) : null;
            return user ? (
              <>
                <div className="text-3xl font-semibold tracking-tight">{user.name}</div>
                <div className="text-sm text-[#a1a1aa]">{user.email} • {user.phone}</div>
                <button 
                  onClick={() => {
                    localStorage.removeItem('reelramp_user');
                    window.location.reload();
                  }}
                  className="text-xs text-[#e11d48] mt-1"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => navigate('/')}
                className="px-8 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium"
              >
                Login / Register
              </button>
            );
          })()}
        </div>
      </div>

      {/* Subscription Status - Fixed Mobile Layout */}
      <div className="mb-8 bg-[#111] border border-[#222] rounded-3xl p-6 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="uppercase text-xs tracking-[2.5px] text-[#a1a1aa]">SUBSCRIPTION</div>
            <div className="font-semibold text-2xl md:text-3xl tracking-tight mt-1">{isSubscribed ? "Premium Active" : "Free Plan"}</div>
          </div>
          
          {isSubscribed ? (
            <div className="text-left md:text-right">
              <div className="text-[#22c55e] text-sm flex items-center gap-1.5"><CheckCircle size={16}/> ACTIVE</div>
              <button onClick={() => navigate('/subscription')} className="text-sm underline text-[#666] mt-1">Manage Subscription</button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/subscription')} 
              className="w-full md:w-auto px-8 py-3.5 bg-[#c5a26f] text-black text-sm font-semibold rounded-2xl active:bg-white transition-all"
            >
              UPGRADE TO PREMIUM
            </button>
          )}
        </div>
      </div>

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

      {/* Library Tab */}
      {activeTab === 'library' && (
        <div>
          {library.length === 0 ? (
            <div className="py-14 text-center text-[#666]">No saved shorts yet. Start saving from the home feed.</div>
          ) : (
            <div className="space-y-4">
              {library.map(video => (
                <div key={video.id} className="flex gap-3 bg-[#111] p-3 rounded-2xl border border-[#222]">
                  <img src={video.thumbnail} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl" alt="" />
                  <div className="flex-1 pt-0.5">
                    <div className="font-medium tracking-tight text-sm md:text-base line-clamp-1">{video.title}</div>
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

      {/* Downloads Tab - Offline Simulation */}
      {activeTab === 'downloads' && (
        <div>
          <div className="text-[#a1a1aa] text-sm mb-4">Offline viewing enabled. Premium members can download shorts.</div>
          {downloads.length === 0 ? (
            <div className="text-center py-14 text-[#666]">No offline downloads. Download premium shorts from the player.</div>
          ) : (
            <div className="space-y-4">
              {downloads.map(video => (
                <div key={video.id} className="flex gap-3 bg-[#111] p-3 rounded-2xl border border-[#222]">
                  <img src={video.thumbnail} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl" alt="" />
                  <div className="flex-1 pt-0.5">
                    <div className="font-medium tracking-tight text-sm md:text-base flex items-center gap-2 line-clamp-1">{video.title} <span className="text-[#22c55e] text-[10px] px-1.5 py-px bg-[#0a0a0a] rounded">OFFLINE</span></div>
                    <div className="text-xs text-[#666] mt-0.5">{video.duration}</div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <button onClick={() => playOffline(video)} className="flex items-center gap-1 text-[#22c55e]">PLAY OFFLINE <Play size={13} /></button>
                      <button onClick={() => removeDownload(video.id)} className="text-[#666]">DELETE</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6 pt-1 text-sm">
          <div className="p-6 bg-[#111] rounded-3xl border border-[#222]">
            <div className="font-medium mb-4">Account Settings</div>
            <div className="flex justify-between py-4 border-t border-[#222]">
              <div>Email</div><div className="text-[#a1a1aa]">alex.rivera@reelramp.app</div>
            </div>
            <div className="flex justify-between py-4 border-t border-[#222]">
              <div>Member Since</div><div className="text-[#a1a1aa]">March 2024</div>
            </div>
          </div>
          <button 
            onClick={() => {
              if (confirm("Are you sure you want to reset all your data and sign out? This action cannot be undone.")) {
                localStorage.clear();
                window.location.reload();
              }
            }} 
            className="text-[#e11d48] text-xs tracking-widest hover:underline"
          >
            RESET ALL DATA &amp; SIGN OUT
          </button>
        </div>
      )}
    </div>
  );
}

// ==================== LEGAL PAGES (Razorpay & Play Store Compliance) ====================
function LegalPage({ type }: { type: 'privacy' | 'terms' | 'refund' | 'shipping' }) {
  const navigate = useNavigate();
  const titles: Record<string, string> = {
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    refund: "Cancellation & Refund Policy",
    shipping: "Shipping & Delivery Policy"
  };
  const contents: Record<string, string> = {
    privacy: `At ReelRamp Shorts, we respect your privacy. This policy explains how we collect, use, and protect your personal information when you use our premium OTT platform.

1. Information We Collect: We collect your name, email, phone number, and payment details solely for account management and subscription services.

2. How We Use Information: To provide access to premium content, process payments via Razorpay, send updates, and improve the service.

3. Data Security: All data is encrypted. We never share personal information with third parties except for payment processing.

4. Cookies & Tracking: We use minimal cookies for a seamless experience.

5. Contact: reelramporiginal@gmail.com | +91 7307493338

Last Updated: May 2025`,

    terms: `Welcome to ReelRamp Shorts. By accessing or using our platform, you agree to these Terms & Conditions.

1. Subscription: Premium access is granted upon successful payment. Subscriptions are auto-renewing unless cancelled.

2. Content: All short films are proprietary. Unauthorized distribution is prohibited.

3. User Conduct: Respectful usage is expected. Accounts may be suspended for violations.

4. Payment: All payments are processed securely via Razorpay.

5. Limitation of Liability: ReelRamp is not liable for any indirect damages.

6. Governing Law: Laws of India apply. Disputes resolved in Lucknow courts.

For queries: reelramporiginal@gmail.com`,

    refund: `Cancellation & Refund Policy

1. You may cancel your subscription anytime from the Profile page. Cancellation takes effect at the end of the current billing period.

2. Refunds: Full refunds are available within 7 days of purchase if you have not watched more than 2 premium shorts. After this period, no refunds will be issued.

3. How to Request: Email reelramporiginal@gmail.com with your transaction ID. Refunds (if approved) are processed within 5-7 business days to the original payment method.

4. Partial Refunds: Not applicable for monthly or annual plans once content has been accessed significantly.

This policy ensures compliance with Razorpay and consumer protection laws.`,

    shipping: `Shipping & Delivery Policy (Digital Products)

ReelRamp Shorts is a digital subscription service. There is no physical shipping involved.

1. Instant Access: Upon successful payment confirmation via Razorpay, your Premium subscription is activated immediately. You will receive instant access to all premium shorts.

2. Delivery Confirmation: A confirmation email/SMS is sent to your registered contact details within seconds.

3. No Physical Goods: This policy is applicable for digital access only.

4. Support: For any delivery issues, contact +91 7307493338 or reelramporiginal@gmail.com.

Office Address: FF Shop No. 6, Arohi Arcade, Munshipulia, Lucknow - 226016, Uttar Pradesh, India.`
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 pb-28">
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-5xl font-semibold tracking-[-2px] mb-3">{titles[type]}</h1>
      <div className="text-xs uppercase tracking-[3px] text-[#c5a26f] mb-8">REELRAMP ORIGINALS • LAST UPDATED MAY 2025</div>
      
      <div className="prose prose-invert text-[#ccc] whitespace-pre-line leading-relaxed text-[15px]">
        {contents[type]}
      </div>

      <div className="mt-12 text-xs border-t border-[#222] pt-8 text-[#666]">
        Office: FF Shop No. 6, Arohi Arcade, Munshipulia, Lucknow - 226016<br />
        Support: reelramporiginal@gmail.com | +91 7307493338
      </div>
    </div>
  );
}

// ==================== EDITOR PANEL (Limited Access) ====================
function EditorPanel() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const EDITOR_PASSWORD = "editor@2025";

  const handleLogin = () => {
    if (password === EDITOR_PASSWORD) {
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Invalid Editor Password");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5">
        <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-3xl p-9">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-[#c5a26f] rounded-2xl flex items-center justify-center mb-4">
              <Edit2 className="text-black" size={28} />
            </div>
            <h1 className="text-3xl font-semibold">Editor Access</h1>
            <p className="text-[#666] mt-1 text-sm">Limited Content Management</p>
          </div>

          <div className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter Editor Password" 
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f]" 
            />
            {error && <p className="text-[#e11d48] text-sm text-center">{error}</p>}
          </div>

          <button onClick={handleLogin} className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold">LOGIN AS EDITOR</button>
          
          <div className="text-center mt-6">
            <button onClick={() => navigate('/')} className="text-xs text-[#666]">Back to App</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#c5a26f] rounded-xl flex items-center justify-center">
              <Edit2 className="text-black" size={18} />
            </div>
            <div>
              <div className="font-semibold">ReelRamp • Editor Studio</div>
              <div className="text-[10px] text-[#666]">Limited Access</div>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-sm px-4 py-2 bg-[#222] rounded-2xl">Exit Editor</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="mb-8">
          <h2 className="text-4xl font-semibold tracking-tight">Content Management</h2>
          <p className="text-[#a1a1aa]">Manage videos, popups and trial offers</p>
        </div>

        {/* Limited Tabs for Editor */}
        <div className="flex gap-2 mb-8 border-b border-[#222] pb-1 text-sm">
          <div className="px-6 py-3 border-b-2 border-[#c5a26f] text-white font-medium">Manage Content</div>
          <div className="px-6 py-3 text-[#666]">Popup Ads</div>
          <div className="px-6 py-3 text-[#666]">Plan Settings</div>
        </div>

        <div className="text-[#a1a1aa] text-sm">Editor access is limited to Content, Popups and Plan Settings only.</div>
        
        {/* Mini Content Manager for Editor */}
        <div className="mt-8 bg-[#111] rounded-3xl p-8 border border-[#222]">
          <p className="text-lg">You have access to manage shorts and trial offers.</p>
          <p className="text-sm text-[#666] mt-2">Full admin features are available only to Owner.</p>
        </div>
      </div>
    </div>
  );
}

// ==================== OWNER PANEL (Full Access) ====================
function OwnerPanel() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const OWNER_PASSWORD = "owner@reelramp2025";

  const handleLogin = () => {
    if (password === OWNER_PASSWORD) {
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Invalid Owner Password");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5">
        <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-3xl p-9">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 bg-gradient-to-br from-[#c5a26f] to-[#d4b17f] rounded-2xl flex items-center justify-center mb-4">
              <Settings className="text-black" size={28} />
            </div>
            <h1 className="text-3xl font-semibold">Owner Access</h1>
            <p className="text-[#666] mt-1 text-sm">Full Control Panel</p>
          </div>

          <div className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Enter Owner Password" 
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f]" 
            />
            {error && <p className="text-[#e11d48] text-sm text-center">{error}</p>}
          </div>

          <button onClick={handleLogin} className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold">LOGIN AS OWNER</button>
          
          <div className="text-center mt-6">
            <button onClick={() => navigate('/')} className="text-xs text-[#666]">Back to App</button>
          </div>
        </div>
      </div>
    );
  }

  // Full Owner Panel (existing Admin features)
  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#c5a26f] to-[#d4b17f] rounded-xl flex items-center justify-center">
              <Settings className="text-black" size={18} />
            </div>
            <div>
              <div className="font-semibold">ReelRamp • Owner Studio</div>
              <div className="text-[10px] text-[#c5a26f]">Full Access</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/admin-secure-7842')} className="text-sm px-4 py-2 bg-[#222] rounded-2xl">Switch to Editor</button>
            <button onClick={() => navigate('/')} className="text-sm px-4 py-2 bg-[#e11d48] rounded-2xl">Exit</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        <div className="mb-8">
          <h2 className="text-5xl font-semibold tracking-tight">Owner Control Center</h2>
          <p className="text-[#a1a1aa]">Complete access to all settings, users, and revenue</p>
        </div>

        {/* Full Admin Features */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#111] border border-[#222] rounded-3xl p-8">
            <div className="font-medium mb-4">Quick Actions</div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-[#222]">
                <span>Manage All Shorts</span> 
                <button onClick={() => navigate('/admin')} className="text-[#c5a26f]">Open</button>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#222]">
                <span>Subscription Plans</span> 
                <button onClick={() => navigate('/admin')} className="text-[#c5a26f]">Open</button>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-[#222]">
                <span>User Management</span> 
                <button onClick={() => navigate('/admin')} className="text-[#c5a26f]">Open</button>
              </div>
              <div className="flex justify-between items-center py-2">
                <span>Revenue & Analytics</span> 
                <button onClick={() => navigate('/admin')} className="text-[#c5a26f]">Open</button>
              </div>
            </div>
          </div>

          <div className="bg-[#111] border border-[#222] rounded-3xl p-8">
            <div className="text-[#e11d48] font-medium mb-4">Owner Only</div>
            <div className="text-sm text-[#a1a1aa]">
              You have access to all features including User data, Revenue, Platform configuration, and full control over the Trial Offer.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== OLD ADMIN PANEL (kept for reference) ====================
function AdminPage({ isOwnerRoute = false }: { isOwnerRoute?: boolean }) {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [adminVideos, setAdminVideos] = useState<Video[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [popups, setPopups] = useState<PopupAd[]>([]);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(defaultSettings);
  const [subscriptionSettings, setSubscriptionSettings] = useState<SubscriptionSettings>(defaultSubscriptionSettings);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPaymentSettings);
  const [adminCategories, setAdminCategories] = useState<string[]>(defaultCategories);
  const [storageSettings, setStorageSettings] = useState<StorageSettings>(defaultStorageSettings);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'users' | 'analytics' | 'popups' | 'settings' | 'plans' | 'categories' | 'payment' | 'storage' | 'firebase' | 'promo'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggedInAdmin, setLoggedInAdmin] = useState("");
  const [editingPopup, setEditingPopup] = useState<PopupAd | null>(null);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseAppConfig>(defaultFirebaseConfig);
  const [promoSettings, setPromoSettings] = useState<PromoVideoSettings>(defaultPromoVideo);
  const [videoViews, setVideoViews] = useState<Record<number, number>>({});
  const [adminSaveMsg, setAdminSaveMsg] = useState('');
  const [jsonImportError, setJsonImportError] = useState('');

  const showAdminToast = (msg: string) => {
    setAdminSaveMsg(msg);
    setTimeout(() => setAdminSaveMsg(''), 3000);
  };

  // Form state for Add/Edit Video
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Horror', duration: '4:30', 
    isPremium: true, thumbnail: '', videoUrl: ''
  });

  // Load persisted data
  useEffect(() => {
    setAdminVideos(getStoredVideos());
    const savedUsers = localStorage.getItem('reelramp_admin_users');
    if (savedUsers) setAdminUsers(JSON.parse(savedUsers));
    setPopups(getStoredPopups());
    setPlatformSettings(getStoredSettings());
    setSubscriptionSettings(getSubscriptionSettings());
    setPaymentSettings(getPaymentSettings());
    setAdminCategories(getCategories());
    setStorageSettings(getStorageSettings());
    setFirebaseConfig(getFirebaseAppConfig());
    setPromoSettings(getPromoVideoSettings());
    setVideoViews(getVideoViews());
  }, []);

  // Enhanced Admin Security (Firebase Auth Simulation)
  const handleAdminLogin = () => {
    const allowedAdmins = [
      { email: "admin@reelramp.com", password: "reelramp-pro-2025" },
      { email: "founder@reelramp.com", password: "admin2025" },
      { email: "ops@reelramp.com", password: "reelramp2025" }
    ];

    const validAdmin = allowedAdmins.find(
      a => a.email === adminEmail && a.password === adminPass
    );

    if (validAdmin) {
      setLoggedInAdmin(validAdmin.email);
      setShowAdminLogin(false);
      setAdminEmail("");
      setAdminPass("");
      setLoginError("");
      localStorage.setItem('admin_logged_in', validAdmin.email);
    } else {
      setLoginError("Invalid credentials. Please check your email and password.");
    }
  };

  const handleAdminLogout = () => {
    setShowAdminLogin(true);
    setLoggedInAdmin("");
    localStorage.removeItem('admin_logged_in');
  };

  // Save videos
  const persistVideos = (updated: Video[]) => {
    setAdminVideos(updated);
    saveVideosToStorage(updated);
  };

  // Popup Ad Controller (Task 1)
  const persistPopups = (updated: PopupAd[]) => {
    setPopups(updated);
    savePopupsToStorage(updated);
  };

  const togglePopupActive = (id: number) => {
    const updated = popups.map(p => ({ ...p, isActive: p.id === id ? !p.isActive : false }));
    persistPopups(updated);
  };

  const savePopup = () => {
    if (!editingPopup) return;
    const updated = popups.map(p => p.id === editingPopup.id ? editingPopup : p);
    persistPopups(updated);
    setEditingPopup(null);
  };

  const deletePopup = (id: number) => {
    const updated = popups.filter(p => p.id !== id);
    persistPopups(updated);
  };

  const savePlatformSettings = (newSettings: PlatformSettings) => {
    setPlatformSettings(newSettings);
    saveSettingsToStorage(newSettings);
    showAdminToast("✅ Platform settings saved!");
  };

  const saveSubscriptionPlanSettings = async (newSettings: SubscriptionSettings) => {
    setSubscriptionSettings(newSettings);
    try {
      const { saveSubscriptionSettings } = await import('./services/subscriptionService');
      await saveSubscriptionSettings(newSettings);
      showAdminToast("✅ Plan Settings saved!");
    } catch {
      showAdminToast("✅ Plan Settings saved locally!");
    }
  };

  // Categories CRUD
  const addCategory = (name: string) => {
    if (!name.trim() || adminCategories.includes(name.trim())) return;
    const updated = [...adminCategories, name.trim()];
    setAdminCategories(updated);
    saveCategories(updated);
  };

  const updateCategory = (oldName: string, newName: string) => {
    if (!newName.trim() || adminCategories.includes(newName.trim())) return;
    const updated = adminCategories.map(c => c === oldName ? newName.trim() : c);
    setAdminCategories(updated);
    saveCategories(updated);
  };

  const deleteCategory = (name: string) => {
    const updated = adminCategories.filter(c => c !== name);
    setAdminCategories(updated);
    saveCategories(updated);
  };

  // CRUD Operations
  const openAddModal = () => {
    setFormData({ title: '', description: '', category: 'Horror', duration: '4:30', isPremium: true, thumbnail: '/images/horror1.jpg', videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' });
    setEditingVideo(null);
    setShowAddModal(true);
  };

  const openEditModal = (video: Video) => {
    setFormData({
      title: video.title, description: video.description, category: video.category,
      duration: video.duration, isPremium: video.isPremium, thumbnail: video.thumbnail, videoUrl: video.videoUrl
    });
    setEditingVideo(video);
    setShowAddModal(true);
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveVideo = () => {
    if (!formData.title.trim()) return;

    let updatedVideos: Video[];
    
    if (editingVideo) {
      // Update existing
      updatedVideos = adminVideos.map(v => 
        v.id === editingVideo.id 
          ? { ...v, ...formData, id: v.id } as Video 
          : v
      );
    } else {
      // Add new
      const newId = Math.max(0, ...adminVideos.map(v => v.id)) + 1;
      const newVideo: Video = { ...formData, id: newId } as Video;
      updatedVideos = [...adminVideos, newVideo];
    }

    persistVideos(updatedVideos);
    setShowAddModal(false);
    setEditingVideo(null);
  };

  const deleteVideo = (id: number) => {
    const updated = adminVideos.filter(v => v.id !== id);
    persistVideos(updated);
    showAdminToast("Short deleted.");
  };

  // User Management
  const toggleUserSubscription = (userId: number) => {
    const updated = adminUsers.map(u => 
      u.id === userId ? { ...u, subscribed: !u.subscribed } : u
    );
    setAdminUsers(updated);
    localStorage.setItem('reelramp_admin_users', JSON.stringify(updated));
  };

  // Analytics Data (simulated)
  const totalShorts = adminVideos.length;
  const premiumShorts = adminVideos.filter(v => v.isPremium).length;
  const totalUsers = adminUsers.length;
  const premiumUsers = adminUsers.filter(u => u.subscribed).length;
  const totalPlays = adminUsers.reduce((sum, u) => sum + u.totalWatched, 0);
  const estimatedRevenue = premiumUsers * 199 + 12400; // Fake monthly

  // Category breakdown for charts
  const categoryStats = categories.slice(1).map(cat => ({
    name: cat,
    count: adminVideos.filter(v => v.category === cat).length,
    plays: Math.floor(Math.random() * 140) + 60
  }));

  if (showAdminLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5">
        <div className="w-full max-w-md bg-[#111] border border-[#222] rounded-3xl p-9 text-center">
          <div className="mx-auto w-16 h-16 bg-[#c5a26f] text-black rounded-2xl flex items-center justify-center mb-6">
            <Settings size={32} />
          </div>
          <h1 className="text-4xl font-semibold tracking-[-1.5px]">Admin Portal</h1>
          <p className="text-[#a1a1aa] mt-2 mb-8">ReelRamp Shorts • Admin Dashboard</p>

          <div className="space-y-3 text-left">
            <input 
              type="email" 
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Admin Email" 
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none" 
            />
            <input 
              type="password" 
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()}
              placeholder="Password" 
              className="w-full bg-[#1a1a1a] border border-[#333] rounded-2xl py-4 px-5 text-lg focus:border-[#c5a26f] outline-none" 
            />
            {loginError && <p className="text-[#e11d48] text-sm">{loginError}</p>}
          </div>

          <button 
            onClick={handleAdminLogin}
            className="mt-6 w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold tracking-wider active:bg-[#d4b17f]"
          >
            ACCESS ADMIN DASHBOARD
          </button>

          <button onClick={() => navigate('/profile')} className="mt-4 text-sm text-[#666]">Back to Profile</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Admin Toast Notification */}
      {adminSaveMsg && (
        <div className="fixed top-6 right-6 z-[200] bg-[#111] border border-[#c5a26f]/40 text-white px-6 py-3 rounded-2xl text-sm shadow-xl animate-pulse">
          {adminSaveMsg}
        </div>
      )}

      {/* Admin Header */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#222]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size={30} />
            <div>
              <div className="font-semibold text-xl tracking-tighter text-white">Admin</div>
              <div className="text-xs text-[#666] -mt-1">CONTENT &amp; GROWTH CONTROL</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {loggedInAdmin && (
              <div className="text-sm text-[#a1a1aa]">
                Logged in as: <span className="text-[#c5a26f]">{loggedInAdmin}</span>
              </div>
            )}
            <button onClick={() => navigate('/admin-secure-7842')} className="px-5 py-2 rounded-2xl border border-[#c5a26f]/50 text-[#c5a26f] text-sm">Editor Panel</button>
            <button onClick={() => navigate('/rrmp-control-9x7k')} className="px-5 py-2 rounded-2xl bg-[#c5a26f] text-black text-sm font-medium">Owner Panel</button>
            <button onClick={() => navigate('/')} className="px-5 py-2 rounded-2xl border border-[#333] text-sm">View App</button>
            <button onClick={handleAdminLogout} className="px-5 py-2 rounded-2xl bg-[#e11d48] text-white text-sm">Logout</button>
          </div>
        </div>

        {/* Admin Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 border-t border-[#222] pt-1 text-sm overflow-x-auto">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { key: 'content', label: 'Content', icon: Play },
            { key: 'popups', label: 'Popup Ads', icon: Star },
            { key: 'users', label: 'Users & Subs', icon: Users },
            { key: 'analytics', label: 'Analytics', icon: TrendingUp },
            { key: 'settings', label: 'Platform', icon: Settings },
            { key: 'plans', label: 'Plans', icon: CreditCard },
            { key: 'payment', label: 'Payment', icon: CreditCard },
            { key: 'categories', label: 'Categories', icon: Play },
            { key: 'storage', label: 'Storage/CDN', icon: Settings },
            { key: 'firebase', label: 'Firebase', icon: Settings },
            { key: 'promo', label: 'Promo Video', icon: Play }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button 
                key={tab.key} 
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 border-b-2 transition whitespace-nowrap ${activeTab === tab.key ? 'border-[#c5a26f] text-white' : 'border-transparent text-[#666]'}`}
              >
                <Icon size={17} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-8">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="flex justify-between mb-8">
              <div>
                <h2 className="text-6xl font-semibold tracking-[-3.2px]">Control Center</h2>
                <p className="text-[#a1a1aa]">Real-time platform metrics and quick actions</p>
              </div>
              <button onClick={openAddModal} className="flex items-center gap-2 px-7 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium">
                <Plus size={18} /> New Short
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: "Total Shorts", value: totalShorts, sub: `${premiumShorts} Premium` },
                { label: "Active Users", value: totalUsers, sub: `${premiumUsers} Premium` },
                { label: "Total Plays", value: totalPlays, sub: "This month" },
                { label: "Est. Revenue", value: `₹${estimatedRevenue.toLocaleString()}`, sub: "Monthly recurring" }
              ].map((stat, i) => (
                <div key={i} className="bg-[#111] border border-[#222] rounded-3xl p-7">
                  <div className="text-[#a1a1aa] text-sm tracking-widest">{stat.label}</div>
                  <div className="text-5xl font-semibold tracking-[-1.5px] mt-1">{stat.value}</div>
                  <div className="text-xs text-[#c5a26f] mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Revenue Dashboard */}
            <div className="bg-[#111] border border-[#222] rounded-3xl p-8 mb-8">
              <div className="flex justify-between mb-6">
                <div>
                  <div className="font-semibold text-xl">Revenue Overview</div>
                  <div className="text-sm text-[#666]">Last 30 days</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-semibold text-[#c5a26f]">₹{estimatedRevenue}</div>
                  <div className="text-xs text-[#22c55e]">+23% from last month</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-[#1a1a1a] rounded-2xl p-4">
                  <div className="text-2xl font-semibold">142</div>
                  <div className="text-xs text-[#666]">Trials Started</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-4">
                  <div className="text-2xl font-semibold">67%</div>
                  <div className="text-xs text-[#666]">Conversion Rate</div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-4">
                  <div className="text-2xl font-semibold">₹42k</div>
                  <div className="text-xs text-[#666]">MRR</div>
                </div>
              </div>
            </div>

            <div className="bg-[#111] rounded-3xl p-8 border border-[#222]">
              <div className="text-lg mb-5 font-medium">Quick Actions</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button onClick={() => setActiveTab('content')} className="p-5 text-left border border-[#222] hover:border-[#c5a26f] rounded-2xl flex justify-between items-center group">
                  Manage Shorts <Play className="group-hover:text-[#c5a26f]" />
                </button>
                <button onClick={() => setActiveTab('users')} className="p-5 text-left border border-[#222] hover:border-[#c5a26f] rounded-2xl flex justify-between items-center group">
                  Manage Subscribers <Users className="group-hover:text-[#c5a26f]" />
                </button>
                <button onClick={() => setActiveTab('analytics')} className="p-5 text-left border border-[#222] hover:border-[#c5a26f] rounded-2xl flex justify-between items-center group">
                  View Insights <TrendingUp className="group-hover:text-[#c5a26f]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENT MANAGEMENT TAB */}
        {activeTab === 'content' && (
          <div>
            <div className="flex flex-wrap justify-between gap-3 mb-6">
              <h3 className="text-3xl tracking-tight font-semibold">All Shorts ({adminVideos.length})</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const json = JSON.stringify(adminVideos, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'reelramp-content.json'; a.click();
                    showAdminToast("✅ Content exported as JSON");
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#333] text-sm hover:bg-[#222]"
                >Export JSON</button>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-[#333] text-sm hover:bg-[#222] cursor-pointer">
                  Import JSON
                  <input type="file" accept=".json" className="hidden" onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = ev => {
                      try {
                        const data = JSON.parse(ev.target?.result as string);
                        if (!Array.isArray(data)) { setJsonImportError("Invalid JSON: expected array"); return; }
                        persistVideos(data);
                        showAdminToast(`✅ Imported ${data.length} shorts`);
                        setJsonImportError('');
                      } catch { setJsonImportError("Invalid JSON file"); }
                    };
                    reader.readAsText(file);
                    e.target.value = '';
                  }} />
                </label>
                <button onClick={openAddModal} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c5a26f] text-black font-medium text-sm"><Plus size={17} /> Add New</button>
              </div>
            </div>
            {jsonImportError && <p className="text-[#e11d48] text-sm mb-3">{jsonImportError}</p>}

            <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden">
              <table className="w-full">
                <thead className="border-b border-[#222] text-sm text-[#a1a1aa]">
                  <tr>
                    <th className="text-left py-4 px-7">Short</th>
                    <th className="text-left py-4">Category</th>
                    <th className="text-left py-4">Duration</th>
                    <th className="text-left py-4">Views</th>
                    <th className="text-left py-4">Access</th>
                    <th className="text-right py-4 px-7">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {adminVideos.map(video => (
                    <tr key={video.id} className="hover:bg-[#1a1a1a]">
                      <td className="py-4 px-7">
                        <div className="flex items-center gap-4">
                          <img src={video.thumbnail} className="w-14 h-14 object-cover rounded-xl" alt="" />
                          <div>
                            <div className="font-medium">{video.title}</div>
                            <div className="text-xs text-[#666] line-clamp-1 pr-8">{video.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-sm text-[#a1a1aa]">{video.category}</td>
                      <td className="font-mono text-sm text-[#a1a1aa]">{video.duration}</td>
                      <td className="font-mono text-sm text-[#c5a26f]">{videoViews[video.id] || 0}</td>
                      <td>
                        {video.isPremium ? 
                          <span className="text-xs px-3 py-px bg-[#e11d48] rounded">PREMIUM</span> : 
                          <span className="text-xs px-3 py-px bg-[#22c55e] text-black rounded">FREE</span>}
                      </td>
                      <td className="text-right px-7">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEditModal(video)} className="p-3 hover:bg-[#222] rounded-xl"><Edit2 size={17} /></button>
                          <button onClick={() => deleteVideo(video.id)} className="p-3 hover:bg-[#e11d48]/10 text-[#e11d48] rounded-xl"><Trash2 size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* POPUP ADS CONTROLLER (Task 1) */}
        {activeTab === 'popups' && (
          <div>
            <div className="flex justify-between items-center mb-7">
              <div>
                <h3 className="text-4xl font-semibold tracking-tight">Popup Ad Controller</h3>
                <p className="text-[#a1a1aa]">Marketing popups shown to users on app launch.</p>
              </div>
              <button onClick={() => {
                const newP: PopupAd = { id: Date.now(), title: "New Campaign", imageUrl: "/images/popup-ad.jpg", redirectUrl: "/subscription", isActive: false };
                const updated = [...popups, newP];
                persistPopups(updated);
                setEditingPopup(newP);
              }} className="px-6 py-3 bg-[#c5a26f] text-black rounded-2xl flex items-center gap-2 font-medium"><Plus size={18} /> New Popup</button>
            </div>

            <div className="space-y-4">
              {popups.map(popup => (
                <div key={popup.id} className="bg-[#111] border border-[#222] rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center">
                  <img src={popup.imageUrl} className="w-full md:w-72 h-40 object-cover rounded-2xl" alt="" />
                  <div className="flex-1">
                    <input value={popup.title} onChange={e => {
                      const updated = popups.map(p => p.id === popup.id ? {...p, title: e.target.value} : p);
                      setPopups(updated);
                    }} className="font-semibold text-2xl bg-transparent border-b border-[#333] pb-1 w-full" />
                    
                    <div className="mt-4 text-sm text-[#a1a1aa]">Redirect URL</div>
                    <input value={popup.redirectUrl} onChange={e => {
                      const updated = popups.map(p => p.id === popup.id ? {...p, redirectUrl: e.target.value} : p);
                      setPopups(updated);
                    }} className="font-mono text-xs bg-[#1a1a1a] px-4 py-2.5 w-full rounded-2xl border border-[#333] mt-1" />

                    <div className="flex gap-3 mt-5">
                      <button onClick={() => togglePopupActive(popup.id)} className={`px-6 py-2 rounded-2xl text-sm ${popup.isActive ? 'bg-[#22c55e] text-black' : 'bg-[#333]'}`}>
                        {popup.isActive ? "LIVE ON APP" : "HIDDEN"}
                      </button>
                      <button onClick={() => setEditingPopup(popup)} className="px-6 py-2 bg-[#222] rounded-2xl text-sm">Edit</button>
                      <button onClick={() => deletePopup(popup.id)} className="px-6 py-2 bg-[#e11d48]/10 text-[#e11d48] rounded-2xl text-sm">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {editingPopup && (
              <div className="fixed inset-0 bg-black/90 z-[95] flex items-center justify-center p-6">
                <div className="bg-[#111] p-8 rounded-3xl w-full max-w-md">
                  <div className="text-xl font-medium mb-6">Edit Popup</div>
                  <input value={editingPopup.title} onChange={e => setEditingPopup({...editingPopup, title: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3 rounded-2xl mb-4" />
                  <input value={editingPopup.imageUrl} onChange={e => setEditingPopup({...editingPopup, imageUrl: e.target.value})} placeholder="Image URL" className="w-full bg-[#1a1a1a] px-5 py-3 rounded-2xl mb-4" />
                  <input value={editingPopup.redirectUrl} onChange={e => setEditingPopup({...editingPopup, redirectUrl: e.target.value})} placeholder="Redirect URL" className="w-full bg-[#1a1a1a] px-5 py-3 rounded-2xl mb-6" />
                  <div className="flex gap-3">
                    <button onClick={() => setEditingPopup(null)} className="flex-1 py-3 border border-[#333] rounded-2xl">Cancel</button>
                    <button onClick={savePopup} className="flex-1 py-3 bg-[#c5a26f] text-black rounded-2xl">Save Changes</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* USERS & SUBSCRIPTIONS TAB */}
        {activeTab === 'users' && (
          <div>
            <h3 className="text-3xl font-semibold tracking-tight mb-6">User Management • {premiumUsers} Premium Subscribers</h3>
            
            <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-[#222] text-[#a1a1aa]">
                  <tr>
                    <th className="py-4 px-7 text-left">User</th>
                    <th className="py-4 px-7 text-left">Joined</th>
                    <th className="py-4 text-left">Watched</th>
                    <th className="py-4 px-7 text-left">Status</th>
                    <th className="py-4 px-7 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                  {adminUsers.map(user => (
                    <tr key={user.id}>
                      <td className="py-5 px-7">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-[#666]">{user.email}</div>
                        <div className="text-xs text-[#a1a1aa] mt-px font-mono">{user.phone}</div>
                      </td>
                      <td className="text-[#a1a1aa] px-7">{user.joinDate}</td>
                      <td className="font-mono">{user.totalWatched} shorts</td>
                      <td className="px-7">
                        <span className={`px-3 py-px rounded text-xs ${user.subscribed ? 'bg-[#c5a26f] text-black' : 'bg-[#333] text-white'}`}>
                          {user.subscribed ? "PREMIUM" : "FREE"}
                        </span>
                      </td>
                      <td className="px-7 text-right">
                        <button 
                          onClick={() => toggleUserSubscription(user.id)} 
                          className="px-5 py-2 border text-xs border-[#333] rounded-xl hover:bg-[#222]"
                        >
                          {user.subscribed ? "Revoke Access" : "Upgrade to Premium"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-[#555] mt-3 text-center">All changes are live and persist across sessions.</p>
          </div>
        )}

        {/* REVENUE ANALYTICS DASHBOARD */}
        {activeTab === 'analytics' && (
          <div>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-4xl font-semibold tracking-tight">Revenue Dashboard</h3>
                <p className="text-[#a1a1aa]">Real-time business metrics</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const data = getRevenueData();
                    const csv = "Date,Amount,Type,Plan\n" + data.map(r => `${r.date},${r.amount},${r.type},${r.plan}`).join("\n");
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'revenue-report.csv'; a.click();
                  }}
                  className="px-5 py-2.5 border border-[#333] rounded-2xl text-sm hover:bg-[#222]"
                >Export CSV</button>
                <button 
                  onClick={() => {
                    const data = getRevenueData();
                    const total = data.reduce((s, r) => s + r.amount, 0);
                    const html = `<!DOCTYPE html><html><head><title>ReelRamp Revenue Report</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#111}h1{font-size:26px;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:20px}th,td{padding:10px 14px;border-bottom:1px solid #eee;text-align:left}th{background:#f9f9f9;font-weight:600}.summary{margin-top:24px;font-size:18px;font-weight:bold}</style></head><body><h1>ReelRamp — Revenue Report</h1><p style="color:#888">Generated: ${new Date().toLocaleDateString()} | Active Subscribers: ${premiumUsers}</p><table><thead><tr><th>Date</th><th>Plan</th><th>Type</th><th>Amount</th></tr></thead><tbody>${data.map(r => `<tr><td>${r.date}</td><td>${r.plan}</td><td>${r.type}</td><td>₹${r.amount}</td></tr>`).join('')}</tbody></table><p class="summary">Total Revenue: ₹${total.toLocaleString()}</p><p class="summary">Monthly Recurring Revenue: ₹7,298</p><script>window.onload=()=>window.print()</script></body></html>`;
                    const blob = new Blob([html], { type: 'text/html' });
                    window.open(URL.createObjectURL(blob), '_blank');
                  }}
                  className="px-5 py-2.5 border border-[#c5a26f]/50 text-[#c5a26f] rounded-2xl text-sm hover:bg-[#c5a26f]/10"
                >Download PDF</button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Revenue", value: "₹" + getRevenueData().reduce((sum, r) => sum + r.amount, 0), change: "+18%" },
                { label: "Monthly Recurring", value: "₹7,298", change: "+12%" },
                { label: "Active Subscribers", value: premiumUsers, change: "+7" },
                { label: "Trial Conversions", value: "64%", change: "+9%" },
              ].map((metric, index) => (
                <div key={index} className="bg-[#111] border border-[#222] rounded-3xl p-6">
                  <div className="text-xs text-[#666] tracking-wider">{metric.label}</div>
                  <div className="text-4xl font-semibold tracking-tighter mt-1 text-white">{metric.value}</div>
                  <div className="text-emerald-400 text-xs mt-1 font-medium">{metric.change}</div>
                </div>
              ))}
            </div>

            {/* Revenue Trend */}
            <div className="bg-[#111] border border-[#222] rounded-3xl p-8 mb-8">
              <div className="flex justify-between mb-6">
                <div className="font-medium tracking-wider text-sm">REVENUE TREND (Last 6 Months)</div>
                <div className="text-xs text-[#666]">₹ in thousands</div>
              </div>
              
              <div className="flex items-end gap-4 h-48">
                {[3200, 4100, 3850, 5200, 6100, 7298].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="text-xs text-[#c5a26f] mb-1 opacity-0 group-hover:opacity-100 transition">₹{val}</div>
                    <div 
                      className="w-full bg-gradient-to-t from-[#c5a26f] to-[#d4b17f] rounded-t-xl transition-all hover:brightness-110" 
                      style={{ height: `${(val / 7300) * 100}%` }}
                    />
                    <div className="text-xs text-[#666] mt-3">May</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-[#111] border border-[#222] rounded-3xl p-8">
              <div className="font-medium tracking-wider text-sm mb-6">RECENT TRANSACTIONS</div>
              <div className="space-y-4">
                {getRevenueData().slice().reverse().map((entry, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-[#222] last:border-0">
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

        {/* PLATFORM SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl">
            <h3 className="text-4xl font-semibold tracking-tight mb-2">Platform Settings</h3>
            <p className="text-[#a1a1aa] mb-8">App name, branding, contact info — saved instantly to localStorage.</p>

            <div className="space-y-5">
              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-5">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">APP IDENTITY</div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">App Name</label>
                  <input value={platformSettings.appName} onChange={e => setPlatformSettings({...platformSettings, appName: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm" placeholder="ReelRamp Shorts" />
                </div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Tagline</label>
                  <input value={platformSettings.tagline} onChange={e => setPlatformSettings({...platformSettings, tagline: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm" placeholder="Premium Short Films & Stories" />
                </div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Logo URL (leave blank to use default)</label>
                  <input value={platformSettings.logoUrl} onChange={e => setPlatformSettings({...platformSettings, logoUrl: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="https://..." />
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-5">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">CONTACT & SUPPORT</div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Support Email</label>
                  <input value={platformSettings.supportEmail} onChange={e => setPlatformSettings({...platformSettings, supportEmail: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm" placeholder="support@reelramp.com" />
                </div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Support Phone</label>
                  <input value={platformSettings.supportPhone} onChange={e => setPlatformSettings({...platformSettings, supportPhone: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm" placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-5">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">THEME & COLORS</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#666] mb-2 block">Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={platformSettings.accentColor} onChange={e => setPlatformSettings({...platformSettings, accentColor: e.target.value, primaryColor: e.target.value})} className="w-12 h-10 rounded-xl cursor-pointer bg-transparent border-0" />
                      <span className="font-mono text-sm text-[#a1a1aa]">{platformSettings.accentColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-2 block">Background Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={platformSettings.backgroundColor} onChange={e => setPlatformSettings({...platformSettings, backgroundColor: e.target.value})} className="w-12 h-10 rounded-xl cursor-pointer bg-transparent border-0" />
                      <span className="font-mono text-sm text-[#a1a1aa]">{platformSettings.backgroundColor}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => savePlatformSettings(platformSettings)} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm tracking-wider">
                SAVE PLATFORM SETTINGS
              </button>
            </div>
          </div>
        )}

        {/* PLAN SETTINGS TAB */}
        {activeTab === 'plans' && (
          <div className="max-w-2xl">
            <h3 className="text-4xl font-semibold tracking-tight mb-2">Plan Settings</h3>
            <p className="text-[#a1a1aa] mb-8">Control pricing, trial offers, and subscription durations shown to users.</p>

            <div className="space-y-5">
              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-5">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">TRIAL OFFER</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Trial Price</label>
                    <input value={subscriptionSettings.trialOfferPrice} onChange={e => setSubscriptionSettings({...subscriptionSettings, trialOfferPrice: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm" placeholder="₹2" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Trial Duration</label>
                    <input value={subscriptionSettings.trialOfferDuration} onChange={e => setSubscriptionSettings({...subscriptionSettings, trialOfferDuration: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm" placeholder="1 Day" />
                  </div>
                </div>
                <div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]">
                  <div>
                    <div className="font-medium text-sm">Show Trial Popup</div>
                    <div className="text-xs text-[#666]">Display trial offer popup to users on app launch</div>
                  </div>
                  <button onClick={() => setSubscriptionSettings({...subscriptionSettings, showTrialPopup: !subscriptionSettings.showTrialPopup})} className={`w-12 h-6 rounded-full transition-colors ${subscriptionSettings.showTrialPopup ? 'bg-[#c5a26f]' : 'bg-[#333]'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${subscriptionSettings.showTrialPopup ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-5">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">FULL SUBSCRIPTION</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Full Price</label>
                    <input value={subscriptionSettings.fullPrice} onChange={e => setSubscriptionSettings({...subscriptionSettings, fullPrice: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm" placeholder="₹699" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Validity</label>
                    <input value={subscriptionSettings.fullValidity} onChange={e => setSubscriptionSettings({...subscriptionSettings, fullValidity: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm" placeholder="3 months" />
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#c5a26f]/20">
                  <div className="text-xs text-[#c5a26f] mb-1">Live Preview</div>
                  <div className="text-white font-semibold">{subscriptionSettings.fullPrice} <span className="text-[#a1a1aa] font-normal text-sm">/ {subscriptionSettings.fullValidity}</span></div>
                  <div className="text-xs text-[#666] mt-1">Trial: {subscriptionSettings.trialOfferPrice} for {subscriptionSettings.trialOfferDuration}</div>
                </div>
              </div>

              <button onClick={() => { setSubscriptionSettings(subscriptionSettings); saveSubscriptionSettings(subscriptionSettings); showAdminToast("✅ Plan Settings saved! Changes are live."); }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm tracking-wider">
                SAVE PLAN SETTINGS
              </button>
            </div>
          </div>
        )}

        {/* PAYMENT SETTINGS TAB */}
        {activeTab === 'payment' && (
          <div className="max-w-2xl">
            <h3 className="text-4xl font-semibold tracking-tight mb-2">Payment Settings</h3>
            <p className="text-[#a1a1aa] mb-8">Configure payment gateways. Keys are saved locally — no code changes needed.</p>

            <div className="space-y-5">
              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium tracking-widest text-[#c5a26f]">ACTIVE GATEWAY</div>
                  <div className={`text-xs px-3 py-1 rounded-full ${paymentSettings.isLiveMode ? 'bg-[#22c55e] text-black' : 'bg-[#333] text-[#a1a1aa]'}`}>
                    {paymentSettings.isLiveMode ? '🟢 LIVE MODE' : '🟡 TEST MODE'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['razorpay', 'stripe', 'upi', 'none'] as const).map(gw => (
                    <button key={gw} onClick={() => setPaymentSettings({...paymentSettings, activeGateway: gw})} className={`py-3 rounded-2xl text-sm font-medium capitalize transition-all border ${paymentSettings.activeGateway === gw ? 'border-[#c5a26f] bg-[#c5a26f]/10 text-[#c5a26f]' : 'border-[#333] text-[#666]'}`}>
                      {gw === 'none' ? 'None / Manual' : gw.charAt(0).toUpperCase() + gw.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]">
                  <div>
                    <div className="font-medium text-sm">Live Mode</div>
                    <div className="text-xs text-[#e11d48]">⚠️ Only enable when ready to accept real payments</div>
                  </div>
                  <button onClick={() => setPaymentSettings({...paymentSettings, isLiveMode: !paymentSettings.isLiveMode})} className={`w-12 h-6 rounded-full transition-colors ${paymentSettings.isLiveMode ? 'bg-[#22c55e]' : 'bg-[#333]'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${paymentSettings.isLiveMode ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">RAZORPAY</div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Key ID {paymentSettings.isLiveMode ? '(Live)' : '(Test)'}</label>
                  <input value={paymentSettings.razorpayKeyId} onChange={e => setPaymentSettings({...paymentSettings, razorpayKeyId: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="rzp_test_..." />
                </div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Key Secret</label>
                  <input type="password" value={paymentSettings.razorpayKeySecret} onChange={e => setPaymentSettings({...paymentSettings, razorpayKeySecret: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="••••••••••••••••••••••••••••••••" />
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">UPI</div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">UPI ID</label>
                  <input value={paymentSettings.upiId} onChange={e => setPaymentSettings({...paymentSettings, upiId: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="yourname@upi" />
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">STRIPE</div>
                <div>
                  <label className="text-xs text-[#666] mb-1 block">Publishable Key</label>
                  <input value={paymentSettings.stripePublishableKey} onChange={e => setPaymentSettings({...paymentSettings, stripePublishableKey: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="pk_test_..." />
                </div>
              </div>

              <button onClick={() => { savePaymentSettings(paymentSettings); showAdminToast("✅ Payment settings saved!"); }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm tracking-wider">
                SAVE PAYMENT SETTINGS
              </button>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div className="max-w-2xl">
            <h3 className="text-4xl font-semibold tracking-tight mb-2">Categories</h3>
            <p className="text-[#a1a1aa] mb-8">Add, rename, or delete content categories. Changes apply instantly across the app.</p>

            <div className="space-y-5">
              <div className="bg-[#111] border border-[#222] rounded-3xl p-7">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f] mb-5">ADD NEW CATEGORY</div>
                <div className="flex gap-3">
                  <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newCategoryName.trim()) { addCategory(newCategoryName.trim()); setNewCategoryName(""); }}} className="flex-1 bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm" placeholder="Category name (e.g. Thriller)" />
                  <button onClick={() => { if (newCategoryName.trim()) { addCategory(newCategoryName.trim()); setNewCategoryName(""); }}} className="px-6 py-3 bg-[#c5a26f] text-black rounded-2xl font-medium text-sm flex items-center gap-2">
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              <div className="bg-[#111] border border-[#222] rounded-3xl overflow-hidden">
                <div className="px-7 py-4 border-b border-[#222] text-sm text-[#a1a1aa]">
                  {adminCategories.length} categories
                </div>
                <div className="divide-y divide-[#222]">
                  {adminCategories.map(cat => (
                    <div key={cat} className="flex items-center gap-4 px-7 py-4">
                      {editingCategoryName === cat ? (
                        <>
                          <input value={editingCategoryValue} onChange={e => setEditingCategoryValue(e.target.value)} className="flex-1 bg-[#1a1a1a] px-4 py-2 rounded-xl border border-[#c5a26f] text-sm" autoFocus />
                          <button onClick={() => { updateCategory(cat, editingCategoryValue); setEditingCategoryName(null); }} className="px-4 py-2 bg-[#c5a26f] text-black rounded-xl text-xs font-medium">Save</button>
                          <button onClick={() => setEditingCategoryName(null)} className="px-4 py-2 border border-[#333] rounded-xl text-xs">Cancel</button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 font-medium">{cat}</div>
                          <button onClick={() => { setEditingCategoryName(cat); setEditingCategoryValue(cat); }} className="p-2 hover:bg-[#222] rounded-xl text-[#a1a1aa]"><Edit2 size={15} /></button>
                          <button onClick={() => deleteCategory(cat)} className="p-2 hover:bg-[#e11d48]/10 text-[#e11d48] rounded-xl"><Trash2 size={15} /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIREBASE CONFIG TAB */}
        {activeTab === 'firebase' && (
          <div className="max-w-2xl">
            <h3 className="text-4xl font-semibold tracking-tight mb-2">Firebase Config</h3>
            <p className="text-[#a1a1aa] mb-8">Paste your Firebase project config here. No code changes needed — save and it's live.</p>

            <div className="space-y-5">
              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">FIREBASE APP CREDENTIALS</div>
                {([
                  { key: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...' },
                  { key: 'authDomain', label: 'Auth Domain', placeholder: 'your-project.firebaseapp.com' },
                  { key: 'projectId', label: 'Project ID', placeholder: 'your-project-id' },
                  { key: 'storageBucket', label: 'Storage Bucket', placeholder: 'your-project.appspot.com' },
                  { key: 'messagingSenderId', label: 'Messaging Sender ID', placeholder: '1234567890' },
                  { key: 'appId', label: 'App ID', placeholder: '1:1234:web:abcdef...' },
                  { key: 'measurementId', label: 'Measurement ID (Analytics)', placeholder: 'G-XXXXXXXXXX' },
                ] as { key: keyof FirebaseAppConfig; label: string; placeholder: string }[]).map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-[#666] mb-1 block">{field.label}</label>
                    <input
                      value={firebaseConfig[field.key]}
                      onChange={e => setFirebaseConfig({ ...firebaseConfig, [field.key]: e.target.value })}
                      className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-[#111] border border-[#222] rounded-3xl p-7">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f] mb-4">PASTE CONFIG JSON</div>
                <p className="text-xs text-[#666] mb-3">Paste the entire Firebase config object and click Parse to auto-fill all fields.</p>
                <textarea
                  rows={6}
                  className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-xs font-mono resize-none focus:border-[#c5a26f] outline-none"
                  placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  ...`}
                  id="firebase-json-paste"
                />
                <button
                  className="mt-3 px-5 py-2.5 border border-[#c5a26f] text-[#c5a26f] rounded-2xl text-sm hover:bg-[#c5a26f]/10"
                  onClick={() => {
                    try {
                      const textarea = document.getElementById('firebase-json-paste') as HTMLTextAreaElement;
                      const raw = textarea.value.trim().replace(/^const\s+\w+\s*=\s*/, '').replace(/;$/, '');
                      const parsed = JSON.parse(raw);
                      setFirebaseConfig({ ...defaultFirebaseConfig, ...parsed });
                      showAdminToast("✅ Firebase config parsed successfully!");
                    } catch { showAdminToast("❌ Invalid JSON. Check and try again."); }
                  }}
                >Parse & Fill</button>
              </div>

              <button
                onClick={() => { saveFirebaseAppConfig(firebaseConfig); showAdminToast("✅ Firebase config saved! Ready to use."); }}
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm tracking-wider"
              >
                SAVE FIREBASE CONFIG
              </button>
            </div>
          </div>
        )}

        {/* PROMO VIDEO TAB */}
        {activeTab === 'promo' && (
          <div className="max-w-2xl">
            <h3 className="text-4xl font-semibold tracking-tight mb-2">Promo Video</h3>
            <p className="text-[#a1a1aa] mb-8">Control the promotional video shown in the trial/subscription popup. Change URL anytime — no code needed.</p>

            <div className="space-y-5">
              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-5">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">VIDEO SOURCE</div>

                <div className="flex items-center justify-between bg-[#1a1a1a] px-5 py-4 rounded-2xl border border-[#333]">
                  <div>
                    <div className="font-medium text-sm">Show Promo Video</div>
                    <div className="text-xs text-[#666]">Display video popup to users on app launch</div>
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
                    <button key={t} onClick={() => setPromoSettings({ ...promoSettings, videoType: t })} className={`flex-1 py-2.5 rounded-2xl text-sm font-medium border transition ${promoSettings.videoType === t ? 'border-[#c5a26f] bg-[#c5a26f]/10 text-[#c5a26f]' : 'border-[#333] text-[#666]'}`}>
                      {t === 'youtube' ? 'YouTube' : 'Direct URL (.mp4)'}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-[#666] mb-1 block">
                    {promoSettings.videoType === 'youtube' ? 'YouTube Video URL or Embed URL' : 'Direct Video URL (.mp4, .webm)'}
                  </label>
                  <input
                    value={promoSettings.videoUrl}
                    onChange={e => setPromoSettings({ ...promoSettings, videoUrl: e.target.value })}
                    className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono focus:border-[#c5a26f] outline-none"
                    placeholder={promoSettings.videoType === 'youtube' ? 'https://youtube.com/watch?v=... or https://youtube.com/embed/...' : 'https://cdn.example.com/promo.mp4'}
                  />
                  <p className="text-xs text-[#555] mt-1">Paste a YouTube watch URL, embed URL, or any direct video URL.</p>
                </div>

                {promoSettings.videoUrl && (
                  <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#c5a26f]/20">
                    <div className="text-xs text-[#c5a26f] px-4 py-2 border-b border-[#222]">LIVE PREVIEW</div>
                    <div className="aspect-video">
                      {promoSettings.videoType === 'youtube' ? (
                        <iframe
                          width="100%" height="100%"
                          src={(() => {
                            const url = promoSettings.videoUrl;
                            if (url.includes('embed')) return url;
                            const vid = url.includes('v=') ? url.split('v=')[1]?.split('&')[0] : url.split('/').pop();
                            return `https://www.youtube.com/embed/${vid}?controls=1`;
                          })()}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media"
                          allowFullScreen
                        />
                      ) : (
                        <video src={promoSettings.videoUrl} controls className="w-full h-full bg-black" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => { savePromoVideoSettings(promoSettings); showAdminToast("✅ Promo video settings saved!"); }}
                className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm tracking-wider"
              >
                SAVE PROMO VIDEO SETTINGS
              </button>
            </div>
          </div>
        )}

        {/* STORAGE SETTINGS TAB */}
        {activeTab === 'storage' && (
          <div className="max-w-2xl">
            <h3 className="text-4xl font-semibold tracking-tight mb-2">Storage Settings</h3>
            <p className="text-[#a1a1aa] mb-8">Configure where media files are hosted. Switch providers without touching code.</p>

            <div className="space-y-5">
              <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                <div className="text-sm font-medium tracking-widest text-[#c5a26f]">STORAGE PROVIDER</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['firebase', 'cloudinary', 'bunny', 'custom'] as const).map(p => (
                    <button key={p} onClick={() => setStorageSettings({...storageSettings, storageProvider: p})} className={`py-3 rounded-2xl text-sm font-medium capitalize transition-all border ${storageSettings.storageProvider === p ? 'border-[#c5a26f] bg-[#c5a26f]/10 text-[#c5a26f]' : 'border-[#333] text-[#666]'}`}>
                      {p === 'firebase' ? 'Firebase' : p === 'cloudinary' ? 'Cloudinary' : p === 'bunny' ? 'Bunny.net' : 'Custom CDN'}
                    </button>
                  ))}
                </div>
              </div>

              {storageSettings.storageProvider === 'firebase' && (
                <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                  <div className="text-sm font-medium tracking-widest text-[#c5a26f]">FIREBASE STORAGE</div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Storage Bucket URL</label>
                    <input value={storageSettings.firebaseStorageBucket} onChange={e => setStorageSettings({...storageSettings, firebaseStorageBucket: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="gs://your-project.appspot.com" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">CDN Base URL (optional)</label>
                    <input value={storageSettings.cdnBaseUrl} onChange={e => setStorageSettings({...storageSettings, cdnBaseUrl: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="https://firebasestorage.googleapis.com/..." />
                  </div>
                </div>
              )}

              {storageSettings.storageProvider === 'bunny' && (
                <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                  <div className="text-sm font-medium tracking-widest text-[#c5a26f]">BUNNY.NET CDN</div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Library ID</label>
                    <input value={storageSettings.bunnyLibraryId} onChange={e => setStorageSettings({...storageSettings, bunnyLibraryId: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="123456" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">API Key</label>
                    <input type="password" value={storageSettings.bunnyApiKey} onChange={e => setStorageSettings({...storageSettings, bunnyApiKey: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="••••••••••••••••" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">CDN Hostname</label>
                    <input value={storageSettings.bunnyCdnHostname} onChange={e => setStorageSettings({...storageSettings, bunnyCdnHostname: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="your-zone.b-cdn.net" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Storage Zone Name</label>
                    <input value={storageSettings.bunnyStorageZone} onChange={e => setStorageSettings({...storageSettings, bunnyStorageZone: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="reelramp-videos" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Storage Password (FTP)</label>
                    <input type="password" value={storageSettings.bunnyStoragePassword} onChange={e => setStorageSettings({...storageSettings, bunnyStoragePassword: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="••••••••••••••••" />
                  </div>
                  <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#c5a26f]/20 text-xs text-[#a1a1aa]">
                    <span className="text-[#c5a26f] font-medium">CDN URL format:</span> https://{storageSettings.bunnyCdnHostname || 'your-zone.b-cdn.net'}/filename.mp4
                  </div>
                </div>
              )}

              {storageSettings.storageProvider === 'cloudinary' && (
                <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                  <div className="text-sm font-medium tracking-widests text-[#c5a26f]">CLOUDINARY</div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Cloud Name</label>
                    <input value={storageSettings.cloudinaryCloudName} onChange={e => setStorageSettings({...storageSettings, cloudinaryCloudName: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="your-cloud-name" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">API Key</label>
                    <input value={storageSettings.cloudinaryApiKey} onChange={e => setStorageSettings({...storageSettings, cloudinaryApiKey: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="123456789012345" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Upload Preset (unsigned)</label>
                    <input value={storageSettings.cloudinaryUploadPreset} onChange={e => setStorageSettings({...storageSettings, cloudinaryUploadPreset: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="reelramp_uploads" />
                  </div>
                </div>
              )}

              {storageSettings.storageProvider === 'custom' && (
                <div className="bg-[#111] border border-[#222] rounded-3xl p-7 space-y-4">
                  <div className="text-sm font-medium tracking-widests text-[#c5a26f]">CUSTOM CDN / API</div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">Storage API URL</label>
                    <input value={storageSettings.customStorageApiUrl} onChange={e => setStorageSettings({...storageSettings, customStorageApiUrl: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="https://api.yourstorage.com/upload" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">API Key / Bearer Token</label>
                    <input type="password" value={storageSettings.customStorageApiKey} onChange={e => setStorageSettings({...storageSettings, customStorageApiKey: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="••••••••••••••••" />
                  </div>
                  <div>
                    <label className="text-xs text-[#666] mb-1 block">CDN Base URL</label>
                    <input value={storageSettings.cdnBaseUrl} onChange={e => setStorageSettings({...storageSettings, cdnBaseUrl: e.target.value})} className="w-full bg-[#1a1a1a] px-5 py-3.5 rounded-2xl border border-[#333] text-sm font-mono" placeholder="https://cdn.yourdomain.com" />
                  </div>
                </div>
              )}

              <button onClick={() => { saveStorageSettings(storageSettings); showAdminToast("✅ Storage settings saved!"); }} className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl text-sm tracking-wider">
                SAVE STORAGE SETTINGS
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
                <button onClick={() => setShowAddModal(false)}><X /></button>
              </div>

              <div className="space-y-4">
                <input type="text" placeholder="Short Title" value={formData.title} onChange={e => handleFormChange('title', e.target.value)} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222]" />
                
                <textarea placeholder="Compelling description..." value={formData.description} onChange={e => handleFormChange('description', e.target.value)} rows={3} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] resize-y" />

                <div className="grid grid-cols-2 gap-4">
                  <select value={formData.category} onChange={e => handleFormChange('category', e.target.value)} className="bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222]">
                    {getCategories().slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="text" placeholder="Duration e.g. 4:45" value={formData.duration} onChange={e => handleFormChange('duration', e.target.value)} className="bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222]" />
                </div>

                <div className="flex items-center gap-4 bg-[#1a1a1a] rounded-2xl p-5 border border-[#222]">
                  <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <input type="checkbox" checked={formData.isPremium} onChange={e => handleFormChange('isPremium', e.target.checked)} className="accent-[#c5a26f] scale-125" />
                    <div>
                      <div className="font-medium">Premium Only</div>
                      <div className="text-xs text-[#a1a1aa]">Requires active subscription</div>
                    </div>
                  </label>
                </div>

                <input type="text" placeholder="Thumbnail URL (or use existing /images/...)" value={formData.thumbnail} onChange={e => handleFormChange('thumbnail', e.target.value)} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm" />
                <input type="text" placeholder="Video URL (mp4)" value={formData.videoUrl} onChange={e => handleFormChange('videoUrl', e.target.value)} className="w-full bg-[#1a1a1a] py-4 px-5 rounded-2xl border border-[#222] text-sm" />
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 border border-[#333] rounded-2xl">Cancel</button>
                <button onClick={saveVideo} className="flex-1 py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl">{editingVideo ? "Save Changes" : "Publish Short"}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
