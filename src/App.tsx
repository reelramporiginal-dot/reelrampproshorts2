// Fix 1: Replace your existing PremiumVideoPlayer/CinematicPlayer component with this
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
  const playAttemptRef = useRef(0);

  // FIX: Robust video loading with timeout and retry
  const handleCanPlay = () => {
    setIsLoaded(true);
    setIsBuffering(false);
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    
    // Force play if isPlaying is true
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn("Auto-play failed:", err);
        setIsBuffering(true);
      });
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

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error("Video error:", e);
    setHasError(true);
    setIsLoaded(false);
    setIsBuffering(false);
    
    // Retry logic: attempt reload after 2 seconds
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
        setHasError(false);
      }
    }, 2000);
  };

  // Force play/pause with retry
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isLoaded) return;

    if (isPlaying) {
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Play failed, retrying:", err);
          setIsBuffering(true);
          // Retry after short delay
          setTimeout(() => {
            if (videoRef.current && isPlaying) {
              videoRef.current.play().catch(() => {});
            }
          }, 500);
        });
      }
    } else {
      v.pause();
      setIsBuffering(false);
    }
  }, [isPlaying, isLoaded]);

  // Resume timestamp with proper loading
  useEffect(() => {
    const v = videoRef.current;
    if (v && resumeFrom > 0 && !hasResumed.current && isLoaded) {
      v.currentTime = resumeFrom;
      hasResumed.current = true;
    }
  }, [resumeFrom, isLoaded]);

  // Loading timeout fallback
  useEffect(() => {
    loadTimeoutRef.current = setTimeout(() => {
      if (!isLoaded && !hasError) {
        console.warn("Loading timeout, retrying...");
        if (videoRef.current) {
          videoRef.current.load();
        }
      }
    }, 8000);

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

  // Rest of your existing handlers remain the same...
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

      {/* Loading Spinner - only shows during buffering or not loaded */}
      {(!isLoaded || isBuffering) && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
          <div className="w-9 h-9 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20">
          <div className="text-center">
            <div className="text-[#e11d48] mb-2">⚠️</div>
            <div className="text-white text-sm mb-3">Unable to load video</div>
            <button 
              onClick={() => {
                setHasError(false);
                setIsLoaded(false);
                if (videoRef.current) videoRef.current.load();
              }}
              className="px-4 py-2 bg-[#c5a26f] text-black rounded-xl text-xs font-medium"
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

      {/* Speed HUD + Mute — always visible */}
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

      {/* Scrubber — always visible */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20 z-50 cursor-pointer group"
        onClick={e => { e.stopPropagation(); handleProgressClick(e); onUserActivity(); }}>
        <div className="h-full bg-[#c5a26f] relative" style={{ width: `${progressPercent}%` }}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-[#c5a26f] rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FIX 2: Add this Platform Context Provider before your AuthProvider
// ============================================================================

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

export const usePlatform = () => {
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
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshAllData = useCallback(() => {
    // Force refresh all data from localStorage
    setVideos(getStoredVideos());
    setSettings(getSettings());
    setSubSettings(getSubSettings());
    setPaymentConfig(getPaymentSettings());
    setPopups(getStoredPopups());
    setCategories(getCategories());
    setRefreshKey(prev => prev + 1);
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

// ============================================================================
// FIX 2: Update your App component to wrap with PlatformProvider
// ============================================================================

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

// ============================================================================
// FIX 2: Update HomePage to use usePlatform hook for reactive updates
// ============================================================================

function HomePage() {
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  const { videos: allVideos, categories: allCategories, refreshAllData } = usePlatform();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallVideo, setPaywallVideo] = useState<Video | null>(null);
  const [library, setLibrary] = useState<number[]>(() => ls.get('reelramp_library', []));
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [showGlobalPopup, setShowGlobalPopup] = useState(false);
  const [activePopup, setActivePopup] = useState<PopupAd | null>(null);
  const [showScrollPaywall, setShowScrollPaywall] = useState(false);

  // Listen for storage events to sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'reelramp_videos' || e.key === 'reelramp_settings' || 
          e.key === 'reelramp_sub_settings' || e.key === 'reelramp_popups' ||
          e.key === 'reelramp_categories') {
        refreshAllData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshAllData]);

  useEffect(() => {
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

  const allCats = ["All", ...allCategories];

  const filtered = allVideos.filter(v => {
    const matchCat = selectedCategory === "All" || v.category === selectedCategory;
    const matchSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) || v.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = allCategories.map(cat => ({
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

  // Rest of your HomePage JSX remains exactly the same...
  // (keeping all your existing UI exactly as is)
  return (
    <div className="pb-20 md:pb-8">
      {/* Your existing JSX here - unchanged */}
    </div>
  );
}

// ============================================================================
// FIX 2: Update Footer to use usePlatform hook
// ============================================================================

function Footer() {
  const { settings } = usePlatform();
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

// ============================================================================
// FIX 2: Update EditorPanel Save buttons to trigger refreshAllData
// ============================================================================

// In your EditorPanel component, find all save/saveSettings/saveVideos calls
// and add refreshAllData() after each save. Example:

// Inside EditorPanel, add this at the component start:
const { refreshAllData } = usePlatform();

// Then update your save functions to call refreshAllData:

const persistVideos = async (updated: Video[]) => {
  setAdminVideos(updated);
  saveVideos(updated);
  refreshAllData(); // ← ADD THIS LINE
  setSyncing(true);
  supabase.from('videos').upsert(updated)
    .then(() => {})
    .catch(() => {})
    .finally(() => setSyncing(false));
};

// Update your saveVideo function:
const saveVideo = async () => {
  if (!formData.title.trim()) return;
  let updated: Video[];
  if (editingVideo) {
    updated = adminVideos.map(v => v.id === editingVideo.id ? { ...v, ...formData } : v);
  } else {
    const newId = Math.max(0, ...adminVideos.map(v => v.id)) + 1;
    updated = [...adminVideos, { ...formData, id: newId } as Video];
  }
  setShowAddModal(false);
  showToast(editingVideo ? "✅ Short updated!" : "✅ Short published!");
  await persistVideos(updated);
  refreshAllData(); // Force UI update
};

// Update your platform settings save button:
<button onClick={async () => { 
  saveSettings(platformSettings); 
  await syncSettingToSupabase('platform', platformSettings);
  refreshAllData(); // ← ADD THIS
  showToast("✅ Platform settings saved!"); 
}}>
  SAVE PLATFORM SETTINGS
</button>

// Update your plan settings save button:
<button onClick={async () => { 
  saveSubSettings(subSettings); 
  await syncSettingToSupabase('subscription', subSettings);
  refreshAllData(); // ← ADD THIS
  showToast("✅ Plan settings saved!"); 
}}>
  SAVE PLAN SETTINGS
</button>

// Update your payment settings save button:
<button onClick={async () => {
  savePaymentSettings(paymentConfig);
  await syncSettingToSupabase('payment', paymentConfig);
  refreshAllData(); // ← ADD THIS
  showToast("✅ Payment settings saved!");
}}>
  SAVE PAYMENT SETTINGS
</button>

// Update your promo video save button:
<button onClick={async () => {
  savePromoSettings(promoSettings);
  await syncPromoToSupabase(promoSettings);
  refreshAllData(); // ← ADD THIS
  showToast("✅ Promo video saved & synced!");
}}>
  SAVE PROMO VIDEO SETTINGS
</button>

// Update your popup save button:
<button onClick={() => { 
  persistPopups(popups.map(p => p.id === editingPopup.id ? editingPopup : p)); 
  setEditingPopup(null);
  refreshAllData(); // ← ADD THIS
  showToast("✅ Popup saved!"); 
}}>
  Save
</button>

// Update category add/save/delete functions to call refreshAllData
