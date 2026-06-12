import { initiatePayment } from './paymentHelper';
import { FormEvent, ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Bookmark, Crown, Download, Edit3, Facebook, FileJson, FileText, Film,
  Gift, Heart, Home, Instagram, Loader2, Lock, Maximize, MessageCircle, Palette,
  Pause, Play, Plus, RefreshCw, Search, Share2, ShieldCheck, Sparkles, Trash2,
  User, Volume2, VolumeX, Wallet, X, Youtube, Bell, CheckCircle2, AlertCircle,
  Calendar, CreditCard, TrendingUp, Users, DollarSign, Clock, RotateCcw,
  BarChart2, Zap, Shield, RefreshCcw, Ban, ChevronRight, Info as InfoIcon,
  Image, Link, Phone
} from 'lucide-react';
import supabase from './lib/supabase';
import { handleGoogleRedirect, signInWithGoogle } from './lib/googleAuth';
import type { Session } from '@supabase/supabase-js';

handleGoogleRedirect();

// ─── TYPES ───────────────────────────────────────────────────────────────────
type Row = { id: number; [k: string]: any };
type Video = Row & {
  title: string; description: string; series_title: string; episode_number: number;
  video_filename: string; thumbnail_url: string; is_premium: boolean;
  is_published: boolean; duration_seconds: number; category: string;
  bunny_video_id?: string; bunny_embed_url?: string;
};
type Category = Row & { name: string; slug: string; icon: string; sort_order: number; is_active: boolean };
type Plan = Row & {
  name: string; price: number; duration_days: number; features: any;
  is_active: boolean; sort_order: number; plan_type?: string;
  supports_autorenew?: boolean; trial_days?: number;
  cf_plan_id?: string;
};
type UserRow = Row & {
  guest_id: string; display_name: string; email: string;
  role: string; is_admin: boolean; phone?: string; avatar_url?: string;
  cf_customer_id?: string;
};
type Subscription = Row & {
  user_id: string; plan: string; plan_id?: number; status: string;
  expires_at: string; created_at: string; auto_renew?: boolean;
  renewal_date?: string; cancelled_at?: string; gateway?: string;
  mandate_id?: string; cf_subscription_id?: string;
};
type Payment = Row & {
  user_id: string; plan_id?: number; amount: number; gateway: string;
  status: string; notes?: string; created_at: string;
  transaction_id?: string; cf_order_id?: string; cf_payment_id?: string; refund_status?: string;
};
type Notification = Row & {
  title: string; message: string; target: string; is_active: boolean;
  type?: 'info' | 'success' | 'warning' | 'error'; created_at?: string; read?: boolean;
};
type GatewayConfig = {
  id: string; name: string; type: string; enabled: boolean; isDefault: boolean;
  testMode: boolean; keys: Record<string, string>;
  webhookSecret?: string; healthStatus?: 'ok' | 'error' | 'unknown';
};
type PaymentSettings = {
  gateways: GatewayConfig[];
  whatsapp: string; instructions: string;
  monthlyPrice: number; annualPrice: number;
  gateway?: string; razorpayKey?: string; razorpaySecret?: string;
  upiId?: string; upiQr?: string; webhookSecret?: string; testMode?: boolean;
};
type BrandSettings = {
  brand: string; logoText: string; logoImageUrl: string;
  primary: string; accent: string; bg: string; radius: string;
};
type Ctx = {
  data: Record<string, Row[]>; videos: Video[]; categories: Category[];
  plans: Plan[]; user: UserRow | null; guestId: string; loading: boolean;
  subscribed: boolean; activeSub: Subscription | null; theme: BrandSettings;
  payment: PaymentSettings; player: any;
  refresh: (silent?: boolean) => Promise<void>;
  mutate: (r: string, m: 'POST' | 'PUT' | 'DELETE', b: Record<string, any>) => Promise<any>;
  addNotif: (n: Omit<Notification, 'id' | 'is_active'>) => void;
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const AppContext = createContext<Ctx | null>(null);
const CDN = (import.meta.env.VITE_BUNNY_CDN_URL || '').replace(/\/$/, '') + '/';
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'RRPRO2026';
const resources = [
  'videos', 'series', 'categories', 'banners', 'popup_settings', 'platform_settings',
  'admin_settings', 'legal_policies', 'plans', 'users', 'subscriptions', 'payments',
  'watch_history', 'likes', 'bookmarks', 'video_views', 'support_tickets',
  'promo_campaigns', 'notifications', 'promo_events', 'audit_logs', 'referrals',
  'wallet_transactions', 'content_reports', 'error_logs', 'help_articles',
  'push_subscriptions'
];
const defaultTheme: BrandSettings = {
  brand: 'ReelRamp Pro', logoText: 'RR', logoImageUrl: '',
  primary: '#c5a26f', accent: '#ff4f8b',
  bg: '#fff7ed', radius: '30px'
};
const defaultPayment: PaymentSettings = {
  gateways: [], whatsapp: '+917307493338', instructions: '',
  monthlyPrice: 99, annualPrice: 899
};
const defaultPlayer = {
  mode: 'default', bunnyEmbedBase: 'https://iframe.mediadelivery.net/embed',
  bunnyLibraryId: '', autoplay: true, muted: false, responsive: true, controls: true
};
const fallbackImages = {
  hero: '/images/reelramp-hero.jpg',
  studio: '/images/reelramp-studio.jpg',
  promo: '/images/reelramp-promo.jpg'
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const api = (r: string) => `/api/${r}`;
const gid = () => `guest_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const vurl = (f: string) => !f ? '' : f.startsWith('http') ? f : `${CDN}${f}`;
const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const ftime = (n: number) => `${Math.floor((n || 0) / 60)}:${Math.floor((n || 0) % 60).toString().padStart(2, '0')}`;
const isInstalledApp = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true ||
  localStorage.getItem('rr_install_completed') === '1';
const bunnyIframeUrl = (video: Video, player: any) => {
  if (video.bunny_embed_url) return video.bunny_embed_url;
  const id = video.bunny_video_id || video.video_filename;
  const base = String(player?.bunnyEmbedBase || defaultPlayer.bunnyEmbedBase).replace(/\/$/, '');
  const lib = player?.bunnyLibraryId ? `/${player.bunnyLibraryId}` : '';
  const qs = new URLSearchParams({
    autoplay: String(player?.autoplay !== false),
    muted: String(!!player?.muted), preload: 'true',
    responsive: String(player?.responsive !== false)
  });
  return `${base}${lib}/${encodeURIComponent(id || '')}?${qs.toString()}`;
};

// ── FIX: Get best display name (never show raw email as name) ──
const getBestDisplayName = (u: UserRow | null, fallback = 'User'): string => {
  if (!u) return fallback;
  const dn = u.display_name?.trim() || '';
  // If display_name IS the email address, extract the part before @
  if (dn && dn.includes('@')) {
    return dn.split('@')[0].replace(/[._]/g, ' ').split(' ').map(
      w => w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  }
  if (dn) return dn;
  if (u.email) return u.email.split('@')[0];
  return fallback;
};

const migratePayment = (raw: any): PaymentSettings => {
  if (!raw) return defaultPayment;
  if (Array.isArray(raw.gateways)) return { ...defaultPayment, ...raw };
  const gateways: GatewayConfig[] = [];
  if (raw.razorpayKey || raw.gateway === 'Razorpay') {
    gateways.push({
      id: 'rzp_1', name: 'Razorpay', type: 'Razorpay', enabled: !!(raw.razorpayKey),
      isDefault: true, testMode: !!raw.testMode,
      keys: { keyId: raw.razorpayKey || '', keySecret: raw.razorpaySecret || '' },
      webhookSecret: raw.webhookSecret || '', healthStatus: 'unknown'
    });
  }
  if (raw.upiId) {
    gateways.push({
      id: 'upi_1', name: 'UPI Manual', type: 'UPI Manual', enabled: true,
      isDefault: gateways.length === 0, testMode: false,
      keys: { upiId: raw.upiId || '', upiQr: raw.upiQr || '' },
      healthStatus: 'ok'
    });
  }
  return {
    gateways, whatsapp: raw.whatsapp || defaultPayment.whatsapp,
    instructions: raw.instructions || '',
    monthlyPrice: raw.monthlyPrice || 99,
    annualPrice: raw.annualPrice || 899,
    gateway: raw.gateway, razorpayKey: raw.razorpayKey, razorpaySecret: raw.razorpaySecret,
    upiId: raw.upiId, upiQr: raw.upiQr, webhookSecret: raw.webhookSecret, testMode: raw.testMode
  };
};

// ─── RAZORPAY INTEGRATION ────────────────────────────────────────────────────
declare global { interface Window { Razorpay: any } }

const loadRazorpay = (): Promise<boolean> =>
  new Promise(resolve => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });

const openRazorpay = async (opts: {
  keyId: string; amount: number; planName: string; userName: string;
  userEmail: string; userPhone?: string; testMode: boolean;
  onSuccess: (data: { paymentId: string; orderId?: string; signature?: string }) => void;
  onFailure: (err: string) => void;
}) => {
  const loaded = await loadRazorpay();
  if (!loaded) { opts.onFailure('Razorpay load nahi hua. Internet check karein.'); return; }
  const amountPaise = Math.round(opts.amount * 100);
  const rzp = new window.Razorpay({
    key: opts.keyId, amount: amountPaise, currency: 'INR',
    name: 'ReelRamp Pro', description: opts.planName,
    prefill: { name: opts.userName || '', email: opts.userEmail || '' },
    theme: { color: '#c5a26f' },
    handler: (response: any) => opts.onSuccess({
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id,
      signature: response.razorpay_signature
    }),
    modal: { ondismiss: () => opts.onFailure('Payment cancel ho gaya') }
  });
  rzp.open();
};

// ─── CASHFREE INTEGRATION ────────────────────────────────────────────────────
const loadCashfree = (testMode: boolean): Promise<boolean> =>
  new Promise(resolve => {
    if ((window as any).Cashfree) return resolve(true);
    const s = document.createElement('script');
    s.src = testMode
      ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
      : 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });

// Create Cashfree order via your backend API
const createCashfreeOrder = async (opts: {
  appId: string; secretKey: string; testMode: boolean;
  amount: number; planName: string; userId: string;
  userName: string; userEmail: string; userPhone: string;
}): Promise<{ orderId: string; paymentSessionId: string } | null> => {
  try {
    // Call your Netlify/Vercel function or direct Cashfree API
    const baseUrl = opts.testMode
      ? 'https://sandbox.cashfree.com/pg/orders'
      : 'https://api.cashfree.com/pg/orders';

    const orderData = {
      order_id: `rrp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      order_amount: opts.amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: opts.userId,
        customer_name: opts.userName || 'ReelRamp User',
        customer_email: opts.userEmail || 'user@reelramp.com',
        customer_phone: opts.userPhone || '9999999999'
      },
      order_meta: {
        return_url: `${window.location.origin}?cf_order={order_id}&cf_payment={payment_id}`,
        notify_url: `${window.location.origin}/api/cashfree-webhook`
      },
      order_note: opts.planName
    };

    // Use backend proxy to avoid CORS & keep secret safe
    const res = await fetch('/api/cashfree-create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderData, testMode: opts.testMode })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Order create nahi hua');
    }
    const data = await res.json();
    return { orderId: data.order_id, paymentSessionId: data.payment_session_id };
  } catch (e: any) {
    console.error('Cashfree order error:', e);
    return null;
  }
};

const openCashfreeCheckout = async (opts: {
  appId: string; secretKey: string; testMode: boolean;
  amount: number; planName: string;
  userId: string; userName: string; userEmail: string; userPhone: string;
  onSuccess: (data: { orderId: string; paymentId: string }) => void;
  onFailure: (err: string) => void;
}) => {
  const loaded = await loadCashfree(opts.testMode);
  if (!loaded) { opts.onFailure('Cashfree load nahi hua. Internet check karein.'); return; }

  const orderData = await createCashfreeOrder(opts);
  if (!orderData) { opts.onFailure('Order create nahi hua. Dobara try karein.'); return; }

  const cf = new (window as any).Cashfree({ mode: opts.testMode ? 'sandbox' : 'production' });
  cf.checkout({
    paymentSessionId: orderData.paymentSessionId,
    redirectTarget: '_modal',
    onSuccess: (data: any) => opts.onSuccess({
      orderId: orderData.orderId,
      paymentId: data?.transaction?.transactionId || data?.payment?.payment_id || ''
    }),
    onFailure: (data: any) => opts.onFailure(data?.transaction?.txMsg || 'Payment fail ho gaya'),
    onClose: () => opts.onFailure('Payment window band ho gayi')
  });
};

// Create Cashfree Subscription (auto-pay mandate)
const createCashfreeSubscription = async (opts: {
  testMode: boolean; planName: string; amount: number; intervalDays: number;
  userId: string; userName: string; userEmail: string; userPhone: string;
  cfPlanId?: string;
  onSuccess: (data: { subscriptionId: string; authLink: string }) => void;
  onFailure: (err: string) => void;
}) => {
  try {
    const res = await fetch('/api/cashfree-create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planName: opts.planName, amount: opts.amount,
        intervalDays: opts.intervalDays, userId: opts.userId,
        userName: opts.userName, userEmail: opts.userEmail,
        userPhone: opts.userPhone, cfPlanId: opts.cfPlanId,
        testMode: opts.testMode,
        returnUrl: `${window.location.origin}?cf_sub=success`
      })
    });
    if (!res.ok) throw new Error('Subscription create nahi hua');
    const data = await res.json();
    opts.onSuccess({ subscriptionId: data.subscription_id, authLink: data.auth_link });
  } catch (e: any) {
    opts.onFailure(e.message || 'Auto-pay setup nahi hua');
  }
};

// ─── SUBSCRIPTION HELPERS ────────────────────────────────────────────────────
const isSubActive = (sub: Subscription | null) =>
  !!sub && sub.status === 'active' && new Date(sub.expires_at).getTime() > Date.now();

const daysLeft = (sub: Subscription | null) => {
  if (!sub) return 0;
  return Math.max(0, Math.floor((new Date(sub.expires_at).getTime() - Date.now()) / 86400000));
};

