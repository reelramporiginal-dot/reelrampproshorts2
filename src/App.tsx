import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Crown, Edit3, Gift, Loader2, Lock, Palette, Pause, Play,
  Search, ShieldCheck, User, Wallet, X, CheckCircle2, CreditCard, Sparkles,
  UploadCloud, Image as ImageIcon, Server, Home as HomeIcon, FileText, TrendingUp,
  Users as UsersIcon, DollarSign, Film, Clock, Volume2, VolumeX
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { list, create, update, remove as dbRemove, TABLES } from './lib/db';
import { uploadImage, uploadVideo, storageInfo } from './lib/storage';
import { signInWithGoogle } from './lib/googleAuth';
import { RRLogo, RRLogoHorizontal, RRLogoHero } from './components/Logo';

type Row = { id?: number | string; [k: string]: any };
type Video = Row & { title: string; description: string; series_title: string; episode_number: number; video_filename: string; thumbnail_url: string; is_premium: boolean; is_published: boolean; duration_seconds: number; category: string; bunny_video_id?: string; bunny_embed_url?: string };
type Plan = Row & { name: string; price: number; duration_days: number; features: any; is_active: boolean; sort_order: number; plan_type?: string; supports_autorenew?: boolean; trial_days?: number; cf_plan_id?: string; autopay_amount?: number; autopay_interval?: string };
type UserRow = Row & { guest_id: string; display_name: string; email: string; role: string; is_admin?: boolean; phone?: string; avatar_url?: string; password?: string };
type Subscription = Row & { user_id: string; plan: string; plan_id?: number; status: string; expires_at: string; created_at: string; auto_renew?: boolean; gateway?: string };

type GatewayConfig = { id: string; name: string; type: string; enabled: boolean; isDefault: boolean; testMode: boolean; keys: Record<string,string> };
type PaymentSettings = { gateways: GatewayConfig[]; whatsapp: string; instructions: string; monthlyPrice: number; annualPrice: number };
type BrandSettings = { brand: string; logoText: string; logoImageUrl: string; primary: string; accent: string; bg: string; radius: string };

const CDN = (import.meta.env.VITE_BUNNY_CDN_URL || '').replace(/\/$/, '') + '/';
const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || 'RRPRO2026';

const defaultTheme: BrandSettings = { brand:'ReelRamp Pro', logoText:'RR', logoImageUrl:'', primary:'#c5a26f', accent:'#ff4f8b', bg:'#fff7ed', radius:'30px' };
const defaultPayment: PaymentSettings = { gateways:[], whatsapp:'+917307493338', instructions:'Payment complete karne ke baad UTR WhatsApp par bhejein.', monthlyPrice:99, annualPrice:899 };
const defaultPlayer = { mode:'default', bunnyEmbedBase:'https://iframe.mediadelivery.net/embed', bunnyLibraryId: storageInfo.bunnyLibraryId || '', autoplay:true, muted:false, responsive:true, controls:true };

const money = (n:number) => `₹${Number(n||0).toLocaleString('en-IN')}`;
const ftime = (n:number) => `${Math.floor((n||0)/60)}:${Math.floor((n||0)%60).toString().padStart(2,'0')}`;
const gid = () => `guest_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

const getDisplayName = (u: UserRow | null, fallback='User') => {
  if (!u) return fallback;
  const dn = (u.display_name || '').trim();
  if (dn && !dn.includes('@')) return dn;
  if (u.email) return u.email.split('@')[0].replace(/[._-]/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
  return fallback;
};

/* ─── SMART VIDEO URL RESOLVER ───
   Tries multiple URL patterns automatically when a video fails to load. */
const CDN_HOSTS = [
  'reelrampayush1.b-cdn.net',
  'reelrampayush.b-cdn.net',
  'vz-42dd47a0-93c.b-cdn.net',
];

const encodeName = (s: string): string[] => {
  if (!s) return [];
  const set = new Set<string>([s]);
  set.add(encodeURI(s));
  set.add(encodeURIComponent(s));
  if (s.includes(' ')) set.add(s.replace(/ /g, '%20'));
  if (s.includes('(') || s.includes(')')) set.add(s.replace(/\(/g,'%28').replace(/\)/g,'%29'));
  return Array.from(set);
};

const resolveVideoUrl = (video: any, bunnyCdn: string): string[] => {
  if (!video) return [];
  const fn = String(video.video_filename || '');
  const id = String(video.bunny_video_id || '');
  const cdn = (bunnyCdn || '').replace(/\/$/, '');
  const out: string[] = [];

  if (fn && /^https?:|^blob:|^data:/.test(fn)) encodeName(fn).forEach(u => out.push(u));
  if (fn) encodeName(fn).forEach(v => {
    out.push(`https://storage.bunnycdn.com/reelrampayush/${v}`);
    out.push(`https://storage.bunnycdn.com/${v}`);
  });
  const hosts = new Set<string>();
  if (cdn) hosts.add(cdn);
  CDN_HOSTS.forEach(h => hosts.add('https://' + h));
  if (fn) encodeName(fn).forEach(v => hosts.forEach(host => out.push(`${host}/${v}`)));
  if (id) {
    hosts.forEach(host => out.push(`${host}/${id}`, `${host}/${id}.mp4`, `${host}/play/${id}.mp4`));
    out.push(`https://iframe.mediadelivery.net/play/${id}`);
  }
  return Array.from(new Set(out));
};

type Ctx = {
  data: Record<string, Row[]>;
  videos: Video[]; plans: Plan[];
  user: UserRow | null;
  guestId: string;
  loading: boolean;
  subscribed: boolean;
  activeSub: Subscription | null;
  theme: BrandSettings;
  payment: PaymentSettings;
  player: any;
  refresh: ()=>Promise<void>;
  createRow: (table:string, payload:any)=>Promise<any>;
  updateRow: (table:string, payload:any)=>Promise<any>;
  removeRow: (table:string, match:any)=>Promise<any>;
  notify: (title:string, message:string, type?:'info'|'success'|'warning'|'error')=>void;
};

const AppCtx = createContext<Ctx|null>(null);
const useApp = () => { const c = useContext(AppCtx); if(!c) throw new Error('no ctx'); return c; };

function AppProvider({ children }:{ children:ReactNode }) {
  const [data, setData] = useState<Record<string, Row[]>>({});
  const [user, setUser] = useState<UserRow|null>(null);
  const [loading, setLoading] = useState(true);
  const [localNotifs, setLocalNotifs] = useState<any[]>([]);
  const [guestId] = useState(() => { const s = localStorage.getItem('rr_guest'); if(s) return s; const n = gid(); localStorage.setItem('rr_guest', n); return n; });

  const refresh = useCallback(async () => {
    setLoading(true);
    const out: Record<string, Row[]> = {};
    for (const t of TABLES) out[t] = await list(t) as Row[];
    let u: UserRow | null = null;
    if (isSupabaseConfigured) {
      const { data: { user: au } } = await supabase.auth.getUser();
      if (au?.email) {
        const users = out.users || [];
        u = users.find((x:any) => x.email === au.email || x.guest_id === au.id) as UserRow || null;
        if (!u) {
          u = await create('users', { guest_id: au.id, display_name: au.user_metadata?.full_name || au.email.split('@')[0], email: au.email, role:'viewer' }) as UserRow;
          out.users = [ ...(out.users||[]), u ];
        }
        if (localStorage.getItem('rr_guest') !== au.id) localStorage.setItem('rr_guest', au.id);
      }
    }
    if (!u) {
      const users = out.users || [];
      u = users.find((x:any) => x.guest_id === guestId) as UserRow || null;
      if (!u) {
        u = await create('users', { guest_id: guestId, display_name:`Viewer ${guestId.slice(-4)}`, email:'', role:'viewer' }) as UserRow;
        out.users = [ ...(out.users||[]), u ];
      }
    }
    setUser(u);
    setData(out);
    setLoading(false);
  }, [guestId]);

  useEffect(()=>{ refresh(); }, [refresh]);

  // Handle Cashfree subscription/order return URL — confirm pending subscriptions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cfSubId = params.get('cf_sub_id');
    const cfOrderId = params.get('cf_order_id');
    if (cfSubId || cfOrderId) {
      // Mark pending subscription as active
      (async () => {
        const subs = await list('subscriptions');
        const pending = subs.find((s:any)=> s.cf_subscription_id === cfSubId && s.status === 'pending');
        if (pending) {
          await update('subscriptions', { id: pending.id, status: 'active' });
          await create('payments', { user_id: pending.user_id, plan: pending.plan, amount: 1, gateway:'Cashfree', status:'success', transaction_id: cfSubId || cfOrderId, notes:'Auto-pay trial activated' });
        }
        window.history.replaceState({}, '', window.location.pathname);
        refresh();
      })();
    }
  }, []);

  useEffect(()=>{
    if (!isSupabaseConfigured) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e: any, session: any)=>{
      if (session?.user) { localStorage.setItem('rr_guest', session.user.id); refresh(); }
    });
    return ()=>subscription.unsubscribe();
  }, [refresh]);

  const createRow = useCallback(async (table:string, payload:any) => {
    const r = await create(table, payload); await refresh(); return r;
  }, [refresh]);
  const updateRow = useCallback(async (table:string, payload:any) => {
    const r = await update(table, payload); await refresh(); return r;
  }, [refresh]);
  const removeRow = useCallback(async (table:string, match:any)=>{
    await dbRemove(table, match); await refresh();
  }, [refresh]);

  const notify = useCallback((title:string, message:string, type:'info'|'success'|'warning'|'error'='info')=>{
    setLocalNotifs(n => [{ id: Date.now()+Math.random(), title, message, type, is_active:true }, ...n].slice(0,6));
  }, []);

  const adminSettings = (data.admin_settings||[]);
  const theme = useMemo(()=>({ ...defaultTheme, ...(adminSettings.find((a:any)=>a.key==='theme')?.value || {}) }), [adminSettings]);
  const payment = useMemo(()=>{
    const raw = adminSettings.find((a:any)=>a.key==='payment')?.value;
    return raw && Array.isArray(raw.gateways) ? { ...defaultPayment, ...raw } : defaultPayment;
  }, [adminSettings]);
  const player = useMemo(()=>({ ...defaultPlayer, ...(adminSettings.find((a:any)=>a.key==='player')?.value || {}) }), [adminSettings]);

  const allSubs = (data.subscriptions||[]) as Subscription[];
  const activeSub = allSubs.find(s=> s.user_id === (user?.guest_id||guestId) && s.status==='active' && new Date(s.expires_at).getTime() > Date.now()) || null;
  const subscribed = !!activeSub;

  const mergedData = useMemo(()=>({ ...data, notifications: [...(localNotifs), ...(data.notifications||[])] }), [data, localNotifs]);

  return <AppCtx.Provider value={{
    data: mergedData, videos: (data.videos||[]) as Video[], plans: (data.plans||[]) as Plan[],
    user, guestId: user?.guest_id || guestId, loading, subscribed, activeSub,
    theme, payment, player, refresh,
    createRow, updateRow, removeRow, notify
  }}>{children}</AppCtx.Provider>;
}

