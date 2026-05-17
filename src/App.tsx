// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// REELRAMP PRO â€” SYSTEM 1 & 2 DROP-IN REPLACEMENT
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// SYSTEM 1: INSTANT ANONYMOUS PASS + FRICTIONLESS AUTH
//   â€¢ Guest mode on mount â€” no login gate
//   â€¢ Auth (Login/Register/Forgot/Google) moved entirely into ProfilePage
//   â€¢ LoginPage kept as a standalone route for backward-compatibility but now
//     redirects directly to / instead of blocking the app
//   â€¢ Auto-profile creation on register, no email-verify blocking
//
// SYSTEM 2: ULTRA-PREMIUM TIKTOK/KUKU-STYLE PLAYER
//   â€¢ Full-bleed vertical cinematic layout
//   â€¢ CSS scroll-snap feed container (one card per viewport)
//   â€¢ Animated double-tap heart burst engine (left = -10 s, right = +10 s + â¤ï¸)
//   â€¢ Floating speed control HUD (0.5Ã— â†’ 2Ã—)
//   â€¢ Custom minimal mute controller
//   â€¢ Absolute-positioned micro progress timeline bar
//   â€¢ Swipe gesture navigation (touch + wheel)
//
// HOW TO INTEGRATE:
//   1. Replace the entire PremiumVideoPlayer function in App.tsx with the one below.
//   2. Replace the entire LoginPage function with the one below.
//   3. Replace the entire ProfilePage function with the one below
//      (auth forms are now embedded inside the Profile tab).
//   4. Replace the entire ShortsPlayerPage function with the one below.
//   5. Update AppContent routes â€” add the new GuestRoute wrapper shown below.
//   6. No new npm packages required (uses existing: react, framer-motion,
//      lucide-react, supabase-js, react-router-dom).
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Pause, Heart, Bookmark, Share2, ArrowLeft,
  User as UserIcon, Star, CheckCircle, Lock,
  Volume2, VolumeX, ChevronUp, ChevronDown,
  LogIn, UserPlus, KeyRound, Chrome,
} from 'lucide-react';

// â”€â”€â”€ Re-export everything that hasn't changed so tree-shaking works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// (You keep supabase, ls, fetchVideosFromDB, etc. from the original file)
// These types/helpers are referenced below â€” they come from your original App.tsx:
//   supabase, ls, fetchVideosFromDB, fetchCategoriesFromDB, fetchPopupsFromDB,
//   addToWatchHistory, incrementView, getWatchHistory, getBunnyCdnUrl,
//   defaultPromoVideo, defaultSubscriptionSettings, useAuth, AuthContext,
//   PaywallModal, Logo, REELRAMP_LOGO, initialVideos
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SYSTEM 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GUEST ROUTE WRAPPER
// Drop this into AppContent in place of any protected-route wrapper.
// Usage: wrap routes that previously required login.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

/**
 * GuestRoute â€” always renders children.
 * Keeps a `guestId` in localStorage so anonymous sessions persist.
 * When the real Supabase user signs in, the guest session is silently replaced.
 */
export function GuestRoute({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!localStorage.getItem('rr_guest_id')) {
      localStorage.setItem(
        'rr_guest_id',
        `guest_${Math.random().toString(36).slice(2, 11)}`,
      );
    }
  }, []);
  return <>{children}</>;
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LOGIN PAGE  (kept as /login route but now non-blocking)
// Redirects to / immediately when user is already authenticated.
// If a logged-out user hits /login directly they get the auth form;
// otherwise the main feed is always accessible as a guest.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function LoginPage() {
  const navigate  = useNavigate();
  // `useAuth` comes from your original AuthContext
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = (React as any).useContext(
    // We reference AuthContext from the original file â€” replace with direct import
    // in your codebase:  import { useAuth } from './App';
    // For this drop-in file we call it via a type-safe shim:
    AuthContextShim,
  );

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  // Render the inline auth form (same component used in ProfilePage)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-5 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 justify-center mb-4">
            <svg width={36} height={36} viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="#c5a26f" strokeWidth="3"/>
              <circle cx="32" cy="32" r="18" stroke="#c5a26f" strokeWidth="2"/>
              <path d="M24 22 L24 42 M24 22 L36 22 C40 22 42 25 42 28 C42 32 39 34 35 34 L24 34 M35 34 L42 42"
                stroke="#f4f4f5" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M38 27 L38 37 L45 32 Z" fill="#c5a26f"/>
            </svg>
            <span className="font-semibold tracking-[-1.5px] text-2xl text-white">ReelRamp</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Sign In</h1>
          <p className="text-[#a1a1aa] mt-1 text-sm">or <button onClick={() => navigate('/')} className="text-[#c5a26f] underline">continue as guest</button></p>
        </div>
        <AuthForms onSuccess={() => navigate('/', { replace: true })} />
        <p className="text-center text-xs text-[#555] mt-6">
          <button onClick={() => navigate('/')} className="hover:text-white transition">
            â† Back to app without signing in
          </button>
        </p>
      </motion.div>
    </div>
  );
}