// ─── PROVIDER ────────────────────────────────────────────────────────────────
function Provider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Record<string, Row[]>>({});
  const [user, setUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [localNotifs, setLocalNotifs] = useState<Notification[]>([]);
  const [guestId] = useState(() => {
    const s = localStorage.getItem('rr_guest');
    if (s) return s;
    const n = gid();
    localStorage.setItem('rr_guest', n);
    return n;
  });

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const fetchWithRetry = async (url: string, retries = 1): Promise<any> => {
        try {
          const r = await fetch(url);
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return await r.json();
        } catch (e) {
          if (retries > 0) {
            await new Promise(res => setTimeout(res, 700));
            return fetchWithRetry(url, retries - 1);
          }
          return [];
        }
      };

      const calls = resources.map(r => fetchWithRetry(
        r === 'videos' ? '/api/videos?includeUnpublished=true' :
          r === 'users' ? `/api/users?guest_id=${guestId}` :
            r === 'subscriptions' || r === 'payments' || r === 'watch_history' ||
              r === 'likes' || r === 'bookmarks' || r === 'wallet_transactions' ||
              r === 'referrals' ? `/api/${r}?user_id=${guestId}` : `/api/${r}`
      ));
      const vals = await Promise.all(calls);
      const next: Record<string, Row[]> = {};
      resources.forEach((r, i) => next[r] = Array.isArray(vals[i]) ? vals[i] : []);
      setData(next);
      if (next.users?.[0]) setUser(next.users[0] as UserRow);
      else {
        const cr = await fetch('/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guest_id: guestId, display_name: `Viewer ${guestId.slice(-4)}`, email: '', role: 'viewer' })
        });
        const u = await cr.json();
        setUser(u); next.users = [u]; setData({ ...next });
      }
    } finally { setLoading(false); }
  }, [guestId]);

  const mutate = useCallback(async (r: string, m: 'POST' | 'PUT' | 'DELETE', b: Record<string, any>) => {
    const res = await fetch(api(r), {
      method: m, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b)
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || 'Action failed');
    await refresh(true);
    window.dispatchEvent(new CustomEvent('supabase-data-updated'));
    return j;
  }, [refresh]);

  const addNotif = useCallback((n: Omit<Notification, 'id' | 'is_active'>) => {
    setLocalNotifs(prev => [...prev, { ...n, id: Date.now(), is_active: true }]);
  }, []);

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const h = () => setTimeout(() => refresh(true), 1500);
    window.addEventListener('supabase-data-updated', h);
    return () => window.removeEventListener('supabase-data-updated', h);
  }, [guestId, refresh]);

  // ── AUTH: Google / Email login — FIX display name ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session?.user?.email) {
        localStorage.setItem('rr_guest', session.user.id);
        const rawName = session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name || '';
        // Never set email as display_name
        const cleanName = rawName && !rawName.includes('@') ? rawName :
          session.user.email!.split('@')[0].replace(/[._]/g, ' ')
            .split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        fetch('/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guest_id: session.user.id,
            display_name: cleanName,
            email: session.user.email, role: 'viewer'
          })
        }).then(() => refresh(true));
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: Session | null) => {
      if (session?.user?.email) {
        localStorage.setItem('rr_guest', session.user.id);
        const rawName = session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name || '';
        const cleanName = rawName && !rawName.includes('@') ? rawName :
          session.user.email!.split('@')[0].replace(/[._]/g, ' ')
            .split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        fetch('/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guest_id: session.user.id,
            display_name: cleanName,
            email: session.user.email, role: 'viewer'
          })
        }).then(() => refresh(true));
      }
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  // ── Cashfree return URL handler ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cfOrder = params.get('cf_order');
    const cfSub = params.get('cf_sub');
    if (cfOrder || cfSub) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Refresh to pick up payment/subscription updates
      setTimeout(() => refresh(true), 1000);
    }
  }, []);

  // ── Auto-deactivate expired subscriptions ──
  useEffect(() => {
    const subs = data.subscriptions || [];
    subs.forEach(async (s) => {
      if (s.status === 'active' && new Date(s.expires_at).getTime() < Date.now()) {
        try {
          await fetch(api('subscriptions'), {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: s.id, status: 'expired' })
          });
          refresh(true);
        } catch { }
      }
    });
  }, [data.subscriptions]);

  const admin = data.admin_settings || [];
  const rawTheme = admin.find(x => x.key === 'theme')?.value || {};
  const theme: BrandSettings = { ...defaultTheme, ...rawTheme };
  const rawPayment = admin.find(x => x.key === 'payment')?.value;
  const payment = migratePayment(rawPayment);
  const player = admin.find(x => x.key === 'player')?.value || defaultPlayer;

  const allSubs = data.subscriptions || [];
  const activeSub = (allSubs.find(s => s.status === 'active' && new Date(s.expires_at).getTime() > Date.now()) || null) as Subscription | null;
  const subscribed = isSubActive(activeSub);

  const mergedData = {
    ...data,
    notifications: [...(data.notifications || []), ...localNotifs]
  };

  return (
    <AppContext.Provider value={{
      data: mergedData, videos: (data.videos || []) as Video[],
      categories: (data.categories || []) as Category[],
      plans: (data.plans || []) as Plan[],
      user, guestId, loading, subscribed, activeSub, theme, payment, player,
      refresh, mutate, addNotif
    }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error('Provider missing');
  return c;
}

// ─── PLAYER ──────────────────────────────────────────────────────────────────
function Player({ video, onBack, onNext }: { video: Video; onBack?: () => void; onNext: () => void }) {
  const { guestId, subscribed, mutate, data, player } = useApp();
  const ref = useRef<HTMLVideoElement | null>(null);
  const bar = useRef<HTMLDivElement | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);
  const hide = useRef<number | undefined>(undefined);
  const buf = useRef<number | undefined>(undefined);
  const tap = useRef(0);
  const last = useRef(0);
  const resumed = useRef(false);
  const [show, setShow] = useState(true);
  const [play, setPlay] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [wait, setWait] = useState(false);
  const [err, setErr] = useState('');
  const [speed, setSpeed] = useState(1);
  const [menu, setMenu] = useState(false);
  const [muted, setMuted] = useState(false);
  const [vol] = useState(() => Number(localStorage.getItem('rr_vol') || .85));
  const [drag, setDrag] = useState(false);
  const [fx, setFx] = useState<{ t: string; s: string } | null>(null);
  const locked = video.is_premium && !subscribed;
  const liked = (data.likes || []).some(l => l.video_id === video.id);
  const saved = (data.bookmarks || []).some(b => b.video_id === video.id);
  const p = dur ? Math.min(100, cur / dur * 100) : 0;
  const reveal = () => {
    setShow(true); clearTimeout(hide.current);
    hide.current = window.setTimeout(() => { if (!ref.current?.paused && !menu && !drag) setShow(false); }, 2500);
  };
  const enterFull = async () => { try { await wrap.current?.requestFullscreen?.(); } catch { } };
  const startPlayback = async () => {
    const v = ref.current;
    if (!v || locked) return;
    try { v.volume = vol; v.muted = muted; v.playbackRate = speed; await v.play(); setPlay(true); await enterFull(); reveal(); }
    catch { setShow(true); }
  };
  const pausePlayback = () => { ref.current?.pause(); setPlay(false); setShow(true); };
  useEffect(() => { reveal(); resumed.current = false; setErr(''); setCur(0); setDur(0); setPlay(false); }, [video.id]);
  useEffect(() => { const v = ref.current; if (v) { v.volume = vol; v.muted = muted; v.playbackRate = speed; } }, [vol, muted, speed]);
  const buffer = () => {
    setWait(true); clearTimeout(buf.current);
    buf.current = window.setTimeout(() => { setWait(false); setErr('Unable to load video'); }, 8000);
  };
  const seek = (x: number) => {
    if (!bar.current || !ref.current || !dur) return;
    const r = bar.current.getBoundingClientRect();
    const n = Math.max(0, Math.min(1, (x - r.left) / r.width)) * dur;
    ref.current.currentTime = n; setCur(n); reveal();
  };
  const jump = (d: number, s: string) => {
    if (!ref.current) return;
    ref.current.currentTime = Math.max(0, Math.min(dur || ref.current.duration || 0, ref.current.currentTime + d));
    setFx({ t: d > 0 ? '+10s' : '-10s', s }); setTimeout(() => setFx(null), 650); reveal();
  };
  const surface = (e: any) => {
    if ((e.target as HTMLElement).closest('button,input,select,a')) return;
    const now = Date.now(), r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
    if (now - tap.current < 300) {
      if (x < .4) jump(-10, 'left'); else if (x > .6) jump(10, 'right');
      else { setFx({ t: '❤️', s: 'center' }); setTimeout(() => setFx(null), 650); }
      tap.current = 0;
    } else { tap.current = now; reveal(); }
  };
  const like = async () => liked
    ? mutate('likes', 'DELETE', { user_id: guestId, video_id: video.id })
    : mutate('likes', 'POST', { user_id: guestId, video_id: video.id });
  const save = async () => saved
    ? mutate('bookmarks', 'DELETE', { user_id: guestId, video_id: video.id })
    : mutate('bookmarks', 'POST', { user_id: guestId, video_id: video.id });

  if (locked) return (
    <div ref={wrap} className="relative mx-auto grid h-[78vh] max-h-[820px] min-h-[560px] w-full max-w-[430px] place-items-center overflow-hidden rounded-[34px] bg-zinc-950 text-white shadow-2xl">
      <video src={vurl(video.video_filename)} muted className="absolute h-full w-full object-cover opacity-20 blur-sm" />
      <div className="relative p-8 text-center">
        <Lock className="mx-auto mb-4 text-[var(--rr-primary)]" size={58} />
        <h2 className="text-3xl font-black">Premium Locked</h2>
        <p className="mt-2 opacity-75">Plan activate karke episode unlock karein.</p>
        <button onClick={() => initiatePayment({ price: 699 }, null)} className="btn mt-5 inline-flex">Unlock Plan</button>
      </div>
    </div>
  );

  if (player?.mode === 'bunny') return (
    <div ref={wrap} className="relative mx-auto h-[78vh] max-h-[820px] min-h-[560px] w-full max-w-[430px] overflow-hidden rounded-[34px] bg-black text-white shadow-2xl transform-gpu">
      <iframe src={bunnyIframeUrl(video, player)} title={video.title}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen className="h-full w-full border-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/75 to-transparent p-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="icon pointer-events-auto"><ArrowLeft /></button>
          <div className="min-w-0"><h2 className="truncate font-black">{video.title}</h2><p className="text-xs text-[var(--rr-primary)]">EP {video.episode_number}</p></div>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={wrap} onClick={surface} onMouseMove={reveal}
      className="relative mx-auto h-[78vh] max-h-[820px] min-h-[560px] w-full max-w-[430px] overflow-hidden rounded-[34px] bg-black text-white shadow-2xl transform-gpu select-none">
      <video ref={ref} src={vurl(video.video_filename)} poster={video.thumbnail_url}
        playsInline preload="auto" className="h-full w-full object-cover transform-gpu"
        onLoadedMetadata={e => {
          setDur(e.currentTarget.duration || video.duration_seconds);
          if (!resumed.current) {
            const h = (data.watch_history || []).find(w => w.video_id === video.id);
            if (h?.current_position) e.currentTarget.currentTime = Number(h.current_position);
            resumed.current = true;
          }
        }}
        onWaiting={buffer}
        onPlaying={() => { setWait(false); clearTimeout(buf.current); setPlay(true); }}
        onCanPlay={() => { setWait(false); clearTimeout(buf.current); }}
        onError={() => { setErr('Unable to load video'); setWait(false); }}
        onPause={() => setPlay(false)}
        onEnded={() => {
          mutate('video_views', 'POST', { user_id: guestId, video_id: video.id, watch_seconds: cur, completed: true, device: 'web' });
          onNext();
        }}
        onTimeUpdate={e => {
          const n = Date.now();
          if (n - last.current < 250) return;
          last.current = n;
          setCur(e.currentTarget.currentTime);
          setDur(e.currentTarget.duration || 0);
          mutate('watch_history', 'POST', {
            user_id: guestId, video_id: video.id,
            current_position: e.currentTarget.currentTime,
            duration: e.currentTarget.duration || 0, completed: false
          }).catch(() => { });
        }} />
      {!play && !wait && !err && (
        <button onClick={e => { e.stopPropagation(); startPlayback(); }}
          className="absolute inset-0 z-10 grid place-items-center bg-black/20">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-black shadow-2xl">
            <Play size={38} className="translate-x-1" />
          </span>
        </button>
      )}
      {wait && <div className="absolute inset-0 z-20 grid place-items-center bg-black/20"><Loader2 className="animate-spin text-[var(--rr-primary)]" size={48} /></div>}
      {err && (
        <div className="absolute inset-0 z-30 grid place-items-center bg-black/75">
          <div className="rounded-3xl bg-white p-6 text-center text-zinc-950">
            <b>{err}</b>
            <button onClick={() => { setErr(''); ref.current?.load(); startPlayback(); }} className="btn mt-4"><RefreshCw /> Retry</button>
          </div>
        </div>
      )}
      <AnimatePresence>
        {fx && (
          <motion.div initial={{ scale: .6, opacity: 0, y: 18 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}
            className={`pointer-events-none absolute top-1/2 z-30 rounded-full bg-black/55 px-5 py-3 text-3xl font-black ${fx.s === 'left' ? 'left-10' : fx.s === 'right' ? 'right-10' : 'left-1/2 -translate-x-1/2'}`}>
            {fx.t}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div animate={{ opacity: show ? 1 : 0 }} transition={{ duration: .2 }}
        className="absolute inset-0 z-20 bg-gradient-to-b from-black/75 via-transparent to-black/85">
        <div className="absolute inset-x-0 top-0 flex items-center gap-3 p-4">
          <button onClick={onBack} className="icon"><ArrowLeft /></button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-black">{video.title}</h2>
            <p className="text-xs font-bold text-[var(--rr-primary)]">{video.series_title} · EP {video.episode_number}</p>
          </div>
        </div>
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-3">
          <button onClick={like} className="icon"><Heart className={liked ? 'fill-red-500 text-red-500' : ''} /></button>
          <button onClick={save} className="icon"><Bookmark className={saved ? 'fill-[var(--rr-primary)] text-[var(--rr-primary)]' : ''} /></button>
          <button onClick={() => navigator.share ? navigator.share({ title: video.title, url: location.href }) : navigator.clipboard.writeText(location.href)} className="icon"><Share2 /></button>
          <button onClick={() => window.open(vurl(video.video_filename), '_blank')} className="icon"><Download /></button>
        </div>
        <div className="absolute inset-x-0 bottom-0 space-y-3 p-4">
          <div ref={bar}
            onPointerDown={e => { setDrag(true); seek(e.clientX); }}
            onPointerMove={e => drag && seek(e.clientX)}
            onPointerUp={e => { setDrag(false); seek(e.clientX); }}
            className="h-5 cursor-pointer py-2">
            <div className="h-1 rounded-full bg-white/20">
              <div className="relative h-full rounded-full bg-[var(--rr-primary)]" style={{ width: `${p}%` }}>
                <span className={`absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full bg-[var(--rr-primary)] ${drag ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="grid h-11 w-11 place-items-center rounded-full bg-[var(--rr-primary)] text-black"
              onClick={() => play ? pausePlayback() : startPlayback()}>
              {play ? <Pause /> : <Play />}
            </button>
            <span className="min-w-[84px] text-xs font-bold tabular-nums">{ftime(cur)} / {ftime(dur)}</span>
            <button onClick={() => jump(-10, 'left')} className="rounded-full bg-white/15 px-3 py-2 text-xs font-black">-10</button>
            <button onClick={() => jump(10, 'right')} className="rounded-full bg-white/15 px-3 py-2 text-xs font-black">+10</button>
            <div className="relative ml-auto">
              <button onClick={() => setMenu(!menu)} className="rounded-full bg-white/15 px-3 py-2 text-xs font-black">{speed}x</button>
              {menu && (
                <div className="absolute bottom-11 right-0 rounded-2xl bg-zinc-950 p-1 shadow-xl">
                  {[.5, .75, 1, 1.25, 1.5, 2].map(s => (
                    <button key={s} onClick={() => { setSpeed(s); setMenu(false); }} className="block w-full rounded-xl px-4 py-2 text-left text-sm hover:bg-white/10">{s}x</button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setMuted(!muted)} className="icon h-10 w-10">{muted ? <VolumeX /> : <Volume2 />}</button>
            <button onClick={enterFull} className="icon h-10 w-10"><Maximize /></button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ go }: { go: (t: string) => void }) {
  const { data, videos, categories } = useApp();
  const banners = data.banners || [];
  const hero = banners.find(b => b.is_active);
  const heroTitle = hero?.title || 'ReelRamp Pro Originals';
  const heroSub = hero?.subtitle || 'Mobile-first short episodes, premium stories aur seamless streaming.';
  const heroImg = hero?.image_url || fallbackImages.hero;
  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-[40px] bg-zinc-950 text-white shadow-2xl md:grid md:grid-cols-[1.05fr_.95fr]">
        <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[var(--rr-primary)]/25 blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-52 w-52 rounded-full bg-[var(--rr-accent)]/20 blur-3xl" />
        <div className="relative p-8 md:p-12">
          <p className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black text-[var(--rr-primary)]">ReelRamp Originals</p>
          <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">{heroTitle}</h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">{heroSub}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button onClick={() => go('forYou')} className="btn">{hero?.cta_label || 'Start Watching'}</button>
            <button onClick={() => go('plans')} className="rounded-full border border-white/15 bg-white/10 px-6 py-3 font-black text-white">View Plans</button>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
            <div className="rounded-3xl bg-white/10 p-4"><b>{videos.length}+</b><small className="block text-white/60">Episodes</small></div>
            <div className="rounded-3xl bg-white/10 p-4"><b>{categories.length}</b><small className="block text-white/60">Categories</small></div>
            <div className="rounded-3xl bg-white/10 p-4"><b>HD</b><small className="block text-white/60">Bunny CDN</small></div>
          </div>
        </div>
        <div className="relative min-h-[420px]">
          <img src={heroImg} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent md:bg-gradient-to-r md:from-zinc-950 md:to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 rounded-3xl bg-black/45 p-4 text-white backdrop-blur">
            <p className="text-sm font-black text-[var(--rr-primary)]">Featured Premiere</p>
            <h3 className="text-2xl font-black">Stories jo sirf sunayi nahi, mehsoos hoti hain.</h3>
          </div>
        </div>
      </div>
      <Rows title="Categories">
        {categories.filter(c => c.is_active).map(c => (
          <button key={c.id} onClick={() => go('forYou')} className="card shrink-0 px-5 py-4 font-black transition hover:-translate-y-1 hover:shadow-xl">
            <span className="mr-2">{c.icon}</span>{c.name}
          </button>
        ))}
      </Rows>
      <Rows title="Trending Stories">
        {videos.filter(v => v.is_published).slice(0, 10).map(v => <VideoCard key={v.id} v={v} onClick={() => go('forYou')} />)}
      </Rows>
      <div className="grid gap-4 md:grid-cols-3">
        <FeatureCard icon="🎬" title="Original Shorts" body="Drama, romance, thriller aur family stories ek mobile-first format me." />
        <FeatureCard icon="👑" title="Premium Unlock" body="Admin-controlled plans, paywall aur Cashfree payment + auto-pay." />
        <FeatureCard icon="📲" title="Install App" body="PWA install se app jaisa home-screen experience paayein." />
      </div>
      <InfoSection />
    </section>
  );
}

function FeatureCard({ icon, title, body }: { icon: string; title: string; body: string }) {
  return <div className="card p-6"><div className="text-4xl">{icon}</div><h3 className="mt-3 text-2xl font-black">{title}</h3><p className="mt-2 text-zinc-600">{body}</p></div>;
}

// ─── SERIES PAGE ──────────────────────────────────────────────────────────────
function SeriesPage({ go }: { go: (t: string) => void }) {
  const { data, videos } = useApp();
  const [active, setActive] = useState<Row | null>(null);
  const series = data.series || [];
  const chosen = active || series[0];
  return (
    <section className="space-y-5">
      <Title t="Series" s="Poster, episode list, premium/free tags." />
      <div className="grid gap-5 md:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {series.map(s => (
            <button key={s.id} onClick={() => setActive(s)}
              className={`w-full rounded-[26px] p-4 text-left font-black shadow-sm ${chosen?.id === s.id ? 'bg-zinc-950 text-white' : 'bg-white'}`}>
              {s.title}<small className="block opacity-60">{s.category}</small>
            </button>
          ))}
        </div>
        {chosen && (
          <div className="card overflow-hidden">
            <div className="grid md:grid-cols-[260px_1fr]">
              <img src={chosen.poster_url || fallbackImages.promo} className="h-full min-h-80 w-full object-cover" />
              <div className="p-6">
                <p className="font-black text-[var(--rr-accent)]">{chosen.category}</p>
                <h2 className="text-4xl font-black">{chosen.title}</h2>
                <p className="mt-3 text-zinc-600">{chosen.description}</p>
                <button onClick={() => go('forYou')} className="btn mt-5">Start Watching</button>
              </div>
            </div>
            <div className="grid gap-2 p-4">
              {videos.filter(v => v.series_title === chosen.title).map(v => (
                <button key={v.id} onClick={() => go('forYou')} className="rounded-2xl bg-zinc-100 p-4 text-left font-bold">
                  EP {v.episode_number}: {v.title} {v.is_premium && <span className="ml-2 rounded-full bg-yellow-300 px-2 py-1 text-xs">PRO</span>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SEARCH PAGE ──────────────────────────────────────────────────────────────
function SearchPage({ go }: { go: (t: string) => void }) {
  const { videos, categories } = useApp();
  const [q, setQ] = useState(''), [premium, setPremium] = useState('all');
  const list = videos.filter(v =>
    `${v.title} ${v.description} ${v.series_title} ${v.category}`.toLowerCase().includes(q.toLowerCase()) &&
    (premium === 'all' || (premium === 'premium' ? v.is_premium : !v.is_premium))
  );
  return (
    <section className="space-y-5">
      <Title t="Search" s="Title, series, category aur premium/free filter." />
      <div className="card p-4">
        <div className="flex items-center gap-3">
          <Search className="text-[var(--rr-accent)]" />
          <input className="w-full bg-transparent p-3 outline-none" value={q} onChange={e => setQ(e.target.value)} placeholder="Search stories" />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          <button onClick={() => setPremium('all')} className={`pill ${premium === 'all' ? 'active' : ''}`}>All</button>
          <button onClick={() => setPremium('free')} className={`pill ${premium === 'free' ? 'active' : ''}`}>Free</button>
          <button onClick={() => setPremium('premium')} className={`pill ${premium === 'premium' ? 'active' : ''}`}>Premium</button>
          {categories.map(c => <button key={c.id} onClick={() => setQ(c.name)} className="pill">{c.icon} {c.name}</button>)}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {list.map(v => <VideoCard key={v.id} v={v} onClick={() => go('forYou')} />)}
      </div>
    </section>
  );
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────────────
function Rows({ title, children }: { title: string; children: ReactNode }) {
  return <div><h2 className="mb-3 text-2xl font-black">{title}</h2><div className="flex gap-4 overflow-x-auto pb-2">{children}</div></div>;
}

function VideoCard({ v, onClick }: { v: Video; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card group w-56 shrink-0 overflow-hidden text-left transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative aspect-[3/4] bg-zinc-200">
        {v.thumbnail_url
          ? <img src={v.thumbnail_url} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <img src={fallbackImages.promo} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-black text-white backdrop-blur">EP {v.episode_number}</span>
        {v.is_premium && <span className="absolute right-3 top-3 rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-black">PRO</span>}
        <span className="absolute bottom-3 left-3 grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow-xl"><Play size={18} /></span>
      </div>
      <div className="p-4">
        <p className="text-xs font-black text-[var(--rr-accent)]">{v.category} · {v.series_title}</p>
        <h3 className="line-clamp-2 text-lg font-black">{v.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{v.description}</p>
      </div>
    </button>
  );
}

// ─── FOR YOU ──────────────────────────────────────────────────────────────────
function ForYou() {
  const { videos, categories, mutate, guestId } = useApp();
  const [cat, setCat] = useState('All'), [idx, setIdx] = useState(0), [touch, setTouch] = useState<number | null>(null), [report, setReport] = useState('');
  const list = videos.filter(v => v.is_published && (cat === 'All' || v.category === cat));
  const v = list[idx] || list[0];
  useEffect(() => setIdx(0), [cat]);
  if (!v) return <Empty />;
  const next = () => setIdx(i => list.length ? (i + 1) % list.length : 0);
  const prev = () => setIdx(i => list.length ? (i - 1 + list.length) % list.length : 0);
  return (
    <section className="mx-auto w-full max-w-6xl overflow-x-hidden">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {['All', ...categories.filter(c => c.is_active).map(c => c.name)].map(c => (
          <button key={c} onClick={() => setCat(c)} className={`pill ${cat === c ? 'active' : ''}`}>{c}</button>
        ))}
      </div>
      <div className="grid items-start justify-center gap-5 lg:grid-cols-[minmax(320px,430px)_minmax(280px,420px)]">
        <div className="w-full"
          onWheel={e => { if (Math.abs(e.deltaY) > 30) { e.preventDefault(); e.deltaY > 0 ? next() : prev(); } }}
          onTouchStart={e => setTouch(e.touches[0].clientY)}
          onTouchEnd={e => { if (touch === null) return; const diff = touch - e.changedTouches[0].clientY; if (Math.abs(diff) > 55) { diff > 0 ? next() : prev(); } setTouch(null); }}>
          <Player video={v} onNext={next} />
        </div>
        <aside className="w-full max-w-[430px] space-y-4 lg:sticky lg:top-32">
          <div className="card p-5">
            <p className="font-black text-[var(--rr-accent)]">{v.series_title}</p>
            <h1 className="text-3xl font-black leading-tight">{v.title}</h1>
            <p className="mt-3 text-sm text-zinc-600">{v.description}</p>
            <div className="mt-4 rounded-2xl bg-zinc-100 p-3 text-sm font-bold">Swipe up/down ya next/previous se episodes navigate karein.</div>
            <div className="mt-4 flex gap-2">
              <button className="pill" onClick={prev}>Previous</button>
              <button className="pill active" onClick={next}>Next</button>
            </div>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {list.map((e, i) => (
              <button key={e.id} onClick={() => setIdx(i)}
                className={`w-full rounded-[22px] p-3 text-left text-sm font-bold ${i === idx ? 'bg-zinc-950 text-white' : 'bg-white shadow-sm'}`}>
                EP {e.episode_number}: {e.title}
              </button>
            ))}
          </div>
          <div className="card p-4">
            <h3 className="font-black">Report content</h3>
            <input className="input" value={report} onChange={e => setReport(e.target.value)} placeholder="Reason" />
            <button className="btn w-full" onClick={() => mutate('content_reports', 'POST', {
              user_id: guestId, video_id: v.id, reason: report || 'User report', details: report, status: 'open'
            }).then(() => setReport(''))}>Submit Report</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ─── PLANS / CASHFREE PAYMENT ENGINE ─────────────────────────────────────────
function Plans() {
  const { plans, payment, guestId, mutate, subscribed, user, addNotif } = useApp();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [step, setStep] = useState<'brief' | 'pay' | 'done'>('brief');
  const [busy, setBusy] = useState(false);
  const [payErr, setPayErr] = useState('');
  const [txId, setTxId] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');

  const openPlan = (p: Plan) => {
    setSelected(p); setStep('brief'); setPayErr(''); setTxId('');
  };
  const close = () => { setSelected(null); setStep('brief'); setPayErr(''); setBusy(false); };

  const activatePlan = async (plan: Plan, gateway: string, transactionId?: string, cfSubId?: string) => {
    const expiresAt = new Date(Date.now() + plan.duration_days * 86400000).toISOString();
    await mutate('payments', 'POST', {
      user_id: guestId, plan_id: plan.id, amount: plan.price,
      gateway, status: 'success', notes: `Plan: ${plan.name}`,
      transaction_id: transactionId || `manual_${Date.now()}`,
      cf_payment_id: transactionId
    });
    await mutate('subscriptions', 'POST', {
      user_id: guestId, plan: plan.name, plan_id: plan.id,
      status: 'active', expires_at: expiresAt,
      auto_renew: !!plan.supports_autorenew && !!cfSubId,
      renewal_date: expiresAt, gateway,
      cf_subscription_id: cfSubId || null
    });
    if (phone && user?.id) {
      await mutate('users', 'PUT', { id: user.id, phone }).catch(() => {});
    }
    addNotif({
      title: 'Plan Activated! 🎉', type: 'success',
      message: `${plan.name} — ${plan.duration_days} din ke liye active hai.`,
      target: 'user', is_active: true
    });
    setStep('done');
  };

  const handleCashfree = async (gw: GatewayConfig) => {
    if (!selected) return;
    if (!phone.trim() || phone.length < 10) { setPayErr('Valid mobile number daalein (10 digit)'); return; }
    setBusy(true); setPayErr('');
    try {
      await openCashfreeCheckout({
        appId: gw.keys.appId || '',
        secretKey: gw.keys.secretKey || '',
        testMode: gw.testMode,
        amount: selected.price,
        planName: selected.name,
        userId: guestId,
        userName: getBestDisplayName(user),
        userEmail: user?.email || `${guestId}@reelramp.com`,
        userPhone: phone,
        onSuccess: async ({ orderId, paymentId }) => {
          await activatePlan(selected, 'Cashfree', paymentId);
          setBusy(false);
        },
        onFailure: (err) => { setPayErr(err); setBusy(false); }
      });
    } catch (e: any) { setPayErr(e.message); setBusy(false); }
  };

  // Silent recurring setup — runs in the background when the plan is
  // configured for auto-renew (admin decides this, user sees nothing extra).
  const handleCashfreeAutoPay = async (gw: GatewayConfig) => {
    if (!selected) return;
    if (!phone.trim() || phone.length < 10) { setPayErr('Valid mobile number daalein (10 digit)'); return; }
    setBusy(true); setPayErr('');
    try {
      await createCashfreeSubscription({
        testMode: gw.testMode,
        planName: selected.name,
        amount: selected.price,
        intervalDays: selected.duration_days,
        userId: guestId,
        userName: getBestDisplayName(user),
        userEmail: user?.email || `${guestId}@reelramp.com`,
        userPhone: phone,
        cfPlanId: selected.cf_plan_id,
        onSuccess: async ({ subscriptionId, authLink }) => {
          if (authLink) window.location.href = authLink;
          await mutate('payments', 'POST', {
            user_id: guestId, plan_id: selected.id, amount: selected.price,
            gateway: 'Cashfree', status: 'pending',
            notes: `Subscription: ${subscriptionId}`,
            cf_subscription_id: subscriptionId
          });
          setBusy(false);
        },
        onFailure: (err) => { setPayErr(err); setBusy(false); }
      });
    } catch (e: any) { setPayErr(e.message); setBusy(false); }
  };

  const handleRazorpay = async (gw: GatewayConfig) => {
    if (!selected) return;
    setBusy(true); setPayErr('');
    try {
      await openRazorpay({
        keyId: gw.keys.keyId, amount: selected.price,
        planName: selected.name,
        userName: getBestDisplayName(user),
        userEmail: user?.email || '',
        testMode: gw.testMode,
        onSuccess: async ({ paymentId }) => {
          await activatePlan(selected, 'Razorpay', paymentId);
          setBusy(false);
        },
        onFailure: (err) => { setPayErr(err); setBusy(false); }
      });
    } catch (e: any) { setPayErr(e.message); setBusy(false); }
  };

  const handleUpiManual = async (gw: GatewayConfig) => {
    if (!selected || !txId.trim()) { setPayErr('Transaction ID ya UTR number daalein'); return; }
    setBusy(true); setPayErr('');
    try {
      await mutate('payments', 'POST', {
        user_id: guestId, plan_id: selected.id, amount: selected.price,
        gateway: gw.name, status: 'pending',
        notes: `UPI Manual — UTR: ${txId}`, transaction_id: txId
      });
      addNotif({
        title: 'Payment Submitted', type: 'info',
        message: `UTR ${txId} received. Admin verification ke baad activate hoga.`,
        target: 'user', is_active: true
      });
      setStep('done');
    } catch (e: any) { setPayErr(e.message); }
    finally { setBusy(false); }
  };

  const defaultGw = payment.gateways.find(g => g.enabled && g.isDefault) || payment.gateways.find(g => g.enabled);
  const hasGateway = !!defaultGw;

  return (
    <section id="plans" className="space-y-5">
      <Title t="Plans" s="Premium plans admin panel se manage hote hain." />
      {subscribed && (
        <div className="rounded-3xl bg-green-100 p-4 font-black text-green-800 flex items-center gap-2">
          <CheckCircle2 size={22} /> Premium Active ✅
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order).map(p => (
          <div key={p.id} className="card p-6 flex flex-col">
            <Crown className="text-yellow-500" />
            <h3 className="mt-3 text-2xl font-black">{p.name}</h3>
            <p className="text-4xl font-black">{money(p.price)}</p>
            <p className="text-zinc-500">{p.duration_days} days</p>
            {p.trial_days && p.trial_days > 0 && (
              <p className="text-xs font-black text-green-600 mt-1">✨ {p.trial_days} din free trial</p>
            )}
            {p.features && typeof p.features === 'object' && (
              <ul className="mt-3 space-y-1 text-sm text-zinc-600 flex-1">
                {Object.entries(p.features).map(([k, v]: any) => (
                  <li key={k} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-green-500 shrink-0" />{v}
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => openPlan(p)} className="btn mt-5 w-full">Select Plan</button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4 backdrop-blur" onClick={close}>
            <motion.div initial={{ scale: .93, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: .93, y: 24 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm rounded-[34px] bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

              {step === 'brief' && (
                <div className="p-7 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-[var(--rr-accent)] uppercase tracking-wider">Plan Details</p>
                      <h2 className="text-3xl font-black mt-1">{selected.name}</h2>
                    </div>
                    <button onClick={close} className="rounded-full bg-zinc-100 p-2"><X size={18} /></button>
                  </div>
                  <div className="rounded-3xl bg-zinc-950 text-white p-5">
                    <p className="text-4xl font-black">{money(selected.price)}</p>
                    <p className="text-white/60 text-sm mt-1">{selected.duration_days} din ka access</p>
                    {selected.trial_days && selected.trial_days > 0 && (
                      <p className="text-green-400 text-xs font-bold mt-1">✨ {selected.trial_days} din free trial included</p>
                    )}
                  </div>
                  {selected.features && typeof selected.features === 'object' && (
                    <ul className="space-y-2">
                      {Object.entries(selected.features).map(([k, v]: any) => (
                        <li key={k} className="flex items-center gap-3 text-sm font-bold">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-100 text-green-600"><CheckCircle2 size={14} /></span>{v}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" onClick={() => setStep('pay')} className="btn w-full">Proceed to Payment →</button>
                </div>
              )}

              {step === 'pay' && (
                <div className="p-7 space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black">Payment</h2>
                    <button onClick={close} className="rounded-full bg-zinc-100 p-2"><X size={18} /></button>
                  </div>
                  <div className="rounded-2xl bg-zinc-100 p-4 text-sm font-bold flex justify-between">
                    <span>{selected.name}</span><span>{money(selected.price)}</span>
                  </div>
                  {payErr && (
                    <div className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700 flex items-center gap-2">
                      <AlertCircle size={16} /> {payErr}
                    </div>
                  )}
                  {/* Phone number — required for Cashfree */}
                  {defaultGw?.type === 'Cashfree' && (
                    <div>
                      <label className="label flex items-center gap-1"><Phone size={14} /> Mobile Number (required)</label>
                      <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
                    </div>
                  )}
                  {!hasGateway ? (
                    <div className="rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-center text-white space-y-3">
                      <div className="text-4xl">🚀</div>
                      <h3 className="text-xl font-black">Payment Gateway</h3>
                      <p className="text-sm text-white/70">Coming Soon</p>
                      <p className="text-xs text-white/50 leading-relaxed">Admin panel mein gateway configure karein.</p>
                      {payment.whatsapp && (
                        <a href={`https://wa.me/${payment.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-black text-white">
                          WhatsApp pe contact karo
                        </a>
                      )}
                    </div>
                  ) : (
                    <GatewayPayBlock
                      gateway={defaultGw!} plan={selected} busy={busy} txId={txId}
                      setTxId={setTxId} payment={payment}
                      onCashfree={() => selected.supports_autorenew ? handleCashfreeAutoPay(defaultGw!) : handleCashfree(defaultGw!)}
                      onRazorpay={() => handleRazorpay(defaultGw!)}
                      onUpiManual={() => handleUpiManual(defaultGw!)}
                    />
                  )}
                  <button type="button" onClick={() => setStep('brief')} className="w-full text-center text-sm font-bold text-zinc-500 py-2">← Wapas jaao</button>
                </div>
              )}

              {step === 'done' && (
                <div className="p-8 text-center space-y-4">
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100">
                    <CheckCircle2 size={48} className="text-green-500" />
                  </div>
                  <h2 className="text-3xl font-black">
                    {defaultGw?.type === 'UPI Manual' ? 'Payment Submitted!' : 'Plan Activated!'}
                  </h2>
                  <p className="text-zinc-600">
                    {defaultGw?.type === 'UPI Manual'
                      ? 'Admin verification ke baad premium activate hoga. WhatsApp par UTR bhejein.'
                      : selected.supports_autorenew
                        ? `${selected.name} active ho gaya hai. Aapka premium access shuru ho chuka hai.`
                        : `${selected.name} — ${selected.duration_days} din ke liye active hai.`}
                  </p>
                  {defaultGw?.type === 'UPI Manual' && payment.whatsapp && (
                    <a href={`https://wa.me/${payment.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-black text-white">
                      WhatsApp pe confirm karein
                    </a>
                  )}
                  <button type="button" onClick={close} className="btn w-full">
                    {defaultGw?.type === 'UPI Manual' ? 'Theek hai' : 'Enjoy Premium 🎉'}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function GatewayPayBlock({
  gateway, plan, busy, txId, setTxId, payment,
  onCashfree, onRazorpay, onUpiManual
}: {
  gateway: GatewayConfig; plan: Plan; busy: boolean;
  txId: string; setTxId: (v: string) => void; payment: PaymentSettings;
  onCashfree: () => void; onRazorpay: () => void; onUpiManual: () => void;
}) {
  if (gateway.type === 'Cashfree') return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-700 font-bold flex items-center gap-2">
        <Zap size={16} /> Cashfree Secure Checkout
        {gateway.testMode && <span className="ml-auto rounded-full bg-yellow-200 px-2 py-0.5 text-xs text-yellow-800">SANDBOX</span>}
      </div>
      <button type="button" disabled={busy} onClick={onCashfree} className="btn w-full disabled:opacity-60">
        {busy ? <Loader2 className="animate-spin mx-auto" size={20} /> : `Pay ${money(plan.price)} via Cashfree`}
      </button>
    </div>
  );

  if (gateway.type === 'Razorpay') return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-700 font-bold flex items-center gap-2">
        <CreditCard size={16} /> Razorpay Secure Checkout
        {gateway.testMode && <span className="ml-auto rounded-full bg-yellow-200 px-2 py-0.5 text-xs text-yellow-800">TEST MODE</span>}
      </div>
      <button type="button" disabled={busy} onClick={onRazorpay} className="btn w-full disabled:opacity-60">
        {busy ? <Loader2 className="animate-spin mx-auto" size={20} /> : `Pay ${money(plan.price)} via Razorpay`}
      </button>
    </div>
  );

  if (gateway.type === 'UPI Manual') return (
    <div className="space-y-3">
      {gateway.keys.upiQr && (
        <div className="flex flex-col items-center gap-2">
          <img src={gateway.keys.upiQr} alt="UPI QR" className="h-40 w-40 rounded-2xl border object-contain bg-white" />
          <p className="text-xs font-bold text-zinc-500">Scan karo aur pay karo</p>
        </div>
      )}
      {gateway.keys.upiId && (
        <div className="rounded-2xl bg-zinc-100 p-3 flex justify-between items-center">
          <span className="text-sm font-black">UPI ID: {gateway.keys.upiId}</span>
          <button onClick={() => navigator.clipboard.writeText(gateway.keys.upiId)} className="text-xs text-[var(--rr-accent)] font-bold">Copy</button>
        </div>
      )}
      {payment.instructions && <p className="text-xs text-zinc-500">{payment.instructions}</p>}
      <input className="input" value={txId} onChange={e => setTxId(e.target.value)} placeholder="UTR / Transaction ID daalein" />
      <button type="button" disabled={busy || !txId.trim()} onClick={onUpiManual} className="btn w-full disabled:opacity-60">
        {busy ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Submit Payment'}
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-zinc-100 p-4 text-sm font-bold">
        <p>Gateway: {gateway.name}</p>
        {payment.instructions && <p className="text-zinc-500 text-xs mt-2">{payment.instructions}</p>}
      </div>
      {payment.whatsapp && (
        <a href={`https://wa.me/${payment.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full bg-green-500 py-3 text-sm font-black text-white">
          WhatsApp pe contact karo
        </a>
      )}
    </div>
  );
}

// ─── PROFILE / USER DASHBOARD ─────────────────────────────────────────────────
function Profile() {
  const { user, guestId, subscribed, activeSub, data, mutate } = useApp();
  const isLoggedIn = !!(user?.email);
  const [name, setName] = useState(getBestDisplayName(user));
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState('');
  const [authMsg, setAuthMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'subscription' | 'history'>('account');

  useEffect(() => {
    setName(getBestDisplayName(user));
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
  }, [user?.id]);

  const signIn = async (signUp = false) => {
    if (!email || !password) { setAuthMsg('Email aur password dono bharo.'); return; }
    setBusy(true); setAuthMsg('');
    try {
      const { error } = signUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthMsg(error.message);
      else setAuthMsg(signUp ? 'Account ban gaya!' : 'Login ho gaya!');
    } catch (e: any) { setAuthMsg(e.message); }
    finally { setBusy(false); }
  };

  const signOut = async () => { await supabase.auth.signOut(); localStorage.removeItem('rr_guest'); window.location.href = '/'; };
  const saveProfile = () => user && mutate('users', 'PUT', {
    id: user.id,
    display_name: name,
    email,
    phone
  }).then(() => setAuthMsg('Profile update ho gaya.'));

  const cancelSub = async () => {
    if (!activeSub) return;
    if (!confirm('Kya aap subscription cancel karna chahte hain?')) return;
    try {
      await mutate('subscriptions', 'PUT', { id: activeSub.id, status: 'cancelled', cancelled_at: new Date().toISOString(), auto_renew: false });
    } catch (e: any) { setAuthMsg(e.message); }
  };

  const payments = (data.payments || []).filter(p => p.user_id === guestId);
  const watchHistory = (data.watch_history || []);
  const displayName = getBestDisplayName(user);

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[36px] bg-zinc-950 text-white shadow-2xl md:grid md:grid-cols-[1.05fr_.95fr]">
        <div className="relative p-7 md:p-10">
          <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[var(--rr-primary)]/25 blur-3xl" />
          <p className="relative inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-[var(--rr-primary)]">
            <ShieldCheck size={16} /> Secure ReelRamp Account
          </p>
          <h1 className="relative mt-5 text-4xl font-black leading-tight md:text-5xl">Login karke premium kahaniyan resume karein.</h1>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-4">
              <b>{subscribed ? 'Premium' : 'Free'}</b><small className="block text-white/60">Current Plan</small>
              {activeSub && <small className="block text-[var(--rr-primary)] text-xs font-bold">{daysLeft(activeSub)} din bache</small>}
            </div>
            <div className="rounded-3xl bg-white/10 p-4"><b>{(data.bookmarks || []).length}</b><small className="block text-white/60">Saved</small></div>
            <div className="rounded-3xl bg-white/10 p-4"><b>{watchHistory.length}</b><small className="block text-white/60">History</small></div>
          </div>
        </div>
        <div className="bg-white p-6 text-zinc-950 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-3xl bg-[var(--rr-primary)]"><User className="text-black" /></span>
            <div>
              {/* FIX: Always show display name, never raw email */}
              <h2 className="text-2xl font-black">{isLoggedIn ? `Namaste, ${displayName.split(' ')[0]}!` : 'Member Login'}</h2>
              <p className="text-sm text-zinc-500">{isLoggedIn ? user?.email : 'Apna account se login karein'}</p>
            </div>
          </div>
          {!isLoggedIn && <>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Display name" />
            <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
            <div className="grid gap-2 sm:grid-cols-2">
              <button disabled={busy} className="btn w-full disabled:opacity-60" onClick={() => signIn(false)}>
                {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Sign In
              </button>
              <button disabled={busy} className="rounded-full bg-zinc-950 px-5 py-3 font-black text-white disabled:opacity-60" onClick={() => signIn(true)}>Create Account</button>
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 font-black shadow-sm" onClick={() => signInWithGoogle('ReelRamp Pro')}>
              <Sparkles size={18} /> Continue with Google
            </button>
          </>}
          {isLoggedIn && <>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Display name" />
            <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
            <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Mobile number" type="tel" />
            <div className="flex flex-wrap gap-2 mt-2">
              <button className="btn" onClick={saveProfile}>Save Profile</button>
              <button className="rounded-full bg-zinc-200 px-5 py-3 font-bold" onClick={signOut}>Logout</button>
            </div>
          </>}
          {authMsg && <p className="mt-3 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-800">{authMsg}</p>}
          <p className="mt-4 rounded-2xl bg-zinc-100 p-3 text-xs font-bold text-zinc-600">Account: {user?.email || 'Guest mode'} · Status: {subscribed ? 'Premium Active' : 'Free Viewer'}</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b">
          {(['account', 'subscription', 'history'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-4 font-black text-sm capitalize ${activeTab === t ? 'bg-zinc-950 text-white' : 'text-zinc-500'}`}>
              {t === 'account' ? '👤 Account' : t === 'subscription' ? '👑 Subscription' : '📜 History'}
            </button>
          ))}
        </div>

        {activeTab === 'account' && (
          <div className="p-5 space-y-3">
            <div className="rounded-2xl bg-zinc-100 p-4 space-y-2 text-sm">
              <p className="font-black">Name: <span className="font-normal">{displayName}</span></p>
              <p className="font-black">Guest ID: <span className="font-mono text-xs">{guestId}</span></p>
              <p className="font-black">Role: <span className="font-normal">{user?.role || 'viewer'}</span></p>
              <p className="font-black">Status: <span className="font-normal">{subscribed ? '✅ Premium' : '🔓 Free'}</span></p>
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          <div className="p-5 space-y-4">
            {activeSub ? (
              <div className="space-y-3">
                <div className="rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-400 p-5 text-black">
                  <Crown size={28} className="mb-2" />
                  <h3 className="text-2xl font-black">{activeSub.plan}</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div><p className="opacity-70">Status</p><p className="font-black capitalize">{activeSub.status}</p></div>
                    <div><p className="opacity-70">Bache hue din</p><p className="font-black">{daysLeft(activeSub)} din</p></div>
                    <div><p className="opacity-70">Purchase</p><p className="font-black">{new Date(activeSub.created_at).toLocaleDateString('en-IN')}</p></div>
                    <div><p className="opacity-70">Expiry</p><p className="font-black">{new Date(activeSub.expires_at).toLocaleDateString('en-IN')}</p></div>
                    {activeSub.auto_renew !== undefined && (
                      <div><p className="opacity-70">Auto-Renew</p><p className="font-black">{activeSub.auto_renew ? '✅ On' : '❌ Off'}</p></div>
                    )}
                    {activeSub.gateway && (
                      <div><p className="opacity-70">Gateway</p><p className="font-black">{activeSub.gateway}</p></div>
                    )}
                  </div>
                </div>
                {daysLeft(activeSub) <= 5 && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm font-bold text-amber-700 flex items-center gap-2">
                    <Clock size={16} /> Subscription jald expire hone wala hai! Renew karein.
                  </div>
                )}
                <button onClick={cancelSub} className="w-full rounded-full bg-red-50 py-3 font-black text-red-600 text-sm flex items-center justify-center gap-2">
                  <Ban size={16} /> Subscription Cancel Karein
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="mx-auto text-zinc-300 mb-3" size={44} />
                <p className="font-black text-zinc-500">Koi active subscription nahi hai.</p>
                <a href="#plans" className="btn mt-4 inline-flex">Plans Dekhein</a>
              </div>
            )}
            {payments.length > 0 && (
              <div>
                <h3 className="font-black mb-2">Payment History</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {payments.slice(0, 20).map(p => (
                    <div key={p.id} className="rounded-2xl bg-zinc-50 p-3 text-sm flex justify-between items-center">
                      <div>
                        <p className="font-bold">{money(p.amount)} — {p.gateway}</p>
                        <p className="text-xs text-zinc-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
                        {p.transaction_id && <p className="text-xs text-zinc-400 font-mono">Txn: {p.transaction_id}</p>}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${p.status === 'success' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-5">
            <Rows title="Saved Episodes">
              {(data.bookmarks || []).map(b => <span key={b.id} className="card px-4 py-3">Video #{b.video_id}</span>)}
            </Rows>
            <div className="mt-4">
              <h3 className="font-black mb-2">Watch History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {watchHistory.slice(0, 20).map(h => (
                  <div key={h.id} className="rounded-2xl bg-zinc-50 p-3 text-sm">
                    <p className="font-bold">Video #{h.video_id}</p>
                    <p className="text-xs text-zinc-400">{ftime(h.current_position)} / {ftime(h.duration)} watched</p>
                  </div>
                ))}
                {watchHistory.length === 0 && <p className="text-zinc-400 text-sm">Koi history nahi hai.</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-black">Support Center</h2>
        <p className="text-sm text-zinc-500">Login, payment, video ya account issue yahan bhejein.</p>
        <textarea className="input" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Issue likhiye" />
        <button className="btn" onClick={() => mutate('support_tickets', 'POST', {
          user_id: guestId, name, email, contact: email, message: msg, status: 'open'
        }).then(() => setMsg(''))}>Send Ticket</button>
      </div>
    </section>
  );
}

// ─── WALLET & REFERRAL (LIVE) ─────────────────────────────────────────────────
function WalletReferral() {
  const { data, guestId, mutate, user } = useApp();
  const tx = (data.wallet_transactions || []).filter(t => t.user_id === guestId);
  const balance = tx.reduce((a, t) => a + (t.type === 'debit' ? -Number(t.coins || 0) : Number(t.coins || 0)), 0);
  const code = `RR${guestId.slice(-5).toUpperCase()}`;
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState('');

  const claimDaily = async () => {
    setClaiming(true); setClaimMsg('');
    const today = new Date().toISOString().slice(0, 10);
    const alreadyClaimed = tx.some(t => t.reason === 'Daily reward' && t.reference_id === today);
    if (alreadyClaimed) { setClaimMsg('Aaj ka reward le liya gaya hai! Kal wapas aana.'); setClaiming(false); return; }
    try {
      await mutate('wallet_transactions', 'POST', {
        user_id: guestId, type: 'credit', coins: 10,
        reason: 'Daily reward', reference_id: today
      });
      setClaimMsg('10 coins credit ho gaye! 🎉');
    } catch (e: any) { setClaimMsg(e.message); }
    finally { setClaiming(false); }
  };

  const shareReferral = () => {
    const msg = `ReelRamp Pro pe dekho premium short films! Mere referral code se signup karo: ${code} — ${window.location.origin}`;
    if (navigator.share) navigator.share({ text: msg });
    else navigator.clipboard.writeText(msg).then(() => setClaimMsg('Referral link copy ho gaya!'));
  };

  return (
    <section className="space-y-5">
      <Title t="Wallet & Referral" s="Coins, rewards aur referral se earn karo." />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <Wallet className="text-yellow-500" size={44} />
          <h2 className="mt-3 text-4xl font-black">{balance} Coins</h2>
          <p className="text-zinc-500 text-sm">Daily login, referrals aur rewards se coins kamao.</p>
          {claimMsg && <p className="mt-2 rounded-2xl bg-green-50 p-3 text-sm font-bold text-green-700">{claimMsg}</p>}
          <button disabled={claiming} className="btn mt-4 disabled:opacity-60" onClick={claimDaily}>
            {claiming ? <Loader2 className="animate-spin" size={16} /> : '🎁'} Claim Daily 10 Coins
          </button>
        </div>
        <div className="card p-6">
          <Gift className="text-[var(--rr-accent)]" size={44} />
          <h2 className="mt-3 text-2xl font-black">Referral Code</h2>
          <p className="text-sm text-zinc-500 mt-1">Dost ko refer karo — dono ko 50 coins milenge!</p>
          <p className="my-3 rounded-2xl bg-zinc-100 p-4 text-2xl font-black tracking-widest">{code}</p>
          <div className="flex gap-2">
            <button className="btn flex-1" onClick={() => navigator.clipboard.writeText(code).then(() => setClaimMsg('Code copied!'))}>Copy Code</button>
            <button className="btn flex-1" onClick={shareReferral}>Share</button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card p-5">
        <h3 className="font-black mb-3">Transaction History</h3>
        {tx.length === 0 ? (
          <p className="text-zinc-400 text-sm text-center py-4">Koi transaction nahi hai abhi.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tx.slice().reverse().map(t => (
              <div key={t.id} className="rounded-2xl bg-zinc-50 p-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold">{t.reason || 'Transaction'}</p>
                  <p className="text-xs text-zinc-400">{new Date(t.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`font-black text-lg ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {t.type === 'credit' ? '+' : '-'}{t.coins}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── HELP CENTER ──────────────────────────────────────────────────────────────
function HelpCenter() {
  const { data } = useApp();
  return (
    <section className="space-y-5">
      <Title t="Help Center" s="Video, account, subscription aur support FAQ." />
      {(data.help_articles || []).filter(a => a.is_published).map(a => (
        <article key={a.id} className="card p-6">
          <p className="font-black text-[var(--rr-accent)]">{a.category}</p>
          <h2 className="text-2xl font-black">{a.title}</h2>
          <p className="mt-3 whitespace-pre-line text-zinc-600">{a.body}</p>
        </article>
      ))}
      {(data.help_articles || []).filter(a => a.is_published).length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-zinc-400">Admin panel se help articles add karein.</p>
        </div>
      )}
    </section>
  );
}

// ─── PWA INSTALL ──────────────────────────────────────────────────────────────
function PwaInstall() {
  const { guestId, mutate } = useApp();
  const [deferred, setDeferred] = useState<any>(null);
  const [hidden, setHidden] = useState(isInstalledApp() || localStorage.getItem('rr_install_closed') === '1');
  const [iosOpen, setIosOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (isInstalledApp()) { setHidden(true); return; }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => { });
    const markInstalled = () => { localStorage.setItem('rr_install_completed', '1'); setHidden(true); setIosOpen(false); setManualOpen(false); };
    const onPrompt = (e: any) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', markInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', markInstalled); };
  }, []);

  if (hidden || isInstalledApp()) return null;

  const install = async () => {
    if (deferred) {
      setInstalling(true);
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setInstalling(false);
      if (outcome === 'accepted') {
        localStorage.setItem('rr_install_completed', '1');
        setHidden(true);
        try { await mutate('push_subscriptions', 'POST', { user_id: guestId, endpoint: 'pwa-installed', subscription: { platform: navigator.userAgent }, enabled: true }); } catch { }
      }
    } else if (isIos) { setIosOpen(true); }
    else { setManualOpen(true); }
  };

  return <>
    {iosOpen && (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4 backdrop-blur">
        <motion.div initial={{ scale: .92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-sm rounded-[34px] bg-white p-6 shadow-2xl">
          <button onClick={() => setIosOpen(false)} className="float-right rounded-full bg-zinc-100 p-2"><X size={18} /></button>
          <h2 className="text-2xl font-black mb-2">iPhone par Install karein</h2>
          <ol className="space-y-4 text-sm font-bold mt-4">
            <li className="flex gap-3 items-start"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--rr-primary)] text-black text-xs font-black">1</span><span>Safari toolbar mein <b>Share button</b> (↑) dabao</span></li>
            <li className="flex gap-3 items-start"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--rr-primary)] text-black text-xs font-black">2</span><span><b>"Add to Home Screen"</b> select karo</span></li>
            <li className="flex gap-3 items-start"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--rr-primary)] text-black text-xs font-black">3</span><span>Right mein <b>"Add"</b> dabao</span></li>
          </ol>
          <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-700 font-bold">⚠️ Sirf Safari browser mein kaam karta hai.</p>
          <button onClick={() => setIosOpen(false)} className="btn mt-4 w-full">Samajh gaya ✓</button>
        </motion.div>
      </div>
    )}
    {manualOpen && (
      <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4 backdrop-blur">
        <motion.div initial={{ scale: .92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-sm rounded-[34px] bg-white p-6 shadow-2xl">
          <button onClick={() => setManualOpen(false)} className="float-right rounded-full bg-zinc-100 p-2"><X size={18} /></button>
          <h2 className="text-2xl font-black mb-2">App Install karein</h2>
          <ol className="space-y-4 text-sm font-bold mt-4">
            <li className="flex gap-3 items-start"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--rr-primary)] text-black text-xs font-black">1</span><span>Address bar ke right mein <b>install icon (⊕)</b> ya <b>3-dot menu</b> kholo</span></li>
            <li className="flex gap-3 items-start"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--rr-primary)] text-black text-xs font-black">2</span><span><b>"Install App"</b> select karo</span></li>
            <li className="flex gap-3 items-start"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--rr-primary)] text-black text-xs font-black">3</span><span>Confirm karo</span></li>
          </ol>
          <button onClick={() => setManualOpen(false)} className="btn mt-4 w-full">Samajh gaya ✓</button>
        </motion.div>
      </div>
    )}
    <button onClick={install} disabled={installing}
      className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 font-black text-white shadow-2xl disabled:opacity-60 md:left-auto md:right-6">
      {installing ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} Install App
    </button>
    <button onClick={() => { localStorage.setItem('rr_install_closed', '1'); setHidden(true); }} className="fixed bottom-[4.5rem] left-4 z-40 text-xs text-zinc-400 md:left-auto md:right-6">Dismiss</button>
  </>;
}

