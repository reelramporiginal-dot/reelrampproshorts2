import { initiatePayment } from './paymentHelper';
import {
  FormEvent, ReactNode, createContext, useCallback, useContext,
  useEffect, useRef, useState
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, Bookmark, Crown, Download as DownloadIcon, Edit3, FileJson, FileText, Film,
  Gift, Heart, Home, Loader2, Lock, Maximize, MessageCircle, Palette,
  Pause, Play, Plus, RefreshCw, Search, Share2, ShieldCheck, Sparkles, Trash2,
  User, Volume2, VolumeX, Wallet, X, Bell, CheckCircle2, AlertCircle,
  CreditCard, Clock,
  Zap, Shield, Ban,
  Image, Phone, Upload, HardDrive, Eye, EyeOff,
  Video, Folder, Save, RefreshCcw, BarChart, Database,
  ArrowRight, TrendingUp, Users, DollarSign, Calendar as CalendarIcon, Star as StarIcon
} from 'lucide-react';
const Download = DownloadIcon;
/* used icons to silence TS when referenced dynamically */
void CalendarIcon; void StarIcon; void Home;
import supabase from './lib/supabase';
import { handleGoogleRedirect, signInWithGoogle } from './lib/googleAuth';
import type { Session } from '@supabase/supabase-js';

handleGoogleRedirect();

// ─── TYPES ────────────────────────────────────────────────────────────────────
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
type StorageConfig = {
  videoProvider: 'bunny' | 'supabase' | 'local';
  imageProvider: 'supabase' | 'bunny' | 'local';
  // Bunny.net
  bunnyStorageZone?: string; bunnyStoragePassword?: string;
  bunnyLibraryId?: string; bunnyApiKey?: string; bunnyCdnUrl?: string;
  // Supabase
  supabaseBucket?: string; supabaseImageBucket?: string;
};
type Ctx = {
  data: Record<string, Row[]>; videos: Video[]; categories: Category[];
  plans: Plan[]; user: UserRow | null; guestId: string; loading: boolean;
  subscribed: boolean; activeSub: Subscription | null; theme: BrandSettings;
  payment: PaymentSettings; player: any; storage: StorageConfig;
  refresh: (silent?: boolean) => Promise<void>;
  mutate: (r: string, m: 'POST' | 'PUT' | 'DELETE', b: Record<string, any>) => Promise<any>;
  addNotif: (n: Omit<Notification, 'id' | 'is_active'>) => void;
};

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const AppContext = createContext<Ctx | null>(null);
const CDN = ((import.meta as any).env?.VITE_BUNNY_CDN_URL || '').replace(/\/$/, '') + '/';
const ADMIN_SECRET = (import.meta as any).env?.VITE_ADMIN_SECRET || 'RRPRO2026';
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
const defaultStorage: StorageConfig = {
  videoProvider: 'bunny',
  imageProvider: 'supabase',
  bunnyStorageZone: '', bunnyStoragePassword: '', bunnyLibraryId: '',
  bunnyApiKey: '', bunnyCdnUrl: '',
  supabaseBucket: 'videos',
  supabaseImageBucket: 'images'
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
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

const getBestDisplayName = (u: UserRow | null, fallback = 'User'): string => {
  // Priority: 1) DB display_name (clean) 2) localStorage cache 3) email prefix 4) fallback
  const cached = localStorage.getItem('rr_display_name') || '';
  if (!u) return cached || fallback;

  const dn = u.display_name?.trim() || '';

  // If DB name is clean (not email, not default viewer), use it
  if (dn && !dn.includes('@') && !dn.startsWith('Viewer ')) {
    // Cache it for offline/refresh use
    localStorage.setItem('rr_display_name', dn);
    return dn;
  }
  // Use localStorage cache (survives refresh)
  if (cached && !cached.includes('@') && !cached.startsWith('Viewer ')) return cached;
  // Fallback: clean from email
  if (u.email) {
    return u.email.split('@')[0].replace(/[._-]/g, ' ')
      .split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
  }
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

// ─── RAZORPAY ─────────────────────────────────────────────────────────────────
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
  const rzp = new window.Razorpay({
    key: opts.keyId, amount: Math.round(opts.amount * 100), currency: 'INR',
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

// ─── CASHFREE ────────────────────────────────────────────────────────────────
const loadCashfree = (): Promise<boolean> =>
  new Promise(resolve => {
    if ((window as any).Cashfree) return resolve(true);
    const s = document.createElement('script');
    s.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });

const createCashfreeOrder = async (opts: {
  appId: string; secretKey: string; testMode: boolean;
  amount: number; planName: string; userId: string;
  userName: string; userEmail: string; userPhone: string;
}): Promise<{ orderId: string; paymentSessionId: string } | null> => {
  try {
    const res = await fetch('/api/cashfree/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
        order_note: opts.planName,
        testMode: opts.testMode
      })
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Order create nahi hua');
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
  const loaded = await loadCashfree();
  if (!loaded) { opts.onFailure('Cashfree load nahi hua.'); return; }
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

const openCashfreeSubscription = async (opts: {
  appId: string; secretKey: string; testMode: boolean;
  planId: string; userId: string; userName: string;
  userEmail: string; userPhone: string;
  trialPrice?: number; recurringPrice?: number;
  trialDays?: number; intervals?: number;
  intervalType?: string;
  onSuccess: (data: { subscriptionId: string }) => void;
  onFailure: (err: string) => void;
}) => {
  try {
    const res = await fetch('/api/cashfree/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: opts.planId,
        customer_details: {
          customer_id: opts.userId,
          customer_name: opts.userName,
          customer_email: opts.userEmail,
          customer_phone: opts.userPhone
        },
        trial_price: opts.trialPrice || 1,
        recurring_price: opts.recurringPrice || 399,
        trial_days: opts.trialDays || 2,
        intervals: opts.intervals || 3,
        interval_type: opts.intervalType || 'MONTH',
        return_url: `${window.location.origin}?cf_sub={subscription_id}`,
        testMode: opts.testMode
      })
    });
    if (!res.ok) throw new Error((await res.json()).message || 'Mandate create nahi hua');
    const data = await res.json();
    if (data.sub_auth_url) {
      window.location.href = data.sub_auth_url; // Direct redirect to secure e-mandate page
    } else {
      throw new Error('Mandate URL missing');
    }
  } catch (e: any) {
    opts.onFailure(e.message);
  }
};

// ─── SUB HELPERS ─────────────────────────────────────────────────────────────
const isSubActive = (sub: Subscription | null) =>
  !!sub && sub.status === 'active' && new Date(sub.expires_at).getTime() > Date.now();

const daysLeft = (sub: Subscription | null) => {
  if (!sub) return 0;
  return Math.max(0, Math.floor((new Date(sub.expires_at).getTime() - Date.now()) / 86400000));
};

// ─── BUNNY UPLOAD HELPER ─────────────────────────────────────────────────────
const uploadToBunny = async (
  file: File,
  config: StorageConfig,
  onProgress?: (pct: number) => void
): Promise<string> => {
  const zone = config.bunnyStorageZone;
  const pass = config.bunnyStoragePassword;
  const cdn = (config.bunnyCdnUrl || '').replace(/\/$/, '');
  if (!zone || !pass) throw new Error('Bunny Storage Zone aur Password configure karein');
  const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const url = `https://storage.bunnycdn.com/${zone}/${filename}`;
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('AccessKey', pass);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round(e.loaded / e.total * 100)); };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
  return cdn ? `${cdn}/${filename}` : filename;
};