// Shim so this file compiles standalone â€” in your project just use useAuth() directly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AuthContextShim = React.createContext<any>({ user: null, session: null });


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AUTH FORMS COMPONENT
// Self-contained auth panel embedded in ProfilePage.
// Handles: Login Â· Register Â· Forgot Password Â· Google OAuth
// No email-verification blocking â€” registers and signs in immediately.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface AuthFormsProps {
  onSuccess?: () => void;
}

export function AuthForms({ onSuccess }: AuthFormsProps) {
  // Import supabase from your original App.tsx
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (window as any).__reelramp_supabase__;
  // â†‘ In your actual project, just import supabase directly:
  //   import { supabase } from './App';

  const [mode,          setMode]          = useState<'login' | 'register' | 'forgot'>('login');
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [name,          setName]          = useState('');
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const reset = () => { setError(''); setSuccessMsg(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    setLoading(true);

    try {
      if (mode === 'register') {
        // 1. Sign up
        const { data: up, error: upErr } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } },
        });
        if (upErr) throw upErr;

        // 2. Upsert profile row immediately â€” no email gate
        if (up?.user) {
          await supabase.from('profiles').upsert({
            id:         up.user.id,
            full_name:  name,
            email,
            created_at: new Date().toISOString(),
          });
        }

        // 3. Auto sign-in right after (skips email verification flow)
        const { error: inErr } = await supabase.auth.signInWithPassword({ email, password });
        if (inErr) {
          // Edge case: email confirmation enabled server-side
          setSuccessMsg('Account created! Check your email if login fails.');
          setMode('login');
        } else {
          onSuccess?.();
        }

      } else if (mode === 'login') {
        const { error: inErr } = await supabase.auth.signInWithPassword({ email, password });
        if (inErr) throw inErr;
        onSuccess?.();

      } else {
        // forgot
        const { error: rErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (rErr) throw rErr;
        setSuccessMsg('Reset link sent! Check your inbox.');
        setMode('login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    reset();
    try {
      const { error: oErr } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options:  { redirectTo: `${window.location.origin}/profile` },
      });
      if (oErr) throw oErr;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-[#111] border border-[#222] rounded-3xl p-6 sm:p-8 w-full">
      {/* Mode selector */}
      {mode !== 'forgot' && (
        <div className="flex bg-[#1a1a1a] rounded-2xl p-1 mb-6">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); reset(); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                mode === m ? 'bg-[#c5a26f] text-black' : 'text-[#666]'
              }`}
            >
              {m === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>
      )}

      {/* Google OAuth â€” single tap */}
      {mode !== 'forgot' && (
        <>
          <button
            onClick={() => void handleGoogle()}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white text-black rounded-2xl
                       font-medium text-sm mb-4 hover:bg-[#f0f0f0] transition-all disabled:opacity-60"
          >
            {googleLoading
              ? <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
              )
            }
            Continue with Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#2a2a2a]" />
            <span className="text-[#444] text-xs">or</span>
            <div className="flex-1 h-px bg-[#2a2a2a]" />
          </div>
        </>
      )}

      {/* Form */}
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        {mode === 'register' && (
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full Name"
            required
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm
                       focus:border-[#c5a26f] outline-none placeholder:text-[#555] text-white"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email address"
          required
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm
                     focus:border-[#c5a26f] outline-none placeholder:text-[#555] text-white"
        />
        {mode !== 'forgot' && (
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            minLength={6}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl py-3.5 px-5 text-sm
                       focus:border-[#c5a26f] outline-none placeholder:text-[#555] text-white"
          />
        )}

        {error      && <p className="text-[#e11d48] text-xs px-1">{error}</p>}
        {successMsg && <p className="text-[#22c55e] text-xs px-1">{successMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#c5a26f] text-black font-semibold rounded-2xl tracking-wider
                     disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          )}
          {mode === 'login'    && <><LogIn   size={16}/> Login</>}
          {mode === 'register' && <><UserPlus size={16}/> Create Account</>}
          {mode === 'forgot'   && <><KeyRound size={16}/> Send Reset Link</>}
        </button>
      </form>

      {/* Footer links */}
      <div className="mt-4 flex flex-col items-center gap-2">
        {mode === 'login' && (
          <button
            onClick={() => { setMode('forgot'); reset(); }}
            className="text-xs text-[#c5a26f] hover:underline"
          >
            Forgot password?
          </button>
        )}
        {mode === 'forgot' && (
          <button
            onClick={() => { setMode('login'); reset(); }}
            className="text-xs text-[#555] hover:text-white transition"
          >
            â† Back to Login
          </button>
        )}
      </div>
    </div>
  );
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PROFILE PAGE  (auth forms embedded â€” replaces the original ProfilePage)
// Guests see a CTA to sign in. Signed-in users see their full profile.
// The auth module lives in the "Account" tab so the page is always accessible.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function ProfilePage() {
  const navigate  = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user, isSubscribed, signOut, loading } = (React as any).useContext(AuthContextShim);

  // Local state
  const [activeTab,    setActiveTab]    = useState<'library' | 'history' | 'account'>('library');
  const [library,      setLibrary]      = useState<Video[]>([]);
  const [allVideos,    setAllVideos]    = useState<Video[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);

  // NOTE: import these from your original App.tsx
  // fetchVideosFromDB, getWatchHistory, ls
  // Using window shims here for drop-in compatibility:
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchVideos      = (window as any).__rr_fetchVideos__      ?? (() => Promise.resolve([]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getHistory       = (window as any).__rr_getWatchHistory__  ?? (() => []);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lsHelper         = (window as any).__rr_ls__               ?? { get: (_k: string, d: unknown) => d, set: () => {}, remove: () => {} };

  useEffect(() => {
    fetchVideos().then((vids: Video[]) => {
      setAllVideos(vids);
      const libIds: number[] = lsHelper.get('reelramp_library', []);
      setLibrary(vids.filter((v: Video) => libIds.includes(v.id)));
    });
    setWatchHistory(getHistory());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFromLibrary = (id: number) => {
    const updated = library.filter(v => v.id !== id);
    setLibrary(updated);
    lsHelper.set('reelramp_library', updated.map((v: Video) => v.id));
  };

  const displayName = user
    ? ((user.user_metadata?.full_name as string | undefined) ?? user.email?.split('@')[0] ?? 'User')
    : 'Guest';
  const initials = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-28 px-4 pt-8 w-full overflow-x-hidden">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-semibold text-3xl md:text-5xl tracking-[-2px] text-white">Profile</h1>
        <button onClick={() => navigate('/')} className="text-sm text-[#a1a1aa]">Home</button>
      </div>

      {/* â”€â”€ Profile Header â”€â”€ */}
      <div className="flex items-center gap-5 mb-9 border-b border-[#222] pb-8">
        <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] ring-1 ring-[#c5a26f]/40 flex items-center justify-center shrink-0">
          {user
            ? <span className="text-4xl font-bold text-[#c5a26f]">{initials}</span>
            : <UserIcon size={32} className="text-[#555]" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-2xl font-semibold tracking-tight text-white truncate">{displayName}</div>
          {user && <div className="text-sm text-[#a1a1aa] truncate">{user.email}</div>}
          {!user && (
            <div className="text-sm text-[#555] mt-0.5">Not signed in</div>
          )}
          {user && (
            <button
              onClick={async () => { await signOut(); navigate('/'); }}
              className="text-xs text-[#e11d48] mt-1 hover:underline"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* â”€â”€ Subscription Banner â”€â”€ */}
      <div className="mb-8 bg-[#111] border border-[#222] rounded-3xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="uppercase text-xs tracking-[2.5px] text-[#a1a1aa]">SUBSCRIPTION</div>
            <div className="font-semibold text-2xl tracking-tight mt-1 text-white">
              {isSubscribed ? 'Premium Active' : 'Free / Guest Plan'}
            </div>
          </div>
          {isSubscribed
            ? (
              <div className="text-[#22c55e] text-sm flex items-center gap-1.5">
                <CheckCircle size={16}/> ACTIVE
              </div>
            ) : (
              <button
                onClick={() => navigate('/subscription')}
                className="w-full md:w-auto px-8 py-3.5 bg-[#c5a26f] text-black text-sm font-semibold rounded-2xl"
              >
                UPGRADE TO PREMIUM
              </button>
            )
          }
        </div>
      </div>

      {/* â”€â”€ Tabs â”€â”€ */}
      <div className="flex border-b border-[#222] mb-6 text-sm overflow-x-auto no-scrollbar">
        {([
          { key: 'library',  label: 'My Library' },
          { key: 'history',  label: 'Watch History' },
          { key: 'account',  label: user ? 'Account' : 'Sign In / Register' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 md:px-7 pb-4 border-b-2 transition whitespace-nowrap ${
              activeTab === key
                ? 'border-[#c5a26f] text-white font-medium'
                : 'border-transparent text-[#666]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* â”€â”€ Library Tab â”€â”€ */}
      {activeTab === 'library' && (
        <div>
          {library.length === 0
            ? <div className="py-14 text-center text-[#555]">No saved shorts yet. Bookmark from the home feed.</div>
            : (
              <div className="space-y-4">
                {library.map(video => (
                  <div key={video.id} className="flex gap-3 bg-[#111] p-3 rounded-2xl border border-[#222]">
                    <img src={video.thumbnail} className="w-16 h-16 object-cover rounded-xl shrink-0" alt="" />
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="font-medium text-sm text-white line-clamp-1">{video.title}</div>
                      <div className="text-xs text-[#555] mt-0.5">{video.duration} Â· {video.category}</div>
                      <div className="flex gap-3 mt-2 text-xs">
                        <button
                          onClick={() => navigate(`/player/${video.id}`)}
                          className="flex items-center gap-1 text-[#c5a26f]"
                        >
                          PLAY <Play size={13}/>
                        </button>
                        <button onClick={() => removeFromLibrary(video.id)} className="text-[#555]">
                          REMOVE
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}

      {/* â”€â”€ History Tab â”€â”€ */}
      {activeTab === 'history' && (
        <div>
          {watchHistory.length === 0
            ? <div className="py-14 text-center text-[#555]">No watch history yet.</div>
            : (
              <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                {watchHistory.slice(0, 10).map(item => {
                  const video = allVideos.find(v => v.id === item.videoId);
                  if (!video) return null;
                  return (
                    <div
                      key={item.videoId}
                      onClick={() => navigate(`/player/${video.id}`)}
                      className="flex-shrink-0 w-[150px] cursor-pointer group"
                    >
                      <div className="relative rounded-2xl overflow-hidden aspect-video bg-black">
                        <img
                          src={video.thumbnail} alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                          <div className="h-full bg-[#c5a26f]" style={{ width: `${item.progress}%` }}/>
                        </div>
                      </div>
                      <div className="mt-2 text-xs font-medium line-clamp-1 text-white">{video.title}</div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {/* â”€â”€ Account / Auth Tab â”€â”€ */}
      {activeTab === 'account' && (
        <div>
          {user
            ? (
              /* Signed-in account details */
              <div className="space-y-6 text-sm">
                <div className="p-6 bg-[#111] rounded-3xl border border-[#222]">
                  <div className="font-medium mb-4 text-white">Account Settings</div>
                  {[
                    ['Email',        user.email],
                    ['User ID',      `${(user.id as string).slice(0, 14)}â€¦`],
                    ['Member Since', new Date(user.created_at ?? '').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-4 border-t border-[#1f1f1f] first:border-0">
                      <div className="text-[#a1a1aa]">{label}</div>
                      <div className="text-white font-mono text-xs max-w-[55%] text-right truncate">{value}</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={async () => {
                    if (confirm('Sign out and clear all local data?')) {
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
            )
            : (
              /* Guest â€” show auth forms inline */
              <div>
                <p className="text-[#555] text-sm mb-6">
                  Sign in to sync your library, watch history, and subscription across devices.
                </p>
                <AuthForms onSuccess={() => setActiveTab('library')} />
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

// Minimal type aliases (matching your original App.tsx types)
interface Video {
  id: number; title: string; description: string; category: string;
  duration: string; isPremium: boolean; thumbnail: string; videoUrl: string;
  source?: 'direct' | 'youtube' | 'gdrive' | 'bunny'; storagePath?: string;
}
interface WatchHistoryItem { videoId: number; watchedAt: string; progress: number; }


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ SYSTEM 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ULTRA-PREMIUM VIDEO PLAYER
// Full-bleed Â· double-tap heart burst Â· speed HUD Â· mute Â· micro progress bar
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

interface PremiumVideoPlayerProps {
  video: Video;
  isPlaying: boolean;
  onPlayPause: () => void;
  onEnded: () => void;
  onProgress?: (pct: number) => void;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

export function PremiumVideoPlayer({
  video,
  isPlaying,
  onPlayPause,
  onEnded,
  onProgress,
}: PremiumVideoPlayerProps) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const [loaded,        setLoaded]        = useState(false);
  const [isMuted,       setIsMuted]       = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [duration,      setDuration]      = useState(0);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [speed,         setSpeed]         = useState(1);
  const [showSpeedHUD,  setShowSpeedHUD]  = useState(false);
  const [showControls,  setShowControls]  = useState(false); // tap once = toggle overlay
  const [tapSide,       setTapSide]       = useState<'left' | 'right' | null>(null);
  const [heartBursts,   setHeartBursts]   = useState<{ id: number; x: number; y: number }[]>([]);
  const lastTap         = useRef<{ time: number; side: 'left' | 'right' }>({ time: 0, side: 'left' });
  const controlsTimer   = useRef<ReturnType<typeof setTimeout>>();
  const speedMenuRef    = useRef<HTMLDivElement>(null);
  const burstId         = useRef(0);

  // â”€â”€ Playback sync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    isPlaying ? v.play().catch(() => {}) : v.pause();
  }, [isPlaying]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed]);

  // â”€â”€ Auto-hide controls overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const flashControls = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 2800);
  }, []);

  // â”€â”€ Time helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const pct = (v.currentTime / v.duration) * 100;
    setProgress(pct);
    setCurrentTime(v.currentTime);
    onProgress?.(pct);
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
  };

  // â”€â”€ Double-tap engine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't propagate into speed menu
    if (speedMenuRef.current?.contains(e.target as Node)) return;

    const rect    = e.currentTarget.getBoundingClientRect();
    const tapX    = e.clientX - rect.left;
    const tapY    = e.clientY - rect.top;
    const isLeft  = tapX < rect.width / 2;
    const side    = isLeft ? 'left' : 'right';
    const now     = Date.now();
    const delta   = now - lastTap.current.time;

    if (delta < 300 && lastTap.current.side === side) {
      // Double-tap detected
      const v = videoRef.current;
      if (v) {
        v.currentTime = isLeft
          ? Math.max(0, v.currentTime - 10)
          : Math.min(v.duration, v.currentTime + 10);
      }
      setTapSide(side);
      setTimeout(() => setTapSide(null), 650);

      if (!isLeft) {
        // Spawn heart burst at tap position
        const id = burstId.current++;
        setHeartBursts(prev => [...prev, { id, x: tapX, y: tapY }]);
        setTimeout(() => setHeartBursts(prev => prev.filter(b => b.id !== id)), 900);
      }
    } else {
      // Single tap â€” toggle play/pause & flash controls
      setTimeout(() => {
        if (Date.now() - now >= 290) {
          onPlayPause();
          flashControls();
        }
      }, 300);
    }
    lastTap.current = { time: now, side };
  };

  // â”€â”€ YouTube embed shortcut â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (video.source === 'youtube') {
    const ytId = video.videoUrl.split('/').pop()?.split('?')[0] ?? '';
    return (
      <div className="relative w-full h-full bg-black">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${ytId}?autoplay=${isPlaying ? 1 : 0}&controls=1&modestbranding=1&rel=0&playsinline=1`}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <span className="w-9 h-9 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }

  const resolvedUrl = video.source === 'bunny'
    ? (typeof getBunnyCdnUrl !== 'undefined' ? getBunnyCdnUrl(video.videoUrl) : video.videoUrl)
    : video.videoUrl;

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden">
      {/* â”€â”€ Core video element â”€â”€ */}
      <video
        ref={videoRef}
        src={resolvedUrl}
        className="w-full h-full object-cover"
        playsInline
        autoPlay={isPlaying}
        onEnded={onEnded}
        onLoadedData={() => {
          setLoaded(true);
          setDuration(videoRef.current?.duration ?? 0);
        }}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setLoaded(false)}
        onCanPlay={() => setLoaded(true)}
      />

      {/* â”€â”€ Invisible tap zone (full coverage) â”€â”€ */}
      <div className="absolute inset-0 z-10" onClick={handleTap} />

      {/* â”€â”€ Loading spinner â”€â”€ */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            key="spinner"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 pointer-events-none"
          >
            <div className="w-12 h-12 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Pause overlay â”€â”€ */}
      <AnimatePresence>
        {!isPlaying && loaded && (
          <motion.div
            key="pause"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.7 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="w-[72px] h-[72px] rounded-full bg-white/90 flex items-center justify-center shadow-2xl"
            >
              <Play size={34} className="text-black ml-1" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Double-tap seek flash â”€â”€ */}
      <AnimatePresence>
        {tapSide && (
          <motion.div
            key={`flash-${tapSide}`}
            initial={{ opacity: 0.95, scale: 0.75 }}
            animate={{ opacity: 0, scale: 1.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className={`absolute top-1/2 -translate-y-1/2 z-30 pointer-events-none
              w-[90px] h-[90px] rounded-full bg-white/15 backdrop-blur-sm
              flex flex-col items-center justify-center gap-1
              ${tapSide === 'left' ? 'left-8' : 'right-8'}`}
          >
            <span className="text-white text-xl font-bold font-mono">
              {tapSide === 'left' ? 'âˆ’10s' : '+10s'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Heart burst particles (right double-tap) â”€â”€ */}
      <AnimatePresence>
        {heartBursts.map(burst => (
          <motion.div
            key={burst.id}
            initial={{ opacity: 1, scale: 0.4, x: burst.x - 20, y: burst.y - 20 }}
            animate={{ opacity: 0, scale: 1.8, y: burst.y - 100 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-40 pointer-events-none text-[#e11d48] text-4xl leading-none"
            style={{ left: 0, top: 0 }}
          >
            â¤ï¸
          </motion.div>
        ))}
      </AnimatePresence>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          TOP-RIGHT CONTROLS HUD
          Mute toggle + Speed control (always visible, z above tap zone)
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div className="absolute top-4 right-4 z-40 flex flex-col items-end gap-2">

        {/* Mute button */}
        <button
          onClick={e => { e.stopPropagation(); setIsMuted(m => !m); }}
          className="p-2.5 bg-black/55 backdrop-blur-lg rounded-2xl border border-white/10
                     hover:bg-black/70 transition-colors active:scale-95"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted
            ? <VolumeX size={18} className="text-white" />
            : <Volume2  size={18} className="text-white" />
          }
        </button>

        {/* Speed control */}
        <div className="relative" ref={speedMenuRef}>
          <button
            onClick={e => { e.stopPropagation(); setShowSpeedHUD(s => !s); }}
            className="px-3 py-2 bg-black/55 backdrop-blur-lg rounded-2xl border border-white/10
                       text-white text-xs font-mono font-bold tracking-wide
                       hover:bg-black/70 transition-colors active:scale-95 min-w-[44px] text-center"
          >
            {speed}Ã—
          </button>

          <AnimatePresence>
            {showSpeedHUD && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -6 }}
                transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                className="absolute right-0 top-11 z-50 bg-[#0d0d0d]/96 backdrop-blur-2xl
                           border border-[#333] rounded-2xl overflow-hidden w-[86px] shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {PLAYBACK_SPEEDS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSpeed(s); setShowSpeedHUD(false); }}
                    className={`w-full py-2.5 text-center text-sm font-mono transition-colors
                      ${speed === s
                        ? 'bg-[#c5a26f] text-black font-bold'
                        : 'text-white hover:bg-[#1a1a1a]'
                      }`}
                  >
                    {s}Ã—
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          MICRO PROGRESS TIMELINE
          Absolute bottom â€” slim, interactive, hover expands
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 group/bar cursor-pointer pb-0"
        onClick={e => { e.stopPropagation(); seekTo(e); }}
        style={{ paddingBottom: 0 }}
      >
        {/* Time readout â€” appears on hover */}
        <div
          className="absolute bottom-3 right-3 text-[10px] font-mono text-white/50
                     opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
        >
          {fmt(currentTime)} / {fmt(duration)}
        </div>

        {/* Track */}
        <div
          className="relative bg-white/15 transition-all duration-150"
          style={{ height: 'var(--bar-h, 3px)' }}
          onMouseEnter={e => (e.currentTarget.style.setProperty('--bar-h', '6px'))}
          onMouseLeave={e => (e.currentTarget.style.setProperty('--bar-h', '3px'))}
        >
          {/* Filled portion */}
          <div
            className="absolute left-0 top-0 h-full bg-[#c5a26f] transition-all"
            style={{ width: `${progress}%` }}
          >
            {/* Scrubber thumb */}
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4
                         rounded-full bg-[#c5a26f] shadow-lg
                         opacity-0 group-hover/bar:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Prevent TS errors when getBunnyCdnUrl isn't directly imported
declare function getBunnyCdnUrl(path: string): string;


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SHORTS PLAYER PAGE  (TikTok-style scroll-snap feed)
// Replaces the original ShortsPlayerPage entirely.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

export function ShortsPlayerPage() {
  const { id }          = useParams<{ id: string }>();
  const navigate        = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { isSubscribed } = (React as any).useContext(AuthContextShim);

  const [feedVideos,    setFeedVideos]    = useState<Video[]>([]);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [isPlaying,     setIsPlaying]     = useState(true);
  const [isLiked,       setIsLiked]       = useState(false);
  const [showPaywall,   setShowPaywall]   = useState(false);
  const [library,       setLibrary]       = useState<number[]>([]);
  const [userRating,    setUserRating]    = useState(0);

  // Scroll-snap refs
  const feedRef         = useRef<HTMLDivElement>(null);
  const itemRefs        = useRef<Array<HTMLDivElement | null>>([]);
  const isScrolling     = useRef(false);

  // Touch/wheel tracking
  const touchStartY     = useRef(0);
  const wheelAccum      = useRef(0);
  const wheelTimer      = useRef<ReturnType<typeof setTimeout>>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fetchVideos   = (window as any).__rr_fetchVideos__    ?? (() => Promise.resolve([]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lsHelper      = (window as any).__rr_ls__             ?? { get: (_k: string, d: unknown) => d, set: () => {} };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addHistory    = (window as any).__rr_addHistory__     ?? (() => {});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incView       = (window as any).__rr_incView__        ?? (() => {});

  const currentVideoId = parseInt(id ?? '1', 10);

  useEffect(() => {
    fetchVideos().then((vids: Video[]) => {
      setFeedVideos(vids);
      const idx = vids.findIndex((v: Video) => v.id === currentVideoId);
      setCurrentIndex(idx !== -1 ? idx : 0);
    });
    setLibrary(lsHelper.get('reelramp_library', []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVideoId]);

  const currentShort = feedVideos[currentIndex];

  // Track history + views on index change
  useEffect(() => {
    if (!currentShort) return;
    addHistory(currentShort.id, 0);
    incView(currentShort.id);
    const ratings = lsHelper.get('reelramp_ratings', {});
    setUserRating(ratings[currentShort.id] ?? 0);
    setIsLiked(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentShort]);

  // â”€â”€ Scroll the snap container programmatically â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const scrollToIndex = useCallback((idx: number) => {
    const el = itemRefs.current[idx];
    if (!el || isScrolling.current) return;
    isScrolling.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => { isScrolling.current = false; }, 600);
  }, []);

  // â”€â”€ Paywall gate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const checkPremium = useCallback((): boolean => {
    if (currentShort?.isPremium && !isSubscribed) {
      setShowPaywall(true);
      setIsPlaying(false);
      return false;
    }
    return true;
  }, [currentShort, isSubscribed]);

  // â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const goNext = useCallback(() => {
    if (currentIndex < feedVideos.length - 1 && checkPremium()) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      scrollToIndex(next);
      setIsPlaying(true);
    }
  }, [currentIndex, feedVideos.length, checkPremium, scrollToIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      setCurrentIndex(prev);
      scrollToIndex(prev);
      setIsPlaying(true);
    }
  }, [currentIndex, scrollToIndex]);

  // â”€â”€ Touch handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(delta) > 55) { delta > 0 ? goNext() : goPrev(); }
  };

  // â”€â”€ Mouse-wheel handler (desktop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    wheelAccum.current += e.deltaY;
    clearTimeout(wheelTimer.current);
    wheelTimer.current = setTimeout(() => {
      if (Math.abs(wheelAccum.current) > 60) {
        wheelAccum.current > 0 ? goNext() : goPrev();
      }
      wheelAccum.current = 0;
    }, 80);
  }, [goNext, goPrev]);

  // â”€â”€ Library toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleSave = () => {
    if (!currentShort) return;
    const updated = library.includes(currentShort.id)
      ? library.filter(x => x !== currentShort.id)
      : [...library, currentShort.id];
    setLibrary(updated);
    lsHelper.set('reelramp_library', updated);
  };

  // â”€â”€ Share â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleShare = () => {
    const url = `${window.location.origin}/player/${currentShort?.id}`;
    if (navigator.share) { void navigator.share({ title: currentShort?.title, url }); }
    else { void navigator.clipboard.writeText(url); }
  };

  const handleEnded = () => {
    if (currentShort) addHistory(currentShort.id, 100);
    goNext();
  };

  const rateVideo = (star: number) => {
    if (!currentShort) return;
    setUserRating(star);
    const ratings = lsHelper.get('reelramp_ratings', {});
    ratings[currentShort.id] = star;
    lsHelper.set('reelramp_ratings', ratings);
  };

  if (!currentShort) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black z-50 overflow-hidden"
      style={{ touchAction: 'none' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onWheel={onWheel}
    >
      {/* â”€â”€ TOP BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center
                   px-5 pt-10 pb-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
      >
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-black/40 rounded-2xl backdrop-blur-md pointer-events-auto"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-xs tracking-[3px] text-white/60 font-medium">
          {currentShort.category.toUpperCase()} Â· {currentShort.duration}
        </div>
        <div className="text-sm px-3 py-1 bg-white/10 rounded-full font-mono pointer-events-auto">
          {currentIndex + 1}/{feedVideos.length}
        </div>
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
          SCROLL-SNAP FEED CONTAINER
          Each card snaps to 100dvh. JS also calls scrollIntoView for smooth nav.
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      <div
        ref={feedRef}
        className="w-full h-full overflow-y-scroll"
        style={{
          scrollSnapType:  'y mandatory',
          scrollbarWidth:  'none',
          msOverflowStyle: 'none',
        }}
      >
        {feedVideos.map((video, idx) => (
          <div
            key={video.id}
            ref={el => { itemRefs.current[idx] = el; }}
            className="relative w-full flex items-center justify-center bg-black"
            style={{
              height:          '100dvh',
              scrollSnapAlign: 'start',
              scrollSnapStop:  'always',
              flexShrink:      0,
            }}
          >
            {/* Only fully mount the player for current Â± 1 indices to save memory */}
            {Math.abs(idx - currentIndex) <= 1 && (
              <div className="relative w-full max-w-[480px] h-full">
                <PremiumVideoPlayer
                  video={video}
                  isPlaying={isPlaying && idx === currentIndex}
                  onPlayPause={() => {
                    if (idx === currentIndex) {
                      if (!checkPremium()) return;
                      setIsPlaying(p => !p);
                    }
                  }}
                  onEnded={idx === currentIndex ? handleEnded : () => {}}
                  onProgress={() => {}}
                />

                {/* â”€â”€ Bottom info overlay â”€â”€ */}
                <div
                  className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none
                             bg-gradient-to-t from-black/95 via-black/70 to-transparent
                             px-5 pb-[76px] pt-20"
                >
                  <div className="max-w-[300px]">
                    <h2 className="text-[1.65rem] font-semibold tracking-[-1px] leading-tight text-white mb-1.5">
                      {video.title}
                    </h2>
                    <p className="text-sm text-white/65 leading-snug line-clamp-2 pr-16">
                      {video.description}
                    </p>
                    {/* Star rating â€” interactive */}
                    {idx === currentIndex && (
                      <div className="flex items-center gap-2 mt-3 pointer-events-auto">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button
                              key={s}
                              onClick={() => rateVideo(s)}
                              className="text-lg transition-transform active:scale-125"
                            >
                              <span className={s <= userRating ? 'text-[#c5a26f]' : 'text-white/30'}>â˜…</span>
                            </button>
                          ))}
                        </div>
                        <span className="text-[11px] text-white/40">Rate this</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* â”€â”€ Right action rail â”€â”€ */}
                {idx === currentIndex && (
                  <div className="absolute right-4 bottom-[90px] z-30 flex flex-col items-center gap-5">
                    {/* Like */}
                    <button
                      onClick={() => setIsLiked(l => !l)}
                      className="flex flex-col items-center gap-1"
                    >
                      <motion.div
                        animate={{ scale: isLiked ? [1, 1.45, 1] : 1 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 400 }}
                        className={`p-4 rounded-2xl transition-colors ${
                          isLiked ? 'bg-[#e11d48]' : 'bg-black/55 backdrop-blur-md'
                        }`}
                      >
                        <Heart size={24} className={isLiked ? 'fill-white text-white' : 'text-white'} />
                      </motion.div>
                      <span className="text-[9px] tracking-widest text-white/60">LIKE</span>
                    </button>

                    {/* Save */}
                    <button onClick={toggleSave} className="flex flex-col items-center gap-1">
                      <div className="p-4 rounded-2xl bg-black/55 backdrop-blur-md">
                        <Bookmark
                          size={24}
                          className={library.includes(video.id)
                            ? 'fill-[#c5a26f] text-[#c5a26f]'
                            : 'text-white'}
                        />
                      </div>
                      <span className="text-[9px] tracking-widest text-white/60">SAVE</span>
                    </button>

                    {/* Share */}
                    <button onClick={handleShare} className="flex flex-col items-center gap-1">
                      <div className="p-4 rounded-2xl bg-black/55 backdrop-blur-md">
                        <Share2 size={24} className="text-white" />
                      </div>
                      <span className="text-[9px] tracking-widest text-white/60">SHARE</span>
                    </button>

                    {/* Lock / Subscribe CTA */}
                    {video.isPremium && !isSubscribed && (
                      <button
                        onClick={() => setShowPaywall(true)}
                        className="flex flex-col items-center gap-1 mt-1"
                      >
                        <div className="p-3.5 bg-[#e11d48] rounded-2xl">
                          <Lock size={22} className="text-white" />
                        </div>
                        <span className="text-[9px] text-[#e11d48] font-semibold tracking-wider">
                          UNLOCK
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* â”€â”€ Swipe hint arrows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[76px] z-40 pointer-events-none opacity-35">
        {currentIndex > 0 && (
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          >
            <ChevronUp size={22} className="text-white" />
          </motion.div>
        )}
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 bottom-[84px] z-40 pointer-events-none opacity-35">
        {currentIndex < feedVideos.length - 1 && (
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.4 }}
          >
            <ChevronDown size={22} className="text-white" />
          </motion.div>
        )}
      </div>

      {/* â”€â”€ Bottom nav controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="absolute bottom-0 left-0 right-0 z-40 px-6 pb-8 pt-4
                   bg-gradient-to-t from-black/80 to-transparent"
      >
        <div className="flex items-center justify-between max-w-[420px] mx-auto">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="p-4 disabled:opacity-25 text-white transition"
          >
            <ArrowLeft size={22} />
          </button>

          <button
            onClick={() => { if (checkPremium()) setIsPlaying(p => !p); }}
            className="p-4 bg-white/10 hover:bg-white/20 transition rounded-2xl backdrop-blur-xl"
          >
            {isPlaying
              ? <Pause size={26} className="text-white" />
              : <Play  size={26} className="text-white ml-0.5" />
            }
          </button>

          <button
            onClick={goNext}
            disabled={currentIndex >= feedVideos.length - 1}
            className="p-4 disabled:opacity-25 text-white text-sm font-semibold tracking-wider"
          >
            NEXT
          </button>
        </div>
      </div>

      {/* â”€â”€ Paywall modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {showPaywall && (
          <PaywallShim
            video={currentShort}
            onClose={() => setShowPaywall(false)}
            onSubscribe={() => { setShowPaywall(false); navigate('/subscription'); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Inline PaywallShim â€” replace with your real PaywallModal import in App.tsx
function PaywallShim({
  video, onClose, onSubscribe,
}: { video: Video; onClose: () => void; onSubscribe: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ ease: [0.23, 1, 0.32, 1] }}
        className="bg-[#111] w-full max-w-md rounded-3xl overflow-hidden border border-[#333]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-6">
            <Lock className="text-[#c5a26f]" size={32} />
          </div>
          <h3 className="text-3xl font-semibold tracking-tight mb-2 text-white">Premium Content</h3>
          <p className="text-[#a1a1aa] mb-7 text-[15px]">
            Unlock <span className="text-white font-medium">"{video.title}"</span> with a ReelRamp subscription.
          </p>
          <div className="flex flex-col gap-3">
            <button onClick={onSubscribe}
              className="w-full py-4 bg-[#c5a26f] text-black rounded-2xl font-semibold text-base tracking-wider">
              SUBSCRIBE TO UNLOCK
            </button>
            <button onClick={onClose} className="text-sm text-[#555] py-2">Maybe Later</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INTEGRATION GUIDE  (read this before copy-pasting)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//
// STEP 1 â€” expose shared helpers on window (or just import them directly):
//
//   In App.tsx, add after the helpers are defined:
//
//     (window as any).__reelramp_supabase__  = supabase;
//     (window as any).__rr_fetchVideos__     = fetchVideosFromDB;
//     (window as any).__rr_getWatchHistory__ = getWatchHistory;
//     (window as any).__rr_addHistory__      = addToWatchHistory;
//     (window as any).__rr_incView__         = incrementView;
//     (window as any).__rr_ls__             = ls;
//
//   OR (cleaner) just import the functions from the original file since
//   everything lives in App.tsx. Delete the window shims above and replace
//   every reference to them with the direct function call.
//
// STEP 2 â€” wire AuthContextShim to your real AuthContext:
//
//   Replace every `(React as any).useContext(AuthContextShim)` with:
//     const { user, isSubscribed, signOut, loading } = useAuth();
//
// STEP 3 â€” update AppContent routes in App.tsx:
//
//   <Route path="/"        element={<GuestRoute><HomePage /></GuestRoute>} />
//   <Route path="/player/:id" element={<GuestRoute><ShortsPlayerPage /></GuestRoute>} />
//   <Route path="/login"   element={<LoginPage />} />
//   <Route path="/profile" element={<ProfilePage />} />   â† no longer requires login
//
// STEP 4 â€” remove the old `if (!loading && !user) navigate('/login')` guard
//   from ProfilePage (it's already removed in the version above).
//
// STEP 5 â€” replace the original PremiumVideoPlayer, LoginPage, ProfilePage,
//   and ShortsPlayerPage functions with the four exported above.
//
// STEP 6 â€” the scroll-snap CSS is applied via inline styles and Tailwind.
//   No extra CSS file needed. The `no-scrollbar` utility already exists in
//   your project (it's used in your original code); if it doesn't:
//
//     /* globals.css */
//     .no-scrollbar::-webkit-scrollbar { display: none; }
//     .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
//
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// UNUSED ICONS (kept for completeness, remove if tree-shaking warns):
// Chrome, Star, CheckCircle â€” used by AuthForms & ProfilePage above.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// Silence unused-import warnings for icons referenced in JSX:
void Chrome; void Star; void CheckCircle;