// ─── POLICIES ─────────────────────────────────────────────────────────────────
function Policies() {
  const { data } = useApp();
  return (
    <section className="space-y-4">
      <Title t="Legal Policies" s="Privacy Policy, Terms aur Payment policies." />
      {(data.legal_policies || []).filter(p => p.is_published).map(p => (
        <article key={p.id} className="card p-6">
          <h2 className="text-2xl font-black">{p.title}</h2>
          <p className="text-sm font-bold text-[var(--rr-accent)]">Version {p.version}</p>
          <p className="mt-4 whitespace-pre-line text-zinc-600">{p.body}</p>
        </article>
      ))}
    </section>
  );
}

// ─── PROMO VIDEO MODAL ────────────────────────────────────────────────────────
function PromoVideoModal({ go }: { go: (t: string) => void }) {
  const { data, subscribed } = useApp();
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canSkip, setCanSkip] = useState(false);
  const [muted, setMuted] = useState(true);
  const promo = (data.promo_campaigns || []).find(p => p.is_active && p.placement === 'app_open');
  useEffect(() => {
    if (!promo || subscribed) return;
    const key = `rr_promo_seen_${promo.id}`;
    const last = Number(localStorage.getItem(key) || 0);
    const wait = Number(promo.show_after_seconds || 2) * 1000;
    const freq = Number(promo.frequency_hours || 12) * 3600000;
    if (Date.now() - last < freq) return;
    const t = window.setTimeout(() => { setOpen(true); setProgress(0); setCanSkip(false); localStorage.setItem(key, String(Date.now())); }, wait);
    return () => window.clearTimeout(t);
  }, [promo?.id, subscribed]);
  useEffect(() => {
    if (!open) return;
    setProgress(0); setCanSkip(false);
    const skip = window.setTimeout(() => setCanSkip(true), 5000);
    const prog = window.setInterval(() => setProgress(p => Math.min(100, p + 1)), 300);
    return () => { window.clearTimeout(skip); window.clearInterval(prog); };
  }, [open]);
  const close = () => { setOpen(false); setProgress(0); setCanSkip(false); };
  if (!open || !promo) return null;
  return (
    <AnimatePresence>
      <motion.div key="promo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black flex items-center justify-center">
        <div className="relative w-full h-full max-w-[430px] mx-auto bg-zinc-950">
          {promo.video_filename
            ? <video src={vurl(promo.video_filename)} poster={promo.poster_url || undefined} autoPlay muted={muted} playsInline loop className="absolute inset-0 h-full w-full object-cover" />
            : promo.poster_url
              ? <img src={promo.poster_url} className="absolute inset-0 h-full w-full object-cover" />
              : <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black grid place-items-center"><Sparkles size={80} className="text-[var(--rr-primary)]" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
          <div className="absolute top-0 inset-x-0 p-4 space-y-3">
            <div className="h-1 rounded-full bg-white/20 overflow-hidden">
              <motion.div className="h-full rounded-full bg-[var(--rr-primary)]" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[var(--rr-primary)] grid place-items-center font-black text-black text-xs">{(promo.celebrity_name || 'RR').slice(0, 2).toUpperCase()}</div>
                <div><p className="text-white text-xs font-black">{promo.celebrity_name || 'ReelRamp Pro'}</p><p className="text-white/60 text-[10px]">Sponsored</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setMuted(!muted)} className="h-9 w-9 rounded-full bg-black/40 backdrop-blur grid place-items-center text-white">{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
                {canSkip
                  ? <button onClick={close} className="flex items-center gap-1 rounded-full bg-black/50 backdrop-blur px-3 py-2 text-white text-xs font-black"><X size={14} /> Skip</button>
                  : <div className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur px-3 py-2 text-white/60 text-xs font-bold">Skip in {Math.max(0, 5 - Math.floor(progress / 20))}s</div>}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 inset-x-0 p-6 space-y-4">
            {promo.celebrity_name && <p className="text-[var(--rr-primary)] text-sm font-black">⭐ {promo.celebrity_name} recommends</p>}
            <h2 className="text-4xl font-black text-white leading-tight">{promo.title}</h2>
            {(promo.offer_text || promo.subtitle) && <p className="text-white/80 text-base">{promo.offer_text || promo.subtitle}</p>}
            <div className="grid gap-3 pt-2">
              <button onClick={() => { close(); go(promo.cta_action || 'plans'); }} className="w-full rounded-full bg-[var(--rr-primary)] py-4 text-black font-black text-lg">{promo.cta_label || 'View Offer'}</button>
              <button onClick={close} className="w-full rounded-full bg-white/10 backdrop-blur py-3 text-white font-bold">Abhi nahi</button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── NOTIFICATION STRIP ───────────────────────────────────────────────────────
function NotificationStrip() {
  const { data } = useApp();
  const [dismissed, setDismissed] = useState<number[]>([]);
  const notifs = (data.notifications || []).filter(x => x.is_active && !dismissed.includes(x.id));
  const n = notifs[0];
  if (!n) return null;
  const colors: Record<string, string> = {
    success: 'bg-green-900 text-green-100', warning: 'bg-amber-900 text-amber-100',
    error: 'bg-red-900 text-red-100', info: 'bg-zinc-950 text-white'
  };
  const cls = colors[n.type || 'info'] || colors.info;
  return (
    <div className="mx-auto mt-4 max-w-6xl px-4">
      <div className={`flex items-center gap-3 rounded-3xl p-4 shadow-lg ${cls}`}>
        <Bell className="text-[var(--rr-primary)] shrink-0" />
        <div className="flex-1"><b>{n.title}</b><p className="text-sm opacity-75">{n.message}</p></div>
        <button onClick={() => setDismissed(p => [...p, n.id])} className="opacity-60 hover:opacity-100"><X size={18} /></button>
      </div>
    </div>
  );
}

// ─── ADMIN GATE ───────────────────────────────────────────────────────────────
function AdminGate() {
  const [s, setS] = useState('');
  const [ok, setOk] = useState(() => sessionStorage.getItem('rr_admin') === '1');
  if (ok) return <Admin />;
  return (
    <main className="grid min-h-screen place-items-center bg-orange-50 p-4">
      <div className="card max-w-md p-8">
        <ShieldCheck className="text-[var(--rr-accent)]" size={54} />
        <h1 className="mt-4 text-3xl font-black">Admin Login</h1>
        <p className="text-zinc-500">Authorized personnel only.</p>
        <input className="input" type="password" value={s} onChange={e => setS(e.target.value)} placeholder="Admin password"
          onKeyDown={e => { if (e.key === 'Enter' && s === ADMIN_SECRET) { sessionStorage.setItem('rr_admin', '1'); setOk(true); } }} />
        <button className="btn w-full" onClick={() => { if (s === ADMIN_SECRET) { sessionStorage.setItem('rr_admin', '1'); setOk(true); } }}>Enter</button>
      </div>
    </main>
  );
}

const empty: any = {};

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function Admin() {
  const { data, videos, categories, payment, theme, player, mutate, refresh } = useApp();
  const [tab, setTab] = useState('dashboard');
  const [pay, setPay] = useState<PaymentSettings>(payment);
  const [th, setTh] = useState<BrandSettings>(theme);
  const [pl, setPl] = useState(player);
  const [importText, setImportText] = useState('');
  const [importResource, setImportResource] = useState('videos');
  const [importMsg, setImportMsg] = useState('');
  const [gwForm, setGwForm] = useState<Partial<GatewayConfig & { keys: any }>>({});

  useEffect(() => setPay(payment), [payment]);
  useEffect(() => setTh(theme), [theme]);
  useEffect(() => setPl(player), [player]);

  const admin = data.admin_settings || [];
  const saveSetting = (key: string, value: any) => {
    const row = admin.find(a => a.key === key);
    return mutate('admin_settings', row ? 'PUT' : 'POST', row ? { id: row.id, key, value } : { key, value });
  };

  const payments = data.payments || [];
  const successPayments = payments.filter(p => p.status === 'success');
  const revenue = successPayments.reduce((a, p) => a + Number(p.amount || 0), 0);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const dailyRevenue = successPayments.filter(p => new Date(p.created_at).getTime() >= startOfDay).reduce((a, p) => a + Number(p.amount || 0), 0);
  const monthlyRevenue = successPayments.filter(p => new Date(p.created_at).getTime() >= startOfMonth).reduce((a, p) => a + Number(p.amount || 0), 0);
  const allSubs = data.subscriptions || [];
  const activeSubs = allSubs.filter(s => s.status === 'active' && new Date(s.expires_at).getTime() > Date.now());
  const expiredSubs = allSubs.filter(s => s.status === 'expired' || (s.status === 'active' && new Date(s.expires_at).getTime() < Date.now()));
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const failedPayments = payments.filter(p => p.status === 'failed');

  const pdf = () => {
    const w = open('', '_blank');
    w?.document.write(`<h1>ReelRamp Pro Report</h1><p>Total Revenue: ${money(revenue)}</p><p>Daily: ${money(dailyRevenue)}</p><p>Monthly: ${money(monthlyRevenue)}</p><p>Active Subs: ${activeSubs.length}</p><p>Users: ${(data.users || []).length}</p><p>Videos: ${videos.length}</p><script>print()<\/script>`);
  };

  const exp = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'reelramp-backup.json'; a.click();
  };

  const doImport = async (dryRun = false) => {
    try {
      const parsed = JSON.parse(importText);
      const rows = Array.isArray(parsed) ? parsed : (parsed[importResource] || []);
      const res = await fetch('/api/json_import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: importResource, rows, dryRun })
      });
      const j = await res.json();
      setImportMsg(JSON.stringify(j, null, 2));
      if (!dryRun) refresh(true);
    } catch (e: any) { setImportMsg(e.message); }
  };

  const addGateway = () => {
    if (!gwForm.name || !gwForm.type) return;
    const newGw: GatewayConfig = {
      id: `gw_${Date.now()}`, name: gwForm.name,
      type: gwForm.type, enabled: true,
      isDefault: pay.gateways.length === 0, testMode: !!gwForm.testMode,
      keys: gwForm.keys || {}, healthStatus: 'unknown'
    };
    const updated = { ...pay, gateways: [...pay.gateways, newGw] };
    setPay(updated); setGwForm({});
  };
  const updateGateway = (id: string, changes: Partial<GatewayConfig>) => {
    setPay({ ...pay, gateways: pay.gateways.map(g => g.id === id ? { ...g, ...changes } : g) });
  };
  const removeGateway = (id: string) => setPay({ ...pay, gateways: pay.gateways.filter(g => g.id !== id) });
  const setDefault = (id: string) => setPay({ ...pay, gateways: pay.gateways.map(g => ({ ...g, isDefault: g.id === id })) });

  const tabs = ['dashboard', 'videos', 'series', 'categories', 'banners', 'promoVideo', 'promoAnalytics', 'popups', 'notifications', 'plans', 'payments', 'subscriptions', 'users', 'wallet', 'referrals', 'reports', 'errors', 'audit', 'brand', 'gateways', 'player', 'content', 'policies', 'help', 'push', 'support', 'json'];

  return (
    <main className="min-h-screen bg-orange-50 p-4 md:p-8">
      <Title t="Admin Control Center" s="Content, plans, brand, gateway, revenue — sab yahan se." />
      <div className="my-5 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`pill shrink-0 ${tab === t ? 'active' : ''}`}>{t}</button>)}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Stat l="Total Revenue" v={money(revenue)} />
            <Stat l="Daily Revenue" v={money(dailyRevenue)} />
            <Stat l="Monthly Revenue" v={money(monthlyRevenue)} />
            <Stat l="Total Users" v={(data.users || []).length} />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat l="Active Subs" v={activeSubs.length} />
            <Stat l="Expired Subs" v={expiredSubs.length} />
            <Stat l="Pending Payments" v={pendingPayments.length} />
            <Stat l="Failed Payments" v={failedPayments.length} />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat l="Videos" v={videos.length} />
            <Stat l="Series" v={(data.series || []).length} />
            <Stat l="Categories" v={(data.categories || []).length} />
            <Stat l="Support Tickets" v={(data.support_tickets || []).length} />
          </div>
          <button onClick={pdf} className="btn"><FileText /> Download PDF Report</button>
          {pendingPayments.length > 0 && (
            <div className="card p-5">
              <h3 className="font-black text-amber-700 flex items-center gap-2 mb-3"><AlertCircle size={18} /> Pending Payments — Manual Verification Required</h3>
              <div className="space-y-2">
                {pendingPayments.map(p => (
                  <div key={p.id} className="rounded-2xl bg-amber-50 p-3 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{money(p.amount)} — {p.gateway}</p>
                      <p className="text-xs text-zinc-500">User: {p.user_id} · Txn: {p.transaction_id || p.cf_payment_id}</p>
                      <p className="text-xs text-zinc-400">{new Date(p.created_at).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => mutate('payments', 'PUT', { id: p.id, status: 'success' })} className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">Approve</button>
                      <button onClick={() => mutate('payments', 'PUT', { id: p.id, status: 'failed' })} className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'videos' && <Crud resource="videos" fields={['title', 'description', 'series_title', 'episode_number', 'video_filename', 'bunny_video_id', 'bunny_embed_url', 'thumbnail_url', 'category', 'duration_seconds', 'age_rating', 'publish_at']} checks={['is_premium', 'is_published']} defaults={{ is_published: true, category: categories[0]?.name || 'Drama', age_rating: 'U/A 13+' }} />}
      {tab === 'series' && <Crud resource="series" fields={['title', 'description', 'poster_url', 'category', 'status', 'sort_order']} checks={['is_featured']} defaults={{ status: 'published' }} />}
      {tab === 'categories' && <Crud resource="categories" fields={['name', 'slug', 'icon', 'sort_order']} checks={['is_active']} defaults={{ icon: '🎬', is_active: true }} />}
      {tab === 'banners' && <Crud resource="banners" fields={['title', 'subtitle', 'image_url', 'cta_label', 'cta_action', 'sort_order']} checks={['is_active']} defaults={{ is_active: true, cta_action: 'forYou' }} />}
      {tab === 'promoVideo' && <Crud resource="promo_campaigns" fields={['title', 'subtitle', 'celebrity_name', 'video_filename', 'poster_url', 'offer_text', 'cta_label', 'cta_action', 'placement', 'show_after_seconds', 'frequency_hours', 'sort_order', 'start_at', 'end_at', 'target']} checks={['is_active']} defaults={{ is_active: true, placement: 'app_open', cta_action: 'plans', show_after_seconds: 2, frequency_hours: 12, target: 'free_users' }} />}
      {tab === 'promoAnalytics' && <DataTable resource="promo_events" rows={data.promo_events || []} />}
      {tab === 'popups' && <Crud resource="popup_settings" fields={['title', 'message', 'cta_label', 'cta_url']} checks={['enabled']} defaults={{ enabled: true }} />}
      {tab === 'notifications' && <Crud resource="notifications" fields={['title', 'message', 'target']} checks={['is_active']} defaults={{ is_active: true, target: 'all' }} />}
      {tab === 'plans' && <Crud resource="plans" fields={['name', 'price', 'duration_days', 'sort_order', 'plan_type', 'trial_days', 'cf_plan_id']} checks={['is_active', 'supports_autorenew']} defaults={{ is_active: true, price: 99, duration_days: 30, plan_type: 'monthly' }} />}
      {tab === 'payments' && <DataTable resource="payments" rows={data.payments || []} />}
      {tab === 'subscriptions' && <DataTable resource="subscriptions" rows={data.subscriptions || []} />}
      {tab === 'users' && <DataTable resource="users" rows={data.users || []} />}
      {tab === 'wallet' && <DataTable resource="wallet_transactions" rows={data.wallet_transactions || []} />}
      {tab === 'referrals' && <DataTable resource="referrals" rows={data.referrals || []} />}
      {tab === 'reports' && <DataTable resource="content_reports" rows={data.content_reports || []} />}
      {tab === 'errors' && <DataTable resource="error_logs" rows={data.error_logs || []} />}
      {tab === 'audit' && <DataTable resource="audit_logs" rows={data.audit_logs || []} />}

      {/* ── BRAND & LOGO ── */}
      {tab === 'brand' && (
        <div className="panel space-y-4">
          <h2 className="adminh"><Palette /> Brand & Logo Settings</h2>

          {/* Logo Image Section */}
          <div className="rounded-3xl border-2 border-dashed border-[var(--rr-primary)] bg-orange-50 p-5">
            <h3 className="font-black mb-3 flex items-center gap-2"><Image size={18} /> Logo Image</h3>
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <div>
                <label className="label">Logo Image URL</label>
                <input className="input" value={th.logoImageUrl || ''} onChange={e => setTh({ ...th, logoImageUrl: e.target.value })} placeholder="https://example.com/logo.png" />
                <p className="text-xs text-zinc-500 mt-1">
                  PNG/SVG transparent background best lagti hai. Recommended: 200×60px ya square 100×100px.
                </p>
                <label className="label mt-3">Logo Text (Fallback — jab image na ho)</label>
                <input className="input" value={th.logoText || ''} onChange={e => setTh({ ...th, logoText: e.target.value })} placeholder="RR" />
              </div>
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs font-black text-zinc-500">Preview:</p>
                <div className="rounded-2xl border bg-white p-4 flex items-center gap-3 w-full">
                  {th.logoImageUrl ? (
                    <img src={th.logoImageUrl} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-2xl font-black text-black" style={{ background: th.primary || '#c5a26f' }}>
                      {th.logoText || 'RR'}
                    </span>
                  )}
                  <b className="text-xl">{th.brand || 'ReelRamp Pro'}</b>
                </div>
                <p className="text-xs text-zinc-400 text-center">Aisa header mein dikhega</p>
              </div>
            </div>
          </div>

          {/* Brand Name */}
          <div>
            <label className="label">Brand Name</label>
            <input className="input" value={th.brand || ''} onChange={e => setTh({ ...th, brand: e.target.value })} placeholder="ReelRamp Pro" />
          </div>

          {/* Colors */}
          <div className="grid gap-4 md:grid-cols-3">
            {(['primary', 'accent', 'bg'] as const).map(k => (
              <div key={k} className="space-y-2">
                <label className="label capitalize">{k} Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" className="h-10 w-12 cursor-pointer rounded-xl border border-zinc-200" value={th[k] || '#000000'} onChange={e => setTh({ ...th, [k]: e.target.value })} />
                  <input className="input flex-1" value={th[k] || ''} onChange={e => setTh({ ...th, [k]: e.target.value })} placeholder="#hex" />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="label">Border Radius</label>
            <input className="input max-w-xs" value={th.radius || ''} onChange={e => setTh({ ...th, radius: e.target.value })} placeholder="30px" />
          </div>

          <button className="save w-full" onClick={() => saveSetting('theme', th)}>💾 Save Brand Settings</button>

          {/* Gateway status quick info */}
          <div className={`rounded-2xl p-3 text-sm font-bold flex items-center gap-2 ${pay.gateways.some(g => g.enabled) ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
            {pay.gateways.some(g => g.enabled)
              ? <><CheckCircle2 size={16} /> {pay.gateways.filter(g => g.enabled).length} payment gateway(s) active</>
              : <><span>⏳</span> Koi gateway active nahi — "Gateways" tab mein configure karein.</>}
          </div>
        </div>
      )}

      {/* ── GATEWAYS (Full Cashfree + Multi-Gateway Engine) ── */}
      {tab === 'gateways' && (
        <div className="space-y-5">
          <div className="panel">
            <h2 className="adminh"><Wallet /> Payment Gateway Engine</h2>
            <p className="text-sm text-zinc-500 mb-4">Cashfree, Razorpay, UPI Manual — multiple gateways add karein. Default gateway plans page par use hoga.</p>

            {/* Cashfree Quick Setup Guide */}
            <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-5 mb-5">
              <h3 className="font-black text-orange-700 flex items-center gap-2 mb-2"><Zap size={16} /> Cashfree Quick Setup</h3>
              <ol className="text-sm text-orange-800 space-y-1">
                <li>1. <a href="https://merchant.cashfree.com" target="_blank" className="underline font-bold">merchant.cashfree.com</a> par account banao</li>
                <li>2. Developers → API Keys → App ID aur Secret Key copy karo</li>
                <li>3. Sandbox mein test karo, fir Production keys use karo</li>
                <li>4. Webhooks → URL set karo: <code className="bg-orange-100 px-1 rounded">{window.location.origin}/api/cashfree-webhook</code></li>
                <li>5. Subscriptions use karne ke liye: Plans tab mein <b>cf_plan_id</b> fill karo</li>
              </ol>
            </div>

            {/* Existing Gateways */}
            <div className="space-y-3 mb-5">
              {pay.gateways.map(gw => (
                <div key={gw.id} className={`rounded-3xl border-2 p-4 ${gw.enabled ? 'border-green-200 bg-green-50' : 'border-zinc-200 bg-zinc-50'}`}>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${gw.enabled ? 'bg-green-500' : 'bg-zinc-300'}`} />
                      <b className="font-black">{gw.name}</b>
                      <span className="text-xs text-zinc-500">({gw.type})</span>
                      {gw.isDefault && <span className="rounded-full bg-[var(--rr-primary)] px-2 py-0.5 text-xs font-black text-black">DEFAULT</span>}
                      {gw.testMode && <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-black text-yellow-800">SANDBOX</span>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => updateGateway(gw.id, { enabled: !gw.enabled })} className={`rounded-full px-3 py-1 text-xs font-black ${gw.enabled ? 'bg-zinc-200 text-zinc-700' : 'bg-green-200 text-green-700'}`}>
                        {gw.enabled ? 'Disable' : 'Enable'}
                      </button>
                      {!gw.isDefault && <button onClick={() => setDefault(gw.id)} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">Set Default</button>}
                      <button onClick={() => removeGateway(gw.id)} className="rounded-full bg-red-100 p-2 text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {Object.entries(gw.keys).map(([k, v]) => (
                    <p key={k} className="text-xs text-zinc-500 font-mono">{k}: {k.toLowerCase().includes('secret') ? '••••••••' : String(v).slice(0, 16) + (String(v).length > 16 ? '...' : '')}</p>
                  ))}
                </div>
              ))}
              {pay.gateways.length === 0 && (
                <div className="rounded-3xl bg-zinc-100 p-5 text-center text-zinc-500 text-sm">Koi gateway configure nahi hai. Neeche add karein.</div>
              )}
            </div>

            {/* Add Gateway Form */}
            <div className="rounded-3xl border-2 border-dashed border-zinc-300 p-5">
              <h3 className="font-black mb-4 flex items-center gap-2"><Plus size={18} /> New Gateway Add Karein</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div><label className="label">Gateway Name *</label><input className="input" value={gwForm.name || ''} onChange={e => setGwForm({ ...gwForm, name: e.target.value })} placeholder="Cashfree Production" /></div>
                <div>
                  <label className="label">Gateway Type *</label>
                  <select className="input" value={gwForm.type || ''} onChange={e => setGwForm({ ...gwForm, type: e.target.value, keys: {} })}>
                    <option value="">-- Select --</option>
                    {['Cashfree', 'Razorpay', 'PayU', 'Cashfree', 'UPI Manual', 'Paytm', 'PhonePe', 'Stripe', 'PayPal', 'Bank Transfer'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {/* Cashfree-specific keys */}
              {gwForm.type === 'Cashfree' && (
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <div>
                    <label className="label">App ID (Client ID)</label>
                    <input className="input" value={gwForm.keys?.appId || ''} onChange={e => setGwForm({ ...gwForm, keys: { ...gwForm.keys, appId: e.target.value } })} placeholder="TEST1234567890..." />
                  </div>
                  <div>
                    <label className="label">Secret Key</label>
                    <input className="input" type="password" value={gwForm.keys?.secretKey || ''} onChange={e => setGwForm({ ...gwForm, keys: { ...gwForm.keys, secretKey: e.target.value } })} placeholder="Secret" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Webhook Secret (optional)</label>
                    <input className="input" type="password" value={gwForm.webhookSecret || ''} onChange={e => setGwForm({ ...gwForm, webhookSecret: e.target.value })} placeholder="Cashfree webhook secret" />
                  </div>
                </div>
              )}

              {/* Razorpay-specific keys */}
              {gwForm.type === 'Razorpay' && (
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <div><label className="label">Key ID</label><input className="input" value={gwForm.keys?.keyId || ''} onChange={e => setGwForm({ ...gwForm, keys: { ...gwForm.keys, keyId: e.target.value } })} placeholder="rzp_live_..." /></div>
                  <div><label className="label">Key Secret</label><input className="input" type="password" value={gwForm.keys?.keySecret || ''} onChange={e => setGwForm({ ...gwForm, keys: { ...gwForm.keys, keySecret: e.target.value } })} placeholder="Secret" /></div>
                </div>
              )}

              {/* UPI Manual */}
              {gwForm.type === 'UPI Manual' && (
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <div><label className="label">UPI ID</label><input className="input" value={gwForm.keys?.upiId || ''} onChange={e => setGwForm({ ...gwForm, keys: { ...gwForm.keys, upiId: e.target.value } })} placeholder="yourname@upi" /></div>
                  <div><label className="label">QR Code Image URL</label><input className="input" value={gwForm.keys?.upiQr || ''} onChange={e => setGwForm({ ...gwForm, keys: { ...gwForm.keys, upiQr: e.target.value } })} placeholder="https://..." /></div>
                </div>
              )}

              {/* PayU / Others */}
              {(gwForm.type === 'PayU' || gwForm.type === 'Stripe' || gwForm.type === 'PayPal') && (
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <div><label className="label">API Key / Client ID</label><input className="input" value={gwForm.keys?.keyId || ''} onChange={e => setGwForm({ ...gwForm, keys: { ...gwForm.keys, keyId: e.target.value } })} /></div>
                  <div><label className="label">Secret Key</label><input className="input" type="password" value={gwForm.keys?.keySecret || ''} onChange={e => setGwForm({ ...gwForm, keys: { ...gwForm.keys, keySecret: e.target.value } })} /></div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-4">
                <label className="flex cursor-pointer items-center gap-2 font-black text-sm">
                  <input type="checkbox" checked={!!gwForm.testMode} onChange={e => setGwForm({ ...gwForm, testMode: e.target.checked })} className="h-4 w-4" />
                  Sandbox / Test Mode
                </label>
              </div>
              <button onClick={addGateway} disabled={!gwForm.name || !gwForm.type} className="btn mt-4 disabled:opacity-50">
                <Plus size={16} /> Add Gateway
              </button>
            </div>

            {/* Common Settings */}
            <div className="mt-5 space-y-3">
              <h3 className="font-black">Common Payment Settings</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div><label className="label">WhatsApp Support Number</label><input className="input" value={pay.whatsapp || ''} onChange={e => setPay({ ...pay, whatsapp: e.target.value })} placeholder="+917307493338" /></div>
                <div><label className="label">Monthly Base Price (₹)</label><input className="input" type="number" value={pay.monthlyPrice || ''} onChange={e => setPay({ ...pay, monthlyPrice: Number(e.target.value) })} /></div>
              </div>
              <div><label className="label">Payment Instructions (users ko dikhega)</label><textarea className="input min-h-20" value={pay.instructions || ''} onChange={e => setPay({ ...pay, instructions: e.target.value })} placeholder="UPI se payment karein aur UTR WhatsApp par bhejein." /></div>
            </div>

            <button className="save w-full mt-4" onClick={() => saveSetting('payment', pay)}>💾 Save All Gateway Settings</button>
          </div>
        </div>
      )}

      {tab === 'player' && (
        <div className="panel">
          <h2 className="adminh"><Play /> Video Player Settings</h2>
          <label className="font-black">Player mode</label>
          <select className="input" value={pl.mode || 'default'} onChange={e => setPl({ ...pl, mode: e.target.value })}>
            <option value="default">Default Player (MP4/HLS)</option>
            <option value="bunny">Bunny.net Player (iframe embed)</option>
          </select>
          {['bunnyEmbedBase', 'bunnyLibraryId'].map(k => <input key={k} className="input" value={pl[k] || ''} onChange={e => setPl({ ...pl, [k]: e.target.value })} placeholder={k} />)}
          <label className="flex gap-2 font-bold mt-2"><input type="checkbox" checked={pl.autoplay !== false} onChange={e => setPl({ ...pl, autoplay: e.target.checked })} /> Autoplay</label>
          <label className="flex gap-2 font-bold"><input type="checkbox" checked={!!pl.muted} onChange={e => setPl({ ...pl, muted: e.target.checked })} /> Muted</label>
          <label className="flex gap-2 font-bold"><input type="checkbox" checked={pl.responsive !== false} onChange={e => setPl({ ...pl, responsive: e.target.checked })} /> Responsive</label>
          <button className="save mt-3" onClick={() => saveSetting('player', pl)}>Save Player Settings</button>
        </div>
      )}

      {tab === 'content' && <Crud resource="platform_settings" fields={['site_name', 'hero_title', 'hero_subtitle', 'pwa_message']} checks={['maintenance_mode']} defaults={{ site_name: 'ReelRamp Pro' }} />}
      {tab === 'policies' && <Crud resource="legal_policies" fields={['title', 'type', 'version', 'body']} checks={['is_published']} defaults={{ version: '1.0', is_published: true }} />}
      {tab === 'help' && <Crud resource="help_articles" fields={['title', 'body', 'category', 'sort_order']} checks={['is_published']} defaults={{ is_published: true, category: 'General' }} />}
      {tab === 'push' && <DataTable resource="push_subscriptions" rows={data.push_subscriptions || []} />}
      {tab === 'support' && <DataTable resource="support_tickets" rows={data.support_tickets || []} />}
      {tab === 'json' && (
        <div className="panel">
          <h2 className="adminh"><FileJson /> JSON Backup / Restore</h2>
          <button className="save" onClick={exp}>Export Full JSON</button>
          <select className="input" value={importResource} onChange={e => setImportResource(e.target.value)}>{resources.map(r => <option key={r}>{r}</option>)}</select>
          <textarea className="input min-h-56" value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste JSON array or full backup JSON here" />
          <div className="flex gap-2">
            <button className="btn" onClick={() => doImport(true)}>Validate</button>
            <button className="btn" onClick={() => doImport(false)}>Import</button>
            <button className="btn" onClick={() => refresh()}>Refresh</button>
          </div>
          {importMsg && <pre className="max-h-64 overflow-auto rounded-2xl bg-zinc-950 p-4 text-xs text-green-200">{importMsg}</pre>}
        </div>
      )}
    </main>
  );
}

// ─── CRUD / DATA TABLE ────────────────────────────────────────────────────────
function Crud({ resource, fields, checks, defaults }: { resource: string; fields: string[]; checks?: string[]; defaults?: any }) {
  const { data, mutate } = useApp();
  const [f, setF] = useState<any>(defaults || {});
  const rows = data[resource] || [];
  const save = async (e: FormEvent) => { e.preventDefault(); await mutate(resource, f.id ? 'PUT' : 'POST', f); setF(defaults || {}); };
  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <form onSubmit={save} className="panel">
        <h2 className="adminh"><Edit3 /> {resource}</h2>
        {fields.map(k => k === 'body' || k === 'description' || k === 'message' || k === 'hero_subtitle'
          ? <textarea key={k} className="input min-h-28" value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} placeholder={k} />
          : <input key={k} className="input" value={f[k] || ''} onChange={e => setF({ ...f, [k]: e.target.value })} placeholder={k} />)}
        {checks?.map(k => <label key={k} className="flex gap-2 font-bold"><input type="checkbox" checked={!!f[k]} onChange={e => setF({ ...f, [k]: e.target.checked })} />{k}</label>)}
        <button className="save"><Plus /> Save</button>
      </form>
      <DataTable resource={resource} rows={rows} onEdit={setF} />
    </div>
  );
}

function DataTable({ rows, resource, onEdit }: { rows: Row[]; resource: string; onEdit?: (r: Row) => void }) {
  const { mutate } = useApp();
  const keys = Object.keys(rows[0] || empty).slice(0, 7);
  return (
    <div className="overflow-auto rounded-[28px] bg-white p-3 shadow-sm">
      <table className="min-w-full text-sm">
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="border-b">
              <td className="p-3 font-black">#{r.id}</td>
              {keys.map(k => <td key={k} className="max-w-48 truncate p-3">{typeof r[k] === 'object' ? JSON.stringify(r[k]) : String(r[k] ?? '')}</td>)}
              <td className="flex gap-2 p-3">
                {onEdit && <button onClick={() => onEdit(r)} className="rounded-full bg-blue-100 p-2 text-blue-700"><Edit3 size={16} /></button>}
                <button onClick={() => mutate(resource, 'DELETE', { id: r.id })} className="rounded-full bg-red-100 p-2 text-red-600"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={10} className="p-6 text-center text-zinc-400">Koi data nahi hai.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ─── MISC COMPONENTS ──────────────────────────────────────────────────────────
function Stat({ l, v }: { l: string; v: any }) { return <div className="card p-5"><p className="text-sm text-zinc-500">{l}</p><b className="text-3xl">{v}</b></div>; }

function InfoSection() {
  return (
    <div className="card overflow-hidden md:grid md:grid-cols-[.9fr_1.1fr]">
      <img src={fallbackImages.studio} className="h-full min-h-72 w-full object-cover" />
      <div className="p-7">
        <p className="font-black text-[var(--rr-accent)]">About ReelRamp</p>
        <h2 className="mt-2 text-3xl font-black">ReelRamp Originals Pvt. Ltd.</h2>
        <p className="mt-3 text-zinc-600">Founder/Director Ayush Jivan — "Kahaniyan sirf sunayi nahi jati, mehsoos ki jati hain."</p>
        <p className="mt-4 text-zinc-600">FF Shop No. 6, Arohi Arcade, Munshipulia, Lucknow - 226016 · reelramporiginal@gmail.com · +91 7307493338</p>
        <div className="mt-5 flex gap-3 text-[var(--rr-accent)]"><Facebook /><Instagram /><Youtube /><MessageCircle /></div>
      </div>
    </div>
  );
}

function Empty() { return <div className="card p-10 text-center"><Film className="mx-auto text-[var(--rr-accent)]" size={50} /><h2 className="text-3xl font-black">No content yet</h2></div>; }
function Title({ t, s }: { t: string; s: string }) { return <div><p className="font-black text-[var(--rr-accent)]">ReelRamp Pro</p><h1 className="text-4xl font-black">{t}</h1><p className="text-zinc-600">{s}</p></div>; }

// ─── SHELL (with Logo Image support) ─────────────────────────────────────────
function Shell() {
  const { loading, theme, data, user } = useApp();
  const [tab, setTab] = useState('home');
  const [historyStack, setHistoryStack] = useState<string[]>(['home']);
  const [exitAsk, setExitAsk] = useState(false);

  const isLoggedIn = !!(user?.email);
  // FIX: Use getBestDisplayName everywhere — never show raw email
  const displayName = getBestDisplayName(user);
  const headerName = isLoggedIn ? displayName.split(' ')[0] : 'Login';

  const go = (t: string) => { setTab(t); setHistoryStack(prev => [...prev, t]); };

  useEffect(() => {
    document.documentElement.style.setProperty('--rr-primary', theme.primary || '#c5a26f');
    document.documentElement.style.setProperty('--rr-accent', theme.accent || '#ff4f8b');
    document.documentElement.style.setProperty('--rr-bg', theme.bg || '#fff7ed');
    document.documentElement.style.setProperty('--rr-radius', theme.radius || '30px');
  }, [theme]);

  useEffect(() => {
    history.pushState({ rr: true }, '', location.href);
    const onPop = () => {
      setHistoryStack(prev => {
        if (prev.length > 1) {
          const newStack = [...prev]; newStack.pop();
          const prevTab = newStack[newStack.length - 1];
          setTab(prevTab);
          history.pushState({ rr: true }, '', location.href);
          return newStack;
        } else {
          setExitAsk(true);
          history.pushState({ rr: true }, '', location.href);
          return prev;
        }
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  if (new URLSearchParams(location.search).get('admin') === '1') return <AdminGate />;
  if (loading) return <div className="grid min-h-screen place-items-center bg-orange-50"><Loader2 className="animate-spin text-[var(--rr-accent)]" size={54} /></div>;

  const popup = (data.popup_settings || []).find(p => p.enabled);
  const page = tab === 'home' ? <HomePage go={go} />
    : tab === 'forYou' ? <ForYou />
      : tab === 'series' ? <SeriesPage go={go} />
        : tab === 'search' ? <SearchPage go={go} />
          : tab === 'plans' ? <Plans />
            : tab === 'wallet' ? <WalletReferral />
              : tab === 'help' ? <HelpCenter />
                : tab === 'profile' ? <Profile />
                  : <Policies />;

  return (
    <div className="min-h-screen bg-[var(--rr-bg)] text-zinc-950">
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <button onClick={() => go('home')} className="flex items-center gap-3">
            {/* LOGO IMAGE SUPPORT — with fallback to text */}
            {theme.logoImageUrl ? (
              <img
                src={theme.logoImageUrl}
                alt={theme.brand || 'ReelRamp Pro'}
                className="h-10 w-auto max-w-[140px] object-contain"
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  const next = e.currentTarget.nextSibling as HTMLElement;
                  if (next) next.style.display = 'flex';
                }}
              />
            ) : null}
            {/* Fallback text logo — shown if no image or image fails */}
            <span
              className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--rr-primary)] font-black"
              style={{ display: theme.logoImageUrl ? 'none' : 'grid' }}
            >
              {theme.logoText || 'RR'}
            </span>
            <b className="text-xl">{theme.brand || 'ReelRamp Pro'}</b>
          </button>
          <button onClick={() => go('profile')} className={`rounded-full px-5 py-2 font-bold ${isLoggedIn ? 'bg-[var(--rr-primary)] text-black' : 'bg-zinc-950 text-white'}`}>
            {/* FIX: Show proper name, not email */}
            {headerName}
          </button>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
          <button onClick={() => go('series')} className="pill">Series</button>
          <button onClick={() => go('search')} className="pill">Search</button>
          <button onClick={() => go('wallet')} className="pill">Wallet</button>
          <button onClick={() => go('help')} className="pill">Help</button>
        </div>
      </header>
      <NotificationStrip />
      {popup && (
        <div className="mx-auto mt-4 max-w-6xl px-4">
          <div className="rounded-3xl bg-gradient-to-r from-pink-500 to-orange-400 p-4 text-white shadow-lg"><b>{popup.title}</b><p>{popup.message}</p></div>
        </div>
      )}
      <main className="mx-auto max-w-6xl p-4 pb-28 md:p-8">{page}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-4 p-2">
          {([['home', Home, 'Home'], ['forYou', Play, 'For You'], ['plans', Crown, 'Plan'], ['profile', User, isLoggedIn ? headerName : 'Login']] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => go(id as string)} className={`rounded-2xl p-2 text-xs font-black ${tab === id ? 'bg-zinc-950 text-white' : 'text-zinc-500'}`}>
              <Icon className="mx-auto mb-1" size={20} />{label}
            </button>
          ))}
        </div>
      </nav>
      <footer className="px-4 pb-32 text-center text-sm text-zinc-500">
        <button onClick={() => go('policies')} className="font-bold underline">Legal Policies</button>
        <p>© 2026 ReelRamp Originals Pvt. Ltd.</p>
      </footer>
      <PromoVideoModal go={go} />
      <PwaInstall />
      {exitAsk && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4 backdrop-blur">
          <motion.div initial={{ scale: .93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-[32px] bg-white p-6 text-center shadow-2xl">
            <h2 className="text-2xl font-black">Exit ReelRamp Pro?</h2>
            <p className="mt-2 text-zinc-600">Kya aap app se bahar jana chahte hain?</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button onClick={() => setExitAsk(false)} className="btn">Ruko</button>
              <button onClick={() => { setExitAsk(false); history.go(-2); }} className="rounded-full bg-zinc-950 px-5 py-3 font-black text-white">Exit</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function App() { return <Provider><Shell /></Provider>; }