// ── Video → Bunny CDN ; Image → Supabase Storage (hybrid)
const uploadToSupabaseImage = async (
  file: File,
  config: StorageConfig,
  onProgress?: (pct: number) => void
): Promise<string> => {
  // Images always go to Supabase image bucket (fast + cheap)
  const isImage = file.type.startsWith('image/');
  const bucket = isImage ? (config.supabaseImageBucket || 'images') : (config.supabaseBucket || 'videos');
  const filename = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  onProgress?.(10);
  const { data, error } = await supabase.storage.from(bucket).upload(filename, file, { upsert: true, cacheControl: '3600' });
  onProgress?.(100);
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
};
void uploadToSupabaseImage; // keep used in FileUploader

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
        } catch {
          if (retries > 0) { await new Promise(res => setTimeout(res, 700)); return fetchWithRetry(url, retries - 1); }
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
    setLocalNotifs(prev => [...prev, { ...n, id: Date.now(), is_active: true } as Notification]);
  }, []);

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const h = () => setTimeout(() => refresh(true), 1500);
    window.addEventListener('supabase-data-updated', h);
    return () => window.removeEventListener('supabase-data-updated', h);
  }, [guestId, refresh]);

  // ── AUTH — Display name ALWAYS from DB, never from email raw ──
  useEffect(() => {
    const syncUser = async (session: Session | null) => {
      if (!session?.user?.email) return;
      localStorage.setItem('rr_guest', session.user.id);
      // Get existing user from DB first
      const existing = await fetch(`/api/users?guest_id=${session.user.id}`).then(r => r.json()).catch(() => []);
      const existingUser = Array.isArray(existing) ? existing[0] : existing;
      // Only use Google/metadata name if DB has no custom name set
      const dbName = existingUser?.display_name?.trim() || '';
      const hasCustomName = dbName && !dbName.includes('@') && !dbName.startsWith('Viewer ');
      let cleanName = dbName;
      if (!hasCustomName) {
        const rawName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
        cleanName = rawName && !rawName.includes('@') ? rawName :
          session.user.email!.split('@')[0].replace(/[._-]/g, ' ')
            .split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
      }
      // Save to localStorage so it persists across refreshes
      localStorage.setItem('rr_display_name', cleanName);
      await fetch('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guest_id: session.user.id, display_name: cleanName, email: session.user.email, role: 'viewer' })
      });
      refresh(true);
    };

    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      syncUser(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      if (session?.user?.email) {
        localStorage.setItem('rr_guest', session.user.id);
        const rawName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
        const cleanName = rawName && !rawName.includes('@') ? rawName :
          session.user.email!.split('@')[0].replace(/[._-]/g, ' ')
            .split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').trim();
        localStorage.setItem('rr_display_name', cleanName);
        fetch('/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guest_id: session.user.id, display_name: cleanName, email: session.user.email, role: 'viewer' })
        }).then(() => refresh(true));
      }
    });
    return () => subscription.unsubscribe();
  }, [refresh]);

  // ── Cashfree return ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('cf_order') || params.get('cf_sub')) {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => refresh(true), 1000);
    }
  }, []);

  // ── Auto-expire subs ──
  useEffect(() => {
    (data.subscriptions || []).forEach(async s => {
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
  const storage: StorageConfig = { ...defaultStorage, ...(admin.find(x => x.key === 'storage')?.value || {}) };

  const allSubs = data.subscriptions || [];
  const activeSub = (allSubs.find(s => s.status === 'active' && new Date(s.expires_at).getTime() > Date.now()) || null) as Subscription | null;
  const subscribed = isSubActive(activeSub);

  const mergedData = { ...data, notifications: [...(data.notifications || []), ...localNotifs] };

  return (
    <AppContext.Provider value={{
      data: mergedData, videos: (data.videos || []) as Video[],
      categories: (data.categories || []) as Category[],
      plans: (data.plans || []) as Plan[],
      user, guestId, loading, subscribed, activeSub, theme, payment, player, storage,
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

// ─── FILE UPLOAD COMPONENT ────────────────────────────────────────────────────
// ─── HYBRID FILE UPLOAD COMPONENT ─────────────────────────────────────────────
// Images → Supabase (fast, integrated, free tier)
// Videos → Bunny.net CDN (global, optimized)
function FileUploader({
  accept, label, onUrl, storage, hint, kind = 'auto'
}: {
  accept: string; label: string; onUrl: (url: string) => void;
  storage: StorageConfig; hint?: string;
  kind?: 'auto' | 'image' | 'video';
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(''); setSuccess(''); setProgress(0); setUploading(true);
    try {
      const isVideo = file.type.startsWith('video/') || kind === 'video';
      const isImage = file.type.startsWith('image/') || kind === 'image';

      let url = '';
      // HYBRID: Images → Supabase (cheaper, built-in), Videos → Bunny CDN
      if (isVideo && storage.videoProvider === 'bunny') {
        url = await uploadToBunny(file, storage, setProgress);
      } else if (isImage && storage.imageProvider === 'supabase') {
        url = await uploadToSupabaseImage(file, storage, setProgress);
      } else if (storage.videoProvider === 'supabase' || storage.imageProvider === 'supabase') {
        url = await uploadToSupabaseImage(file, storage, setProgress);
      } else if (storage.videoProvider === 'bunny') {
        url = await uploadToBunny(file, storage, setProgress);
      } else {
        throw new Error('Storage provider configure nahi hai (Admin → ☁️ Storage).');
      }
      onUrl(url);
      setSuccess(`✅ ${isVideo ? 'Video' : 'Image'} upload complete: ${file.name}`);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      <div
        className={`dropzone ${dragging ? 'drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        {uploading ? (
          <div className="space-y-2">
            <Loader2 className="animate-spin mx-auto text-[var(--rr-primary)]" size={28} />
            <p className="text-sm font-bold text-zinc-600">Uploading… {progress}%</p>
            <div className="upload-bar"><div className="upload-bar-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto text-zinc-400" size={28} />
            <p className="text-sm font-bold text-zinc-500">Click ya drag & drop karein</p>
            {hint && <p className="text-xs text-zinc-400">{hint}</p>}
          </div>
        )}
      </div>
      {error && <p className="text-xs font-bold text-red-600 bg-red-50 rounded-xl p-2">{error}</p>}
      {success && <p className="text-xs font-bold text-green-600 bg-green-50 rounded-xl p-2">{success}</p>}
    </div>
  );
}

// ─── PLAYER ───────────────────────────────────────────────────────────────────
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
  const locked = false; // Bypass static lock to allow 5-second Kuku FM style trial
  const trialLimit = !subscribed;
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

  const seek = (x: number) => {
    if (!bar.current || !ref.current || !dur) return;
    const r = bar.current.getBoundingClientRect();
    const n = Math.max(0, Math.min(1, (x - r.left) / r.width)) * dur;
    ref.current.currentTime = n; setCur(n); reveal();
  };
  const jump = (d: number, s: string) => {
    if (!ref.current) return;
    ref.current.currentTime = Math.max(0, Math.min(dur || 0, ref.current.currentTime + d));
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
        onWaiting={() => {
          setWait(true); clearTimeout(buf.current);
          buf.current = window.setTimeout(() => { setWait(false); setErr('Unable to load video'); }, 8000);
        }}
        onPlaying={() => { setWait(false); clearTimeout(buf.current); setPlay(true); }}
        onCanPlay={() => { setWait(false); clearTimeout(buf.current); }}
        onError={() => { setErr('Unable to load video'); setWait(false); }}
        onPause={() => setPlay(false)}
        onEnded={() => {
          mutate('video_views', 'POST', { user_id: guestId, video_id: video.id, watch_seconds: cur, completed: true, device: 'web' });
          onNext();
        }}
        onTimeUpdate={e => {
          const currentTime = e.currentTarget.currentTime;
          if (trialLimit && currentTime > 5) {
            e.currentTarget.pause();
            setPlay(false);
            try { document.exitFullscreen().catch(() => {}); } catch(err){}
            window.dispatchEvent(new CustomEvent('rr-open-plans'));
            return;
          }
          const n = Date.now();
          if (n - last.current < 250) return;
          last.current = n;
          setCur(currentTime);
          setDur(e.currentTarget.duration || 0);
          mutate('watch_history', 'POST', {
            user_id: guestId, video_id: video.id,
            current_position: currentTime,
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
  const heroImg = hero?.image_url || '';
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
          {heroImg
            ? <img src={heroImg} className="absolute inset-0 h-full w-full object-cover" alt="Hero" />
            : <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center"><Film size={80} className="text-white/20" /></div>}
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
          {series.length === 0 && <p className="text-zinc-400 text-sm p-4">Admin panel se series add karein.</p>}
        </div>
        {chosen && (
          <div className="card overflow-hidden">
            <div className="grid md:grid-cols-[260px_1fr]">
              {chosen.poster_url
                ? <img src={chosen.poster_url} className="h-full min-h-80 w-full object-cover" alt={chosen.title} />
                : <div className="h-80 w-full bg-zinc-100 flex items-center justify-center"><Film size={48} className="text-zinc-300" /></div>}
              <div className="p-6">
                <p className="font-black text-[var(--rr-accent)]">{chosen.category}</p>
                <h2 className="text-4xl font-black">{chosen.title}</h2>
                <p className="mt-3 text-zinc-600">{chosen.description}</p>
                <button onClick={() => go('forYou')} className="btn mt-5">Start Watching</button>
              </div>
            </div>
            <div className="grid gap-2 p-4">
              {videos.filter(v => v.series_title === chosen.title).map(v => (
                <button key={v.id} onClick={() => go('forYou')} className="rounded-2xl bg-zinc-100 p-4 text-left font-bold hover:bg-zinc-200 transition">
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
        {list.length === 0 && <p className="text-zinc-400 col-span-4 text-center py-10">Koi result nahi mila.</p>}
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
          ? <img src={v.thumbnail_url} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" alt={v.title} />
          : <div className="h-full w-full flex items-center justify-center bg-zinc-100"><Film size={40} className="text-zinc-300" /></div>}
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
            <h3 className="font-black">Report Content</h3>
            <input className="input" value={report} onChange={e => setReport(e.target.value)} placeholder="Reason likhein" />
            <button className="btn w-full mt-2" onClick={() => mutate('content_reports', 'POST', {
              user_id: guestId, video_id: v.id, reason: report || 'User report', details: report, status: 'open'
            }).then(() => setReport(''))}>Submit Report</button>
          </div>
        </aside>
      </div>
    </section>
  );
}

// ─── PLANS / PAYMENT ENGINE ───────────────────────────────────────────────────
function Plans() {
  const { plans, payment, guestId, mutate, subscribed, user, addNotif } = useApp();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [step, setStep] = useState<'brief' | 'pay' | 'done'>('brief');
  const [busy, setBusy] = useState(false);
  const [payErr, setPayErr] = useState('');
  const [txId, setTxId] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');

  // Listen for open-plans event from locked player
  useEffect(() => {
    const h = () => { if (plans[0]) { setSelected(plans[0]); setStep('brief'); } };
    window.addEventListener('rr-open-plans', h);
    return () => window.removeEventListener('rr-open-plans', h);
  }, [plans]);

  const openPlan = (p: Plan) => { setSelected(p); setStep('brief'); setPayErr(''); setTxId(''); };
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
    if (phone && user?.id) await mutate('users', 'PUT', { id: user.id, phone }).catch(() => { });
    addNotif({
      title: 'Plan Activated! 🎉', type: 'success',
      message: `${plan.name} — ${plan.duration_days} din ke liye active hai.`,
      target: 'user', is_active: true
    });
    setStep('done');
  };

  const defaultGw = payment.gateways.find(g => g.enabled && g.isDefault) || payment.gateways.find(g => g.enabled);

  const handleCashfree = async (gw: GatewayConfig) => {
    if (!selected) return;
    if (!phone.trim() || phone.length < 10) { setPayErr('Valid mobile number daalein (10 digit)'); return; }
    setBusy(true); setPayErr('');
    try {
      if (selected.supports_autorenew || selected.name.toLowerCase().includes('trial') || selected.name.toLowerCase().includes('auto')) {
        // Auto-Pay Mandate Flow
        // Read features / options if set
        const recurringPrice = Number(selected.features?.recurring_price || 399);
        const trialDays = Number(selected.trial_days || 2);
        const trialPrice = Number(selected.price || 1);

        await openCashfreeSubscription({
          appId: gw.keys.appId || '', secretKey: gw.keys.secretKey || '',
          testMode: gw.testMode, planId: selected.cf_plan_id || `rr_autopay_${recurringPrice}_3_month`,
          userId: guestId, userName: getBestDisplayName(user),
          userEmail: user?.email || `${guestId}@reelramp.com`, userPhone: phone,
          trialPrice,
          recurringPrice,
          trialDays,
          intervals: 3, // quarterly (3 months)
          intervalType: 'MONTH',
          onSuccess: async ({ subscriptionId }) => {
            await activatePlan(selected, 'Cashfree Autopay', subscriptionId, subscriptionId);
            setBusy(false);
          },
          onFailure: (err) => { setPayErr(err); setBusy(false); }
        });
      } else {
        // One-time Payment Flow
        await openCashfreeCheckout({
          appId: gw.keys.appId || '', secretKey: gw.keys.secretKey || '',
          testMode: gw.testMode, amount: selected.price, planName: selected.name,
          userId: guestId, userName: getBestDisplayName(user),
          userEmail: user?.email || `${guestId}@reelramp.com`, userPhone: phone,
          onSuccess: async ({ paymentId }) => { await activatePlan(selected, 'Cashfree', paymentId); setBusy(false); },
          onFailure: (err) => { setPayErr(err); setBusy(false); }
        });
      }
    } catch (e: any) { setPayErr(e.message); setBusy(false); }
  };

  const handleRazorpay = async (gw: GatewayConfig) => {
    if (!selected) return;
    setBusy(true); setPayErr('');
    try {
      await openRazorpay({
        keyId: gw.keys.keyId, amount: selected.price, planName: selected.name,
        userName: getBestDisplayName(user), userEmail: user?.email || '',
        testMode: gw.testMode,
        onSuccess: async ({ paymentId }) => { await activatePlan(selected, 'Razorpay', paymentId); setBusy(false); },
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
            {p.trial_days && p.trial_days > 0 && <p className="text-xs font-black text-green-600 mt-1">✨ {p.trial_days} din free trial</p>}
            {p.features && typeof p.features === 'object' && (
              <ul className="mt-3 space-y-1 text-sm text-zinc-600 flex-1">
                {Object.entries(p.features).map(([k, v]: any) => (
                  <li key={k} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500 shrink-0" />{v}</li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => openPlan(p)} className="btn mt-5 w-full">Select Plan</button>
          </div>
        ))}
        {plans.filter(p => p.is_active).length === 0 && (
          <div className="col-span-3 card p-10 text-center">
            <Crown className="mx-auto text-zinc-300 mb-3" size={44} />
            <p className="text-zinc-400 font-black">Admin panel se plans add karein.</p>
          </div>
        )}
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
                    {selected.trial_days && selected.trial_days > 0 && <p className="text-green-400 text-xs font-bold mt-1">✨ {selected.trial_days} din free trial included</p>}
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
                  {defaultGw?.type === 'Cashfree' && (
                    <div>
                      <label className="label flex items-center gap-1"><Phone size={14} /> Mobile Number (required)</label>
                      <input className="input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
                    </div>
                  )}
                  {!defaultGw ? (
                    <div className="rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-6 text-center text-white space-y-3">
                      <div className="text-4xl">🚀</div>
                      <h3 className="text-xl font-black">Payment Gateway</h3>
                      <p className="text-sm text-white/70">Admin panel → Gateways tab mein configure karein.</p>
                      {payment.whatsapp && (
                        <a href={`https://wa.me/${payment.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-green-500 px-5 py-3 text-sm font-black text-white">
                          WhatsApp pe contact karo
                        </a>
                      )}
                    </div>
                  ) : (
                    <GatewayPayBlock gateway={defaultGw} plan={selected} busy={busy} txId={txId}
                      setTxId={setTxId} payment={payment}
                      onCashfree={() => handleCashfree(defaultGw)}
                      onRazorpay={() => handleRazorpay(defaultGw)}
                      onUpiManual={() => handleUpiManual(defaultGw)} />
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
                      ? 'Admin verification ke baad premium activate hoga.'
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

function GatewayPayBlock({ gateway, plan, busy, txId, setTxId, payment, onCashfree, onRazorpay, onUpiManual }:
  { gateway: GatewayConfig; plan: Plan; busy: boolean; txId: string; setTxId: (v: string) => void; payment: PaymentSettings; onCashfree: () => void; onRazorpay: () => void; onUpiManual: () => void; }) {
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

// ─── PROFILE ──────────────────────────────────────────────────────────────────
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
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    setName(getBestDisplayName(user));
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
  }, [user?.id, user?.display_name]);

  const signIn = async (signUp = false) => {
    if (!email || !password) { setAuthMsg('Email aur password dono bharo.'); return; }
    setBusy(true); setAuthMsg('');
    try {
      const { error } = signUp
        ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthMsg(error.message);
      else {
        setAuthMsg(signUp ? '✅ Account ban gaya! Email verify karein.' : '✅ Login ho gaya!');
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (e: any) { setAuthMsg(e.message); }
    finally { setBusy(false); }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('rr_guest');
    window.location.href = '/';
  };

  const saveProfile = async () => {
    if (!user) return;
    if (!name.trim()) { setAuthMsg('❌ Name khali nahi ho sakta.'); return; }
    // Save to localStorage immediately so refresh pe bhi dikhe
    localStorage.setItem('rr_display_name', name.trim());
    await mutate('users', 'PUT', { id: user.id, display_name: name.trim(), email, phone });
    setAuthMsg('✅ Profile update ho gaya.');
    setTimeout(() => setAuthMsg(''), 3000);
  };

  const cancelSub = async () => {
    if (!activeSub) return;
    if (!confirm('Kya aap subscription cancel karna chahte hain?')) return;
    try { await mutate('subscriptions', 'PUT', { id: activeSub.id, status: 'cancelled', cancelled_at: new Date().toISOString(), auto_renew: false }); }
    catch (e: any) { setAuthMsg(e.message); }
  };

  const payments = (data.payments || []).filter(p => p.user_id === guestId);
  const watchHistory = data.watch_history || [];
  const displayName = getBestDisplayName(user);

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[36px] bg-zinc-950 text-white shadow-2xl md:grid md:grid-cols-[1.05fr_.95fr]">
        <div className="relative p-7 md:p-10">
          <div className="absolute -left-16 -top-16 h-44 w-44 rounded-full bg-[var(--rr-primary)]/25 blur-3xl" />
          <p className="relative inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-[var(--rr-primary)]">
            <ShieldCheck size={16} /> Secure ReelRamp Account
          </p>
          <h1 className="relative mt-5 text-4xl font-black leading-tight md:text-5xl">
            {isLoggedIn ? `Namaste, ${displayName.split(' ')[0]}! 👋` : 'Login karein'}
          </h1>
          <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-white/10 p-4">
              <b>{subscribed ? 'Premium ✅' : 'Free'}</b>
              <small className="block text-white/60">Current Plan</small>
              {activeSub && <small className="block text-[var(--rr-primary)] text-xs font-bold">{daysLeft(activeSub)} din bache</small>}
            </div>
            <div className="rounded-3xl bg-white/10 p-4"><b>{(data.bookmarks || []).length}</b><small className="block text-white/60">Saved</small></div>
            <div className="rounded-3xl bg-white/10 p-4"><b>{watchHistory.length}</b><small className="block text-white/60">History</small></div>
          </div>
        </div>
        <div className="bg-white p-6 text-zinc-950 md:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-3xl bg-[var(--rr-primary)] font-black text-2xl text-black">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-black">{isLoggedIn ? displayName : 'Guest User'}</h2>
              <p className="text-sm text-zinc-500">{isLoggedIn ? user?.email : 'Login karein'}</p>
            </div>
          </div>

          {!isLoggedIn && (
            <div className="space-y-3">
              <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Aapka naam" />
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
              <div className="relative">
                <input className="input pr-12" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <button disabled={busy} className="btn w-full disabled:opacity-60" onClick={() => signIn(false)}>
                  {busy ? <Loader2 className="animate-spin" /> : <ShieldCheck size={16} />} Sign In
                </button>
                <button disabled={busy} className="rounded-full bg-zinc-950 px-5 py-3 font-black text-white disabled:opacity-60" onClick={() => signIn(true)}>Create Account</button>
              </div>
              <button className="flex w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 py-3 font-black shadow-sm hover:bg-zinc-50" onClick={() => signInWithGoogle('ReelRamp Pro')}>
                <Sparkles size={18} className="text-[var(--rr-accent)]" /> Continue with Google
              </button>
            </div>
          )}

          {isLoggedIn && (
            <div className="space-y-3">
              <div>
                <label className="label">Display Name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Aapka naam" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit number" type="tel" />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button className="btn" onClick={saveProfile}><Save size={16} /> Save Profile</button>
                <button className="rounded-full bg-zinc-200 px-5 py-3 font-bold hover:bg-zinc-300" onClick={signOut}>Logout</button>
              </div>
            </div>
          )}
          {authMsg && (
            <p className={`mt-3 rounded-2xl p-3 text-sm font-bold ${authMsg.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{authMsg}</p>
          )}
          <p className="mt-4 rounded-2xl bg-zinc-100 p-3 text-xs font-bold text-zinc-600">
            Status: {subscribed ? '✅ Premium Active' : '🔓 Free Viewer'}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b">
          {(['account', 'subscription', 'history'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-4 font-black text-sm ${activeTab === t ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}>
              {t === 'account' ? '👤 Account' : t === 'subscription' ? '👑 Subscription' : '📜 History'}
            </button>
          ))}
        </div>

        {activeTab === 'account' && (
          <div className="p-5 space-y-3">
            <div className="rounded-2xl bg-zinc-100 p-4 space-y-2 text-sm">
              <p className="font-black">Name: <span className="font-normal">{displayName}</span></p>
              <p className="font-black">Guest ID: <span className="font-mono text-xs break-all">{guestId}</span></p>
              <p className="font-black">Role: <span className="font-normal">{user?.role || 'viewer'}</span></p>
              <p className="font-black">Status: <span className="font-normal">{subscribed ? '✅ Premium' : '🔓 Free'}</span></p>
              {user?.phone && <p className="font-black">Phone: <span className="font-normal">{user.phone}</span></p>}
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
                    {activeSub.gateway && <div><p className="opacity-70">Gateway</p><p className="font-black">{activeSub.gateway}</p></div>}
                  </div>
                </div>
                {daysLeft(activeSub) <= 5 && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm font-bold text-amber-700 flex items-center gap-2">
                    <Clock size={16} /> Subscription jald expire hone wala hai! Renew karein.
                  </div>
                )}
                <button onClick={cancelSub} className="w-full rounded-full bg-red-50 py-3 font-black text-red-600 text-sm flex items-center justify-center gap-2 hover:bg-red-100">
                  <Ban size={16} /> Cancel Subscription
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="mx-auto text-zinc-300 mb-3" size={44} />
                <p className="font-black text-zinc-500">Koi active subscription nahi hai.</p>
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
          <div className="p-5 space-y-4">
            <div>
              <h3 className="font-black mb-2">Watch History</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {watchHistory.slice(0, 20).map(h => (
                  <div key={h.id} className="rounded-2xl bg-zinc-50 p-3 text-sm">
                    <p className="font-bold">Video #{h.video_id}</p>
                    <p className="text-xs text-zinc-400">{ftime(h.current_position)} / {ftime(h.duration)} watched</p>
                  </div>
                ))}
                {watchHistory.length === 0 && <p className="text-zinc-400 text-sm text-center py-6">Koi history nahi hai.</p>}
              </div>
            </div>
            <div>
              <h3 className="font-black mb-2">Saved Episodes</h3>
              <div className="flex flex-wrap gap-2">
                {(data.bookmarks || []).map(b => <span key={b.id} className="pill">Video #{b.video_id}</span>)}
                {(data.bookmarks || []).length === 0 && <p className="text-zinc-400 text-sm">Koi saved episode nahi.</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-black">Support Center</h2>
        <p className="text-sm text-zinc-500 mb-3">Login, payment, video ya account issue yahan bhejein.</p>
        <textarea className="input" value={msg} onChange={e => setMsg(e.target.value)} placeholder="Issue likhiye" />
        <button className="btn mt-2" onClick={() => mutate('support_tickets', 'POST', {
          user_id: guestId, name: getBestDisplayName(user), email: user?.email || '', contact: user?.email || '', message: msg, status: 'open'
        }).then(() => setMsg(''))}>Send Ticket</button>
      </div>
    </section>
  );
}

// ─── WALLET ───────────────────────────────────────────────────────────────────
function WalletReferral() {
  const { data, guestId, mutate } = useApp();
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
      await mutate('wallet_transactions', 'POST', { user_id: guestId, type: 'credit', coins: 10, reason: 'Daily reward', reference_id: today });
      setClaimMsg('🎉 10 coins credit ho gaye!');
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
            <button className="btn flex-1" onClick={() => navigator.clipboard.writeText(code).then(() => setClaimMsg('Code copied!'))}>Copy</button>
            <button className="btn flex-1" onClick={shareReferral}>Share</button>
          </div>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="font-black mb-3">Transaction History</h3>
        {tx.length === 0 ? <p className="text-zinc-400 text-sm text-center py-4">Koi transaction nahi hai abhi.</p> : (
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
  const articles = (data.help_articles || []).filter((a: any) => a.is_published);
  return (
    <section className="space-y-5">
      <Title t="Help Center" s="Video, account, subscription aur support FAQ." />
      {articles.map((a: any) => (
        <article key={a.id} className="card p-6">
          <p className="font-black text-[var(--rr-accent)]">{a.category}</p>
          <h2 className="text-2xl font-black">{a.title}</h2>
          <p className="mt-3 whitespace-pre-line text-zinc-600">{a.body}</p>
        </article>
      ))}
      {articles.length === 0 && <div className="card p-8 text-center"><p className="text-zinc-400">Admin panel se help articles add karein.</p></div>}
    </section>
  );
}

// ─── PWA INSTALL ──────────────────────────────────────────────────────────────
function PwaInstall() {
  const { guestId, mutate } = useApp();
  const [deferred, setDeferred] = useState<any>(null);
  const [hidden, setHidden] = useState(isInstalledApp() || localStorage.getItem('rr_install_closed') === '1');
  const [iosOpen, setIosOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    if (isInstalledApp()) { setHidden(true); return; }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => { });
    const markInstalled = () => { localStorage.setItem('rr_install_completed', '1'); setHidden(true); setIosOpen(false); };
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
    else { setIosOpen(true); }
  };

  return (
    <>
      {iosOpen && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/55 p-4 backdrop-blur">
          <motion.div initial={{ scale: .92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="w-full max-w-sm rounded-[34px] bg-white p-6 shadow-2xl">
            <button onClick={() => setIosOpen(false)} className="float-right rounded-full bg-zinc-100 p-2"><X size={18} /></button>
            <h2 className="text-2xl font-black mb-4">App Install Karein</h2>
            <ol className="space-y-4 text-sm font-bold">
              <li className="flex gap-3 items-start"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--rr-primary)] text-black text-xs font-black">1</span><span>Address bar mein <b>install icon (⊕)</b> ya browser menu kholo</span></li>
              <li className="flex gap-3 items-start"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--rr-primary)] text-black text-xs font-black">2</span><span><b>"Add to Home Screen"</b> select karo</span></li>
              <li className="flex gap-3 items-start"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--rr-primary)] text-black text-xs font-black">3</span><span>Confirm karo — bas ho gaya! ✅</span></li>
            </ol>
            {isIos && <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-700 font-bold">⚠️ iPhone par sirf Safari browser mein kaam karta hai.</p>}
            <button onClick={() => setIosOpen(false)} className="btn mt-4 w-full">Samajh gaya ✓</button>
          </motion.div>
        </div>
      )}
      <button onClick={install} disabled={installing}
        className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 font-black text-white shadow-2xl disabled:opacity-60 md:left-auto md:right-6">
        {installing ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />} Install App
      </button>
      <button onClick={() => { localStorage.setItem('rr_install_closed', '1'); setHidden(true); }} className="fixed bottom-[4.5rem] left-4 z-40 text-xs text-zinc-400 md:left-auto md:right-6">Dismiss</button>
    </>
  );
}

// ─── POLICIES ─────────────────────────────────────────────────────────────────
function Policies() {
  const { data } = useApp();
  return (
    <section className="space-y-4">
      <Title t="Legal Policies" s="Privacy Policy, Terms aur Payment policies." />
      {(data.legal_policies || []).filter((p: any) => p.is_published).map((p: any) => (
        <article key={p.id} className="card p-6">
          <h2 className="text-2xl font-black">{p.title}</h2>
          <p className="text-sm font-bold text-[var(--rr-accent)]">Version {p.version}</p>
          <p className="mt-4 whitespace-pre-line text-zinc-600">{p.body}</p>
        </article>
      ))}
    </section>
  );
}

// ─── PROMO MODAL — Kuku FM Style Autopay Subscription Overlay ──────────────────
function PromoVideoModal({ go }: { go: (t: string) => void }) {
  const { data, subscribed, user, guestId, payment, mutate, addNotif } = useApp();
  void go; // Kept used optionally
  const [open, setOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState('paytm');
  
  // Inline Checkout states
  const [showCheckout, setShowCheckout] = useState(false);
  const [phone, setPhone] = useState(user?.phone || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Find the active trial plan dynamically from the database
  const activeTrialPlan = (data.plans || []).find(
    (p: any) => p.is_active && (p.supports_autorenew || p.name.toLowerCase().includes('trial') || p.name.toLowerCase().includes('auto'))
  );

  // Read pricing details from activeTrialPlan dynamically or fall back STRICTLY to ₹1 trial / ₹399 quarterly
  // This avoids accidental selection of normal 699 plans as trial!
  const isTrialPlan = activeTrialPlan && (activeTrialPlan.supports_autorenew || activeTrialPlan.name.toLowerCase().includes('trial') || activeTrialPlan.name.toLowerCase().includes('auto'));
  const trialPrice = isTrialPlan ? Number(activeTrialPlan.price) : 1;
  const trialDays = isTrialPlan ? Number(activeTrialPlan.trial_days || 2) : 2;
  const recurringPrice = isTrialPlan && activeTrialPlan?.features?.recurring_price 
    ? Number(activeTrialPlan.features.recurring_price) 
    : 399; // Strict Kuku FM style auto-pay standard fallback of ₹399/quarterly

  const promo = (data.promo_campaigns || []).find((p: any) => p.is_active && p.placement === 'app_open');

  useEffect(() => {
    // Open on load if not subscribed
    if (!subscribed) {
      setOpen(true);
    }
  }, [subscribed]);

  // Listen for open-plans event to open the promo overlay (acts as paywall)
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener('rr-open-plans', h);
    return () => window.removeEventListener('rr-open-plans', h);
  }, []);

  if (!open || subscribed) return null;

  const handleStartTrialClick = () => {
    setShowCheckout(true);
  };

  const handlePayTrial = async () => {
    if (!phone.trim() || phone.length < 10) { setErr('Valid mobile number daalein (10 digit)'); return; }
    setBusy(true); setErr('');

    const defaultGw = payment.gateways.find(g => g.enabled && g.isDefault) || payment.gateways.find(g => g.enabled);
    if (!defaultGw) {
      setErr('Payment gateway configure nahi hai. Admin panel mein set karein.');
      setBusy(false);
      return;
    }

    const planName = isTrialPlan ? activeTrialPlan.name : '1 Day Trial Offer';
    const planId = isTrialPlan ? activeTrialPlan.id : 1;
    const planDuration = isTrialPlan ? (activeTrialPlan.duration_days || 90) : 90;

    // Common activation after any successful payment
    const activate = async (txnId: string, gatewayLabel: string, autoRenew: boolean) => {
      const expiresAt = new Date(Date.now() + planDuration * 86400000).toISOString();
      await mutate('payments', 'POST', {
        user_id: guestId, plan_id: planId, amount: trialPrice,
        gateway: gatewayLabel, status: 'success', notes: `Trial Start: ${planName}`,
        transaction_id: txnId, cf_payment_id: txnId
      });
      await mutate('subscriptions', 'POST', {
        user_id: guestId, plan: planName, plan_id: planId,
        status: 'active', expires_at: expiresAt, auto_renew: autoRenew,
        renewal_date: expiresAt, gateway: gatewayLabel, cf_subscription_id: autoRenew ? txnId : null
      });
      if (phone && user?.id) await mutate('users', 'PUT', { id: user.id, phone }).catch(() => { });
      addNotif({
        title: 'Plan Activated! 🎉', type: 'success',
        message: `${planName} successfully active ho gaya hai.`,
        target: 'user', is_active: true
      });
      setOpen(false); setShowCheckout(false); setBusy(false);
      window.location.reload();
    };

    // Fallback: one-time ₹trial payment if autopay/subscription not available
    const fallbackOneTime = async () => {
      setErr('Auto-Pay available nahi — ek baar ka payment use kar rahe hain…');
      await openCashfreeCheckout({
        appId: defaultGw.keys.appId || '', secretKey: defaultGw.keys.secretKey || '',
        testMode: defaultGw.testMode, amount: trialPrice, planName,
        userId: guestId, userName: getBestDisplayName(user),
        userEmail: user?.email || `${guestId}@reelramp.com`, userPhone: phone,
        onSuccess: async ({ paymentId }) => { await activate(paymentId, 'Cashfree', false); },
        onFailure: (err) => { setErr(err); setBusy(false); }
      });
    };

    // Check if Auto-Pay is enabled by admin (default: OFF until Cashfree subscriptions active)
    const autopayEnabled = !!(payment as any).autopayEnabled;

    if (autopayEnabled) {
      // Try Cashfree Subscription (Auto-Pay) first, fallback to one-time
      try {
        await openCashfreeSubscription({
          appId: defaultGw.keys.appId || '',
          secretKey: defaultGw.keys.secretKey || '',
          testMode: defaultGw.testMode,
          planId: `rr_autopay_${recurringPrice}_3_month`,
          userId: guestId,
          userName: getBestDisplayName(user),
          userEmail: user?.email || `${guestId}@reelramp.com`,
          userPhone: phone,
          trialPrice, recurringPrice, trialDays,
          intervals: 3, intervalType: 'MONTH',
          onSuccess: async ({ subscriptionId }) => { await activate(subscriptionId, 'Cashfree Autopay', true); },
          onFailure: async (_err) => { await fallbackOneTime(); }
        });
      } catch (e: any) {
        try { await fallbackOneTime(); } catch { setErr(e.message); setBusy(false); }
      }
    } else {
      // Auto-Pay not yet enabled — use simple ₹trial one-time payment (works immediately!)
      try {
        await openCashfreeCheckout({
          appId: defaultGw.keys.appId || '', secretKey: defaultGw.keys.secretKey || '',
          testMode: defaultGw.testMode, amount: trialPrice, planName,
          userId: guestId, userName: getBestDisplayName(user),
          userEmail: user?.email || `${guestId}@reelramp.com`, userPhone: phone,
          onSuccess: async ({ paymentId }) => { await activate(paymentId, 'Cashfree', false); },
          onFailure: (err) => { setErr(err); setBusy(false); }
        });
      } catch (e: any) { setErr(e.message); setBusy(false); }
    }
  };

  return (
    <AnimatePresence>
      <motion.div key="promo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black flex items-center justify-center overflow-y-auto">
        <div className="relative w-full h-full max-w-[430px] mx-auto bg-zinc-950 text-white flex flex-col justify-between">
          
          {/* Header Back Button */}
          <div className="absolute top-4 left-4 z-[90] flex items-center justify-between w-full pr-8">
            <button onClick={() => { setOpen(false); setShowCheckout(false); }} className="icon bg-black/40 hover:bg-black/60"><X size={20} /></button>
            <span className="text-white/40 text-xs font-bold uppercase tracking-wider">FAQs</span>
          </div>

          {/* Fullscreen Video / Poster Container */}
          <div className="relative w-full h-[32vh] overflow-hidden flex-shrink-0">
            {promo?.video_filename ? (
              <video src={vurl(promo.video_filename)} poster={promo.poster_url || undefined} autoPlay muted={muted} playsInline loop className="absolute inset-0 h-full w-full object-cover" />
            ) : promo?.poster_url ? (
              <img src={promo.poster_url} className="absolute inset-0 h-full w-full object-cover" alt="promo" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 grid place-items-center">
                <Film size={80} className="text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/40" />
            <button onClick={() => setMuted(!muted)} className="absolute bottom-4 right-4 z-[90] h-9 w-9 rounded-full bg-black/40 backdrop-blur grid place-items-center text-white">
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* Kuku FM Styled Content Overlay */}
          <div className="flex-1 px-6 pb-24 space-y-6 overflow-y-auto">
            {/* Title / Header */}
            <div className="text-center space-y-2 mt-2">
              <h2 className="text-2xl md:text-3xl font-black leading-tight tracking-tight">
                {promo?.title || `Watch 1000+ Dramas For ₹${recurringPrice}`}
              </h2>
              {/* Huge ₹1 Price indicator */}
              <div className="flex flex-col items-center justify-center">
                <span className="text-8xl font-black text-white leading-none tracking-tighter">₹{trialPrice}</span>
                <p className="text-zinc-400 text-xs mt-1">Auto-pays ₹{recurringPrice} every quarter, cancel anytime</p>
              </div>
            </div>

            {/* List / Timeline (Kuku FM style) */}
            <div className="space-y-4 max-w-sm mx-auto relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-dashed before:bg-zinc-800">
              
              {/* Point 1 */}
              <div className="relative flex gap-3 items-start">
                <span className="absolute -left-6 grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800 z-10"><Lock size={12} /></span>
                <div>
                  <h4 className="font-black text-sm text-white">Start your Trial Plan</h4>
                  <p className="text-zinc-500 text-xs">Pay ₹{trialPrice} and unlock all dramas</p>
                </div>
              </div>

              {/* Point 2 */}
              <div className="relative flex gap-3 items-start">
                <span className="absolute -left-6 grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800 z-10">★</span>
                <div>
                  <h4 className="font-black text-sm text-white">Watch new dramas for {trialDays} days</h4>
                  <p className="text-zinc-500 text-xs">Romance, revenge and much more</p>
                </div>
              </div>

              {/* Point 3 */}
              <div className="relative flex gap-3 items-start">
                <span className="absolute -left-6 grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800 z-10"><Bell size={12} /></span>
                <div>
                  <h4 className="font-black text-sm text-white">Notified before autopay</h4>
                  <p className="text-zinc-500 text-xs">Pay ₹{recurringPrice}/3 months after {trialDays} days</p>
                </div>
              </div>

            </div>

            {/* Social proof tag */}
            <div className="flex items-center justify-center gap-2 text-green-500 font-bold text-xs bg-green-500/10 rounded-full py-2 px-4 max-w-xs mx-auto">
              <Users size={14} /> 5 Crore+ people bought the trial offer till now!
            </div>
          </div>

          {/* Bottom Sticky Payment Bar */}
          <div className="absolute bottom-0 inset-x-0 bg-zinc-900 border-t border-zinc-800 p-4 flex items-center justify-between gap-4 z-[90]">
            {/* Gateway dropdown */}
            <div className="flex flex-col items-start min-w-[100px]">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Pay via</span>
              <select 
                value={selectedGateway} 
                onChange={e => setSelectedGateway(e.target.value)}
                className="bg-transparent text-sm font-black text-white outline-none cursor-pointer flex items-center gap-1"
              >
                <option value="paytm" className="bg-zinc-900">Paytm</option>
                <option value="phonepe" className="bg-zinc-900">PhonePe</option>
                <option value="upi" className="bg-zinc-900">Any UPI</option>
                <option value="card" className="bg-zinc-900">Debit / Credit</option>
              </select>
            </div>

            {/* Big Start Trial Button */}
            <button 
              onClick={handleStartTrialClick}
              className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black py-4 rounded-full text-base transition flex items-center justify-center gap-2 shadow-lg shadow-pink-600/25"
            >
              Start Trial <ArrowRight size={18} />
            </button>
          </div>

          {/* Inline Checkout Form Overlay (to avoid infinite loops) */}
          <AnimatePresence>
            {showCheckout && (
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
                className="absolute inset-x-0 bottom-0 bg-zinc-900 border-t border-zinc-800 rounded-t-[34px] p-6 z-[100] space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-white">Billing Information</h3>
                  <button onClick={() => setShowCheckout(false)} className="rounded-full bg-zinc-800 p-2 text-white/60 hover:text-white"><X size={16} /></button>
                </div>
                
                <div className="rounded-2xl bg-zinc-800 p-4 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-white">{isTrialPlan ? activeTrialPlan.name : '1 Day Trial Offer'}</p>
                    <p className="text-xs text-zinc-400">Pay ₹{trialPrice} now, then auto-pay ₹{recurringPrice} after {trialDays} days</p>
                  </div>
                  <span className="text-lg font-black text-green-400">₹{trialPrice}</span>
                </div>

                {err && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-bold text-red-400 flex items-center gap-2">
                    <AlertCircle size={14} /> {err}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="label flex items-center gap-1 text-zinc-400"><Phone size={12} /> Mobile Number (required for Auto-Pay)</label>
                  <input className="input bg-zinc-800 text-white border-zinc-700 focus:border-pink-500 focus:ring-0" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
                </div>

                <button 
                  disabled={busy}
                  onClick={handlePayTrial}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black py-4 rounded-full text-base flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg shadow-pink-600/25"
                >
                  {busy ? <Loader2 className="animate-spin" size={20} /> : <>Proceed to Paytm / UPI <ArrowRight size={18} /></>}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── NOTIFICATION STRIP ───────────────────────────────────────────────────────
function NotificationStrip() {
  const { data } = useApp();
  const [dismissed, setDismissed] = useState<number[]>([]);
  const notifs = (data.notifications || []).filter((x: any) => x.is_active && !dismissed.includes(x.id));
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
// ─── REVENUE REPORT PAGE ─────────────────────────────────────
function RevenueReportPage({ data, videos, revenue, dailyRevenue, monthlyRevenue, activeSubs, payments, onDownload }: {
  data: Record<string, Row[]>; videos: Video[]; revenue: number;
  dailyRevenue: number; monthlyRevenue: number; activeSubs: any[];
  payments: any[]; onDownload: () => void;
}) {
  const series = data.series || [];
  const views = data.video_views || [];
  const subs = data.subscriptions || [];
  const totalViews = views.length || 1;

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredPayments = payments.filter((p: any) => {
    if (p.status !== 'success') return false;
    if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(p.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });
  const filteredRevenue = filteredPayments.reduce((a: number, p: any) => a + Number(p.amount || 0), 0);

  const seriesStats = series.map((ser: any) => {
    const eps = videos.filter((v: any) => v.series_title === ser.title);
    const epIds = eps.map((e: any) => e.id);
    const serViews = views.filter((vv: any) => epIds.includes(vv.video_id)).length;
    const sharePct = Number(ser.producer_share_percent || 50);
    const allocated = Math.round((serViews / totalViews) * revenue);
    const producerAmt = Math.round(allocated * sharePct / 100);
    const platformAmt = allocated - producerAmt;
    return { ...ser, episodes: eps.length, views: serViews, allocated, producerAmt, platformAmt, sharePct };
  });

  const cancelledSubs = subs.filter((s: any) => s.status === 'cancelled').length;
  const expiredSubs = subs.filter((s: any) => s.status === 'expired').length;
  const pendingCount = payments.filter((p: any) => p.status === 'pending').length;
  const failedCount = payments.filter((p: any) => p.status === 'failed').length;

  return (
    <div className="space-y-5">
      <div className="panel">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div>
            <h2 className="adminh"><BarChart /> Content Revenue & Producer Share Report</h2>
            <p className="text-sm text-zinc-500">Producer ko dene ke liye professional PDF report generate karein.</p>
          </div>
          <button onClick={onDownload} className="save flex items-center gap-2 text-base px-6 py-3">
            <Download size={18} /> Download PDF Report
          </button>
        </div>

        {/* Date Filter */}
        <div className="rounded-2xl bg-zinc-50 border p-4 mb-5">
          <h3 className="font-black text-sm mb-3">📅 Date Range Filter</h3>
          <div className="grid gap-3 md:grid-cols-3 items-end">
            <div><label className="label">From Date</label><input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div><label className="label">To Date</label><input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
            <div>
              <p className="label">Filtered Revenue</p>
              <p className="text-2xl font-black text-green-600">{money(filteredRevenue)}</p>
              <p className="text-xs text-zinc-500">{filteredPayments.length} transactions</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-3 md:grid-cols-4 mb-5">
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-700 font-bold">Total Revenue</p>
            <p className="text-3xl font-black text-green-800">{money(revenue)}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-700 font-bold">Today</p>
            <p className="text-3xl font-black text-blue-800">{money(dailyRevenue)}</p>
          </div>
          <div className="rounded-2xl bg-purple-50 border border-purple-200 p-4">
            <p className="text-sm text-purple-700 font-bold">This Month</p>
            <p className="text-3xl font-black text-purple-800">{money(monthlyRevenue)}</p>
          </div>
          <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4">
            <p className="text-sm text-orange-700 font-bold">Active Subs</p>
            <p className="text-3xl font-black text-orange-800">{activeSubs.length}</p>
          </div>
        </div>

        {/* More Stats */}
        <div className="grid gap-3 md:grid-cols-4 mb-5">
          <div className="rounded-2xl bg-zinc-50 border p-4"><p className="text-sm text-zinc-500">Total Videos</p><p className="text-2xl font-black">{videos.length}</p></div>
          <div className="rounded-2xl bg-zinc-50 border p-4"><p className="text-sm text-zinc-500">Total Views</p><p className="text-2xl font-black">{views.length}</p></div>
          <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4"><p className="text-sm text-yellow-700">Pending Payments</p><p className="text-2xl font-black text-yellow-800">{pendingCount}</p></div>
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4"><p className="text-sm text-red-700">Failed Payments</p><p className="text-2xl font-black text-red-800">{failedCount}</p></div>
        </div>

        {/* Series Breakdown Table */}
        <h3 className="font-black text-lg mb-3">Series-wise Revenue Share</h3>
        {seriesStats.length === 0 ? (
          <div className="rounded-2xl bg-zinc-100 p-8 text-center text-zinc-400">
            <p>Koi series nahi hai. Admin → Series tab mein add karein.</p>
            <p className="text-xs mt-1 text-zinc-300">Producer share percentage Series mein "producer_share_percent" field se set hota hai (default: 50%)</p>
          </div>
        ) : (
          <div className="overflow-auto rounded-2xl border">
            <table className="min-w-full">
              <thead>
                <tr className="bg-zinc-950 text-white">
                  <th className="text-left p-4 font-black">Series Title</th>
                  <th className="p-4 font-black">Episodes</th>
                  <th className="p-4 font-black">Views</th>
                  <th className="p-4 font-black">Allocated Revenue</th>
                  <th className="p-4 font-black">Producer %</th>
                  <th className="p-4 font-black text-yellow-300">Producer Share</th>
                  <th className="p-4 font-black">Platform Share</th>
                </tr>
              </thead>
              <tbody>
                {seriesStats.map((s: any) => (
                  <tr key={s.id} className="border-b hover:bg-zinc-50">
                    <td className="p-4 font-black">{s.title}</td>
                    <td className="p-4 text-center">{s.episodes}</td>
                    <td className="p-4 text-center">{s.views}</td>
                    <td className="p-4 text-center font-bold">{money(s.allocated)}</td>
                    <td className="p-4 text-center">
                      <span className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-black">{s.sharePct}%</span>
                    </td>
                    <td className="p-4 text-center font-black text-amber-700 text-lg">{money(s.producerAmt)}</td>
                    <td className="p-4 text-center text-zinc-500">{money(s.platformAmt)}</td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-zinc-950 text-white font-black">
                  <td className="p-4">TOTAL</td>
                  <td className="p-4 text-center">{videos.length}</td>
                  <td className="p-4 text-center">{views.length}</td>
                  <td className="p-4 text-center">{money(revenue)}</td>
                  <td className="p-4 text-center">—</td>
                  <td className="p-4 text-center text-yellow-300">{money(seriesStats.reduce((a: number, s: any) => a + s.producerAmt, 0))}</td>
                  <td className="p-4 text-center text-zinc-300">{money(seriesStats.reduce((a: number, s: any) => a + s.platformAmt, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Subscription Breakdown */}
        <div className="mt-5">
          <h3 className="font-black text-lg mb-3">Subscription Summary</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center">
              <p className="text-green-700 font-bold text-sm">Active</p>
              <p className="text-3xl font-black text-green-800">{activeSubs.length}</p>
            </div>
            <div className="rounded-2xl bg-zinc-100 border p-4 text-center">
              <p className="text-zinc-600 font-bold text-sm">Expired</p>
              <p className="text-3xl font-black">{expiredSubs}</p>
            </div>
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-center">
              <p className="text-red-600 font-bold text-sm">Cancelled</p>
              <p className="text-3xl font-black text-red-700">{cancelledSubs}</p>
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div className="mt-5">
          <h3 className="font-black text-lg mb-3">Recent Successful Payments</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {payments.filter((p: any) => p.status === 'success').slice(0, 20).map((p: any) => (
              <div key={p.id} className="rounded-2xl bg-zinc-50 p-3 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold">{money(p.amount)} — {p.gateway}</p>
                  <p className="text-xs text-zinc-400">{new Date(p.created_at).toLocaleString('en-IN')} · {p.transaction_id || 'No Txn ID'}</p>
                </div>
                <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-black">Success</span>
              </div>
            ))}
            {payments.filter((p: any) => p.status === 'success').length === 0 && (
              <p className="text-zinc-400 text-sm text-center py-4">Koi successful payment nahi hai abhi.</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-center">
          <button onClick={onDownload} className="save flex items-center gap-2 text-base px-8 py-4">
            <Download size={20} /> Download Complete PDF Report
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-zinc-100 p-4 text-xs text-zinc-500">
          <p className="font-bold mb-1">💡 Note:</p>
          <p>Revenue allocation views ke basis par pro-rata calculate hoti hai. Producer share percentage Admin → Series tab mein har series ke liye alag set kar sakte hain ("producer_share_percent" field, default: 50%).</p>
        </div>
      </div>
    </div>
  );
}

function AdminGate() {
  const [s, setS] = useState('');
  const [ok, setOk] = useState(() => sessionStorage.getItem('rr_admin') === '1');
  if (ok) return <Admin />;
  return (
    <main className="grid min-h-screen place-items-center bg-orange-50 p-4">
      <div className="card max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="text-[var(--rr-accent)]" size={48} />
          <div>
            <h1 className="text-3xl font-black">Admin Login</h1>
            <p className="text-zinc-500 text-sm">Authorized personnel only.</p>
          </div>
        </div>
        <input className="input" type="password" value={s} onChange={e => setS(e.target.value)} placeholder="Admin password"
          onKeyDown={e => { if (e.key === 'Enter' && s === ADMIN_SECRET) { sessionStorage.setItem('rr_admin', '1'); setOk(true); } }} />
        <button className="btn w-full mt-3" onClick={() => { if (s === ADMIN_SECRET) { sessionStorage.setItem('rr_admin', '1'); setOk(true); } }}>
          <ArrowRight size={16} /> Enter Admin Panel
        </button>
      </div>
    </main>
  );
}



// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
function Admin() {
  const { data, videos, categories, payment, theme, player, storage, mutate, refresh } = useApp();
  const [tab, setTab] = useState('dashboard');
  const [pay, setPay] = useState<PaymentSettings>(payment);
  const [th, setTh] = useState<BrandSettings>(theme);
  const [pl, setPl] = useState(player);
  const [st, setSt] = useState<StorageConfig>(storage);
  const [importText, setImportText] = useState('');
  const [importResource, setImportResource] = useState('videos');
  const [importMsg, setImportMsg] = useState('');
  const [gwForm, setGwForm] = useState<Partial<GatewayConfig & { keys: any }>>({});
  const [saveMsg, setSaveMsg] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);

  useEffect(() => setPay(payment), [payment]);
  useEffect(() => setTh(theme), [theme]);
  useEffect(() => setPl(player), [player]);
  useEffect(() => setSt(storage), [storage]);

  const admin = data.admin_settings || [];

  const saveSetting = async (key: string, value: any) => {
    setSaveBusy(true); setSaveMsg('');
    try {
      const row = admin.find((a: any) => a.key === key);
      await mutate('admin_settings', row ? 'PUT' : 'POST', row ? { id: row.id, key, value } : { key, value });
      setSaveMsg(`✅ "${key}" saved successfully!`);
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: any) {
      setSaveMsg(`❌ Error: ${e.message}`);
    } finally { setSaveBusy(false); }
  };

  // Revenue stats
  const payments = data.payments || [];
  const successPayments = payments.filter((p: any) => p.status === 'success');
  const revenue = successPayments.reduce((a: number, p: any) => a + Number(p.amount || 0), 0);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const dailyRevenue = successPayments.filter((p: any) => new Date(p.created_at).getTime() >= startOfDay).reduce((a: number, p: any) => a + Number(p.amount || 0), 0);
  const monthlyRevenue = successPayments.filter((p: any) => new Date(p.created_at).getTime() >= startOfMonth).reduce((a: number, p: any) => a + Number(p.amount || 0), 0);
  const allSubs = data.subscriptions || [];
  const activeSubs = allSubs.filter((s: any) => s.status === 'active' && new Date(s.expires_at).getTime() > Date.now());
  const pendingPayments = payments.filter((p: any) => p.status === 'pending');

  // ── PDF CONTENT REVENUE REPORT (Producer Share) ──
  const downloadRevenueReportPDF = () => {
    const payments_all = (data.payments || []).filter((p:any) => p.status === 'success');
    const videos_all = videos;
    const series_all = data.series || [];
    const subs_all = data.subscriptions || [];
    const views_all = data.video_views || [];
    const totalRevenue = payments_all.reduce((a:number,p:any)=>a+Number(p.amount||0),0);
    const activeSubsCount = subs_all.filter((s:any)=>s.status==='active' && new Date(s.expires_at).getTime()>Date.now()).length;
    // Build per-series revenue breakdown (pro-rata by views)
    const seriesStats = series_all.map((ser:any)=>{
      const eps = videos_all.filter((v:any)=>v.series_title===ser.title);
      const epIds = eps.map((e:any)=>e.id);
      const seriesViews = views_all.filter((vv:any)=>epIds.includes(vv.video_id)).length;
      const sharePct = Number(ser.producer_share_percent||50);
      return { title: ser.title, episodes: eps.length, views: seriesViews, sharePct };
    });
    const totalViews = views_all.length || 1;
    const htmlRows = seriesStats.map((s:any)=>{
      const revenueShare = Math.round((s.views/totalViews)*totalRevenue);
      const producerAmt = Math.round(revenueShare * s.sharePct / 100);
      const platformAmt = revenueShare - producerAmt;
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd;font-weight:700">${s.title}</td>
        <td style="padding:8px;border:1px solid #ddd">${s.episodes}</td>
        <td style="padding:8px;border:1px solid #ddd">${s.views}</td>
        <td style="padding:8px;border:1px solid #ddd">₹${revenueShare.toLocaleString('en-IN')}</td>
        <td style="padding:8px;border:1px solid #ddd">${s.sharePct}%</td>
        <td style="padding:8px;border:1px solid #ddd;font-weight:700;color:#b45309">₹${producerAmt.toLocaleString('en-IN')}</td>
        <td style="padding:8px;border:1px solid #ddd">₹${platformAmt.toLocaleString('en-IN')}</td>
      </tr>`;
    }).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>ReelRamp Content Revenue Report</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{margin:0}table{border-collapse:collapse;width:100%;margin-top:18px}th{background:#111;color:#fff;padding:10px;text-align:left}td{font-size:13px}.head{display:flex;align-items:center;gap:16px}.badge{background:#c5a26f;padding:6px 14px;border-radius:999px;font-weight:900}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:18px}.stat{border:1px solid #eee;border-radius:16px;padding:14px}.stat b{font-size:22px} .footer{margin-top:24px;font-size:12px;color:#666}</style>
    </head><body>
    <div class="head"><div style="width:52px;height:52px;background:#c5a26f;border-radius:16px;display:grid;place-items:center;font-weight:900;font-size:22px">RR</div>
    <div><h1>ReelRamp Pro</h1><div>Content Revenue & Producer Share Report</div></div>
    <div style="margin-left:auto"><span class="badge">${new Date().toLocaleDateString('en-IN')}</span></div></div>

    <div class="stats">
      <div class="stat"><div>Total Revenue</div><b>₹${totalRevenue.toLocaleString('en-IN')}</b></div>
      <div class="stat"><div>Active Subscriptions</div><b>${activeSubsCount}</b></div>
      <div class="stat"><div>Total Videos</div><b>${videos_all.length}</b></div>
      <div class="stat"><div>Content Series</div><b>${series_all.length}</b></div>
    </div>

    <h2 style="margin-top:28px">Series-wise Revenue Share</h2>
    <table>
      <thead><tr><th>Series</th><th>Episodes</th><th>Views</th><th>Allocated Revenue</th><th>Producer %</th><th>Producer Share</th><th>Platform Share</th></tr></thead>
      <tbody>${htmlRows || '<tr><td colspan="7" style="padding:16px;text-align:center;color:#888">No series data available.</td></tr>'}</tbody>
    </table>

    <div class="footer">
      <p><b>ReelRamp Originals Pvt. Ltd.</b><br>
      FF Shop No. 6, Arohi Arcade, Munshipulia, Lucknow - 226016<br>
      reelramporiginal@gmail.com · +91 7307493338</p>
      <p>Generated: ${new Date().toLocaleString('en-IN')}</p>
      <p><i>Note: Revenue allocation is calculated pro-rata based on content views. Producer share percentage is configurable per series in Admin → Series.</i></p>
    </div>
    <script>window.onload=()=>window.print()</script>
    </body></html>`;
    const w = window.open('','_blank');
    if (w) { w.document.write(html); w.document.close(); }
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
      id: `gw_${Date.now()}`, name: gwForm.name, type: gwForm.type,
      enabled: true, isDefault: pay.gateways.length === 0,
      testMode: !!gwForm.testMode, keys: gwForm.keys || {},
      webhookSecret: gwForm.webhookSecret, healthStatus: 'unknown'
    };
    setPay(prev => ({ ...prev, gateways: [...prev.gateways, newGw] }));
    setGwForm({});
  };
  const updateGateway = (id: string, changes: Partial<GatewayConfig>) =>
    setPay(prev => ({ ...prev, gateways: prev.gateways.map(g => g.id === id ? { ...g, ...changes } : g) }));
  const removeGateway = (id: string) =>
    setPay(prev => ({ ...prev, gateways: prev.gateways.filter(g => g.id !== id) }));
  const setDefault = (id: string) =>
    setPay(prev => ({ ...prev, gateways: prev.gateways.map(g => ({ ...g, isDefault: g.id === id })) }));

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'revenueReport', label: '📑 Revenue PDF' },
    { id: 'videos', label: '🎬 Videos' },
    { id: 'series', label: '📺 Series' },
    { id: 'categories', label: '🏷️ Categories' },
    { id: 'banners', label: '🖼️ Banners' },
    { id: 'promoVideo', label: '📢 Promo' },
    { id: 'popups', label: '💬 Popups' },
    { id: 'notifications', label: '🔔 Notifs' },
    { id: 'plans', label: '👑 Plans' },
    { id: 'payments', label: '💳 Payments' },
    { id: 'subscriptions', label: '📋 Subs' },
    { id: 'users', label: '👥 Users' },
    { id: 'wallet', label: '💰 Wallet' },
    { id: 'brand', label: '🎨 Brand' },
    { id: 'gateways', label: '🏦 Gateways' },
    { id: 'storage', label: '☁️ Storage' },
    { id: 'player', label: '▶️ Player' },
    { id: 'policies', label: '📜 Policies' },
    { id: 'help', label: '❓ Help' },
    { id: 'support', label: '🎫 Support' },
    { id: 'reports', label: '⚠️ Reports' },
    { id: 'json', label: '🗄️ Backup' },
  ];

  return (
    <main className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2"><Shield className="text-[var(--rr-accent)]" /> Admin Control Center</h1>
          <p className="text-zinc-500 text-sm">ReelRamp Pro — Content, plans, brand, gateway, revenue sab yahan se manage karein.</p>
        </div>
        <button onClick={() => refresh()} className="pill flex items-center gap-1"><RefreshCcw size={14} /> Refresh</button>
      </div>

      {saveMsg && (
        <div className={`mb-4 rounded-2xl p-3 text-sm font-bold ${saveMsg.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {saveMsg}
        </div>
      )}

      <div className="my-4 flex gap-2 overflow-x-auto pb-2">
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={`pill shrink-0 ${tab === t.id ? 'active' : ''}`}>{t.label}</button>)}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <Stat l="Total Revenue" v={money(revenue)} icon={<DollarSign size={20} className="text-green-500" />} />
            <Stat l="Today Revenue" v={money(dailyRevenue)} icon={<TrendingUp size={20} className="text-blue-500" />} />
            <Stat l="Monthly Revenue" v={money(monthlyRevenue)} icon={<BarChart size={20} className="text-purple-500" />} />
            <Stat l="Total Users" v={(data.users || []).length} icon={<Users size={20} className="text-orange-500" />} />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Stat l="Active Subs" v={activeSubs.length} icon={<CheckCircle2 size={20} className="text-green-500" />} />
            <Stat l="Pending Payments" v={pendingPayments.length} icon={<Clock size={20} className="text-yellow-500" />} />
            <Stat l="Videos" v={videos.length} icon={<Film size={20} className="text-pink-500" />} />
            <Stat l="Series" v={(data.series || []).length} icon={<Folder size={20} className="text-indigo-500" />} />
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={exp} className="btn"><FileText size={16} /> Export Backup JSON</button>
            <button onClick={downloadRevenueReportPDF} className="save flex items-center gap-2"><BarChart size={16} /> Download Revenue PDF Report</button>
          </div>
          {pendingPayments.length > 0 && (
            <div className="card p-5">
              <h3 className="font-black text-amber-700 flex items-center gap-2 mb-3"><AlertCircle size={18} /> Pending Payments — Verification Required</h3>
              <div className="space-y-2">
                {pendingPayments.map((p: any) => (
                  <div key={p.id} className="rounded-2xl bg-amber-50 p-3 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <p className="font-bold text-sm">{money(p.amount)} — {p.gateway}</p>
                      <p className="text-xs text-zinc-500">User: {p.user_id} · Txn: {p.transaction_id || p.cf_payment_id}</p>
                      <p className="text-xs text-zinc-400">{new Date(p.created_at).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => mutate('payments', 'PUT', { id: p.id, status: 'success' })} className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700 hover:bg-green-200">Approve</button>
                      <button onClick={() => mutate('payments', 'PUT', { id: p.id, status: 'failed' })} className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700 hover:bg-red-200">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REVENUE PDF REPORT TAB ── */}
      {tab === 'revenueReport' && (
        <RevenueReportPage
          data={data}
          videos={videos}
          revenue={revenue}
          dailyRevenue={dailyRevenue}
          monthlyRevenue={monthlyRevenue}
          activeSubs={activeSubs}
          payments={payments}
          onDownload={downloadRevenueReportPDF}
        />
      )}

      {/* ── VIDEOS ── */}
      {tab === 'videos' && (
        <VideoManager storage={st} categories={categories} />
      )}

      {tab === 'series' && <Crud resource="series" fields={['title', 'description', 'category', 'status', 'sort_order']} checks={['is_featured']} defaults={{ status: 'published' }} storageConfig={st} imageFields={['poster_url']} />}
      {tab === 'categories' && <Crud resource="categories" fields={['name', 'slug', 'icon', 'sort_order']} checks={['is_active']} defaults={{ icon: '🎬', is_active: true }} storageConfig={st} />}
      {tab === 'banners' && <Crud resource="banners" fields={['title', 'subtitle', 'cta_label', 'cta_action', 'sort_order']} checks={['is_active']} defaults={{ is_active: true, cta_action: 'forYou' }} storageConfig={st} imageFields={['image_url']} />}
      {tab === 'promoVideo' && <Crud resource="promo_campaigns" fields={['title', 'subtitle', 'celebrity_name', 'offer_text', 'cta_label', 'cta_action', 'placement', 'show_after_seconds', 'frequency_hours', 'sort_order', 'target']} checks={['is_active']} defaults={{ is_active: true, placement: 'app_open', cta_action: 'plans', show_after_seconds: 2, frequency_hours: 12, target: 'free_users' }} storageConfig={st} imageFields={['poster_url']} videoFields={['video_filename']} />}
      {tab === 'popups' && <Crud resource="popup_settings" fields={['title', 'message', 'cta_label', 'cta_url']} checks={['enabled']} defaults={{ enabled: true }} storageConfig={st} />}
      {tab === 'notifications' && <Crud resource="notifications" fields={['title', 'message', 'target']} checks={['is_active']} defaults={{ is_active: true, target: 'all' }} storageConfig={st} />}
      {tab === 'plans' && <Crud resource="plans" fields={['name', 'price', 'duration_days', 'sort_order', 'plan_type', 'trial_days', 'cf_plan_id']} checks={['is_active', 'supports_autorenew']} defaults={{ is_active: true, price: 99, duration_days: 30, plan_type: 'monthly' }} storageConfig={st} />}
      {tab === 'payments' && <DataTable resource="payments" rows={data.payments || []} />}
      {tab === 'subscriptions' && <DataTable resource="subscriptions" rows={data.subscriptions || []} />}
      {tab === 'users' && <DataTable resource="users" rows={data.users || []} />}
      {tab === 'wallet' && <DataTable resource="wallet_transactions" rows={data.wallet_transactions || []} />}
      {tab === 'reports' && <DataTable resource="content_reports" rows={data.content_reports || []} />}
      {tab === 'support' && <DataTable resource="support_tickets" rows={data.support_tickets || []} />}

      {/* ── BRAND ── */}
      {tab === 'brand' && (
        <div className="panel space-y-5">
          <h2 className="adminh"><Palette /> Brand & Logo Settings</h2>

          {/* Logo Section */}
          <div className="rounded-3xl border-2 border-dashed border-[var(--rr-primary)] bg-orange-50 p-5">
            <h3 className="font-black mb-3 flex items-center gap-2"><Image size={18} /> Logo Image</h3>
            <div className="grid gap-4 md:grid-cols-2 items-start">
              <div className="space-y-3">
                <FileUploader
                  accept="image/*"
                  label="Logo Upload (PNG/SVG recommended)"
                  storage={st}
                  onUrl={url => setTh(prev => ({ ...prev, logoImageUrl: url }))}
                  hint="Transparent background best. Max 500KB."
                />
                <div>
                  <label className="label">Ya URL paste karein</label>
                  <input className="input" value={th.logoImageUrl || ''} onChange={e => setTh(prev => ({ ...prev, logoImageUrl: e.target.value }))} placeholder="https://example.com/logo.png" />
                </div>
                <div>
                  <label className="label">Logo Text (fallback)</label>
                  <input className="input" value={th.logoText || ''} onChange={e => setTh(prev => ({ ...prev, logoText: e.target.value }))} placeholder="RR" />
                </div>
              </div>
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs font-black text-zinc-500 uppercase">Live Preview</p>
                <div className="rounded-2xl border-2 bg-white p-4 flex items-center gap-3 w-full shadow-sm">
                  {th.logoImageUrl
                    ? <img src={th.logoImageUrl} alt="Logo Preview" className="h-10 w-auto max-w-[120px] object-contain" />
                    : <span className="grid h-11 w-11 place-items-center rounded-2xl font-black text-black" style={{ background: th.primary || '#c5a26f' }}>{th.logoText || 'RR'}</span>}
                  <b className="text-xl">{th.brand || 'ReelRamp Pro'}</b>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Brand Name</label>
            <input className="input" value={th.brand || ''} onChange={e => setTh(prev => ({ ...prev, brand: e.target.value }))} placeholder="ReelRamp Pro" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {(['primary', 'accent', 'bg'] as const).map(k => (
              <div key={k} className="space-y-2">
                <label className="label capitalize">{k} Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" className="h-10 w-12 cursor-pointer rounded-xl border border-zinc-200" value={th[k] || '#000000'} onChange={e => setTh(prev => ({ ...prev, [k]: e.target.value }))} />
                  <input className="input flex-1" value={th[k] || ''} onChange={e => setTh(prev => ({ ...prev, [k]: e.target.value }))} placeholder="#hex" />
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="label">Border Radius</label>
            <input className="input max-w-xs" value={th.radius || ''} onChange={e => setTh(prev => ({ ...prev, radius: e.target.value }))} placeholder="30px" />
          </div>

          <button disabled={saveBusy} className="save w-full disabled:opacity-60" onClick={() => saveSetting('theme', th)}>
            {saveBusy ? <Loader2 className="animate-spin" size={18} /> : <Save size={16} />} Save Brand Settings
          </button>
        </div>
      )}

      {/* ── GATEWAYS ── */}
      {tab === 'gateways' && (
        <div className="space-y-5">
          <div className="panel">
            <h2 className="adminh"><Wallet /> Payment Gateway Engine</h2>
            <p className="text-sm text-zinc-500 mb-4">Cashfree, Razorpay, UPI Manual — multiple gateways configure karein. Default gateway plans page par use hoga.</p>

            {/* Cashfree Quick Setup */}
            <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 p-5 mb-5">
              <h3 className="font-black text-orange-700 flex items-center gap-2 mb-2"><Zap size={16} /> Cashfree Quick Setup</h3>
              <ol className="text-sm text-orange-800 space-y-1 list-decimal list-inside">
                <li><a href="https://merchant.cashfree.com" target="_blank" className="underline font-bold">merchant.cashfree.com</a> par account banao</li>
                <li>Developers → API Keys → App ID aur Secret Key copy karo</li>
                <li>Sandbox mein test karo, fir Production keys use karo</li>
                <li>Webhook URL: <code className="bg-orange-100 px-1 rounded text-xs">{window.location.origin}/api/cashfree-webhook</code></li>
              </ol>
            </div>

            {/* Existing Gateways */}
            <div className="space-y-3 mb-5">
              {pay.gateways.map(gw => (
                <div key={gw.id} className={`rounded-3xl border-2 p-4 ${gw.enabled ? 'border-green-200 bg-green-50' : 'border-zinc-200 bg-zinc-50'}`}>
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`h-3 w-3 rounded-full ${gw.enabled ? 'bg-green-500' : 'bg-zinc-300'}`} />
                      <b className="font-black">{gw.name}</b>
                      <span className="text-xs text-zinc-500 bg-white rounded-full px-2 py-0.5">({gw.type})</span>
                      {gw.isDefault && <span className="rounded-full bg-[var(--rr-primary)] px-2 py-0.5 text-xs font-black text-black">DEFAULT</span>}
                      {gw.testMode && <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-xs font-black text-yellow-800">SANDBOX</span>}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => updateGateway(gw.id, { enabled: !gw.enabled })} className={`rounded-full px-3 py-1 text-xs font-black ${gw.enabled ? 'bg-zinc-200 text-zinc-700' : 'bg-green-200 text-green-700'}`}>
                        {gw.enabled ? 'Disable' : 'Enable'}
                      </button>
                      {!gw.isDefault && <button onClick={() => setDefault(gw.id)} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">Set Default</button>}
                      <button onClick={() => removeGateway(gw.id)} className="rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(gw.keys).filter(([k]) => !k.toLowerCase().includes('secret')).map(([k, v]) => (
                      <p key={k} className="text-xs text-zinc-500 font-mono bg-white rounded-lg px-2 py-1">{k}: {String(v).slice(0, 20)}{String(v).length > 20 ? '...' : ''}</p>
                    ))}
                  </div>
                </div>
              ))}
              {pay.gateways.length === 0 && <div className="rounded-3xl bg-zinc-100 p-6 text-center text-zinc-500 text-sm">Koi gateway configure nahi hai. Neeche add karein.</div>}
            </div>

            {/* Add Gateway Form */}
            <div className="rounded-3xl border-2 border-dashed border-zinc-300 p-5">
              <h3 className="font-black mb-4 flex items-center gap-2"><Plus size={18} /> New Gateway Add Karein</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="label">Gateway Name *</label>
                  <input className="input" value={gwForm.name || ''} onChange={e => setGwForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Cashfree Production" />
                </div>
                <div>
                  <label className="label">Gateway Type *</label>
                  <select className="input" value={gwForm.type || ''} onChange={e => setGwForm(prev => ({ ...prev, type: e.target.value, keys: {} }))}>
                    <option value="">-- Select Type --</option>
                    {['Cashfree', 'Razorpay', 'UPI Manual', 'PayU', 'Stripe', 'PayPal', 'Bank Transfer'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              {gwForm.type === 'Cashfree' && (
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <div>
                    <label className="label">App ID (Client ID)</label>
                    <input className="input" value={gwForm.keys?.appId || ''} onChange={e => setGwForm(prev => ({ ...prev, keys: { ...prev.keys, appId: e.target.value } }))} placeholder="TEST123..." />
                  </div>
                  <div>
                    <label className="label">Secret Key</label>
                    <input className="input" type="password" value={gwForm.keys?.secretKey || ''} onChange={e => setGwForm(prev => ({ ...prev, keys: { ...prev.keys, secretKey: e.target.value } }))} placeholder="Secret key" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Webhook Secret (optional)</label>
                    <input className="input" type="password" value={gwForm.webhookSecret || ''} onChange={e => setGwForm(prev => ({ ...prev, webhookSecret: e.target.value }))} placeholder="Cashfree webhook secret" />
                  </div>
                </div>
              )}
              {gwForm.type === 'Razorpay' && (
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <div>
                    <label className="label">Key ID</label>
                    <input className="input" value={gwForm.keys?.keyId || ''} onChange={e => setGwForm(prev => ({ ...prev, keys: { ...prev.keys, keyId: e.target.value } }))} placeholder="rzp_live_..." />
                  </div>
                  <div>
                    <label className="label">Key Secret</label>
                    <input className="input" type="password" value={gwForm.keys?.keySecret || ''} onChange={e => setGwForm(prev => ({ ...prev, keys: { ...prev.keys, keySecret: e.target.value } }))} placeholder="Secret" />
                  </div>
                </div>
              )}
              {gwForm.type === 'UPI Manual' && (
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <div>
                    <label className="label">UPI ID</label>
                    <input className="input" value={gwForm.keys?.upiId || ''} onChange={e => setGwForm(prev => ({ ...prev, keys: { ...prev.keys, upiId: e.target.value } }))} placeholder="yourname@upi" />
                  </div>
                  <div>
                    <label className="label">QR Code URL ya Upload</label>
                    <input className="input" value={gwForm.keys?.upiQr || ''} onChange={e => setGwForm(prev => ({ ...prev, keys: { ...prev.keys, upiQr: e.target.value } }))} placeholder="https://..." />
                    <FileUploader accept="image/*" label="" storage={st} onUrl={url => setGwForm(prev => ({ ...prev, keys: { ...prev.keys, upiQr: url } }))} hint="QR image upload karein" />
                  </div>
                </div>
              )}
              {(gwForm.type === 'PayU' || gwForm.type === 'Stripe' || gwForm.type === 'PayPal') && (
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <div><label className="label">API Key / Client ID</label><input className="input" value={gwForm.keys?.keyId || ''} onChange={e => setGwForm(prev => ({ ...prev, keys: { ...prev.keys, keyId: e.target.value } }))} /></div>
                  <div><label className="label">Secret Key</label><input className="input" type="password" value={gwForm.keys?.keySecret || ''} onChange={e => setGwForm(prev => ({ ...prev, keys: { ...prev.keys, keySecret: e.target.value } }))} /></div>
                </div>
              )}

              <div className="flex items-center gap-3 mt-4">
                <label className="flex cursor-pointer items-center gap-2 font-black text-sm">
                  <input type="checkbox" checked={!!gwForm.testMode} onChange={e => setGwForm(prev => ({ ...prev, testMode: e.target.checked }))} className="h-4 w-4" />
                  Sandbox / Test Mode
                </label>
              </div>
              <button onClick={addGateway} disabled={!gwForm.name || !gwForm.type} className="btn mt-4 disabled:opacity-50">
                <Plus size={16} /> Add Gateway
              </button>
            </div>

            {/* Common Settings */}
            <div className="mt-5 space-y-3">
              <h3 className="font-black">Common Settings</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <div><label className="label">WhatsApp Support</label><input className="input" value={pay.whatsapp || ''} onChange={e => setPay(prev => ({ ...prev, whatsapp: e.target.value }))} placeholder="+917307493338" /></div>
                <div><label className="label">Monthly Base Price (₹)</label><input className="input" type="number" value={pay.monthlyPrice || ''} onChange={e => setPay(prev => ({ ...prev, monthlyPrice: Number(e.target.value) }))} /></div>
              </div>
              <div><label className="label">Payment Instructions</label><textarea className="input min-h-20" value={pay.instructions || ''} onChange={e => setPay(prev => ({ ...prev, instructions: e.target.value }))} placeholder="UPI se payment karein aur UTR WhatsApp par bhejein." /></div>

              {/* Auto-Pay Toggle */}
              <div className={`rounded-2xl border-2 p-4 ${(pay as any).autopayEnabled ? 'border-green-300 bg-green-50' : 'border-zinc-200 bg-zinc-50'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!(pay as any).autopayEnabled}
                    onChange={e => setPay(prev => ({ ...(prev as any), autopayEnabled: e.target.checked }))}
                    className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-black text-sm">🔄 Auto-Pay (Subscription / eNACH) Enable karein</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      <b>OFF rakho</b> jab tak Cashfree par Subscriptions activate na ho — tab ₹1 trial ek-baar ka payment se chalega.
                      Jab Cashfree Subscriptions enable ho jaye, toh yahan <b>ON</b> kar do — auto-pay khud chalu ho jayega!
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <button disabled={saveBusy} className="save w-full mt-4 disabled:opacity-60" onClick={() => saveSetting('payment', pay)}>
              {saveBusy ? <Loader2 className="animate-spin" size={18} /> : <Save size={16} />} Save All Gateway Settings
            </button>
          </div>
        </div>
      )}

      {/* ── STORAGE (Hybrid setup: Images → Supabase, Videos → Bunny.net) ── */}
      {tab === 'storage' && (
        <div className="panel space-y-5">
          <h2 className="adminh"><HardDrive /> Storage & CDN Settings</h2>

          <div className="rounded-3xl bg-gradient-to-br from-orange-50 to-blue-50 border-2 border-orange-200 p-5">
            <h3 className="font-black text-lg mb-3">🛠 Hybrid Storage Setup</h3>
            <div className="grid gap-3 md:grid-cols-2 text-sm">
              <div className="rounded-2xl bg-white p-4">
                <p className="font-black text-blue-700">🖼️ Images → Supabase Storage</p>
                <p className="text-zinc-600 mt-1">Logos, thumbnails, banners, posters — Supabase se fast load & free tier.</p>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <p className="font-black text-orange-700">🎬 Videos → Bunny.net CDN</p>
                <p className="text-zinc-600 mt-1">Large video files — Bunny Stream se global fast delivery.</p>
              </div>
            </div>
          </div>

          {/* Video Provider */}
          <div className="rounded-3xl border border-zinc-200 p-5">
            <h3 className="font-black mb-3 flex items-center gap-2">🎬 Video Storage Provider</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {(['bunny','supabase','local'] as const).map(p=>(
                <button key={p} type="button" onClick={()=>setSt(s=>({...s, videoProvider:p}))}
                  className={`rounded-2xl border-2 p-4 text-left ${st.videoProvider===p?'border-[var(--rr-primary)] bg-orange-50':'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                  <div className="font-black capitalize">{p==='bunny'?'🐰 Bunny.net':p==='supabase'?'⚡ Supabase':'🔗 Direct URL'}</div>
                  <p className="text-xs text-zinc-500 mt-0.5">{p==='bunny'?'Global CDN, best for video':p==='supabase'?'Supabase bucket':'Manual URL input'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Image Provider */}
          <div className="rounded-3xl border border-zinc-200 p-5">
            <h3 className="font-black mb-3 flex items-center gap-2">🖼️ Image Storage Provider</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {(['supabase','bunny','local'] as const).map(p=>(
                <button key={p} type="button" onClick={()=>setSt(s=>({...s, imageProvider:p}))}
                  className={`rounded-2xl border-2 p-4 text-left ${st.imageProvider===p?'border-[var(--rr-primary)] bg-blue-50':'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                  <div className="font-black capitalize">{p==='supabase'?'⚡ Supabase (Recommended)':p==='bunny'?'🐰 Bunny Storage':'🔗 Direct URL'}</div>
                  <p className="text-xs text-zinc-500 mt-0.5">{p==='supabase'?'Fast integrated free tier':p==='bunny'?'Bunny storage':'Manual URL input'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Bunny.net Configuration */}
          <div className="rounded-3xl bg-orange-50 border border-orange-200 p-5 space-y-4">
            <h3 className="font-black text-orange-800 flex items-center gap-2"><Zap size={16} /> Bunny.net Configuration (Video)</h3>
            <div className="rounded-2xl bg-white p-4 text-sm">
              <p className="font-black text-orange-700">Setup Guide:</p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-600 mt-2">
                <li><a href="https://panel.bunny.net" target="_blank" rel="noopener noreferrer" className="underline text-orange-600 font-bold">panel.bunny.net</a> → Storage Zones → Add New Zone</li>
                <li>Storage Zone name + Access Password copy karo</li>
                <li>Pull Zone banao (CDN URL milega)</li>
                <li>Stream Library banao (Library ID + API key milenge)</li>
              </ol>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Storage Zone Name</label><input className="input" value={st.bunnyStorageZone || ''} onChange={e=>setSt(s=>({...s, bunnyStorageZone:e.target.value}))} placeholder="reelramp-videos" /></div>
              <div><label className="label">Storage Zone Password</label><input className="input" type="password" value={st.bunnyStoragePassword || ''} onChange={e=>setSt(s=>({...s, bunnyStoragePassword:e.target.value}))} placeholder="AccessKey from Bunny panel" /></div>
              <div><label className="label">CDN Pull Zone URL</label><input className="input" value={st.bunnyCdnUrl || ''} onChange={e=>setSt(s=>({...s, bunnyCdnUrl:e.target.value}))} placeholder="https://reelramp.b-cdn.net" /></div>
              <div><label className="label">Stream Library ID</label><input className="input" value={st.bunnyLibraryId || ''} onChange={e=>setSt(s=>({...s, bunnyLibraryId:e.target.value}))} placeholder="12345" /></div>
              <div className="md:col-span-2"><label className="label">Bunny Stream API Key (optional)</label><input className="input" type="password" value={st.bunnyApiKey || ''} onChange={e=>setSt(s=>({...s, bunnyApiKey:e.target.value}))} placeholder="API key for Stream API" /></div>
            </div>
          </div>

          {/* Supabase Storage Configuration */}
          <div className="rounded-3xl bg-blue-50 border border-blue-200 p-5 space-y-4">
            <h3 className="font-black text-blue-800 flex items-center gap-2"><Database size={16} /> Supabase Storage (Images)</h3>
            <div className="rounded-2xl bg-white p-4 text-sm">
              <p className="font-black text-blue-700">Setup:</p>
              <ol className="list-decimal list-inside space-y-1 text-zinc-600 mt-2">
                <li>Supabase Dashboard → Storage → Create Buckets: <code className="bg-zinc-100 px-1 rounded">images</code> & <code className="bg-zinc-100 px-1 rounded">videos</code></li>
                <li>Buckets ko Public set karo (Settings → Public buckets)</li>
                <li>RLS policies enable karo: <code className="bg-zinc-100 px-1 rounded text-xs">true</code> (open read + insert)</li>
              </ol>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">Image Bucket Name</label>
                <input className="input" value={st.supabaseImageBucket || 'images'} onChange={e=>setSt(s=>({...s, supabaseImageBucket:e.target.value}))} placeholder="images" />
              </div>
              <div>
                <label className="label">Video Fallback Bucket</label>
                <input className="input" value={st.supabaseBucket || 'videos'} onChange={e=>setSt(s=>({...s, supabaseBucket:e.target.value}))} placeholder="videos" />
              </div>
            </div>
          </div>

          <button disabled={saveBusy} type="button" className="save w-full disabled:opacity-60" onClick={() => saveSetting('storage', st)}>
            {saveBusy ? <Loader2 className="animate-spin" size={18} /> : <Save size={16} />} Save Storage Settings
          </button>
        </div>
      )}

      {/* ── PLAYER ── */}
      {tab === 'player' && (
        <div className="panel space-y-4">
          <h2 className="adminh"><Play /> Video Player Settings</h2>
          <div>
            <label className="label">Player Mode</label>
            <select className="input max-w-xs" value={pl.mode || 'default'} onChange={e => setPl((prev: any) => ({ ...prev, mode: e.target.value }))}>
              <option value="default">Default Player (MP4/HLS)</option>
              <option value="bunny">Bunny.net Player (iframe embed)</option>
            </select>
          </div>
          {pl.mode === 'bunny' && (
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="label">Bunny Embed Base URL</label><input className="input" value={pl.bunnyEmbedBase || ''} onChange={e => setPl((prev: any) => ({ ...prev, bunnyEmbedBase: e.target.value }))} placeholder="https://iframe.mediadelivery.net/embed" /></div>
              <div><label className="label">Bunny Library ID</label><input className="input" value={pl.bunnyLibraryId || ''} onChange={e => setPl((prev: any) => ({ ...prev, bunnyLibraryId: e.target.value }))} placeholder="12345" /></div>
            </div>
          )}
          <div className="space-y-2">
            {[['autoplay', 'Autoplay'], ['muted', 'Muted by default'], ['responsive', 'Responsive embed']].map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 font-bold cursor-pointer">
                <input type="checkbox" checked={pl[k] !== false} onChange={e => setPl((prev: any) => ({ ...prev, [k]: e.target.checked }))} className="h-4 w-4" />
                {label}
              </label>
            ))}
          </div>
          <button disabled={saveBusy} className="save disabled:opacity-60" onClick={() => saveSetting('player', pl)}>
            {saveBusy ? <Loader2 className="animate-spin" size={18} /> : <Save size={16} />} Save Player Settings
          </button>
        </div>
      )}

      {tab === 'policies' && <Crud resource="legal_policies" fields={['title', 'type', 'version', 'body']} checks={['is_published']} defaults={{ version: '1.0', is_published: true }} storageConfig={st} />}
      {tab === 'help' && <Crud resource="help_articles" fields={['title', 'body', 'category', 'sort_order']} checks={['is_published']} defaults={{ is_published: true, category: 'General' }} storageConfig={st} />}

      {/* ── JSON BACKUP ── */}
      {tab === 'json' && (
        <div className="panel space-y-4">
          <h2 className="adminh"><FileJson /> JSON Backup / Restore</h2>
          <div className="flex gap-3 flex-wrap">
            <button className="save" onClick={exp}><Download size={16} /> Export Full JSON</button>
            <button className="btn" onClick={() => refresh()}><RefreshCcw size={16} /> Refresh Data</button>
          </div>
          <div>
            <label className="label">Import Resource</label>
            <select className="input max-w-xs" value={importResource} onChange={e => setImportResource(e.target.value)}>
              {resources.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <textarea className="input min-h-56 font-mono text-xs" value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste JSON array or full backup JSON here" />
          <div className="flex gap-2">
            <button className="btn" onClick={() => doImport(true)}>Validate (Dry Run)</button>
            <button className="save" onClick={() => doImport(false)}>Import Data</button>
          </div>
          {importMsg && <pre className="max-h-64 overflow-auto rounded-2xl bg-zinc-950 p-4 text-xs text-green-200">{importMsg}</pre>}
        </div>
      )}
    </main>
  );
}

// ─── VIDEO MANAGER (Professional Upload-based) ────────────────────────────────
function VideoManager({ storage, categories }: { storage: StorageConfig; categories: Category[] }) {
  const { data, mutate } = useApp();
  const [form, setForm] = useState<any>({
    title: '', description: '', series_title: '', episode_number: 1,
    video_filename: '', thumbnail_url: '', bunny_video_id: '', bunny_embed_url: '',
    category: categories[0]?.name || 'Drama', duration_seconds: 0,
    age_rating: 'U/A 13+', is_premium: false, is_published: true
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const rows = data.videos || [];

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title) { setMsg('❌ Title required hai.'); return; }
    setBusy(true); setMsg('');
    try {
      await mutate('videos', form.id ? 'PUT' : 'POST', form);
      setMsg('✅ Video saved!');
      setForm({ title: '', description: '', series_title: '', episode_number: 1, video_filename: '', thumbnail_url: '', bunny_video_id: '', bunny_embed_url: '', category: categories[0]?.name || 'Drama', duration_seconds: 0, age_rating: 'U/A 13+', is_premium: false, is_published: true });
    } catch (e: any) { setMsg('❌ ' + e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[480px_1fr]">
      <form onSubmit={save} className="panel space-y-4">
        <h2 className="adminh"><Video /> {form.id ? 'Edit Video' : 'Upload New Video'}</h2>

        {msg && <div className={`rounded-2xl p-3 text-sm font-bold ${msg.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

        {/* Video Upload */}
        <div className="rounded-3xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
          <h3 className="font-black text-sm flex items-center gap-2"><Upload size={16} /> Video File — {storage.videoProvider === 'bunny' ? '🐰 Bunny.net CDN' : storage.videoProvider === 'supabase' ? '⚡ Supabase' : 'URL only'}</h3>
          {storage.videoProvider !== 'local' ? (
            <FileUploader
              accept="video/*"
              label="Video Upload"
              storage={storage}
              kind="video"
              onUrl={url => setForm((prev: any) => ({ ...prev, video_filename: url }))}
              hint={storage.videoProvider === 'bunny' ? 'Bunny CDN: MP4 best. Auto CDN.' : 'Supabase bucket upload'}
            />
          ) : (
            <p className="text-xs text-zinc-500">Admin → ☁️ Storage tab mein provider configure karein.</p>
          )}
          <div>
            <label className="label">Video URL / Filename</label>
            <input className="input font-mono text-xs" value={form.video_filename || ''} onChange={e => setForm((prev: any) => ({ ...prev, video_filename: e.target.value }))} placeholder="https://... ya filename.mp4" />
          </div>
          <div>
            <label className="label">Bunny Video ID (optional)</label>
            <input className="input" value={form.bunny_video_id || ''} onChange={e => setForm((prev: any) => ({ ...prev, bunny_video_id: e.target.value }))} placeholder="Bunny Stream video ID" />
          </div>
          <div>
            <label className="label">Bunny Embed URL (optional)</label>
            <input className="input" value={form.bunny_embed_url || ''} onChange={e => setForm((prev: any) => ({ ...prev, bunny_embed_url: e.target.value }))} placeholder="https://iframe.mediadelivery.net/embed/..." />
          </div>
        </div>

        {/* Thumbnail Upload */}
        <div className="rounded-3xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
          <h3 className="font-black text-sm flex items-center gap-2"><Image size={16} /> Thumbnail — {storage.imageProvider === 'supabase' ? '⚡ Supabase' : storage.imageProvider === 'bunny' ? '🐰 Bunny' : 'URL'}</h3>
          {storage.imageProvider !== 'local' && (
            <FileUploader
              accept="image/*"
              label="Thumbnail Upload"
              storage={storage}
              kind="image"
              onUrl={url => setForm((prev: any) => ({ ...prev, thumbnail_url: url }))}
              hint="3:4 ratio best. JPG/PNG. Auto → Supabase."
            />
          )}
          <div>
            <label className="label">Thumbnail URL</label>
            <input className="input" value={form.thumbnail_url || ''} onChange={e => setForm((prev: any) => ({ ...prev, thumbnail_url: e.target.value }))} placeholder="https://..." />
          </div>
          {form.thumbnail_url && (
            <img src={form.thumbnail_url} alt="preview" className="h-32 w-24 rounded-2xl object-cover border" />
          )}
        </div>

        {/* Metadata */}
        <div>
          <label className="label">Title *</label>
          <input className="input" value={form.title || ''} onChange={e => setForm((prev: any) => ({ ...prev, title: e.target.value }))} placeholder="Episode title" required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-20" value={form.description || ''} onChange={e => setForm((prev: any) => ({ ...prev, description: e.target.value }))} placeholder="Episode description..." />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Series Title</label>
            <input className="input" value={form.series_title || ''} onChange={e => setForm((prev: any) => ({ ...prev, series_title: e.target.value }))} placeholder="Series name" />
          </div>
          <div>
            <label className="label">Episode Number</label>
            <input className="input" type="number" value={form.episode_number || ''} onChange={e => setForm((prev: any) => ({ ...prev, episode_number: Number(e.target.value) }))} min={1} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category || ''} onChange={e => setForm((prev: any) => ({ ...prev, category: e.target.value }))}>
              {categories.map(c => <option key={c.id}>{c.name}</option>)}
              <option>Drama</option><option>Romance</option><option>Thriller</option><option>Comedy</option><option>Family</option>
            </select>
          </div>
          <div>
            <label className="label">Duration (seconds)</label>
            <input className="input" type="number" value={form.duration_seconds || ''} onChange={e => setForm((prev: any) => ({ ...prev, duration_seconds: Number(e.target.value) }))} min={0} />
          </div>
          <div>
            <label className="label">Age Rating</label>
            <select className="input" value={form.age_rating || ''} onChange={e => setForm((prev: any) => ({ ...prev, age_rating: e.target.value }))}>
              {['U', 'U/A 7+', 'U/A 13+', 'U/A 16+', 'A'].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 font-bold cursor-pointer text-sm">
            <input type="checkbox" checked={!!form.is_premium} onChange={e => setForm((prev: any) => ({ ...prev, is_premium: e.target.checked }))} className="h-4 w-4" />
            Premium Episode
          </label>
          <label className="flex items-center gap-2 font-bold cursor-pointer text-sm">
            <input type="checkbox" checked={!!form.is_published} onChange={e => setForm((prev: any) => ({ ...prev, is_published: e.target.checked }))} className="h-4 w-4" />
            Published
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="save flex-1 disabled:opacity-60">
            {busy ? <Loader2 className="animate-spin" size={18} /> : <Save size={16} />} {form.id ? 'Update Video' : 'Save Video'}
          </button>
          {form.id && <button type="button" onClick={() => setForm({ title: '', description: '', series_title: '', episode_number: 1, video_filename: '', thumbnail_url: '', bunny_video_id: '', bunny_embed_url: '', category: categories[0]?.name || 'Drama', duration_seconds: 0, age_rating: 'U/A 13+', is_premium: false, is_published: true })} className="btn">Cancel</button>}
        </div>
      </form>

      {/* Video List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg">{rows.length} Videos</h3>
        </div>
        <div className="space-y-2 max-h-[80vh] overflow-y-auto pr-1">
          {rows.map((r: any) => (
            <div key={r.id} className="rounded-2xl bg-white shadow-sm p-3 flex items-center gap-3">
              {r.thumbnail_url
                ? <img src={r.thumbnail_url} alt="" className="h-16 w-12 rounded-xl object-cover shrink-0" />
                : <div className="h-16 w-12 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0"><Film size={20} className="text-zinc-300" /></div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-black truncate">{r.title}</p>
                  {r.is_premium && <span className="rounded-full bg-yellow-200 px-2 text-xs font-black">PRO</span>}
                  {r.is_published ? <span className="rounded-full bg-green-100 px-2 text-xs font-black text-green-700">Live</span> : <span className="rounded-full bg-zinc-100 px-2 text-xs font-black text-zinc-500">Draft</span>}
                </div>
                <p className="text-xs text-zinc-500">{r.series_title} · EP {r.episode_number} · {r.category}</p>
                {r.video_filename && <p className="text-xs text-zinc-400 font-mono truncate">{r.video_filename.slice(0, 40)}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setForm(r)} className="rounded-full bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"><Edit3 size={14} /></button>
                <button onClick={() => mutate('videos', 'DELETE', { id: r.id })} className="rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="rounded-3xl bg-white p-10 text-center"><Film className="mx-auto text-zinc-200 mb-3" size={48} /><p className="text-zinc-400">Koi video nahi hai. Upload karein!</p></div>}
        </div>
      </div>
    </div>
  );
}

// ─── CRUD FORM (with file upload support) ────────────────────────────────────
function Crud({
  resource, fields, checks, defaults, storageConfig, imageFields = [], videoFields = []
}: {
  resource: string; fields: string[]; checks?: string[]; defaults?: any;
  storageConfig: StorageConfig; imageFields?: string[]; videoFields?: string[];
}) {
  const { data, mutate } = useApp();
  const [f, setF] = useState<any>(defaults || {});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const rows = data[resource] || [];

  const save = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('');
    try {
      await mutate(resource, f.id ? 'PUT' : 'POST', f);
      setMsg('✅ Saved!');
      setF(defaults || {});
    } catch (e: any) { setMsg('❌ ' + e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr]">
      <form onSubmit={save} className="panel space-y-3">
        <h2 className="adminh"><Edit3 /> {resource}</h2>
        {msg && <div className={`rounded-2xl p-3 text-sm font-bold ${msg.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg}</div>}

        {fields.map(k => {
          if (imageFields.includes(k)) return (
            <div key={k} className="space-y-2">
              <FileUploader accept="image/*" label={k} storage={storageConfig} kind="image" onUrl={url => setF((prev: any) => ({ ...prev, [k]: url }))} hint="Image → Supabase" />
              <input className="input text-xs" value={f[k] || ''} onChange={e => setF((prev: any) => ({ ...prev, [k]: e.target.value }))} placeholder={`${k} URL`} />
              {f[k] && <img src={f[k]} alt="" className="h-24 rounded-xl object-cover border" />}
            </div>
          );
          if (videoFields.includes(k)) return (
            <div key={k} className="space-y-2">
              <FileUploader accept="video/*" label={k} storage={storageConfig} kind="video" onUrl={url => setF((prev: any) => ({ ...prev, [k]: url }))} hint="Video → Bunny CDN" />
              <input className="input text-xs font-mono" value={f[k] || ''} onChange={e => setF((prev: any) => ({ ...prev, [k]: e.target.value }))} placeholder={`${k} URL`} />
            </div>
          );
          return k === 'body' || k === 'description' || k === 'message' || k === 'hero_subtitle'
            ? <textarea key={k} className="input min-h-28" value={f[k] || ''} onChange={e => setF((prev: any) => ({ ...prev, [k]: e.target.value }))} placeholder={k} />
            : <input key={k} className="input" value={f[k] || ''} onChange={e => setF((prev: any) => ({ ...prev, [k]: e.target.value }))} placeholder={k} />;
        })}

        {checks?.map(k => (
          <label key={k} className="flex gap-2 font-bold cursor-pointer text-sm">
            <input type="checkbox" checked={!!f[k]} onChange={e => setF((prev: any) => ({ ...prev, [k]: e.target.checked }))} className="h-4 w-4" />{k}
          </label>
        ))}

        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="save flex-1 disabled:opacity-60">
            {busy ? <Loader2 className="animate-spin" size={18} /> : <Plus size={16} />} Save
          </button>
          {f.id && <button type="button" onClick={() => setF(defaults || {})} className="btn">Cancel</button>}
        </div>
      </form>
      <DataTable resource={resource} rows={rows} onEdit={setF} />
    </div>
  );
}

// ─── DATA TABLE ───────────────────────────────────────────────────────────────
function DataTable({ rows, resource, onEdit }: { rows: Row[]; resource: string; onEdit?: (r: Row) => void }) {
  const { mutate } = useApp();
  const keys = rows[0] ? Object.keys(rows[0]).slice(0, 6) : [];
  return (
    <div className="overflow-auto rounded-[28px] bg-white shadow-sm">
      <table className="min-w-full">
        <thead>
          <tr className="border-b bg-zinc-50">
            <th>ID</th>
            {keys.map(k => <th key={k}>{k}</th>)}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <td className="font-black text-zinc-400">#{r.id}</td>
              {keys.map(k => <td key={k} className="max-w-48 truncate">{typeof r[k] === 'object' ? JSON.stringify(r[k]).slice(0, 40) : String(r[k] ?? '').slice(0, 50)}</td>)}
              <td>
                <div className="flex gap-2">
                  {onEdit && <button onClick={() => onEdit(r)} className="rounded-full bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"><Edit3 size={14} /></button>}
                  <button onClick={() => mutate(resource, 'DELETE', { id: r.id })} className="rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-zinc-400">Koi data nahi hai.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ─── MISC COMPONENTS ──────────────────────────────────────────────────────────
function Stat({ l, v, icon }: { l: string; v: any; icon?: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-zinc-500">{l}</p>
        {icon}
      </div>
      <b className="text-3xl">{v}</b>
    </div>
  );
}

function InfoSection() {
  return (
    <div className="card overflow-hidden md:grid md:grid-cols-[.9fr_1.1fr]">
      <div className="h-72 bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center md:h-auto">
        <Film size={80} className="text-white/20" />
      </div>
      <div className="p-7">
        <p className="font-black text-[var(--rr-accent)]">About ReelRamp</p>
        <h2 className="mt-2 text-3xl font-black">ReelRamp Originals Pvt. Ltd.</h2>
        <p className="mt-3 text-zinc-600">Founder/Director Ayush Jivan — "Kahaniyan sirf sunayi nahi jati, mehsoos ki jati hain."</p>
        <p className="mt-4 text-zinc-600 text-sm">FF Shop No. 6, Arohi Arcade, Munshipulia, Lucknow - 226016 · reelramporiginal@gmail.com · +91 7307493338</p>
        <div className="mt-5 flex gap-3 text-[var(--rr-accent)]"><MessageCircle /><span>FB</span><span>IG</span><span>YT</span></div>
      </div>
    </div>
  );
}

function Empty() { return <div className="card p-10 text-center"><Film className="mx-auto text-[var(--rr-accent)]" size={50} /><h2 className="text-3xl font-black mt-4">No content yet</h2><p className="text-zinc-500 mt-2">Admin panel se videos add karein.</p></div>; }
function Title({ t, s }: { t: string; s: string }) { return <div className="mb-2"><p className="font-black text-[var(--rr-accent)] text-sm">ReelRamp Pro</p><h1 className="text-4xl font-black">{t}</h1><p className="text-zinc-600 text-sm">{s}</p></div>; }

// ─── RR LOGO — Netflix style italic bold ─────────────────────────────────────
function RRLogo({ primary = '#c5a26f', dark = false }: { primary?: string; dark?: boolean }) {
  const textColor = dark ? '#ffffff' : '#18181b';
  return (
    <svg width="72" height="36" viewBox="0 0 72 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left R */}
      <text
        x="2" y="30"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="34"
        fontWeight="900"
        fontStyle="italic"
        fill={primary}
        letterSpacing="-2"
      >R</text>
      {/* Right R — slightly offset for depth */}
      <text
        x="32" y="30"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="34"
        fontWeight="900"
        fontStyle="italic"
        fill={textColor}
        letterSpacing="-2"
      >R</text>
      {/* Bottom accent line — Netflix style */}
      <rect x="2" y="33" width="68" height="3" rx="1.5" fill={primary} />
    </svg>
  );
}

// ─── SHELL ────────────────────────────────────────────────────────────────────
function Shell() {
  const { loading, theme, data, user } = useApp();
  const [tab, setTab] = useState('home');
  const [_historyStack, setHistoryStack] = useState<string[]>(['home']);
  const [exitAsk, setExitAsk] = useState(false);

  const isLoggedIn = !!(user?.email);
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
          const ns = [...prev]; ns.pop();
          setTab(ns[ns.length - 1]);
          history.pushState({ rr: true }, '', location.href);
          return ns;
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
  if (loading) return (
    <div className="grid min-h-screen place-items-center bg-zinc-950">
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <RRLogo primary="#c5a26f" dark={true} />
        </motion.div>
        <Loader2 className="animate-spin text-[#c5a26f] mx-auto" size={28} />
      </div>
    </div>
  );

  const popup = (data.popup_settings || []).find((p: any) => p.enabled);
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
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
          <button onClick={() => go('home')} className="flex items-center gap-2">
            {theme.logoImageUrl ? (
              <img src={theme.logoImageUrl} alt={theme.brand || 'ReelRamp Pro'}
                className="h-9 w-auto max-w-[130px] object-contain"
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <RRLogo primary={theme.primary || '#c5a26f'} />
            )}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => go('search')} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"><Search size={20} /></button>
            <button onClick={() => go('profile')}
              className={`rounded-full px-4 py-2 font-bold text-sm ${isLoggedIn ? 'bg-[var(--rr-primary)] text-black' : 'bg-zinc-950 text-white'}`}>
              {headerName}
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3">
          {[
            { id: 'home', label: 'Home' }, { id: 'forYou', label: 'For You' },
            { id: 'series', label: 'Series' }, { id: 'plans', label: 'Plans' },
            { id: 'wallet', label: 'Wallet' }, { id: 'help', label: 'Help' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => go(id)} className={`pill ${tab === id ? 'active' : ''}`}>{label}</button>
          ))}
        </div>
      </header>

      <NotificationStrip />

      {popup && (
        <div className="mx-auto mt-4 max-w-6xl px-4">
          <div className="rounded-3xl bg-gradient-to-r from-pink-500 to-orange-400 p-4 text-white shadow-lg">
            <b>{popup.title}</b><p>{popup.message}</p>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl p-4 pb-32 md:p-8">{page}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur safe-bottom">
        <div className="mx-auto grid max-w-lg grid-cols-5 p-2">
          {([
            ['home', Home, 'Home'],
            ['forYou', Play, 'Watch'],
            ['plans', Crown, 'Plans'],
            ['wallet', Wallet, 'Wallet'],
            ['profile', User, headerName],
          ] as const).map(([id, Icon, label]) => (
            <button key={id} onClick={() => go(id as string)}
              className={`rounded-2xl p-2 text-xs font-black flex flex-col items-center gap-1 ${tab === id ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-800'}`}>
              <Icon size={20} />
              <span className="truncate max-w-[56px]">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      <footer className="px-4 pb-32 text-center text-sm text-zinc-500">
        <button onClick={() => go('policies')} className="font-bold underline">Legal Policies</button>
        <p className="mt-1">© 2026 ReelRamp Originals Pvt. Ltd.</p>
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

export default function App() {
  return <Provider><Shell /></Provider>;
}
