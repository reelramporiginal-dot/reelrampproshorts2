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
import { GlobalDataProvider, useGlobalData, Video, PlatformSettings } from './DataContext';

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://rwtndqorpizoozbpcmca.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dG5kcW9ycGl6b296YnBjbWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDYwMjMsImV4cCI6MjA5NDE4MjAyM30.8mHW5OGBM8mNuMBp-yASHWYlwcbQkNaUhYQ-JvMl_6Q";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BUNNY_CDN = "https://reelrampproshorts1.b-cdn.net";
const getBunnyCdnUrl = (path: string) => path.startsWith("http") ? path : `${BUNNY_CDN}/${path.replace(/^\//, "")}`;
const REELRAMP_LOGO = "https://drive.google.com/uc?export=view&id=1qs734lVBcgz-fJ_TitnibEG-KqX0LCVg";

// ─────────────────────────────────────────────────────────────────────────────
// STORAGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const ls = {
  get: <T,>(key: string, fallback: T): T => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (key: string, value: any) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key: string) => localStorage.removeItem(key)
};

const getWatchHistory = () => ls.get('reelramp_watch_history', []);
const getAverageRating = (id: number) => ({ average: 4.5, count: 120 });

// ─────────────────────────────────────────────────────────────────────────────
// CINEMATIC PLAYER — FIX 1: ULTRA-PREMIUM PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────────
function CinematicPlayer({ video, isPlaying, onPlayPause, onEnded, overlayVisible, onUserActivity, resumeFrom = 0 }: any) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);

  // Instant Trigger Playback
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(e => console.error("Autoplay blocked", e));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, video.videoUrl]);

  // Resume Progress
  useEffect(() => {
    if (videoRef.current && resumeFrom > 0) {
      videoRef.current.currentTime = resumeFrom;
    }
  }, [video.id]);

  return (
    <div className="relative w-full h-full bg-black group overflow-hidden" onClick={onUserActivity}>
      <video
        ref={videoRef}
        src={video.source === 'bunny' ? getBunnyCdnUrl(video.videoUrl) : video.videoUrl}
        className="w-full h-full object-cover"
        playsInline
        preload="auto"
        onEnded={onEnded}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={(e) => setProgress((e.currentTarget.currentTime / e.currentTarget.duration) * 100)}
      />

      {/* Loading HUD */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-30">
          <div className="w-12 h-12 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin shadow-2xl" />
        </div>
      )}

      {/* Control Overlay with 2.5s Auto-Hide */}
      <AnimatePresence>
        {overlayVisible && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-20 transition-opacity duration-500"
          >
            {/* Play/Pause Button */}
            <div className="absolute inset-0 flex items-center justify-center" onClick={onPlayPause}>
               <div className="p-6 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 active:scale-90 transition-transform">
                 {isPlaying ? <Pause size={48} fill="white" /> : <Play size={48} className="translate-x-1" fill="white" />}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permanent Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
        <div className="h-full bg-[#c5a26f] transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <GlobalDataProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </GlobalDataProvider>
  );
}