function UploadField({ label, value, onChange, accept, kind } : { label:string; value:string; onChange:(url:string, meta?:any)=>void; accept:string; kind:'image'|'video' }) {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState('');
  const pick = async (file: File) => {
    setBusy(true); setPct(0); setErr('');
    try {
      if (kind==='image') {
        const r = await uploadImage(file);
        onChange(r.url, r);
      } else {
        const r = await uploadVideo(file, p=>setPct(p));
        onChange(r.url, r);
      }
    } catch (e: any) {
      setErr(e?.message || 'Upload failed');
    } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2">
      <label className="text-xs font-black text-zinc-600">{label}</label>
      <div className="flex items-center gap-2">
        <input className="input flex-1" placeholder="https://…  ya file upload karein" value={value||''} onChange={e=>onChange(e.target.value)} />
        <label className="cursor-pointer rounded-full bg-zinc-950 px-4 py-3 text-sm font-black text-white">
          <input type="file" accept={accept} hidden onChange={e=> e.target.files?.[0] && pick(e.target.files[0])} />
          {busy ? (kind==='video' ? pct+'%' : <Loader2 size={16} className="animate-spin" />) : <UploadCloud size={16} />}
        </label>
      </div>
      {err && <div className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-lg">⚠ {err}</div>}
      {value ? <div className="text-xs text-green-700 font-bold truncate">✓ {value.startsWith('http') ? 'Cloud URL' : 'Local'}: {value.slice(0,90)}</div> : null}
      {value && kind==='image' && value.startsWith('http') && <img src={value} alt="" className="h-20 w-28 rounded-xl object-cover border" />}
    </div>
  );
}

function Player({ video, onNext, onBack }:{ video: Video; onNext: ()=>void; onBack?: ()=>void }) {
  const { subscribed, player } = useApp();
  const ref = useRef<HTMLVideoElement|null>(null);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);
  const [errMsg, setErrMsg] = useState('');
  const [triedIdx, setTriedIdx] = useState(0);
  const urls = useMemo(() => resolveVideoUrl(video, CDN), [video?.id, video?.video_filename, video?.bunny_video_id, CDN]);

  useEffect(() => {
    setErrMsg(''); setTriedIdx(0); setCur(0); setDur(0); setPlaying(false);
    if (ref.current) ref.current.load();
  }, [video?.id]);

  // HARD PAYWALL: bina subscribe ke koi video nahi (premium ya free)
  const locked = !subscribed;

  if (player.mode === 'bunny' && (video.bunny_embed_url || video.bunny_video_id) && subscribed) {
    const src = video.bunny_embed_url || `https://iframe.mediadelivery.net/embed/${player.bunnyLibraryId}/${video.bunny_video_id}?autoplay=true`;
    return (
      <div className="relative mx-auto h-[76vh] max-h-[820px] min-h-[540px] w-full max-w-[420px] overflow-hidden rounded-[34px] bg-black text-white shadow-2xl">
        <iframe src={src} className="h-full w-full border-0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center gap-3">
            {onBack && <button onClick={onBack} className="pointer-events-auto rounded-full bg-white/10 p-2"><ArrowLeft size={18}/></button>}
            <div className="min-w-0"><div className="truncate font-black">{video.title}</div><div className="text-xs text-amber-300">EP {video.episode_number}</div></div>
          </div>
        </div>
      </div>
    );
  }

  if (locked) return (
    <div className="relative mx-auto grid h-[76vh] max-h-[820px] min-h-[540px] w-full max-w-[420px] place-items-center overflow-hidden rounded-[34px] bg-zinc-950 text-white">
      {video.thumbnail_url && <img src={video.thumbnail_url} className="absolute inset-0 h-full w-full object-cover opacity-25 blur-sm" alt="" />}
      <div className="relative text-center p-8 space-y-3">
        <Lock size={52} className="mx-auto text-amber-400" />
        <div className="text-2xl font-black">Subscribe karke dekhein</div>
        <div className="opacity-70">Saari dramas unlock karne ke liye plan lein.</div>
        <button onClick={()=>window.dispatchEvent(new CustomEvent('rr-go-plans'))} className="rounded-full bg-[var(--rr-accent)] px-6 py-3 font-black text-white inline-flex items-center gap-2">
          <Crown size={18}/> View Plans
        </button>
      </div>
    </div>
  );

  const currentSrc = urls[triedIdx] || '';

  return (
    <div className="relative mx-auto h-[76vh] max-h-[820px] min-h-[540px] w-full max-w-[420px] overflow-hidden rounded-[34px] bg-black text-white shadow-2xl">
      <video ref={ref} src={currentSrc} poster={video.thumbnail_url} playsInline className="h-full w-full object-cover"
        onLoadedMetadata={e=>setDur(e.currentTarget.duration||video.duration_seconds||0)}
        onTimeUpdate={e=>setCur(e.currentTarget.currentTime)}
        onEnded={()=>onNext()}
        onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}
        onError={() => {
          if (triedIdx < urls.length - 1) setTriedIdx(i => i + 1);
          else setErrMsg(`Tried ${urls.length} URLs — none worked`);
        }}
      />
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent p-4 flex items-center gap-3">
        {onBack && <button onClick={onBack} className="rounded-full bg-white/10 p-2"><ArrowLeft size={18} /></button>}
        <div className="min-w-0"><div className="truncate font-black">{video.title}</div><div className="text-xs text-amber-300">{video.series_title} · EP {video.episode_number}</div></div>
      </div>
      {errMsg ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-black/85 p-6 text-center">
          <div className="max-w-xs space-y-2">
            <div className="text-5xl">🎬</div>
            <div className="text-lg font-black">Video play nahi ho rahi</div>
            <div className="text-xs text-zinc-400">{errMsg}</div>
            <div className="text-[10px] text-zinc-500 break-all bg-zinc-900 p-2 rounded">{currentSrc || '(empty)'}</div>
            <button onClick={()=>{ setTriedIdx(0); setErrMsg(''); if (ref.current) ref.current.load(); }} className="rounded-full bg-white text-black px-4 py-2 text-xs font-black">Retry</button>
          </div>
        </div>
      ) : !playing ? (
        <button onClick={()=>ref.current?.play().catch(()=>{})} className="absolute inset-0 grid place-items-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-black"><Play size={36} /></span>
        </button>
      ) : null}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="h-1 rounded bg-white/20 mb-2"><div className="h-full rounded bg-amber-400" style={{ width: `${dur? (cur/dur*100):0}%` }} /></div>
        <div className="flex items-center gap-3 text-sm font-bold">
          <button className="rounded-full bg-amber-400 text-black px-3 py-2" onClick={()=> playing ? ref.current?.pause() : ref.current?.play()}>{playing ? <Pause size={18}/> : <Play size={18}/>}</button>
          <span className="tabular-nums">{ftime(cur)} / {ftime(dur)}</span>
          <button className="ml-auto rounded-full bg-white/10 px-3 py-2" onClick={()=>{ if(ref.current) ref.current.currentTime = Math.max(0, ref.current.currentTime - 10); }}>-10</button>
          <button className="rounded-full bg-white/10 px-3 py-2" onClick={()=>{ if(ref.current) ref.current.currentTime = Math.min(dur, ref.current.currentTime + 10); }}>+10</button>
          <button className="rounded-full bg-white/10 px-3 py-2" onClick={onNext}>Next</button>
        </div>
      </div>
    </div>
  );
}

const Card: any = (p:any) => <div {...p} className={"rounded-[28px] bg-white shadow-[0_10px_40px_rgba(0,0,0,.06)] "+(p.className||"")} />;
const Btn = (p:any) => <button {...p} className={"rounded-full bg-[var(--rr-primary)] px-5 py-3 font-black text-black disabled:opacity-60 "+(p.className||"")} />;
const Pill = ({ active, className='', ...p }:any) => <button {...p} className={"rounded-full px-4 py-2 font-bold text-sm "+(active ? "bg-zinc-950 text-white" : "bg-white shadow-sm")+" "+className} />;

