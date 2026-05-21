import { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bookmark, Download, Heart, Maximize, Pause, Play, RefreshCw, Share2, Volume2, VolumeX } from 'lucide-react';

export interface PremiumVideoPlayerProps {
  src: string;
  title: string;
  episodeIndex: number;
  totalEpisodes: number;
  poster?: string;
  resumeFrom?: number;
  autoPlay?: boolean;
  downloadAvailable?: boolean;
  downloadUrl?: string;
  initialLiked?: boolean;
  initialBookmarked?: boolean;
  className?: string;
  onBack?: () => void;
  onLike?: (liked: boolean) => void;
  onBookmark?: (bookmarked: boolean) => void;
  onShare?: () => void;
  onDownload?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

type SeekFeedback = { id: number; label: string; side: 'left' | 'center' | 'right' } | null;

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const AUTO_HIDE_MS = 2500;
const DOUBLE_TAP_MS = 300;
const BUFFER_TIMEOUT_MS = 8000;
const TIME_UPDATE_THROTTLE_MS = 250;
const VOLUME_STORAGE_KEY = 'premium-video-player-volume';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs}` : `${mins}:${secs}`;
}

export default function PremiumVideoPlayer({
  src,
  title,
  episodeIndex,
  totalEpisodes,
  poster,
  resumeFrom = 0,
  autoPlay = true,
  downloadAvailable = false,
  downloadUrl,
  initialLiked = false,
  initialBookmarked = false,
  className = '',
  onBack,
  onLike,
  onBookmark,
  onShare,
  onDownload,
  onTimeUpdate,
  onEnded,
  onError,
}: PremiumVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const autoHideTimer = useRef<number | null>(null);
  const bufferTimer = useRef<number | null>(null);
  const lastTapAt = useRef(0);
  const lastTimeUpdateAt = useRef(0);
  const resumedForSrc = useRef<string | null>(null);

  const [playing, setPlaying] = useState(autoPlay);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [speed, setSpeed] = useState(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [volumeMenuOpen, setVolumeMenuOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = Number(localStorage.getItem(VOLUME_STORAGE_KEY));
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.85;
  });
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [dragging, setDragging] = useState(false);
  const [hoveringProgress, setHoveringProgress] = useState(false);
  const [seekFeedback, setSeekFeedback] = useState<SeekFeedback>(null);

  const progress = useMemo(() => (duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0), [currentTime, duration]);

  const clearAutoHide = useCallback(() => {
    if (autoHideTimer.current) window.clearTimeout(autoHideTimer.current);
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    clearAutoHide();
    autoHideTimer.current = window.setTimeout(() => {
      if (!videoRef.current?.paused && !speedMenuOpen && !volumeMenuOpen && !dragging) setControlsVisible(false);
    }, AUTO_HIDE_MS);
  }, [clearAutoHide, dragging, speedMenuOpen, volumeMenuOpen]);

  const clearBufferTimeout = useCallback(() => {
    if (bufferTimer.current) window.clearTimeout(bufferTimer.current);
  }, []);

  const startBufferTimeout = useCallback(() => {
    clearBufferTimeout();
    bufferTimer.current = window.setTimeout(() => {
      setBuffering(false);
      setLoadError('Unable to load video');
      onError?.('Unable to load video');
    }, BUFFER_TIMEOUT_MS);
  }, [clearBufferTimeout, onError]);

  const playVideo = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      setLoadError('');
      await video.play();
      setPlaying(true);
      revealControls();
    } catch {
      setPlaying(false);
      setControlsVisible(true);
    }
  }, [revealControls]);

  const pauseVideo = useCallback(() => {
    videoRef.current?.pause();
    setPlaying(false);
    setControlsVisible(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (videoRef.current?.paused) void playVideo();
    else pauseVideo();
  }, [pauseVideo, playVideo]);

  const seekToPercent = useCallback((clientX: number) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const nextTime = ratio * duration;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    revealControls();
  }, [duration, revealControls]);

  const nudgeTime = useCallback((delta: number, side: 'left' | 'right') => {
    const video = videoRef.current;
    if (!video) return;
    const nextTime = Math.max(0, Math.min(video.duration || duration || 0, video.currentTime + delta));
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
    setSeekFeedback({ id: Date.now(), label: delta > 0 ? '+10s' : '-10s', side });
    window.setTimeout(() => setSeekFeedback(null), 650);
    revealControls();
  }, [duration, revealControls]);

  const handleSurfaceTap = (event: ReactMouseEvent<HTMLDivElement>) => {
    const interactive = (event.target as HTMLElement).closest('button, input, select, a, [data-control]');
    if (interactive) return;
    const now = Date.now();
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = (event.clientX - rect.left) / rect.width;
    if (now - lastTapAt.current <= DOUBLE_TAP_MS) {
      if (xPercent <= 0.4) nudgeTime(-10, 'left');
      else if (xPercent >= 0.6) nudgeTime(10, 'right');
      else {
        setSeekFeedback({ id: now, label: '❤️', side: 'center' });
        window.setTimeout(() => setSeekFeedback(null), 650);
      }
      lastTapAt.current = 0;
      return;
    }
    lastTapAt.current = now;
    revealControls();
  };

  const handleProgressPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    setDragging(true);
    seekToPercent(event.clientX);
    (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
  };

  const handleProgressPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging) seekToPercent(event.clientX);
  };

  const handleProgressPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    setDragging(false);
    seekToPercent(event.clientX);
    try {
      (event.currentTarget as HTMLDivElement).releasePointerCapture(event.pointerId);
    } catch {}
  };

  const changeSpeed = (nextSpeed: number) => {
    setSpeed(nextSpeed);
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
    setSpeedMenuOpen(false);
    revealControls();
  };

  const toggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (videoRef.current) videoRef.current.muted = nextMuted;
    revealControls();
  };

  const changeVolume = (nextVolume: number) => {
    const safeVolume = Math.min(1, Math.max(0, nextVolume));
    setVolume(safeVolume);
    setMuted(safeVolume === 0);
    localStorage.setItem(VOLUME_STORAGE_KEY, String(safeVolume));
    if (videoRef.current) {
      videoRef.current.volume = safeVolume;
      videoRef.current.muted = safeVolume === 0;
    }
  };

  const enterFullscreen = async () => {
    try {
      await containerRef.current?.requestFullscreen?.();
      revealControls();
    } catch {}
  };

  const retry = () => {
    const video = videoRef.current;
    if (!video) return;
    setLoadError('');
    setBuffering(true);
    startBufferTimeout();
    video.load();
    if (playing) void video.play();
  };

  const handleShare = async () => {
    if (onShare) return onShare();
    if (navigator.share) await navigator.share({ title, url: window.location.href }).catch(() => undefined);
    else await navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
    revealControls();
  };

  const handleDownload = () => {
    if (onDownload) onDownload();
    else if (downloadUrl || src) window.open(downloadUrl || src, '_blank');
    revealControls();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
    video.playbackRate = speed;
  }, [muted, speed, volume]);

  useEffect(() => {
    setPlaying(autoPlay);
    setCurrentTime(0);
    setDuration(0);
    setLoadError('');
    setBuffering(false);
    resumedForSrc.current = null;
    if (autoPlay) window.setTimeout(() => void playVideo(), 80);
  }, [src, autoPlay, playVideo]);

  useEffect(() => () => {
    clearAutoHide();
    clearBufferTimeout();
  }, [clearAutoHide, clearBufferTimeout]);

  return (
    <div
      ref={containerRef}
      onClick={handleSurfaceTap}
      onMouseMove={revealControls}
      onTouchStart={revealControls}
      className={`relative isolate aspect-[9/16] max-h-[92vh] min-h-[540px] w-full overflow-hidden rounded-[2rem] bg-black text-white shadow-2xl transform-gpu ${className}`}
      style={{ willChange: 'transform' }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="h-full w-full bg-black object-cover transform-gpu"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setDuration(video.duration || 0);
          if (resumeFrom > 0 && resumedForSrc.current !== src) {
            video.currentTime = Math.min(resumeFrom, video.duration || resumeFrom);
            setCurrentTime(video.currentTime);
            resumedForSrc.current = src;
          }
        }}
        onWaiting={() => {
          setBuffering(true);
          startBufferTimeout();
        }}
        onPlaying={() => {
          setBuffering(false);
          setLoadError('');
          clearBufferTimeout();
          setPlaying(true);
        }}
        onCanPlay={() => {
          setBuffering(false);
          clearBufferTimeout();
        }}
        onPause={() => setPlaying(false)}
        onEnded={onEnded}
        onError={() => {
          setBuffering(false);
          setLoadError('Unable to load video');
          clearBufferTimeout();
          onError?.('Unable to load video');
        }}
        onTimeUpdate={(event) => {
          const now = Date.now();
          if (now - lastTimeUpdateAt.current < TIME_UPDATE_THROTTLE_MS) return;
          lastTimeUpdateAt.current = now;
          const video = event.currentTarget;
          setCurrentTime(video.currentTime);
          setDuration(video.duration || 0);
          onTimeUpdate?.(video.currentTime, video.duration || 0);
        }}
      />

      <AnimatePresence>
        {buffering && !loadError && (
          <motion.div className="absolute inset-0 grid place-items-center bg-black/20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }} className="h-11 w-11 rounded-full border-4 border-white/25 border-t-[#c5a26f]" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loadError && (
          <motion.div className="absolute inset-0 grid place-items-center bg-black/75 p-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="rounded-3xl border border-white/10 bg-neutral-950/90 p-6">
              <p className="text-xl font-black">Unable to load video</p>
              <button onClick={retry} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#c5a26f] px-5 py-3 font-bold text-black">
                <RefreshCw size={18} /> Retry
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {seekFeedback && (
          <motion.div
            key={seekFeedback.id}
            initial={{ scale: 0.65, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.2, y: -22, opacity: 0 }}
            className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-5 py-3 text-3xl font-black backdrop-blur ${seekFeedback.side === 'left' ? 'left-10' : seekFeedback.side === 'right' ? 'right-10' : 'left-1/2 -translate-x-1/2'}`}
          >
            {seekFeedback.label}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        data-control
        initial={false}
        animate={{ opacity: controlsVisible ? 1 : 0 }}
        transition={{ duration: 0.22 }}
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/75"
      >
        <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center gap-3 p-4">
          <button onClick={onBack} className="grid h-11 w-11 place-items-center rounded-full bg-black/35 backdrop-blur hover:bg-white/15" aria-label="Back">
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-black leading-tight">{title}</h2>
            <p className="text-sm font-semibold text-white/70">Episode {episodeIndex}/{totalEpisodes}</p>
          </div>
          <span className="rounded-full bg-[#c5a26f] px-3 py-1 text-sm font-black text-black">{episodeIndex}/{totalEpisodes}</span>
        </div>

        <div className="pointer-events-auto absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-3">
          <button onClick={() => { const next = !liked; setLiked(next); onLike?.(next); revealControls(); }} className="grid h-12 w-12 place-items-center rounded-full bg-black/35 backdrop-blur hover:bg-white/15" aria-label="Like">
            <Heart className={liked ? 'fill-red-500 text-red-500' : ''} size={22} />
          </button>
          <button onClick={() => { const next = !bookmarked; setBookmarked(next); onBookmark?.(next); revealControls(); }} className="grid h-12 w-12 place-items-center rounded-full bg-black/35 backdrop-blur hover:bg-white/15" aria-label="Save">
            <Bookmark className={bookmarked ? 'fill-[#c5a26f] text-[#c5a26f]' : ''} size={22} />
          </button>
          <button onClick={() => void handleShare()} className="grid h-12 w-12 place-items-center rounded-full bg-black/35 backdrop-blur hover:bg-white/15" aria-label="Share">
            <Share2 size={22} />
          </button>
          {downloadAvailable && (
            <button onClick={handleDownload} className="grid h-12 w-12 place-items-center rounded-full bg-black/35 backdrop-blur hover:bg-white/15" aria-label="Download">
              <Download size={22} />
            </button>
          )}
        </div>

        <div className="pointer-events-auto absolute inset-x-0 bottom-0 space-y-3 p-4">
          <div
            ref={progressRef}
            onPointerDown={handleProgressPointerDown}
            onPointerMove={handleProgressPointerMove}
            onPointerUp={handleProgressPointerUp}
            onMouseEnter={() => setHoveringProgress(true)}
            onMouseLeave={() => setHoveringProgress(false)}
            className="group h-5 cursor-pointer py-2"
            aria-label="Seek video"
          >
            <div className="h-1 rounded-full bg-white/20">
              <div className="relative h-full rounded-full bg-[#c5a26f]" style={{ width: `${progress}%` }}>
                <div className={`absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-[#c5a26f] shadow-lg transition-opacity ${(hoveringProgress || dragging) ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="grid h-12 w-12 place-items-center rounded-full bg-[#c5a26f] text-black shadow-lg" aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <Pause size={22} /> : <Play size={22} className="translate-x-0.5" />}
            </button>
            <span className="min-w-[92px] text-sm font-bold tabular-nums text-white/90">{formatTime(currentTime)} / {formatTime(duration)}</span>

            <div className="relative ml-auto">
              <button onClick={() => { setSpeedMenuOpen((open) => !open); revealControls(); }} className="rounded-full bg-white/12 px-4 py-2 text-sm font-black backdrop-blur hover:bg-white/20">
                {speed}x
              </button>
              <AnimatePresence>
                {speedMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} className="absolute bottom-12 right-0 overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/95 p-1 shadow-2xl backdrop-blur">
                    {SPEEDS.map((item) => (
                      <button key={item} onClick={() => changeSpeed(item)} className={`block w-full rounded-xl px-4 py-2 text-left text-sm font-bold hover:bg-white/10 ${speed === item ? 'text-[#c5a26f]' : 'text-white'}`}>
                        {item}x
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" onMouseEnter={() => setVolumeMenuOpen(true)} onMouseLeave={() => setVolumeMenuOpen(false)}>
              <button onClick={toggleMute} className="grid h-10 w-10 place-items-center rounded-full bg-white/12 backdrop-blur hover:bg-white/20" aria-label="Toggle volume">
                {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <AnimatePresence>
                {volumeMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute bottom-12 left-1/2 w-28 -translate-x-1/2 rounded-2xl border border-white/10 bg-neutral-950/95 px-3 py-4 shadow-2xl backdrop-blur">
                    <input aria-label="Volume" type="range" min="0" max="100" value={Math.round(volume * 100)} onChange={(event) => changeVolume(Number(event.target.value) / 100)} className="w-full accent-[#c5a26f]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => void enterFullscreen()} className="grid h-10 w-10 place-items-center rounded-full bg-white/12 backdrop-blur hover:bg-white/20" aria-label="Fullscreen">
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