function AppContent() {
  const { platformSettings } = useGlobalData();
  const location = useLocation();
  const isFullscreen = location.pathname.startsWith('/player') || location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ backgroundColor: platformSettings.backgroundColor }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/player/:id" element={<ShortsPlayerPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin-secure-7842" element={<AdminPage />} />
        <Route path="/rrmp-control-9x7k" element={<AdminPage />} />
      </Routes>
      {!isFullscreen && <BottomNavigation />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE — FIX 2: REAL-TIME SYNCED
// ─────────────────────────────────────────────────────────────────────────────
function HomePage() {
  const { videos, platformSettings } = useGlobalData();
  const navigate = useNavigate();

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-40 backdrop-blur-xl p-6 border-b border-white/5" style={{ backgroundColor: `${platformSettings.backgroundColor}F0` }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#c5a26f] rounded-2xl flex items-center justify-center shadow-lg"><Zap className="text-black" /></div>
             <h1 className="text-2xl font-bold tracking-tighter">{platformSettings.appName}</h1>
          </div>
          <button onClick={() => navigate('/profile')} className="p-3 bg-white/5 rounded-2xl border border-white/10"><UserIcon size={20} /></button>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {videos.map(video => (
            <div key={video.id} onClick={() => navigate(`/player/${video.id}`)} className="group cursor-pointer">
              <div className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
                <img src={video.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                {video.isPremium && <div className="absolute top-4 right-4 bg-[#e11d48] text-[10px] px-3 py-1 rounded-full font-bold">PREMIUM</div>}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={32} fill="white" />
                </div>
              </div>
              <h3 className="mt-4 font-bold text-lg truncate px-2">{video.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHORTS PLAYER PAGE — FIX 1: CLEAN MODE
// ─────────────────────────────────────────────────────────────────────────────
function ShortsPlayerPage() {
  const { id } = useParams();
  const { videos } = useGlobalData();
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const timerRef = useRef<any>(null);

  const video = videos.find(v => v.id === parseInt(id || '0'));

  const handleInteraction = useCallback(() => {
    setOverlayVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOverlayVisible(false), 2500); // 2.5s Auto-hide
  }, []);

  useEffect(() => { handleInteraction(); return () => clearTimeout(timerRef.current); }, [handleInteraction]);

  if (!video) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden" onMouseMove={handleInteraction} onTouchStart={handleInteraction}>
      <CinematicPlayer 
         video={video} 
         isPlaying={isPlaying} 
         onPlayPause={() => setIsPlaying(!isPlaying)}
         overlayVisible={overlayVisible}
         onUserActivity={handleInteraction}
      />
      
      {/* Navigation Layer */}
      <AnimatePresence>
        {overlayVisible && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 pointer-events-none">
            <button 
              onClick={() => navigate('/')} 
              className="absolute top-10 left-6 p-4 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 pointer-events-auto active:scale-90 transition"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="absolute bottom-24 left-10 p-6 max-w-lg pointer-events-auto">
               <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">{video.title}</h2>
               <p className="text-lg text-white/60 line-clamp-2">{video.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PANEL — FIX 2: INSTANT PUSH
// ─────────────────────────────────────────────────────────────────────────────
function AdminPage() {
  const { videos, platformSettings, refreshData } = useGlobalData();
  const [activeTab, setActiveTab] = useState('settings');
  const [appTitle, setAppTitle] = useState(platformSettings.appName);

  const saveConfig = async () => {
    const newSettings = { ...platformSettings, appName: appTitle };
    await supabase.from('platform_settings').upsert({ id: 'platform', key: 'platform', value: JSON.stringify(newSettings) });
    await refreshData();
    alert("Configurations Pushed Successfully!");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-10">
      <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[40px] p-12">
         <h2 className="text-4xl font-black italic uppercase mb-10">Admin Control</h2>
         <div className="space-y-8">
            <div className="space-y-3">
               <label className="text-[10px] font-black tracking-widest text-[#c5a26f] uppercase">Platform Branding</label>
               <input 
                 value={appTitle} 
                 onChange={e => setAppTitle(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-xl outline-none focus:border-[#c5a26f] transition-all"
               />
            </div>
            <button 
              onClick={saveConfig}
              className="w-full py-6 bg-[#c5a26f] text-black font-black tracking-widest rounded-3xl active:scale-95 transition-all shadow-xl"
            >
              REFLECT CHANGES INSTANTLY
            </button>
         </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function BottomNavigation() {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#111] border-t border-white/5 flex items-center justify-around px-10 z-[100]">
      <button onClick={() => navigate('/')} className="p-3 text-[#c5a26f]"><Home size={28} /></button>
      <button onClick={() => navigate('/admin')} className="p-3 text-white/30"><Settings size={28} /></button>
      <button onClick={() => navigate('/profile')} className="p-3 text-white/30"><UserIcon size={28} /></button>
    </div>
  );
}

function ProfilePage() { return <div className="p-10">Profile Page placeholder</div>; }
function PWAInstallBanner() { return null; }