function HomePage({ go }:{ go:(t:string)=>void }) {
  const { videos, data } = useApp();
  const banners = data.banners || [];
  const hero:any = banners.find((b:any)=>b.is_active) || {};
  return (
    <section className="space-y-8">
      <div className="relative overflow-hidden rounded-[36px] bg-zinc-950 text-white shadow-2xl md:grid md:grid-cols-[1.1fr_.9fr]">
        <div className="p-8 md:p-12 relative">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-amber-300">ReelRamp Originals</span>
          <h1 className="mt-4 text-4xl md:text-6xl font-black leading-tight">{hero.title || 'Mobile-first premium stories'}</h1>
          <p className="mt-3 text-white/75 max-w-xl">{hero.subtitle || 'Short episodes, cinematic feel, instant streaming.'}</p>
          <div className="mt-5 flex gap-3 flex-wrap">
            <Btn onClick={()=>go('forYou')}>{hero.cta_label || 'Start Watching'}</Btn>
            <button onClick={()=>go('plans')} className="rounded-full border border-white/15 bg-white/10 px-5 py-3 font-black">View Plans</button>
          </div>
        </div>
        <div className="relative min-h-[360px]">
          <img src={hero.image_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop'} className="absolute inset-0 h-full w-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent md:bg-gradient-to-r md:from-zinc-950 md:to-transparent" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-black mb-3">Trending</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {videos.filter((v:any)=>v.is_published).slice(0,12).map((v:any)=>(
            <button key={v.id} onClick={()=>go('forYou')} className="w-52 shrink-0 text-left">
              <Card className="overflow-hidden">
              <div className="relative aspect-[3/4] bg-zinc-200">
                <img src={v.thumbnail_url || 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=600&q=80&auto=format&fit=crop'} className="h-full w-full object-cover" alt="" />
                {v.is_premium && <span className="absolute right-2 top-2 rounded-full bg-yellow-300 px-2 py-1 text-xs font-black text-black">PRO</span>}
                <span className="absolute left-2 bottom-2 grid h-10 w-10 place-items-center rounded-full bg-white"><Play size={16}/></span>
              </div>
              <div className="p-3">
                <div className="text-xs font-black text-[var(--rr-accent)]">{v.series_title}</div>
                <div className="font-black line-clamp-2">{v.title}</div>
              </div>
              </Card>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForYou() {
  const { videos } = useApp();
  const [cat, setCat] = useState('All');
  const [idx, setIdx] = useState(0);
  const cats = useMemo(()=> ['All', ...Array.from(new Set(videos.map((v:any)=>v.category).filter(Boolean))) ] , [videos]);
  const list = useMemo(()=> videos.filter((v:any)=>v.is_published && (cat==='All' || v.category===cat)), [videos, cat]);
  const v = list[idx] || list[0];
  useEffect(()=>{ setIdx(0); }, [cat]);
  if (!v) return <Card className="p-10 text-center">No videos yet — add from Admin → Videos.</Card>;
  const next = ()=> setIdx(i=> list.length ? (i+1)%list.length : 0);
  const prev = ()=> setIdx(i=> list.length ? (i-1+list.length)%list.length : 0);
  return (
    <section className="mx-auto w-full max-w-6xl grid gap-5 lg:grid-cols-[420px_minmax(280px,1fr)]">
      <div>
        <div className="mb-3 flex gap-2 overflow-x-auto"><Pill active={cat==='All'} onClick={()=>setCat('All')}>All</Pill>{cats.slice(1).map((c:any)=> <Pill key={c} active={cat===c} onClick={()=>setCat(c)}>{c}</Pill>)}</div>
        <Player video={v} onNext={next} onBack={prev} />
      </div>
      <aside className="space-y-4">
        <Card className="p-5">
          <div className="text-[var(--rr-accent)] font-black">{v.series_title}</div>
          <h2 className="text-3xl font-black">{v.title}</h2>
          <p className="text-zinc-600 mt-2">{v.description}</p>
          <div className="mt-3 flex gap-2">
            <Pill onClick={prev}>Previous</Pill>
            <Pill active onClick={next}>Next</Pill>
          </div>
        </Card>
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {list.map((e:any,i:number)=>(
            <button key={e.id} onClick={()=>setIdx(i)} className={"w-full rounded-2xl p-3 text-left font-bold "+(i===idx ? "bg-zinc-950 text-white":"bg-white shadow-sm")}>EP {e.episode_number}: {e.title}</button>
          ))}
        </div>
      </aside>
    </section>
  );
}

declare global { interface Window { Razorpay: any; Cashfree: any } }
function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}
function loadCashfreeScript(testMode = true): Promise<boolean> {
  if (window.Cashfree) return Promise.resolve(true);
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src = testMode ? 'https://sdk.cashfree.com/js/v3/cashfree.js' : 'https://sdk.cashfree.com/js/v3/cashfree.js';
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

function Plans() {
  const { plans, payment, createRow, user, guestId, subscribed, notify } = useApp();
  const [openPlan, setOpenPlan] = useState<Plan|null>(null);
  const [busy, setBusy] = useState(false);
  const [txId, setTxId] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [err, setErr] = useState('');
  const [paymentDone, setPaymentDone] = useState(false);

  const gw = payment.gateways.find(g=>g.enabled && g.isDefault) || payment.gateways.find(g=>g.enabled);

  // Promo "Start Trial" se direct trial plan ka payment modal khulta hai
  useEffect(() => {
    // Check pending plan (set by promo before tab switch)
    const pending = (window as any).__rrPendingPlan;
    if (pending != null) {
      const p = plans.find((x:any) => x.id === pending);
      if (p) { setOpenPlan(p); setErr(''); setTxId(''); setPaymentDone(false); }
      (window as any).__rrPendingPlan = null;
    }
    const h = (e: any) => {
      const planId = e?.detail?.planId;
      const p = plans.find((x:any) => x.id === planId);
      if (p) { setOpenPlan(p); setErr(''); setTxId(''); setPaymentDone(false); }
    };
    window.addEventListener('rr-open-plan', h);
    return () => window.removeEventListener('rr-open-plan', h);
  }, [plans]);

  const activateSubscription = async (plan: Plan, gatewayName: string, transactionId?: string, autoRenew = false, cfSubId?: string) => {
    const expiresAt = new Date(Date.now()+ plan.duration_days*86400000).toISOString();
    await createRow('payments', { user_id: guestId, plan_id: plan.id, amount: plan.price, gateway: gatewayName, status:'success', transaction_id: transactionId || `txn_${Date.now()}`, notes: autoRenew ? 'Trial + Auto-pay' : '' });
    await createRow('subscriptions', { user_id: guestId, plan: plan.name, plan_id: plan.id, status:'active', expires_at: expiresAt, gateway: gatewayName, auto_renew: autoRenew, cf_subscription_id: cfSubId || null, renewal_date: expiresAt });
    if (phone && user?.id) try { await update('users', { id: user.id, phone }); } catch {}
    notify('Plan Activated! 🎉', autoRenew ? `${plan.name} active! ${plan.trial_days || 1} din baad auto-pay shuru hoga.` : `${plan.name} — ${plan.duration_days} din ke liye active.`, 'success');
    setPaymentDone(true);
  };

  // Cashfree Auto-Pay (Subscription/Mandate) — KukuFM style
  const processCashfreeAutoPay = async (plan: Plan, gw: GatewayConfig) => {
    if (!phone.trim() || phone.length < 10) { setErr('Valid 10-digit mobile number daalo'); return; }
    const cfLoaded = await loadCashfreeScript(gw.testMode);
    if (!cfLoaded || !window.Cashfree) { setErr('Cashfree SDK load nahi hua.'); return; }

    const res = await fetch('/api/cashfree-create-subscription', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: gw.keys.appId, secretKey: gw.keys.secretKey, testMode: gw.testMode,
        planName: plan.name,
        trialAmount: plan.price,                              // ₹1 today
        recurringAmount: plan.autopay_amount || plan.price,  // ₹399 later
        intervalType: plan.autopay_interval || 'MONTH',
        intervals: 1,
        trialDays: plan.trial_days || 1,
        userId: guestId, userName: getDisplayName(user),
        userEmail: user?.email || `${guestId}@reelramp.com`, userPhone: phone
      })
    });
    const data = await res.json().catch(() => ({}));
    if (data.error) { setErr('Cashfree Auto-Pay: ' + data.error + ' (Cashfree me Subscriptions/eMandate enable hona chahiye)'); console.error(data.details); setBusy(false); return; }

    // If Cashfree returns an auth link, redirect there for mandate approval
    if (data.auth_link) {
      // Save pending subscription locally so we can confirm on return
      await createRow('subscriptions', {
        user_id: guestId, plan: plan.name, plan_id: plan.id, status:'pending',
        expires_at: new Date(Date.now() + (plan.trial_days||1)*86400000).toISOString(),
        gateway:'Cashfree', auto_renew:true, cf_subscription_id: data.subscription_id
      });
      window.location.href = data.auth_link;
      return;
    }

    // If subscription_session_id is returned, use SDK checkout
    if (data.subscription_session_id) {
      const cf = new window.Cashfree({ mode: gw.testMode ? 'sandbox' : 'production' });
      cf.subscriptionsCheckout
        ? cf.subscriptionsCheckout({ subscriptionSessionId: data.subscription_session_id, redirectTarget: '_modal' })
        : (window.location.href = data.auth_link || '/');
      // Activate optimistically (webhook will confirm)
      await activateSubscription(plan, 'Cashfree', data.subscription_id, true, data.subscription_id);
      return;
    }

    setErr('Auto-pay setup nahi hua. Cashfree me Subscriptions enable karein.');
  };

  const processRazorpay = (plan: Plan, gw: GatewayConfig) => {
    const rzp = new window.Razorpay({
      key: gw.keys.keyId, amount: Math.round(plan.price * 100), currency: 'INR',
      name: 'ReelRamp Pro', description: plan.name,
      prefill: { name: getDisplayName(user), email: user?.email || '', contact: phone },
      theme: { color: '#c5a26f' },
      handler: async (response: any) => { await activateSubscription(plan, 'Razorpay', response.razorpay_payment_id); },
      modal: { ondismiss: () => { setErr('Payment cancel ho gaya'); } }
    });
    rzp.on('payment.failed', (resp: any) => setErr(resp.error?.description || 'Payment failed'));
    rzp.open();
  };

  const handlePay = async (plan: Plan) => {
    setErr(''); setBusy(true); setPaymentDone(false);
    try {
      if (!gw) { setErr('Payment gateway configured nahi hai. Admin → Gateways mein add karein.'); return; }
      if (gw.type === 'Razorpay') {
        const loaded = await loadRazorpayScript();
        if (!loaded) { setErr('Razorpay SDK load nahi hua.'); return; }
        processRazorpay(plan, gw);
        return;
      }
      if (gw.type === 'Cashfree') {
        if (!phone.trim() || phone.length < 10) { setErr('Valid 10-digit mobile number daalo'); return; }

        // AUTO-PAY flow: if plan supports auto-renew, create a subscription (mandate)
        if (plan.supports_autorenew) {
          await processCashfreeAutoPay(plan, gw);
          return;
        }

        // 1) Load Cashfree SDK
        const cfLoaded = await loadCashfreeScript(gw.testMode);
        if (!cfLoaded || !window.Cashfree) { setErr('Cashfree SDK load nahi hua. Internet check karo.'); return; }
        // 2) Create order via backend API (Vercel serverless function)
        const apiUrl = '/api/cashfree-create-order';
        const orderRes = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: gw.keys.appId,
            secretKey: gw.keys.secretKey,
            testMode: gw.testMode,
            amount: plan.price,
            planName: plan.name,
            userId: guestId,
            userName: getDisplayName(user),
            userEmail: user?.email || `${guestId}@reelramp.com`,
            userPhone: phone
          })
        });
        const orderData = await orderRes.json().catch(() => ({}));
        // Backend always returns 200 now; check for error field
        if (orderData.error) {
          setErr('Cashfree: ' + orderData.error);
          console.error('Cashfree details:', orderData.details);
          return;
        }
        if (!orderData.payment_session_id) {
          setErr('payment_session_id nahi mila. App ID/Secret check karo, Sandbox OFF karo (production keys).');
          return;
        }
        // 3) Open Cashfree checkout modal
        const cf = new window.Cashfree({ mode: gw.testMode ? 'sandbox' : 'production' });
        cf.checkout({
          paymentSessionId: orderData.payment_session_id,
          redirectTarget: '_modal',
          onSuccess: async (data: any) => {
            const pid = data?.transaction?.transactionId || orderData.order_id;
            await activateSubscription(plan, 'Cashfree', pid);
            setBusy(false);
          },
          onFailure: (data: any) => {
            setErr(data?.transaction?.txMsg || 'Payment fail ho gaya. Dobara try karo.');
            setBusy(false);
          },
          onClose: () => {
            if (!paymentDone) setErr('Payment window band ho gayi.');
            setBusy(false);
          }
        });
        return;
      }
      if (gw.type === 'UPI Manual') {
        if (!txId.trim()) { setErr('UTR / Transaction ID daalein'); return; }
        await createRow('payments', { user_id: guestId, plan_id: plan.id, amount: plan.price, gateway: gw.name, status:'pending', transaction_id: txId, notes:'UPI Manual — admin verification needed' });
        notify('Payment Submitted', `UTR ${txId} saved. Admin verification ke baad activate hoga.`, 'info');
        setPaymentDone(true); return;
      }
      await activateSubscription(plan, gw.name);
    } finally { setBusy(false); }
  };

  const closeModal = () => { setOpenPlan(null); setErr(''); setTxId(''); setPaymentDone(false); };

  return (
    <section className="space-y-5">
      <h1 className="text-4xl font-black">Plans</h1>
      {subscribed && <div className="rounded-3xl bg-green-100 text-green-800 p-4 font-black flex items-center gap-2"><CheckCircle2 size={18}/> Premium Active</div>}
      {!gw && <div className="rounded-3xl bg-amber-50 text-amber-700 p-4 font-bold text-sm flex items-center gap-2"><Server size={16}/> Payment gateway not configured — Admin → Gateways mein add karein.</div>}
      <div className="grid gap-4 md:grid-cols-3">
        {plans.filter(p=>p.is_active).sort((a,b)=>a.sort_order-b.sort_order).map(p=>(
          <Card key={p.id} className="p-6 flex flex-col">
            <Crown className="text-amber-500" />
            <div className="text-2xl font-black mt-2">{p.name}</div>
            <div className="text-4xl font-black">{money(p.price)}</div>
            <div className="text-zinc-500">{p.duration_days} days</div>
            {p.trial_days ? <div className="text-green-600 text-sm font-bold mt-1">✨ {p.trial_days} din ₹{p.price} trial</div> : null}
            {p.supports_autorenew ? <div className="text-zinc-400 text-xs mt-1">Auto-pays {money(p.autopay_amount || p.price)} every {p.autopay_interval?.toLowerCase() || 'month'}, cancel anytime</div> : null}
            <button className="rounded-full bg-zinc-950 text-white py-3 font-black mt-4" onClick={()=>setOpenPlan(p)}>{p.supports_autorenew ? 'Start Trial →' : 'Select Plan'}</button>
          </Card>
        ))}
      </div>

      <AnimatePresence>
        {openPlan &&
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={closeModal}>
            <motion.div onClick={e=>e.stopPropagation()} initial={{scale:.94,y:24}} animate={{scale:1,y:0}} exit={{scale:.94,y:24}} className="w-full max-w-sm rounded-[30px] bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="text-xl font-black">{openPlan.name}</div>
                <button onClick={closeModal} className="rounded-full bg-zinc-100 p-2"><X size={16}/></button>
              </div>
              {paymentDone ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 size={48} className="mx-auto text-green-500" />
                  <div className="text-2xl font-black">{gw?.type === 'UPI Manual' ? 'Payment Submitted!' : 'Plan Activated!'}</div>
                  <p className="text-zinc-600 text-sm">{gw?.type === 'UPI Manual' ? `UTR ${txId} — admin verification ke baad premium activate hoga.` : `${openPlan.name} active ho gaya!`}</p>
                  {gw?.type === 'UPI Manual' && payment.whatsapp && <a href={`https://wa.me/${payment.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-3 text-sm font-black text-white">WhatsApp pe confirm karein</a>}
                  <button onClick={closeModal} className="btn w-full rounded-full bg-[var(--rr-primary)] px-5 py-3 font-black mt-3">Done ✓</button>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-black mt-2">{money(openPlan.price)} <span className="text-sm text-zinc-500 font-bold">/ {openPlan.duration_days} din</span></div>
                  {err && <div className="mt-3 rounded-2xl bg-red-50 text-red-700 p-3 text-sm font-bold">{err}</div>}
                  <div className="mt-4 space-y-3">
                    {gw?.type === 'Razorpay' && (
                      <div><label className="text-xs font-black text-zinc-600">Mobile</label>
                      <input className="input" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="10-digit mobile" /></div>
                    )}
                    {gw?.type === 'UPI Manual' && (
                      <div className="space-y-2">
                        {gw.keys.upiQr && <img src={gw.keys.upiQr} className="h-40 w-40 rounded-2xl border mx-auto object-contain" alt="UPI QR" />}
                        {gw.keys.upiId && <div className="text-sm font-bold mt-2 text-center">UPI: {gw.keys.upiId}</div>}
                        {payment.instructions && <div className="text-xs text-zinc-500">{payment.instructions}</div>}
                        <input className="input mt-2" value={txId} onChange={e=>setTxId(e.target.value)} placeholder="UTR / Transaction ID" />
                      </div>
                    )}
                    <Btn disabled={busy} onClick={()=>handlePay(openPlan)} className="w-full">{busy ? <Loader2 className="animate-spin mx-auto" size={18}/> : (gw ? `Pay ${money(openPlan.price)} via ${gw.name}` : 'Pay Now')}</Btn>
                    {payment.whatsapp && <a href={`https://wa.me/${payment.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="block text-center text-sm font-bold text-green-600">Need help? WhatsApp</a>}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
    </section>
  );
}

function ProfilePage() {
  const { user, guestId, subscribed, createRow, updateRow, refresh } = useApp();
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState(isSignup ? '' : getDisplayName(user));
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // When user changes (login/logout), reset name to display
  useEffect(() => {
    if (!isSignup) setName(getDisplayName(user));
  }, [user?.id, isSignup]);

  useEffect(()=>{ setName(getDisplayName(user)); setEmail(user?.email||''); setPhone(user?.phone||''); }, [user?.id]);

  const doAuth = async (signup=false) => {
    setBusy(true); setMsg('');
    try {
      const finalName = (name || '').trim() || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      if (isSupabaseConfigured) {
        if (signup) {
          // 1) Sign up with metadata so display_name is in auth row
          const { data: signupData, error: signupErr } = await supabase.auth.signUp({
            email, password,
            options: { data: { display_name: finalName, full_name: finalName } }
          });
          if (signupErr) { setMsg(signupErr.message); return; }
          // 2) Immediately upsert our users table row
          const uid = signupData.user?.id || gid();
          await createRow('users', {
            guest_id: uid, display_name: finalName, email, role: 'viewer', phone: ''
          }).catch(() => {});
          // 3) If auto-confirm is on, session exists — set guest id
          if (signupData.session) {
            localStorage.setItem('rr_guest', uid);
            setMsg('Account created & signed in!');
            await refresh();
            return;
          }
          setMsg('Account created! Check email for confirmation, then sign in.');
          return;
        } else {
          const { data: signinData, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) { setMsg(error.message); return; }
          const uid = signinData.user?.id || gid();
          // Upsert / update display_name in our users table
          const allUsers = await list('users');
          const existing = allUsers.find((u:any) => u.email === email || u.guest_id === uid);
          if (existing) {
            // Update display_name ONLY if user explicitly typed a new one
            const currentName = getDisplayName(existing as any);
            if (name.trim() && name.trim() !== currentName) {
              await updateRow('users', { id: existing.id, display_name: finalName });
            }
          } else {
            await createRow('users', {
              guest_id: uid, display_name: finalName, email, role: 'viewer', phone: ''
            }).catch(() => {});
          }
          localStorage.setItem('rr_guest', uid);
          setMsg('Signed in!');
          await refresh();
          return;
        }
      }

      // Local (non-Supabase) auth fallback
      const users = await list('users');
      if (signup) {
        if (users.find((u:any)=>u.email===email)) { setMsg('Email already used'); return; }
        await createRow('users', { guest_id: gid(), display_name: finalName, email, password, role:'viewer' });
        setMsg('Local account created. Now sign in.');
      } else {
        const u = users.find((u:any)=> u.email===email && u.password===password);
        if (!u) { setMsg('Invalid email / password'); return; }
        localStorage.setItem('rr_guest', u.guest_id); location.reload();
      }
    } finally { setBusy(false); }
  };

  const saveProfile = async () => {
    if (!user) return;
    await updateRow('users', { id: user.id, display_name: name, email, phone });
    setMsg('Profile saved.');
  };
  const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    localStorage.removeItem('rr_guest'); location.href = '/';
  };
  const isLoggedIn = !!(user?.email);

  return (
    <section className="space-y-6">
      <Card className="overflow-hidden md:grid md:grid-cols-[1.1fr_.9fr]">
        <div className="bg-zinc-950 text-white p-7 md:p-10">
          <p className="inline-flex items-center gap-2 text-amber-300 text-sm font-black"><ShieldCheck size={16}/> Secure Account</p>
          <h1 className="text-4xl font-black mt-3">{isLoggedIn ? `Namaste, ${getDisplayName(user).split(' ')[0]}!` : 'Member Login'}</h1>
          <p className="opacity-80 mt-2">Premium kahaniyan resume karein, progress sync rakhein.</p>
          <div className="mt-5 grid grid-cols-3 gap-3 max-w-md text-sm">
            <div className="rounded-2xl bg-white/10 p-3 font-bold">{subscribed ? 'Premium' : 'Free'}<small className="block opacity-70">Plan</small></div>
            <div className="rounded-2xl bg-white/10 p-3 font-bold">HD<small className="block opacity-70">Quality</small></div>
            <div className="rounded-2xl bg-white/10 p-3 font-bold">Fast<small className="block opacity-70">CDN</small></div>
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-200"><User/></span>
            <div><div className="text-xl font-black">{getDisplayName(user)}</div><div className="text-sm text-zinc-500">{user?.email || 'Guest mode'}</div></div>
          </div>
          {!isLoggedIn && <>
            {!isSignup && <input className="input mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" />}
            {isSignup && <>
              <input className="input mb-2" placeholder="Apna naam (Display name)" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" autoFocus />
              <input className="input mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" />
            </>}
            <input type="password" className="input mb-2" placeholder="Password (6+ characters)" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={isSignup ? 'new-password' : 'current-password'} />
            <div className="grid grid-cols-2 gap-2">
              {!isSignup && <Btn disabled={busy} onClick={()=>doAuth(false)}>{busy ? <Loader2 className="animate-spin mx-auto" size={18}/> : 'Sign In'}</Btn>}
              {isSignup && <Btn disabled={busy} onClick={()=>doAuth(true)}>{busy ? <Loader2 className="animate-spin mx-auto" size={18}/> : 'Create Account'}</Btn>}
              <button disabled={busy} onClick={()=>{ setIsSignup(!isSignup); setMsg(''); setName(isSignup ? getDisplayName(user) : ''); }} className="rounded-full bg-zinc-950 text-white px-5 py-3 font-black">
                {isSignup ? 'Already have account?' : 'Create New'}
              </button>
            </div>
            <button onClick={signInWithGoogle} className="mt-2 w-full rounded-full border px-5 py-3 font-bold">Continue with Google</button>
          </>}
          {isLoggedIn && <>
            <input className="input mb-2" placeholder="Display name" value={name} onChange={e=>setName(e.target.value)} />
            <input className="input mb-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
            <input className="input mb-2" placeholder="Mobile" value={phone} onChange={e=>setPhone(e.target.value)} />
            <div className="flex gap-2">
              <Btn onClick={saveProfile}>Save Profile</Btn>
              <button onClick={logout} className="rounded-full bg-zinc-200 px-5 py-3 font-bold">Logout</button>
            </div>
          </>}
          {msg && <div className="mt-3 rounded-2xl bg-green-50 text-green-700 p-3 text-sm font-bold">{msg}</div>}
          <p className="mt-3 text-xs text-zinc-500">Account ID: {guestId} · Status: {subscribed ? 'Premium' : 'Free'}</p>
        </div>
      </Card>
    </section>
  );
}

function SearchPage({ go }:{ go:(t:string)=>void }) {
  const { videos } = useApp();
  const [q,setQ] = useState('');
  const list = videos.filter((v:any)=> `${v.title} ${v.series_title} ${v.category}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black">Search</h1>
      <Card className="p-3 flex items-center gap-3"><Search className="text-pink-500" /><input className="flex-1 bg-transparent outline-none py-2" placeholder="Search title, series…" value={q} onChange={e=>setQ(e.target.value)} /></Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{list.map((v:any)=>(
        <button key={v.id} onClick={()=>go('forYou')} className="text-left">
          <Card className="overflow-hidden">
          <img src={v.thumbnail_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80&auto=format&fit=crop'} className="aspect-[3/4] w-full object-cover" alt="" />
          <div className="p-3 font-black">{v.title}</div>
          </Card>
        </button>
      ))}</div>
    </section>
  );
}
function SeriesPage({ go }:{ go:(t:string)=>void }) {
  const { data, videos } = useApp();
  const series = data.series || [];
  const [active, setActive] = useState<any>(null);
  const s = active || series[0];
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black">Series</h1>
      <div className="grid gap-5 md:grid-cols-[300px_1fr]">
        <div className="space-y-2">{series.map((x:any)=>(
          <button key={x.id} onClick={()=>setActive(x)} className={"w-full rounded-2xl p-4 text-left font-bold "+(s?.id===x.id ? "bg-zinc-950 text-white":"bg-white shadow-sm")}>{x.title}<div className="text-xs opacity-70">{x.category}</div></button>
        ))}</div>
        {s && <Card className="overflow-hidden">
          <div className="md:grid md:grid-cols-[260px_1fr]">
            <img src={s.poster_url || 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?w=600&q=80&auto=format&fit=crop'} className="h-64 w-full object-cover md:h-full" alt="" />
            <div className="p-5">
              <div className="text-pink-500 font-black">{s.category}</div>
              <div className="text-3xl font-black">{s.title}</div>
              <p className="text-zinc-600 mt-2">{s.description}</p>
              <Btn className="mt-3" onClick={()=>go('forYou')}>Start Watching</Btn>
            </div>
          </div>
          <div className="p-4 grid gap-2">{videos.filter((v:any)=>v.series_title===s.title).map((v:any)=>(
            <button key={v.id} onClick={()=>go('forYou')} className="rounded-2xl bg-zinc-100 p-3 text-left font-bold">EP {v.episode_number}: {v.title} {v.is_premium && <span className="ml-2 rounded-full bg-yellow-300 px-2 py-1 text-xs">PRO</span>}</button>
          ))}</div>
        </Card>}
      </div>
    </section>
  );
}
function WalletPage() {
  const { data, guestId, createRow } = useApp();
  const tx = (data.wallet_transactions||[]).filter((t:any)=>t.user_id===guestId);
  const balance = tx.reduce((a:number,t:any)=> a + (t.type==='debit'? -Number(t.coins||0): Number(t.coins||0)), 0);
  const code = `RR${guestId.slice(-5).toUpperCase()}`;
  const claim = async ()=> {
    const today = new Date().toISOString().slice(0,10);
    if (tx.some((t:any)=>t.reason==='Daily reward' && t.reference_id===today)) { alert('Aaj ka reward le liya gaya'); return; }
    await createRow('wallet_transactions', { user_id: guestId, type:'credit', coins:10, reason:'Daily reward', reference_id: today });
  };
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black">Wallet & Referral</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6"><Wallet className="text-amber-500" size={40} /><div className="text-4xl font-black mt-2">{balance} Coins</div><Btn className="mt-3" onClick={claim}>Claim Daily 10 Coins</Btn></Card>
        <Card className="p-6"><Gift className="text-pink-500" size={40} /><div className="text-2xl font-black mt-2">Referral Code</div><div className="bg-zinc-100 rounded-2xl p-3 font-black tracking-wider mt-2">{code}</div><Btn className="mt-3" onClick={()=>navigator.clipboard.writeText(code)}>Copy Code</Btn></Card>
      </div>
    </section>
  );
}
function HelpPage() {
  const { data } = useApp();
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black">Help Center</h1>
      {(data.help_articles||[]).filter((a:any)=>a.is_published).map((a:any)=>
        <Card key={a.id} className="p-5"><div className="font-black text-pink-500">{a.category}</div><div className="text-xl font-black">{a.title}</div><p className="text-zinc-600 mt-2 whitespace-pre-line">{a.body}</p></Card>
      )}
    </section>
  );
}
function PoliciesPage() {
  const { data } = useApp();
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black">Legal Policies</h1>
      {(data.legal_policies||[]).filter((p:any)=>p.is_published).map((p:any)=>
        <Card key={p.id} className="p-5"><div className="text-xl font-black">{p.title}</div><div className="text-xs text-zinc-500">v{p.version}</div><p className="mt-2 whitespace-pre-line text-zinc-600">{p.body}</p></Card>
      )}
    </section>
  );
}

function AdminGate() {
  const [pass,setPass] = useState('');
  const [ok,setOk] = useState(()=> sessionStorage.getItem('rr_admin')==='1');
  if (ok) return <Admin />;
  return (
    <main className="min-h-screen grid place-items-center bg-orange-50 p-4">
      <Card className="p-8 max-w-md w-full">
        <ShieldCheck size={44} className="text-pink-500" />
        <div className="text-2xl font-black mt-2">Admin Login</div>
        <input className="input mt-3" type="password" placeholder="Admin password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=> e.key==='Enter' && pass===ADMIN_SECRET && (sessionStorage.setItem('rr_admin','1'), setOk(true))} />
        <Btn className="w-full mt-3" onClick={()=>{ if(pass===ADMIN_SECRET){ sessionStorage.setItem('rr_admin','1'); setOk(true);} else alert('Wrong password'); }}>Enter</Btn>
      </Card>
    </main>
  );
}

function Admin() {
  const { data, theme, payment, player, createRow, updateRow, refresh } = useApp();
  const [tab, setTab] = useState('dashboard');

  const [th, setTh] = useState(theme);
  useEffect(()=>setTh(theme), [theme]);

  const [pay, setPay] = useState<PaymentSettings>(payment);
  useEffect(()=>setPay(payment), [payment]);

  const [pl, setPl] = useState(player);
  useEffect(()=>setPl(player), [player]);

  const adminSettings = data.admin_settings || [];
  const saveSetting = async (key:string, value:any) => {
    const row = adminSettings.find((a:any)=>a.key===key);
    if (row) await updateRow('admin_settings', { id: row.id, key, value });
    else await createRow('admin_settings', { key, value });
    await refresh();
    alert('Saved successfully!');
  };

  const payments = data.payments || [];
  const successPay = payments.filter((p:any)=>p.status==='success');
  const pendingPay = payments.filter((p:any)=>p.status==='pending');
  const revenue = successPay.reduce((a:number,p:any)=>a+Number(p.amount||0),0);
  const now = new Date();
  const dayStart = new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime();
  const monthStart = new Date(now.getFullYear(),now.getMonth(),1).getTime();
  const dailyRev = successPay.filter((p:any)=>new Date(p.created_at).getTime()>=dayStart).reduce((a:number,p:any)=>a+Number(p.amount||0),0);
  const monthlyRev = successPay.filter((p:any)=>new Date(p.created_at).getTime()>=monthStart).reduce((a:number,p:any)=>a+Number(p.amount||0),0);
  const allSubs = data.subscriptions||[];
  const activeSubs = allSubs.filter((s:any)=>s.status==='active' && new Date(s.expires_at)>now);
  const expiredSubs = allSubs.filter((s:any)=>s.status==='expired' || (s.status==='active' && new Date(s.expires_at)<now));
  const users = data.users||[];
  const videos = data.videos||[];
  const tickets = data.support_tickets||[];

  const downloadPDF = () => {
    const nowStr = new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ReelRamp Pro — Revenue Report</title>
<style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:40px auto;color:#222;padding:0 20px}
h1{font-size:32px;border-bottom:3px solid #c5a26f;padding-bottom:8px}
h2{font-size:20px;color:#c5a26f;margin-top:24px}
table{width:100%;border-collapse:collapse;margin:12px 0}
th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #e5e5e5}
th{background:#faf5ef;font-weight:700}
.big{font-size:36px;font-weight:900;color:#c5a26f}
.row{display:flex;gap:24px;flex-wrap:wrap}
.card{flex:1;min-width:140px;background:#faf5ef;border-radius:16px;padding:16px;text-align:center}
.card .val{font-size:28px;font-weight:900;color:#1a1a1a}
.card .lbl{font-size:12px;color:#777;margin-top:4px}
.footer{margin-top:32px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px}
@media print{body{margin:0;padding:0}}</style></head><body>
<h1>📊 ReelRamp Pro — Revenue &amp; Content Report</h1>
<p>Generated: ${nowStr} | <strong>ReelRamp Originals Pvt. Ltd.</strong></p>
<div class="row">
<div class="card"><div class="val">${money(revenue)}</div><div class="lbl">Total Revenue</div></div>
<div class="card"><div class="val">${money(dailyRev)}</div><div class="lbl">Today</div></div>
<div class="card"><div class="val">${money(monthlyRev)}</div><div class="lbl">This Month</div></div>
<div class="card"><div class="val">${activeSubs.length}</div><div class="lbl">Active Subs</div></div>
</div>
<h2>👥 Users &amp; Content</h2>
<table><tr><th>Metric</th><th>Value</th></tr>
<tr><td>Total Users</td><td><strong>${users.length}</strong></td></tr>
<tr><td>Total Videos</td><td><strong>${videos.length}</strong></td></tr>
<tr><td>Published Videos</td><td><strong>${videos.filter((v:any)=>v.is_published).length}</strong></td></tr>
<tr><td>Total Series</td><td><strong>${(data.series||[]).length}</strong></td></tr>
<tr><td>Categories</td><td><strong>${(data.categories||[]).filter((c:any)=>c.is_active).length}</strong></td></tr>
<tr><td>Active Subscriptions</td><td><strong>${activeSubs.length}</strong></td></tr>
<tr><td>Expired Subscriptions</td><td><strong>${expiredSubs.length}</strong></td></tr>
<tr><td>Pending Payments</td><td><strong>${pendingPay.length}</strong></td></tr>
<tr><td>Support Tickets</td><td><strong>${tickets.length}</strong></td></tr>
</table>
<h2>💰 Payment Summary</h2>
<table><tr><th>Gateway</th><th>Successful</th><th>Revenue</th></tr>
${['Cashfree','Razorpay','UPI Manual'].map(g=>{
  const sp = successPay.filter((p:any)=>p.gateway===g);
  const rv = sp.reduce((a:number,p:any)=>a+Number(p.amount||0),0);
  return `<tr><td>${g}</td><td>${sp.length}</td><td>${money(rv)}</td></tr>`;
}).join('')}
</table>
<h2>📋 Recent Transactions</h2>
<table><tr><th>Date</th><th>User</th><th>Gateway</th><th>Amount</th><th>Status</th></tr>
${payments.slice(-20).reverse().map((p:any)=>`<tr>
<td>${new Date(p.created_at).toLocaleDateString('en-IN')}</td>
<td>${p.user_id?.slice(0,10)}…</td>
<td>${p.gateway||'—'}</td>
<td>${money(p.amount)}</td>
<td>${p.status}</td>
</tr>`).join('')}
</table>
<div class="footer">ReelRamp Originals Pvt. Ltd. | FF Shop No.6, Arohi Arcade, Munshipulia, Lucknow - 226016 | +91 7307493338</div>
</body></html>`;
    const w = open('','_blank','width=900,height=700');
    if (w) { w.document.write(html); w.document.close(); setTimeout(()=>w.print(), 600); }
  };

  const tabs = ['dashboard','videos','series','categories','banners','promo','plans','payments','subscriptions','users','brand','gateways','player','storage','support','policies','help'];
  return (
    <main className="min-h-screen bg-orange-50 p-4 md:p-8">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-black">Admin Control Center</h1><button onClick={()=>{ sessionStorage.removeItem('rr_admin'); location.href='/'}} className="text-sm underline">Exit Admin</button></div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">{tabs.map(t=> <Pill key={t} active={tab===t} onClick={()=>setTab(t)}>{t}</Pill>)}</div>

      {tab==='dashboard' && <>
        <div className="grid gap-4 md:grid-cols-4 mt-4">
          {[['Total Revenue', money(revenue), DollarSign], ['Daily Revenue', money(dailyRev), TrendingUp], ['Monthly Revenue', money(monthlyRev), Clock], ['Active Subscriptions', activeSubs.length, Crown]]
            .map(([l,v,Icon]:any)=> <Card key={l} className="p-5"><div className="flex items-center gap-2 text-zinc-500 text-sm mb-1"><Icon size={16}/> {l}</div><div className="text-3xl font-black">{v}</div></Card>)}
        </div>
        <div className="grid gap-4 md:grid-cols-4 mt-4">
          {[['Total Users', users.length, UsersIcon], ['Videos', videos.length, Film], ['Pending Payments', pendingPay.length, Clock], ['Expired Subs', expiredSubs.length, X]]
            .map(([l,v,Icon]:any)=> <Card key={l} className="p-5"><div className="flex items-center gap-2 text-zinc-500 text-sm mb-1"><Icon size={16}/> {l}</div><div className="text-3xl font-black">{v}</div></Card>)}
        </div>
        <div className="mt-5 flex gap-3 flex-wrap">
          <Btn onClick={downloadPDF} className="flex items-center gap-2"><FileText size={18}/> Download PDF Report</Btn>
          <button onClick={()=>{
            const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
            const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='reelramp-backup.json'; a.click();
          }} className="rounded-full border px-5 py-3 font-bold text-sm">Export JSON Backup</button>
        </div>
        {pendingPay.length > 0 && (
          <Card className="p-5 mt-5">
            <h3 className="font-black text-amber-700 mb-3 flex items-center gap-2"><Clock size={16}/> Pending Payments — Manual Verification</h3>
            <div className="space-y-2">
              {pendingPay.slice(0,15).map((p:any)=>(
                <div key={p.id} className="rounded-2xl bg-amber-50 p-3 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-sm">{money(p.amount)} — {p.gateway}</div>
                    <div className="text-xs text-zinc-500">User: {p.user_id?.slice(0,12)}… · Txn: {p.transaction_id||'—'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>updateRow('payments', { id:p.id, status:'success' }).then(()=>{ createRow('subscriptions',{ user_id:p.user_id, plan:'Pro', plan_id:p.plan_id, status:'active', expires_at: new Date(Date.now()+30*86400000).toISOString(), gateway:p.gateway, auto_renew:false }); window.dispatchEvent(new CustomEvent('supabase-data-updated')); })} className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-black">Approve</button>
                    <button onClick={()=>updateRow('payments', { id:p.id, status:'failed' })} className="rounded-full bg-red-100 text-red-600 px-3 py-1 text-xs font-black">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </>}

      {tab==='videos' && <CrudAdvanced
        resource="videos"
        columns={['title','series_title','episode_number','category','is_premium','is_published']}
        form={(f,setF)=>(
          <>
            <div className="grid md:grid-cols-2 gap-3">
              <input className="input" placeholder="Title *" value={f.title||''} onChange={e=>setF({...f, title:e.target.value})} />
              <input className="input" placeholder="Series Title" value={f.series_title||''} onChange={e=>setF({...f, series_title:e.target.value})} />
              <input className="input" placeholder="Category" value={f.category||''} onChange={e=>setF({...f, category:e.target.value})} />
              <input className="input" type="number" placeholder="Episode Number" value={f.episode_number||''} onChange={e=>setF({...f, episode_number: Number(e.target.value)})} />
            </div>
            <textarea className="input min-h-24" placeholder="Description" value={f.description||''} onChange={e=>setF({...f, description:e.target.value})} />
            <UploadField label="Thumbnail (image → Supabase)" accept="image/*" kind="image" value={f.thumbnail_url||''} onChange={(url)=> setF({...f, thumbnail_url:url})} />
            <UploadField label="Video file (MP4 → Bunny.net / Supabase)" accept="video/*" kind="video" value={f.video_filename||''}
              onChange={(url, meta)=> setF({ ...f, video_filename: url, bunny_video_id: meta?.bunny_video_id || f.bunny_video_id, bunny_embed_url: meta?.bunny_embed_url || f.bunny_embed_url, duration_seconds: f.duration_seconds || 0 })}
            />
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!f.is_premium} onChange={e=>setF({...f, is_premium:e.target.checked})} /> Premium</label>
              <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={f.is_published!==false} onChange={e=>setF({...f, is_published:e.target.checked})} /> Published</label>
            </div>
          </>
        )}
        defaults={{ is_published:true, is_premium:false, episode_number:1, category:'Drama' }}
      />}

      {tab==='series' && <CrudAdvanced resource="series" columns={['title','category','status']}
        form={(f,setF)=> (<>
          <input className="input" placeholder="Title *" value={f.title||''} onChange={e=>setF({...f, title:e.target.value})} />
          <input className="input" placeholder="Category" value={f.category||''} onChange={e=>setF({...f, category:e.target.value})} />
          <textarea className="input" placeholder="Description" value={f.description||''} onChange={e=>setF({...f, description:e.target.value})} />
          <UploadField label="Poster Image (→ Supabase)" accept="image/*" kind="image" value={f.poster_url||''} onChange={(url)=>setF({...f, poster_url:url})} />
        </>)} defaults={{ status:'published' }} />}

      {tab==='categories' && <CrudAdvanced resource="categories" columns={['name','icon','is_active']} form={(f,setF)=>(<>
          <input className="input" placeholder="Name *" value={f.name||''} onChange={e=>setF({...f, name:e.target.value})} />
          <input className="input" placeholder="Slug" value={f.slug|| (f.name ? f.name.toLowerCase().replace(/\s+/g,'-'):'')} onChange={e=>setF({...f, slug:e.target.value})} />
          <input className="input" placeholder="Icon (emoji)" value={f.icon||''} onChange={e=>setF({...f, icon:e.target.value})} />
          <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!f.is_active} onChange={e=>setF({...f, is_active:e.target.checked})}/> Active</label>
      </>)} defaults={{ is_active:true, icon:'🎬' }} />}

      {tab==='banners' && <CrudAdvanced resource="banners" columns={['title','is_active']} form={(f,setF)=>(<>
        <input className="input" placeholder="Title" value={f.title||''} onChange={e=>setF({...f, title:e.target.value})} />
        <input className="input" placeholder="Subtitle" value={f.subtitle||''} onChange={e=>setF({...f, subtitle:e.target.value})} />
        <UploadField label="Banner Image (→ Supabase)" accept="image/*" kind="image" value={f.image_url||''} onChange={(url)=>setF({...f, image_url:url})} />
        <div className="grid md:grid-cols-2 gap-3">
          <input className="input" placeholder="CTA Label" value={f.cta_label||''} onChange={e=>setF({...f, cta_label:e.target.value})} />
          <input className="input" placeholder="CTA Action (forYou/plans)" value={f.cta_action||''} onChange={e=>setF({...f, cta_action:e.target.value})} />
        </div>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!f.is_active} onChange={e=>setF({...f, is_active:e.target.checked})}/> Active</label>
      </>)} defaults={{ is_active:true, cta_action:'forYou' }} />}

      {tab==='promo' && <CrudAdvanced resource="promo_campaigns" columns={['title','placement','is_active']} form={(f,setF)=>(<>
        <input className="input" placeholder="Title (e.g. Watch 1000+ Dramas)" value={f.title||''} onChange={e=>setF({...f, title:e.target.value})} />
        <input className="input" placeholder="Subtitle" value={f.subtitle||''} onChange={e=>setF({...f, subtitle:e.target.value})} />
        <UploadField label="Promo Video (MP4 → app khulte hi chalega)" accept="video/*" kind="video" value={f.video_filename||''} onChange={(url)=>setF({...f, video_filename:url})} />
        <UploadField label="Poster (fallback image)" accept="image/*" kind="image" value={f.poster_url||''} onChange={(url)=>setF({...f, poster_url:url})} />
        <input className="input" placeholder="CTA Button Label (e.g. Start Trial)" value={f.cta_label||''} onChange={e=>setF({...f, cta_label:e.target.value})} />
        <div>
          <label className="text-xs font-black text-zinc-600">Promo me jo price dikhana hai (e.g. 1). Khali chhodo to Plan ki price aayegi.</label>
          <input className="input" placeholder="Promo display price (e.g. 1)" type="number" value={f.promo_price ?? ''} onChange={e=>setF({...f, promo_price: e.target.value === '' ? null : Number(e.target.value)})} />
        </div>
        <select className="input" value={f.placement||'app_open'} onChange={e=>setF({...f, placement:e.target.value})}>
          <option value="app_open">App Open (sabse pehle dikhega)</option>
        </select>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!f.is_active} onChange={e=>setF({...f, is_active:e.target.checked})}/> Active</label>
        <div className="text-xs text-zinc-500">Promo video app khulte hi dikhega. "Start Trial" button DIRECT trial plan ka payment kholega. Trial price + autopay Plans section se aayega.</div>
      </>)} defaults={{ is_active:true, placement:'app_open', cta_label:'Start Trial', promo_price: 1 }} />}

      {tab==='plans' && <CrudAdvanced resource="plans" columns={['name','price','duration_days','is_active']} form={(f,setF)=> (<>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="input" placeholder="Name *" value={f.name||''} onChange={e=>setF({...f, name:e.target.value})} />
          <input className="input" placeholder="Trial Price * (e.g. 1)" type="number" value={f.price||''} onChange={e=>setF({...f, price:Number(e.target.value)})} />
          <input className="input" placeholder="Duration days" type="number" value={f.duration_days||''} onChange={e=>setF({...f, duration_days:Number(e.target.value)})} />
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          <input className="input" placeholder="Trial days (e.g. 1)" type="number" value={f.trial_days||0} onChange={e=>setF({...f, trial_days:Number(e.target.value)})} />
          <input className="input" placeholder="Auto-pay amount (e.g. 399)" type="number" value={f.autopay_amount||''} onChange={e=>setF({...f, autopay_amount:Number(e.target.value)})} />
          <select className="input" value={`${f.autopay_interval||'MONTH'}_${f.autopay_intervals||1}`} onChange={e=>{
            const [type, num] = e.target.value.split('_');
            setF({...f, autopay_interval: type, autopay_intervals: Number(num)});
          }}>
            <option value="MONTH_1">Monthly</option>
            <option value="MONTH_3">Quarterly (3 months)</option>
            <option value="MONTH_6">Half-Yearly (6 months)</option>
            <option value="YEAR_1">Yearly</option>
            <option value="WEEK_1">Weekly</option>
          </select>
        </div>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!f.is_active} onChange={e=>setF({...f, is_active:e.target.checked})} /> Active</label>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!f.supports_autorenew} onChange={e=>setF({...f, supports_autorenew:e.target.checked})} /> Enable Auto-Pay (trial → auto deduct)</label>
        <div className="text-xs text-zinc-500">Auto-Pay ON karne pe: Trial amount (Price) aaj katega, fir Auto-pay amount har {f.autopay_interval?.toLowerCase()||'month'} katega.</div>
      </>)} defaults={{ is_active:true, price:1, duration_days:1, trial_days:1, autopay_amount:399, autopay_interval:'MONTH', supports_autorenew:true }} />}

      {tab==='payments' && <TableView rows={data.payments||[]} />}
      {tab==='subscriptions' && <TableView rows={data.subscriptions||[]} />}
      {tab==='users' && <TableView rows={data.users||[]} />}

      {tab==='brand' && (
        <Card className="p-5 space-y-4 max-w-3xl">
          <div className="text-xl font-black flex items-center gap-2"><Palette size={18}/> Brand & Logo</div>
          <div className="rounded-2xl border p-4 bg-orange-50">
            <div className="font-black mb-2 flex items-center gap-2"><ImageIcon size={16}/> Logo Image</div>
            <UploadField label="Logo image (PNG/SVG)" accept="image/*" kind="image" value={th.logoImageUrl||''} onChange={(url)=>setTh({...th, logoImageUrl:url})} />
            <div className="mt-2 text-sm">Fallback text:</div>
            <input className="input max-w-xs" value={th.logoText||''} onChange={e=>setTh({...th, logoText:e.target.value})} placeholder="RR" />
            <div className="mt-3 flex items-center gap-3 bg-white rounded-2xl border p-3 w-fit">
              {th.logoImageUrl ? <img src={th.logoImageUrl} className="h-10 w-auto object-contain max-w-[160px]" alt="" /> : <span className="grid h-10 w-10 place-items-center rounded-xl text-black font-black" style={{ background: th.primary }}>{th.logoText || 'RR'}</span>}
              <b>{th.brand}</b>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <div><div className="text-xs font-black">Brand Name</div><input className="input" value={th.brand} onChange={e=>setTh({...th, brand:e.target.value})} /></div>
            <div><div className="text-xs font-black">Radius (e.g. 30px)</div><input className="input" value={th.radius} onChange={e=>setTh({...th, radius:e.target.value})} /></div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {(['primary','accent','bg'] as const).map(k=>(
              <div key={k}><div className="text-xs font-black capitalize">{k}</div>
                <div className="flex items-center gap-2">
                  <input type="color" value={th[k]||'#000000'} onChange={e=>setTh({...th,[k]:e.target.value})} />
                  <input className="input flex-1" value={th[k]||''} onChange={e=>setTh({...th,[k]:e.target.value})} />
                </div>
              </div>
            ))}
          </div>
          <Btn onClick={()=>saveSetting('theme', th)}>💾 Save Brand Settings</Btn>
        </Card>
      )}

      {tab==='gateways' && (
        <Card className="p-5 space-y-4 max-w-3xl">
          <div className="text-xl font-black flex items-center gap-2"><CreditCard size={18}/> Payment Gateways</div>
          <div className="text-sm text-zinc-600">Cashfree / Razorpay / UPI Manual — keys save karein, Plans page automatic use karega.</div>
          <div className="space-y-2">
            {pay.gateways.length===0 && <div className="text-sm text-zinc-500 text-center py-3">Koi gateway nahi hai. Neeche Add karein.</div>}
            {pay.gateways.map(g=>(
              <div key={g.id} className={`rounded-2xl border p-3 ${g.enabled ? 'bg-green-50 border-green-200' : 'bg-zinc-50'}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div><span className="font-black">{g.name}</span><span className="text-zinc-500 text-sm ml-1">({g.type})</span>
                    {g.isDefault && <span className="text-xs bg-amber-200 px-2 py-0.5 rounded-full ml-1">default</span>}
                    {g.testMode && <span className="text-xs bg-yellow-200 px-2 py-0.5 rounded-full ml-1">sandbox</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=> setPay({ ...pay, gateways: pay.gateways.map((x:any)=> x.id===g.id ? {...x, enabled:!x.enabled} : x) }) } className="text-xs font-bold underline">{g.enabled ? 'Disable':'Enable'}</button>
                    {!g.isDefault && <button onClick={()=> setPay({ ...pay, gateways: pay.gateways.map((x:any)=> ({...x, isDefault: x.id===g.id})) }) } className="text-xs font-bold underline">Make default</button>}
                    <button onClick={()=> setPay({ ...pay, gateways: pay.gateways.filter((x:any)=>x.id!==g.id) }) } className="text-xs text-red-600 font-bold">Remove</button>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 mt-1 font-mono">Keys: {Object.entries(g.keys).map(([k,v])=> `${k}: ${(v||'').slice(0,12)}…`).join(', ') || '—'}</div>
              </div>
            ))}
          </div>
          <GatewayAddForm onAdd={(gw)=> setPay((p:any)=> ({ ...p, gateways:[...p.gateways, gw]}))} />
          <div className="grid md:grid-cols-2 gap-3">
            <div><div className="text-xs font-black">WhatsApp</div><input className="input" value={pay.whatsapp} onChange={e=>setPay({...pay, whatsapp:e.target.value})} /></div>
            <div><div className="text-xs font-black">Monthly Base Price</div><input className="input" type="number" value={pay.monthlyPrice} onChange={e=>setPay({...pay, monthlyPrice:Number(e.target.value)})} /></div>
          </div>
          <div><div className="text-xs font-black">Payment Instructions</div><textarea className="input min-h-20" value={pay.instructions} onChange={e=>setPay({...pay, instructions:e.target.value})} /></div>
          <Btn onClick={()=>saveSetting('payment', pay)} className="w-full">💾 Save Payment Settings</Btn>
          <div className="text-xs text-zinc-500">⚠️ Gateway keys add karne ke baad "Save Payment Settings" dabana zaroori hai.</div>
        </Card>
      )}

      {tab==='player' && (
        <Card className="p-5 max-w-2xl space-y-3">
          <div className="text-xl font-black">Player Settings</div>
          <select className="input" value={pl.mode} onChange={e=>setPl({...pl, mode:e.target.value})}>
            <option value="default">Default HTML5</option>
            <option value="bunny">Bunny.net Embed</option>
          </select>
          <input className="input" placeholder="Bunny Embed Base URL" value={pl.bunnyEmbedBase||''} onChange={e=>setPl({...pl, bunnyEmbedBase:e.target.value})} />
          <input className="input" placeholder="Bunny Library ID" value={pl.bunnyLibraryId||''} onChange={e=>setPl({...pl, bunnyLibraryId:e.target.value})} />
          <label className="flex gap-2 font-bold"><input type="checkbox" checked={pl.autoplay!==false} onChange={e=>setPl({...pl, autoplay:e.target.checked})}/> Autoplay</label>
          <Btn onClick={()=>saveSetting('player', pl)}>Save Player</Btn>
        </Card>
      )}

      {tab==='storage' && (
        <Card className="p-5 max-w-2xl space-y-3">
          <div className="text-xl font-black flex items-center gap-2"><Server size={18}/> Storage Configuration</div>
          <div className="text-sm text-zinc-600">
            <p className="font-bold">Auto-routing enabled:</p>
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li><strong>Images, Logos, Posters</strong> → Supabase Storage</li>
              <li><strong>Videos (MP4)</strong> → Bunny Stream → Supabase fallback</li>
            </ul>
          </div>
          <div className="grid gap-2 text-sm border rounded-2xl p-4 bg-green-50">
            <p><strong>Bunny Stream:</strong> {storageInfo.bunnyConfigured ? '✅ Configured' : '❌ Set VITE_BUNNY_STREAM_API_KEY + VITE_BUNNY_LIBRARY_ID'}</p>
            <p><strong>Supabase:</strong> {storageInfo.supabaseConfigured ? '✅ Configured' : '❌ Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY'}</p>
            <p><strong>CDN:</strong> {storageInfo.cdn || '(none)'}</p>
            <p className="text-xs text-zinc-500 mt-1">Library: {storageInfo.bunnyLibraryId || 'not set'}</p>
          </div>
        </Card>
      )}

      {tab==='support' && <TableView rows={data.support_tickets||[]} />}
      {tab==='policies' && <CrudAdvanced resource="legal_policies" columns={['title','type','version','is_published']} form={(f,setF)=>(<>
        <input className="input" placeholder="Title" value={f.title||''} onChange={e=>setF({...f, title:e.target.value})}/>
        <div className="grid grid-cols-2 gap-3">
          <input className="input" placeholder="Type" value={f.type||''} onChange={e=>setF({...f, type:e.target.value})}/>
          <input className="input" placeholder="Version" value={f.version||''} onChange={e=>setF({...f, version:e.target.value})}/>
        </div>
        <textarea className="input min-h-40" placeholder="Body" value={f.body||''} onChange={e=>setF({...f, body:e.target.value})}/>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!f.is_published} onChange={e=>setF({...f, is_published:e.target.checked})}/> Published</label>
      </>)} defaults={{ is_published:true, version:'1.0' }} />}

      {tab==='help' && <CrudAdvanced resource="help_articles" columns={['title','category','is_published']} form={(f,setF)=>(<>
        <input className="input" placeholder="Title" value={f.title||''} onChange={e=>setF({...f, title:e.target.value})}/>
        <input className="input" placeholder="Category" value={f.category||''} onChange={e=>setF({...f, category:e.target.value})}/>
        <textarea className="input min-h-32" placeholder="Body" value={f.body||''} onChange={e=>setF({...f, body:e.target.value})}/>
        <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={!!f.is_published} onChange={e=>setF({...f, is_published:e.target.checked})}/> Published</label>
      </>)} defaults={{ is_published:true, category:'General' }} />}
    </main>
  );
}

function GatewayAddForm({ onAdd }:{ onAdd:(g:GatewayConfig)=>void }) {
  const [type,setType] = useState('Cashfree');
  const [name,setName] = useState('');
  const [testMode,setTestMode] = useState(true);
  const [keys,setKeys] = useState<Record<string,string>>({});
  return (
    <div className="rounded-2xl border-2 border-dashed border-zinc-300 p-4 bg-orange-50/50">
      <div className="font-black mb-2">➕ New Gateway</div>
      <div className="grid md:grid-cols-3 gap-3">
        <select className="input" value={type} onChange={e=>{ setType(e.target.value); setKeys({}); setName(''); }}>
          {['Cashfree','Razorpay','PayU','UPI Manual','Stripe','PayPal'].map(t=> <option key={t}>{t}</option>)}
        </select>
        <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder={type+' Production'} />
        <label className="flex items-center gap-2 font-bold text-sm"><input type="checkbox" checked={testMode} onChange={e=>setTestMode(e.target.checked)} /> Sandbox</label>
      </div>
      <div className="grid md:grid-cols-2 gap-3 mt-3">
        {type==='Cashfree' && <>
          <input className="input" placeholder="App ID" value={keys.appId||''} onChange={e=>setKeys({...keys, appId:e.target.value})} />
          <input className="input" type="password" placeholder="Secret Key" value={keys.secretKey||''} onChange={e=>setKeys({...keys, secretKey:e.target.value})} />
        </>}
        {type==='Razorpay' && <>
          <input className="input" placeholder="Key ID (rzp_live_…)" value={keys.keyId||''} onChange={e=>setKeys({...keys, keyId:e.target.value})} />
          <input className="input" type="password" placeholder="Key Secret" value={keys.keySecret||''} onChange={e=>setKeys({...keys, keySecret:e.target.value})} />
        </>}
        {type==='UPI Manual' && <>
          <input className="input" placeholder="UPI ID" value={keys.upiId||''} onChange={e=>setKeys({...keys, upiId:e.target.value})} />
          <input className="input" placeholder="QR Code Image URL" value={keys.upiQr||''} onChange={e=>setKeys({...keys, upiQr:e.target.value})} />
        </>}
        {['PayU','Stripe','PayPal'].includes(type) && <>
          <input className="input" placeholder="API Key / Client ID" value={keys.keyId||''} onChange={e=>setKeys({...keys, keyId:e.target.value})} />
          <input className="input" type="password" placeholder="Secret" value={keys.keySecret||''} onChange={e=>setKeys({...keys, keySecret:e.target.value})} />
        </>}
      </div>
      <Btn className="mt-3" disabled={!name.trim()} onClick={()=> onAdd({ id:'gw_'+Date.now(), name: name || type, type, enabled:true, isDefault:false, testMode, keys }) }>Add Gateway</Btn>
    </div>
  );
}

function CrudAdvanced({ resource, columns, form, defaults }:{ resource:string; columns:string[]; form:(f:any,setF:(v:any)=>void)=>ReactNode; defaults?:any }) {
  const { data, createRow, updateRow, removeRow } = useApp();
  const rows = data[resource] || [];
  const [f,setF] = useState<any>(defaults||{});
  const save = async (e: FormEvent) => { e.preventDefault(); if(f.id) await updateRow(resource, f); else await createRow(resource, f); setF(defaults||{}); };
  return (
    <div className="grid gap-5 lg:grid-cols-[420px_1fr] mt-4">
      <Card className="p-5">
        <div className="text-lg font-black mb-3 flex items-center gap-2"><Edit3 size={16}/> {resource}</div>
        <form onSubmit={save} className="space-y-3">
          {form(f,setF)}
          <Btn type="submit">{f.id ? 'Update' : 'Create'}</Btn>
          {f.id && <button type="button" onClick={()=>setF(defaults||{})} className="ml-2 text-sm underline">Clear</button>}
        </form>
      </Card>
      <TableView rows={rows} columns={columns} onEdit={setF} onDelete={(r:any)=> removeRow(resource, { id: r.id })} />
    </div>
  );
}
function TableView({ rows, columns, onEdit, onDelete }:{ rows:any[]; columns?:string[]; onEdit?:(r:any)=>void; onDelete?:(r:any)=>void }) {
  const cols = columns || Object.keys(rows[0]||{}).slice(0,6);
  return (
    <Card className="p-3 overflow-auto">
      <table className="min-w-full text-sm">
        <tbody>
          {rows.map((r:any)=>(
            <tr key={r.id} className="border-b border-zinc-100">
              <td className="p-2 font-black">#{r.id}</td>
              {cols.map(k=> <td key={k} className="p-2 max-w-[220px] truncate">{typeof r[k]==='object' ? JSON.stringify(r[k]) : String(r[k] ?? '')}</td>)}
              {(onEdit||onDelete) && <td className="p-2 text-right whitespace-nowrap">
                {onEdit && <button onClick={()=>onEdit(r)} className="text-blue-600 font-bold mr-3">Edit</button>}
                {onDelete && <button onClick={()=>onDelete(r)} className="text-red-600 font-bold">Delete</button>}
              </td>}
            </tr>
          ))}
          {rows.length===0 && <tr><td className="p-6 text-zinc-400 text-center">No data yet.</td></tr>}
        </tbody>
      </table>
    </Card>
  );
}

// ─── PROMO VIDEO MODAL (app khulte hi dikhta hai jab tak subscribe na ho) ───
function PromoVideoModal({ onClose }:{ onClose:()=>void }) {
  const { data, theme, plans } = useApp();
  const promo:any = (data.promo_campaigns||[]).find((p:any)=>p.is_active && p.placement==='app_open') || {};
  // Trial plan = first active auto-renew plan. Single source of truth = Plans section.
  const trialPlan:any = plans.find((p:any)=>p.is_active && p.supports_autorenew) || plans.find((p:any)=>p.is_active) || {};
  const [muted, setMuted] = useState(true);
  const videoSrc = promo.video_filename || '';
  const poster = promo.poster_url || '';

  // Promo price: admin promo me set kiya hua, warna trial plan ki price
  const promoPrice = (promo.promo_price != null && promo.promo_price !== '') ? Number(promo.promo_price) : (trialPlan.price ?? 1);
  const autopayAmount = trialPlan.autopay_amount || trialPlan.price || 399;
  const autopayInterval = trialPlan.autopay_interval?.toLowerCase() || 'month';
  const trialDays = trialPlan.trial_days || 1;
  const durationDays = trialPlan.duration_days || 1;

  const startTrial = () => {
    onClose();
    // Store pending plan id, switch to plans tab — Plans component will pick it up
    if (trialPlan.id != null) {
      (window as any).__rrPendingPlan = trialPlan.id;
    }
    window.dispatchEvent(new CustomEvent('rr-go-plans'));
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center">
      <div className="relative w-full h-full max-w-[440px] mx-auto bg-zinc-950 overflow-hidden">
        {videoSrc
          ? <video src={videoSrc} poster={poster} autoPlay muted={muted} playsInline loop className="absolute inset-0 h-full w-full object-cover" />
          : poster
            ? <img src={poster} className="absolute inset-0 h-full w-full object-cover" alt="" />
            : <div className="absolute inset-0 grid place-items-center"><RRLogoHero size={180} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60" />

        {/* Top bar */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RRLogo size={34} />
            <b className="text-white text-sm">{theme.brand}</b>
          </div>
          {videoSrc && <button onClick={()=>setMuted(!muted)} className="h-9 w-9 rounded-full bg-black/40 backdrop-blur grid place-items-center text-white">{muted ? <VolumeX size={16}/> : <Volume2 size={16}/>}</button>}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 inset-x-0 p-6 space-y-3 text-white">
          <h2 className="text-3xl font-black leading-tight">{promo.title || `Watch 1000+ Dramas`}</h2>
          {promo.subtitle && <p className="text-white/80">{promo.subtitle}</p>}
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black">{money(promoPrice)}</span>
            {autopayAmount > promoPrice && <span className="text-white/50 line-through mb-1">{money(autopayAmount)}</span>}
          </div>
          <p className="text-white/60 text-sm">Auto-pays {money(autopayAmount)} every {autopayInterval}, cancel anytime</p>
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10"><Lock size={16}/></span><div><div className="font-bold text-sm">Start your Trial Plan</div><div className="text-white/60 text-xs">Pay {money(promoPrice)} and unlock all dramas</div></div></div>
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10"><Sparkles size={16}/></span><div><div className="font-bold text-sm">Watch unlimited for {durationDays} day(s)</div><div className="text-white/60 text-xs">Romance, revenge aur much more</div></div></div>
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10"><Clock size={16}/></span><div><div className="font-bold text-sm">Notified before autopay</div><div className="text-white/60 text-xs">Pay {money(autopayAmount)} after {trialDays} day(s)</div></div></div>
          </div>
          <div className="grid gap-2 pt-3">
            <button onClick={startTrial} className="w-full rounded-full bg-[var(--rr-accent)] py-4 text-white font-black text-lg flex items-center justify-center gap-2">
              {promo.cta_label || 'Start Trial'} <ArrowRight size={20}/>
            </button>
            <button onClick={onClose} className="w-full rounded-full bg-white/10 backdrop-blur py-3 text-white/80 font-bold text-sm">Abhi nahi</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const { theme, user, loading, subscribed, data } = useApp();
  const [tab,setTab] = useState('home');
  const [showPromo, setShowPromo] = useState(false);
  const [paywallMsg, setPaywallMsg] = useState('');

  // Promo: show once per session for non-subscribers if a promo campaign exists
  useEffect(() => {
    if (loading) return;
    if (subscribed) return;
    const hasPromo = (data.promo_campaigns||[]).some((p:any)=>p.is_active && p.placement==='app_open');
    const seen = sessionStorage.getItem('rr_promo_seen');
    if (hasPromo && !seen) {
      const t = setTimeout(() => { setShowPromo(true); sessionStorage.setItem('rr_promo_seen','1'); }, 1500);
      return () => clearTimeout(t);
    }
  }, [loading, subscribed, data.promo_campaigns]);

  // HARD PAYWALL: videos already locked in Player. Just show a gentle hint banner.
  useEffect(() => {
    if (tab !== 'forYou') { setPaywallMsg(''); return; }
    if (subscribed) { setPaywallMsg(''); return; }
    setPaywallMsg('Subscribe karke unlimited dramas dekhein!');
    return () => setPaywallMsg('');
  }, [tab, subscribed]);

  // "View Plans" button from locked player / promo
  useEffect(() => {
    const h = () => setTab('plans');
    window.addEventListener('rr-go-plans', h);
    return () => window.removeEventListener('rr-go-plans', h);
  }, []);

  useEffect(()=>{
    document.documentElement.style.setProperty('--rr-primary', theme.primary);
    document.documentElement.style.setProperty('--rr-accent', theme.accent);
    document.documentElement.style.setProperty('--rr-bg', theme.bg);
  }, [theme]);

  const isLoggedIn = !!(user?.email);
  const displayName = getDisplayName(user);
  const shortName = displayName.split(' ')[0];

  if (new URLSearchParams(location.search).get('admin') === '1') return <AdminGate />;
  if (loading) return <div className="min-h-screen grid place-items-center bg-[var(--rr-bg)]"><Loader2 className="animate-spin text-[var(--rr-accent)]" size={44} /></div>;

  const go = (t:string)=> setTab(t);
  const Page = tab==='home' ? <HomePage go={go}/>
    : tab==='forYou' ? <ForYou/>
    : tab==='series' ? <SeriesPage go={go}/>
    : tab==='search' ? <SearchPage go={go}/>
    : tab==='plans' ? <Plans/>
    : tab==='wallet' ? <WalletPage/>
    : tab==='help' ? <HelpPage/>
    : tab==='profile' ? <ProfilePage/>
    : <PoliciesPage/>;

  return (
    <div className="min-h-screen bg-[var(--rr-bg)] text-zinc-950">
      <style>{`
        .input{ width:100%; border-radius:1.4rem; border:1px solid #e4e4e7; padding:.85rem 1rem; outline:none; background:#fff }
        .input:focus{ border-color:#c5a26f; box-shadow:0 0 0 3px rgba(197,162,111,.18) }
      `}</style>
      {showPromo && <PromoVideoModal onClose={()=>setShowPromo(false)} />}
      {paywallMsg && (
        <div className="fixed top-20 inset-x-0 z-40 flex justify-center px-4">
          <div className="rounded-full bg-zinc-950 text-white px-5 py-3 text-sm font-bold shadow-2xl flex items-center gap-2">
            <Lock size={14}/> {paywallMsg}
          </div>
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <button onClick={()=>go('home')} className="flex items-center gap-2">
            {theme.logoImageUrl ? <img src={theme.logoImageUrl} alt={theme.brand} className="h-10 w-auto object-contain max-w-[140px]" /> : <RRLogoHorizontal height={36} />}
            {!theme.logoImageUrl && <b className="text-lg hidden sm:inline">{theme.brand}</b>}
          </button>
          <button onClick={()=>go('profile')} className={`rounded-full px-4 py-2 text-sm font-bold ${isLoggedIn ? 'bg-[var(--rr-primary)] text-black' : 'bg-zinc-950 text-white'}`}>{isLoggedIn ? shortName : 'Login'}</button>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3 flex gap-2 overflow-x-auto text-sm">
          <Pill onClick={()=>go('series')}>Series</Pill>
          <Pill onClick={()=>go('search')}>Search</Pill>
          <Pill onClick={()=>go('wallet')}>Wallet</Pill>
          <Pill onClick={()=>go('help')}>Help</Pill>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-4 pb-28 md:p-8">{Page}</main>

      <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-lg grid grid-cols-4 p-2 text-xs">
          {[
            ['home', HomeIcon, 'Home'],
            ['forYou', Play, 'For You'],
            ['plans', Crown, 'Plan'],
            ['profile', User, isLoggedIn ? shortName : 'Login'],
          ].map(([id, Icon, label]: any )=>(
            <button key={id as string} onClick={()=>go(id as string)} className={`rounded-2xl py-2 font-black ${tab===id? 'bg-zinc-950 text-white':'text-zinc-500'}`}>
              <Icon size={18} className="mx-auto mb-1" />{label as string}
            </button>
          ))}
        </div>
      </nav>

      <footer className="pb-28 text-center text-sm text-zinc-500 px-4">
        <button onClick={()=>go('policies')} className="underline font-bold">Legal Policies</button>
        <div>© 2026 ReelRamp Originals Pvt. Ltd. | FF Shop 6, Arohi Arcade, Munshipulia, Lucknow - 226016</div>
      </footer>
    </div>
  );
}

export default function App() {
  return <AppProvider><Shell /></AppProvider>;
}
