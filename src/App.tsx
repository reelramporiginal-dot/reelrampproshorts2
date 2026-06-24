import { useEffect, useMemo, useState } from 'react';
import {
  // Ye functions App.tsx mein imports ke niche paste karein:

const saveGatewayCredentials = async (provider: string, payload: any) => {
  const API_BASE = (import.meta as any).env?.VITE_GATEWAY_API || 'http://localhost:4000';
  const r = await fetch(`${API_BASE}/api/admin/gateways/${provider}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error('Failed to save');
  return r.json();
};

const validateKeyShape = (provider: string, key: string, secret: string) => {
  if (!key || !secret) return false;
  // Basic validation: Stripe keys usually start with pk_ or sk_
  if (provider === 'stripe' && (!key.startsWith('pk_') || !secret.startsWith('sk_'))) return false;
  // Razorpay keys usually start with rzp_
  if (provider === 'razorpay' && !key.startsWith('rzp_')) return false;
  return key.length > 8 && secret.length > 8;
};
  verifyGateway,
  saveGatewayCredentials,
  validateKeyShape,
  type GatewayId,
} from './services/paymentGatewayApi';

/* Vault — OTT Operator Console
   Payment Gateways · Admin Panel
   React + Tailwind (no external UI libs)
   Credentials are validated client-side, then verified via the Node backend
   at POST /api/admin/gateways/:id/verify and persisted via PUT /api/admin/gateways/:id.
*/

type GatewayStatus = 'connected' | 'test' | 'error' | 'disconnected';

type GatewayConfig = {
  id: GatewayId;
  name: string;
  label: string;
  status: GatewayStatus;
  environment: 'live' | 'test';
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  currencies: string[];
  webhookUrl: string;
  lastCheckedAt: string | null;
  lastError: string | null;
  autoCapture: boolean;
  enabled: boolean;
};

type GatewayCatalog = {
  id: GatewayId;
  name: string;
  label: string;
  docs: string;
  keyLabel: string;
  secretLabel: string;
  countries: string;
  blurb: string;
};

const CATALOG: GatewayCatalog[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    label: 'Global cards • UPI • Wallets',
    docs: 'https://stripe.com/docs',
    keyLabel: 'Publishable key',
    secretLabel: 'Secret key',
    countries: '47 countries',
    blurb: 'Best for international cards, Apple Pay & Link.'
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    label: 'UPI • Cards • Netbanking',
    docs: 'https://razorpay.com/docs',
    keyLabel: 'Key ID',
    secretLabel: 'Key Secret',
    countries: 'India',
    blurb: 'India-first. Instant UPI settlements.'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    label: 'PayPal • Venmo • Cards',
    docs: 'https://developer.paypal.com',
    keyLabel: 'Client ID',
    secretLabel: 'Client Secret',
    countries: '200+ markets',
    blurb: 'Buyer trust for international subs.'
  },
  {
    id: 'paystack',
    name: 'Paystack',
    label: 'Cards • Transfers • USSD',
    docs: 'https://paystack.com/docs',
    keyLabel: 'Public key',
    secretLabel: 'Secret key',
    countries: 'NG • GH • ZA • KE',
    blurb: 'Africa coverage, fast NGN settlement.'
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    label: 'UPI • Wallets',
    docs: 'https://developer.phonepe.com',
    keyLabel: 'Merchant ID',
    secretLabel: 'Salt Key',
    countries: 'India',
    blurb: 'High success UPI intent flows.'
  },
  {
    id: 'manual',
    name: 'Manual / Bank',
    label: 'Offline invoices',
    docs: '#',
    keyLabel: 'Reference code',
    secretLabel: 'Verification token',
    countries: 'Any',
    blurb: 'For enterprise POs & wire approvals.'
  },
];

const DEFAULT_GATEWAYS: GatewayConfig[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    label: 'Global cards • UPI • Wallets',
    status: 'error', // Broken connection initially – the user asked to fix this
    environment: 'test',
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    currencies: ['USD', 'EUR', 'INR'],
    webhookUrl: 'https://api.vaulthq.run/webhooks/stripe',
    lastCheckedAt: '2026-02-12T04:31:00Z',
    lastError: '401 Unauthorized — API key missing or revoked.',
    autoCapture: true,
    enabled: true,
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    label: 'UPI • Cards • Netbanking',
    status: 'connected',
    environment: 'live',
    publishableKey: 'rzp_live_•••••••••7GqA',
    secretKey: '••••••••••••••••••••••••9kP2',
    webhookSecret: 'whsec_••••••••••••fT3',
    currencies: ['INR'],
    webhookUrl: 'https://api.vaulthq.run/webhooks/razorpay',
    lastCheckedAt: '2026-02-14T18:06:00Z',
    lastError: null,
    autoCapture: true,
    enabled: true,
  },
  {
    id: 'paypal',
    name: 'PayPal',
    label: 'PayPal • Venmo • Cards',
    status: 'test',
    environment: 'test',
    publishableKey: 'AX••••••••••••••••••••mWf',
    secretKey: '••••••••••••••••••••••••••••qL',
    webhookSecret: '',
    currencies: ['USD', 'EUR', 'GBP', 'AUD'],
    webhookUrl: 'https://api.vaulthq.run/webhooks/paypal',
    lastCheckedAt: '2026-02-13T21:12:00Z',
    lastError: null,
    autoCapture: true,
    enabled: true,
  },
];

const STORAGE_KEY = 'vault-gateways-v4';

function loadGateways(): GatewayConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GATEWAYS;
    const parsed = JSON.parse(raw) as GatewayConfig[];
    return parsed;
  } catch {
    return DEFAULT_GATEWAYS;
  }
}

function formatRelTime(iso: string | null) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const kpi = [
  { label: 'MRR', value: '₹ 42.1L', note: '+8.7% this cycle', tone: 'default' as const },
  { label: 'Active subs', value: '18,492', note: '1,241 new', tone: 'default' as const },
  { label: 'Auth rate', value: '94.2%', note: '3DS2 optimized', tone: 'ok' as const },
  { label: 'Failed charges', value: '132', note: 'Needs review', tone: 'warn' as const },
];

const recentCharges = [
  { id: 'ch_8Kq2n', email: 'arjun.mehta@northlight.in', plan: 'Vault Annual', amount: '₹1,499', gateway: 'Razorpay', status: 'succeeded', at: '18:42 IST' },
  { id: 'ch_8Kq0V', email: 'lisa.tan@meridian.sg', plan: 'Pro Monthly', amount: '$14.00', gateway: 'Stripe', status: 'requires_action', at: '17:54 IST' },
  { id: 'ch_8KpxL', email: 'mira.iyer@gmail.com', plan: 'Vault Annual', amount: '₹1,499', gateway: 'Razorpay', status: 'succeeded', at: '16:30 IST' },
  { id: 'ch_8Kpw3', email: 's.diaz@atelier.mx', plan: 'Pro Monthly', amount: '$14.00', gateway: 'PayPal', status: 'succeeded', at: '15:11 IST' },
  { id: 'ch_8KprY', email: 'keita.n@tokyo-arts.jp', plan: 'Pro Monthly', amount: '¥1,980', gateway: 'Stripe', status: 'failed', at: '14:08 IST' },
];


export default function App() {
  const [gateways, setGateways] = useState<GatewayConfig[]>(() => loadGateways());
  const [activeGatewayId, setActiveGatewayId] = useState<GatewayId>('stripe');
  const [nav, setNav] = useState('payments');
  const [showAddGateway, setShowAddGateway] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const activeGateway = useMemo(() => gateways.find(g => g.id === activeGatewayId) ?? gateways[0], [gateways, activeGatewayId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gateways));
  }, [gateways]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const patchActive = (patch: Partial<GatewayConfig>) => {
    setGateways(gs => gs.map(g => g.id === activeGatewayId ? { ...g, ...patch } : g));
  };

  return (
    <div className="min-h-screen bg-[#f2ece3] text-[#191816] antialiased" style={{ fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,600&family=Fragment+Mono:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
      .display { font-family: "Fraunces", ui-serif, Georgia, serif; }
      .mono { font-family: "Fragment Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
      ::selection { background: #ead5c8; }
      ::-webkit-scrollbar { width: 8px; height: 8px;}
      ::-webkit-scrollbar-thumb { background: #d7cdc1; border-radius: 8px;}
      `}</style>

      <div className="mx-auto max-w-[1200px] px-5 sm:px-9 lg:px-12 pt-9 pb-20">
        {/* Top bar */}
        <header className="flex flex-wrap items-center justify-between gap-6 pb-7 border-b border-[#dcd1c3]">
          <div className="flex items-center gap-5">
            <div className="h-[44px] w-[44px] rounded-[14px] bg-[#161412] text-[#f5eee4] flex items-center justify-center text-[17px] display font-[600]">
              V
            </div>
            <div>
              <div className="text-[11.5px] tracking-[0.14em] text-[#7a7067] uppercase">OTT Operator Console</div>
              <div className="display text-[28px] sm:text-[32px] leading-[1.05] tracking-[-0.012em]">Vault</div>
            </div>
            <div className="hidden sm:flex items-center gap-2 ml-7 pl-7 border-l border-[#d8cec1]">
              <div className="text-[12.7px] text-[#6a6158]">Org</div>
              <button className="text-[13.5px] font-[600] text-[#231f1c] flex items-center gap-1.5 hover:opacity-80">
                Meridian Pictures
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="relative hidden sm:block">
              <input
                placeholder="Jump to title, invoice, user…"
                className="w-[320px] rounded-full bg-[#fcf9f4] border border-[#d8cdc0] pl-11 pr-4 py-[11px] text-[13.5px] outline-none placeholder:text-[#9a8d7f] focus:border-[#c9b9a8] focus:ring-4 focus:ring-[#eadfd3]"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9b8d7d]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <button className="h-9 w-9 rounded-full bg-[#efe6d9] border border-[#d8cdc0] text-[#6b5e50] flex items-center justify-center hover:bg-[#e7dacd]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <div className="flex items-center gap-3 pl-2">
              <img src="https://i.pravatar.cc/80?img=32" className="h-9 w-9 rounded-full ring-2 ring-[#e6d9ca]" alt="Operator avatar" />
              <div className="hidden sm:block text-[12.7px] leading-tight">
                <div className="font-[600]">Sana Qureshi</div>
                <div className="text-[#7d7165]">Ops lead</div>
              </div>
            </div>
          </div>
        </header>

        <div className="pt-10 grid grid-cols-12 gap-10 xl:gap-14">
          {/* Sidebar */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <nav className="text-[14.4px]">
              <div className="text-[11px] tracking-wider uppercase text-[#8a7d6e] mb-3">Control</div>
              <ul className="space-y-1.5">
                {[
                  { id:'overview', label:'Overview', icon: IconGrid },
                  { id:'catalog', label:'Catalog', icon: IconFilm },
                  { id:'subscribers', label:'Subscribers', icon: IconUsers },
                  { id:'payments', label:'Payments', icon: IconCard },
                  { id:'analytics', label:'Analytics', icon: IconChart },
                  { id:'team', label:'Team & Roles', icon: IconShield },
                ].map(item => (
                  <li key={item.id}>
                    <button
                      onClick={()=>setNav(item.id)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-[11px] transition ${
                        nav === item.id ? 'bg-[#fcf9f5] shadow-[inset_0_0_0_1px_#ded3c5] text-[#1a1817] font-[600]'
                        : 'text-[#5b5147] hover:bg-[#fcf9f5]/80'
                      }`}
                    >
                      <item.icon active={nav===item.id} />
                      {item.label}
                      {item.id==='payments' && <span className="ml-auto text-[11px] px-[8px] py-[2px] rounded-full bg-[#e9cfc2] text-[#7c3926] font-[600]">Live</span>}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-10 border-t border-[#dcd1c3] pt-8">
                <div className="text-[11px] tracking-wider uppercase text-[#8a7d6e] mb-3">Release channels</div>
                <div className="space-y-3 text-[13.6px] text-[#5a5047]">
                  <div className="flex items-center justify-between">
                    <span>Web</span>
                    <span className="text-[#35684b] font-[600]">● Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>iOS / tvOS</span>
                    <span className="text-[#35684b] font-[600]">● Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Android TV</span>
                    <span className="text-[#6f6559]">○ Staging</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[20px] bg-[#faf5ee] border border-[#e0cfbe] p-4 text-[13px] text-[#5d5146]">
                <div className="font-[600] text-[#2b2622]">Feb payout</div>
                <div className="mt-1">₹ 31.6L settling<br/>19 Feb • Razorpay</div>
                <a href="#" className="inline-flex mt-3 text-[#b44b2b] font-[600] hover:underline">View treasury →</a>
              </div>
            </nav>
          </aside>

          {/* Main */}
          <main className="col-span-12 md:col-span-8 lg:col-span-9">
            {/* Page title */}
            <div className="flex flex-wrap items-end justify-between gap-5 mb-7">
              <div>
                <div className="text-[11.5px] tracking-wider text-[#8b7d6d] uppercase">Finance / Payments</div>
                <h1 className="display text-[48px] leading-[0.98] tracking-[-0.017em] mt-1">Payment gateways</h1>
                <p className="mt-3 text-[15.5px] text-[#62584c] max-w-[680px]">
                  Connect your billing providers. Enter your API keys below to enable live checkout. Keys are encrypted and proxied via your Node backend — never exposed to the client in production.
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowAddGateway(true)}
                  className="rounded-full bg-[#1b1715] text-[#f4eee5] text-[13.6px] font-[600] px-4 py-[10px] hover:bg-black transition"
                >
                  + Add gateway
                </button>
                <button className="rounded-full bg-[#fcf9f5] border border-[#d9cec1] px-4 py-[10px] text-[13.6px] font-[600] text-[#322c27] hover:bg-white">Export ledger</button>
              </div>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
              {kpi.map(k => (
                <div key={k.label} className="rounded-[18px] bg-[#fcf9f5] border border-[#e1d4c6] px-5 py-4">
                  <div className="text-[11.5px] uppercase tracking-wider text-[#8b7b6b]">{k.label}</div>
                  <div className="display text-[28px] leading-tight tracking-[-0.01em] mt-1">{k.value}</div>
                  <div className={`text-[12.8px] mt-1 ${k.tone==='warn' ? 'text-[#ba4b2b] font-[600]' : k.tone==='ok' ? 'text-[#2f6d49]' : 'text-[#6d6154]'}`}>{k.note}</div>
                </div>
              ))}
            </div>

            {/* Gateway selector + config */}
            <div className="grid grid-cols-12 gap-6 items-start">
              <div className="col-span-12 xl:col-span-5">
                <div className="rounded-[22px] bg-[#fcf9f5] border border-[#dfd0c1] shadow-[0_16px_44px_rgba(77,55,36,0.07)]">
                  <div className="px-5 pt-4 pb-3 border-b border-[#e7d9c9] flex items-center justify-between text-[11.5px] text-[#83746a] uppercase tracking-wider">
                    <span>Connected providers</span>
                    <span className="normal-case tracking-normal text-[12px]">{gateways.filter(g=>g.enabled).length} / {CATALOG.length} active</span>
                  </div>

                  <ul className="py-2">
                    {gateways.map(g => (
                      <li key={g.id}>
                        <button
                          onClick={()=> setActiveGatewayId(g.id)}
                          className={`w-full text-left px-5 py-[16px] border-l-[3px] transition ${
                            activeGatewayId === g.id
                              ? 'border-[#d35638] bg-[#fbf3ec]'
                              : 'border-transparent hover:bg-[#fbf5ed]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-[650] text-[16.4px]">{g.name}</div>
                            <GatewayStatusPill status={g.status} />
                          </div>
                          <div className="text-[13.2px] text-[#67594a] mt-1">{g.label}</div>
                          <div className="mt-2 text-[12.2px] text-[#8a7c6b] mono">
                            {g.environment === 'live' ? 'live mode' : 'test mode'} · last checked {formatRelTime(g.lastCheckedAt)}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-[#e7d9c9] px-5 py-4 text-[13px] text-[#6b5d4f]" >
                    Need something custom?<br/>
                    <button onClick={()=>setShowAddGateway(true)} className="text-[#bf4a2b] font-[600] hover:underline">Add a gateway manually →</button>
                  </div>
                </div>

                {/* Live transaction mini feed */}
                <div className="rounded-[22px] bg-[#fcf9f5] border border-[#dfd0c1] mt-5 px-5 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[12px] uppercase tracking-wider text-[#837367]">Recent charges</div>
                    <a className="text-[12.6px] text-[#b94a2b] font-[600]" href="#">Full ledger →</a>
                  </div>
                  <ul className="divide-y divide-[#eaded0]">
                    {recentCharges.slice(0,4).map(c => (
                      <li key={c.id} className="py-3 flex items-center gap-3 text-[13.35px]">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${c.status==='succeeded' ? 'bg-[#2c7d54]' : c.status==='failed' ? 'bg-[#c54a2d]' : 'bg-[#c9a042]'}`}/>
                        <div className="flex-1 min-w-0">
                          <div className="truncate text-[#2b2521]">{c.email}</div>
                          <div className="text-[#7d6e5e] text-[12.2px]">{c.plan} · {c.gateway}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-[600]">{c.amount}</div>
                          <div className="text-[11.8px] text-[#847466]">{c.at}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Configuration panel - this is the main new Payment Gateway feature */}
              <div className="col-span-12 xl:col-span-7">
                <div className="rounded-[26px] bg-[#fdfbf7] border border-[#e3d3c3] shadow-[0_22px_60px_rgba(71,48,29,0.09)]">
                  {/* Header */}
                  <div className="px-6 sm:px-8 pt-7 pb-5 border-b border-[#ebdcca]">
                    <div className="flex items-start justify-between gap-6">
                      <div>
                        <div className="text-[11.5px] uppercase tracking-wider text-[#8a7b6b]">Configure / {activeGateway.name}</div>
                        <h2 className="display text-[30px] leading-tight tracking-[-0.013em] mt-1">{activeGateway.name} credentials</h2>
                        <p className="text-[13.9px] text-[#65594a] mt-2 max-w-[540px]">{CATALOG.find(c=>c.id===activeGateway.id)?.blurb} Supports {activeGateway.currencies.join(' • ')}.</p>
                      </div>
                      <button
                        onClick={() => patchActive({ enabled: !activeGateway.enabled })}
                        className={`mt-1 rounded-full px-3.5 py-[8px] text-[12.6px] font-[650] border transition ${
                          activeGateway.enabled
                            ? 'bg-[#e9f3e9] text-[#25613f] border-[#c5dbca]'
                            : 'bg-[#f8ede7] text-[#9a4a2e] border-[#e3c7bb]'
                        }`}
                      >
                        {activeGateway.enabled ? 'Enabled' : 'Paused'}
                      </button>
                    </div>

                    {/* Status banner */}
                    {activeGateway.status === 'error' && (
                      <div className="mt-5 rounded-[14px] bg-[#faf0e8] border border-[#e4c5b6] px-4 py-3 text-[13.3px] text-[#6b3827] flex items-start gap-3">
                        <svg width="18" height="18" viewBox="0 0 24 24" className="mt-[2px] text-[#c24b2a] shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
                        <div>
                          <div className="font-[700] text-[#a93c22]">Connection failed{activeGateway.lastError ? ` · ${activeGateway.lastError.split(' — ')[0]}` : ''}</div>
                          <div className="mt-0.5">{activeGateway.lastError ?? 'The gateway rejected your last request.'} Update your API key and Secret key below, then click “Test connection”.</div>
                          <div className="mono text-[11.7px] text-[#a66b56] mt-2">api.{activeGateway.id}.com/v1/balance</div>
                        </div>
                      </div>
                    )}
                    {activeGateway.status === 'connected' && (
                      <div className="mt-5 rounded-[14px] bg-[#e9f5ee] border border-[#c9decf] px-4 py-3 text-[13.3px] text-[#214e37]">
                        <span className="font-[700]">Connected.</span> Authenticated successfully {formatRelTime(activeGateway.lastCheckedAt)}. {activeGateway.webhookSecret ? 'Webhook verified.' : 'Add a webhook signing secret to verify callbacks.'}
                      </div>
                    )}
                    {activeGateway.status === 'test' && (
                      <div className="mt-5 rounded-[14px] bg-[#f5f0e7] border border-[#e1d6c6] px-4 py-3 text-[13.3px] text-[#5c4c38]">
                        <span className="font-[650]">Test mode.</span> Live keys not configured yet. Test payments will not settle.
                      </div>
                    )}
                    {activeGateway.status === 'disconnected' && (
                      <div className="mt-5 rounded-[14px] bg-[#f5f0e7] border border-[#e1d6c6] px-4 py-3 text-[13.3px] text-[#5c4c38]">
                        <span className="font-[650]">Not connected.</span> Enter your API credentials below to activate this gateway.
                      </div>
                    )}
                  </div>

                  {/* Form */}
                  <div className="px-6 sm:px-8 py-7">
                    <GatewayConfigForm
                      gateway={activeGateway}
                      catalog={CATALOG.find(c=>c.id===activeGateway.id)!}
                      onChange={patchActive}
                      onVerified={(result) => {
                        patchActive({
                          status: result.ok
                            ? (activeGateway.environment === 'live' ? 'connected' : 'test')
                            : 'error',
                          lastCheckedAt: result.checkedAt,
                          lastError: result.ok ? null : result.message,
                        });
                        setToast(result.ok
                          ? `${activeGateway.name} verified${result.account ? ` · ${result.account}` : ''}`
                          : `${activeGateway.name}: ${result.message}`);
                      }}
                      onSaved={(msg) => setToast(`${activeGateway.name}: ${msg}`)}
                    />
                  </div>
                </div>

                {/* Connection diagnostic */}
                <div className="mt-5 rounded-[22px] bg-[#fcf9f5] border border-[#dfd0c1] px-5 sm:px-6 py-5">
                  <div className="text-[12px] uppercase tracking-wider text-[#857566] mb-3">Connection diagnostic</div>
                  <div className="grid sm:grid-cols-3 gap-4 text-[13.2px]">
                    <DiagnosticItem label="API auth" ok={activeGateway.status === 'connected' || activeGateway.status === 'test'} />
                    <DiagnosticItem label="Webhook signature" ok={!!activeGateway.webhookSecret} warnText="optional" />
                    <DiagnosticItem label="TLS (Node backend)" ok={true} />
                  </div>
                  <div className="mt-4 text-[12.7px] text-[#776659]">
                    Backend route: <span className="mono text-[#42352b]">POST /api/admin/gateways/{activeGateway.id}/verify</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom table */}
            <div className="mt-10 rounded-[26px] bg-[#fcf9f5] border border-[#dfcfbe] overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-[#eadbcc] flex items-center justify-between">
                <div className="text-[13.8px] font-[600] text-[#312a24]">Settlement watch — last 72h</div>
                <div className="text-[12.6px] text-[#7b6b5a]">Auto-retry dunning: ON • 3 attempts • 48h spacing</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-[13.35px]">
                  <thead className="text-[11.3px] uppercase tracking-wider text-[#8b7968] bg-[#f7f0e7]">
                    <tr>
                      <th className="text-left font-[600] px-5 sm:px-6 py-3">Charge</th>
                      <th className="text-left font-[600] px-5 py-3">Customer</th>
                      <th className="text-left font-[600] px-5 py-3">Plan</th>
                      <th className="text-left font-[600] px-5 py-3">Gateway</th>
                      <th className="text-left font-[600] px-5 py-3">Status</th>
                      <th className="text-right font-[600] px-5 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eaded0] text-[#2d2721]">
                    {recentCharges.map(c=>(
                      <tr key={c.id} className="hover:bg-[#fbf4ea]">
                        <td className="px-5 sm:px-6 py-3 mono text-[12.6px] text-[#5c4f41]">{c.id}</td>
                        <td className="px-5 py-3">{c.email}</td>
                        <td className="px-5 py-3 text-[#5b4f41]">{c.plan}</td>
                        <td className="px-5 py-3">{c.gateway}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[11.9px] font-[650] px-2 py-[3px] rounded-full ${
                            c.status==='succeeded' ? 'bg-[#e2f1e6] text-[#25613f]'
                            : c.status==='failed' ? 'bg-[#f8e3db] text-[#a43a2b]'
                            : 'bg-[#f3e8cf] text-[#775621]'
                          }`}>
                            {c.status.replace('_',' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-[600]">{c.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="mt-12 text-[12.6px] text-[#948577] flex flex-wrap items-center gap-x-7 gap-y-2">
              <span>© Vault Ops</span>
              <span>PCI-DSS SAQ-A</span>
              <span>Region: ap-south-1</span>
              <span>Node API: api.vaulthq.run</span>
              <span className="text-[#bc4b2b]">2FA enforced</span>
            </footer>
          </main>
        </div>
      </div>

      {showAddGateway && (
        <AddGatewayModal
          installedIds={gateways.map(g=>g.id)}
          onClose={()=>setShowAddGateway(false)}
          onAdd={(id) => {
            const c = CATALOG.find(x=>x.id===id)!;
            const newGw: GatewayConfig = {
              id,
              name: c.name,
              label: c.label,
              status: 'disconnected',
              environment: 'test',
              publishableKey: '',
              secretKey: '',
              webhookSecret: '',
              currencies: id==='razorpay' ? ['INR'] : id==='paystack' ? ['NGN'] : ['USD'],
              webhookUrl: `https://api.vaulthq.run/webhooks/${id}`,
              lastCheckedAt: null,
              lastError: null,
              autoCapture: true,
              enabled: false,
            };
            setGateways(g => [...g, newGw]);
            setActiveGatewayId(id);
            setShowAddGateway(false);
            setToast(`${c.name} added — enter your API keys`);
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-[#1b1816] text-[#f6efe5] text-[13.4px] px-4 py-3 rounded-[14px] shadow-xl max-w-[380px]">
          {toast}
        </div>
      )}
    </div>
  );
}

function GatewayConfigForm({ gateway, catalog, onChange, onVerified, onSaved }: {
  gateway: GatewayConfig,
  catalog: GatewayCatalog,
  onChange: (p: Partial<GatewayConfig>) => void,
  onVerified: (result: { ok: boolean; account?: string; message: string; checkedAt: string }) => void,
  onSaved: (msg: string) => void
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);

  const runTest = async () => {
    setFieldError(null);
    setTesting(true);
    const result = await verifyGateway(gateway.id, {
      publishableKey: gateway.publishableKey,
      secretKey: gateway.secretKey,
      webhookSecret: gateway.webhookSecret,
      environment: gateway.environment,
    });
    setTesting(false);
    if (!result.ok && result.code === 'invalid_key_format') {
      // Re-run shape check to know which field
      const shape = validateKeyShape(gateway.id, {
        publishableKey: gateway.publishableKey,
        secretKey: gateway.secretKey,
        environment: gateway.environment,
      });
      if (!shape.ok) setFieldError({ field: shape.field, message: shape.message });
    }
    onVerified(result);
  };

  const handleSave = async () => {
    setFieldError(null);
    // Always validate shape before persisting — prevents saving bad keys.
    const shape = validateKeyShape(gateway.id, {
      publishableKey: gateway.publishableKey,
      secretKey: gateway.secretKey,
      environment: gateway.environment,
    });
    if (!shape.ok) {
      setFieldError({ field: shape.field, message: shape.message });
      onSaved(shape.message);
      return;
    }
    setSaving(true);
    const result = await saveGatewayCredentials(gateway.id, {
      publishableKey: gateway.publishableKey,
      secretKey: gateway.secretKey,
      webhookSecret: gateway.webhookSecret,
      environment: gateway.environment,
      autoCapture: gateway.autoCapture,
      currencies: gateway.currencies,
    });
    setSaving(false);
    onSaved(result.message);
  };

  const secretIsMasked = gateway.secretKey.includes('•');
  const pubIsMasked = gateway.publishableKey.includes('•');

  return (
    <div className="space-y-7">
      {/* Environment toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11.7px] uppercase tracking-wider text-[#887869]">Environment</div>
          <div className="mt-2 inline-flex rounded-full bg-[#f1e7d9] p-1 border border-[#decfbc]">
            {(['test','live'] as const).map(env => (
              <button
                key={env}
                onClick={()=>onChange({ environment: env })}
                className={`px-4 py-[7px] rounded-full text-[13.1px] font-[600] transition ${
                  gateway.environment === env ? 'bg-white shadow text-[#231e1a]' : 'text-[#6d5c4a]'
                }`}
              >
                {env === 'test' ? 'Test' : 'Live'}
              </button>
            ))}
          </div>
        </div>
        <div className="text-[12.55px] text-[#6b5b49]">
          Webhook endpoint<br/>
          <span className="mono text-[#3b3026]">{gateway.webhookUrl}</span>
          <button
            onClick={() => {navigator.clipboard.writeText(gateway.webhookUrl); onSaved('Webhook URL copied');}}
            className="ml-2 text-[#b94a2b] font-[600] hover:underline"
          >Copy</button>
        </div>
      </div>

      {/* API Key & Secret */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="text-[12.9px] font-[600] text-[#3a3027]">{catalog.keyLabel}</label>
          <input
            value={gateway.publishableKey}
            onChange={e => { onChange({ publishableKey: e.target.value }); if (fieldError?.field==='publishableKey') setFieldError(null); }}
            onFocus={() => { if (pubIsMasked) onChange({ publishableKey: '' }); }}
            placeholder={gateway.id === 'stripe' ? 'pk_live_51…' : gateway.id==='razorpay' ? 'rzp_live_…' : 'Enter key…'}
            className={`mt-2 w-full rounded-[13px] bg-white border px-4 py-[12px] mono text-[13.35px] outline-none focus:ring-4 focus:ring-[#f1e0cf] ${fieldError?.field==='publishableKey' ? 'border-[#c74a2c] focus:border-[#c74a2c]' : 'border-[#d6c7b6] focus:border-[#cdb297]'}`}
          />
          <div className={`mt-1.5 text-[12.1px] ${fieldError?.field==='publishableKey' ? 'text-[#a93c22] font-[600]' : 'text-[#847566]'}`}>
            {fieldError?.field==='publishableKey' ? fieldError.message : 'Public / publishable. Safe for client SDKs.'}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-[12.9px] font-[600] text-[#3a3027]">{catalog.secretLabel}</label>
            <button onClick={()=> setShowSecret(s=>!s)} className="text-[12.2px] text-[#b84a2b] font-[600]">
              {showSecret ? 'Hide' : 'Reveal'}
            </button>
          </div>
          <input
            type={showSecret ? 'text' : 'password'}
            autoComplete="off"
            value={gateway.secretKey}
            /* BUG FIX: previously this onChange also wrote publishableKey, which
               wiped the public key on every keystroke in the secret field. */
            onChange={e => { onChange({ secretKey: e.target.value }); if (fieldError?.field==='secretKey') setFieldError(null); }}
            onFocus={() => { if (secretIsMasked) onChange({ secretKey: '' }); }}
            placeholder={gateway.id === 'stripe' ? 'sk_live_51…' : gateway.id==='razorpay' ? '••••••••••••••••••••' : 'Enter secret…'}
            className={`mt-2 w-full rounded-[13px] bg-white border px-4 py-[12px] mono text-[13.35px] outline-none focus:ring-4 focus:ring-[#f1e0cf] ${fieldError?.field==='secretKey' ? 'border-[#c74a2c] focus:border-[#c74a2c]' : 'border-[#d6c7b6] focus:border-[#cdb297]'}`}
          />
          <div className={`mt-1.5 text-[12.1px] ${fieldError?.field==='secretKey' ? 'text-[#a93c22] font-[600]' : 'text-[#847566]'}`}>
            {fieldError?.field==='secretKey' ? fieldError.message : 'Server-side only. Stored encrypted in your Node backend.'}
          </div>
        </div>
      </div>

      {/* Webhook secret */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="text-[12.9px] font-[600] text-[#3a3027]">Webhook signing secret <span className="text-[#958777] font-[500]">(optional)</span></label>
          <input
            value={gateway.webhookSecret}
            onChange={e => onChange({ webhookSecret: e.target.value })}
            placeholder="whsec_…"
            className="mt-2 w-full rounded-[13px] bg-white border border-[#d6c7b6] px-4 py-[12px] mono text-[13.35px] outline-none focus:ring-4 focus:ring-[#f1e0cf] focus:border-[#cdb297]"
          />
        </div>
        <div>
          <label className="text-[12.9px] font-[600] text-[#3a3027]">Currencies</label>
          <input
            value={gateway.currencies.join(', ')}
            onChange={e => onChange({ currencies: e.target.value.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean) })}
            className="mt-2 w-full rounded-[13px] bg-white border border-[#d6c7b6] px-4 py-[12px] mono text-[13.35px] outline-none focus:ring-4 focus:ring-[#f1e0cf] focus:border-[#cdb297]"
            placeholder="USD, EUR, INR"
          />
        </div>
      </div>

      <label className="flex items-center gap-3 text-[13.4px] text-[#3a3027]">
        <input type="checkbox" checked={gateway.autoCapture} onChange={e=>onChange({ autoCapture: e.target.checked })} className="h-[16px] w-[16px] accent-[#cc502f]" />
        Auto-capture payments immediately (disable for manual review / rental holds)
      </label>

      {/* Action row */}
      <div className="flex flex-wrap gap-3 pt-2">
        <button
          onClick={runTest}
          disabled={testing || saving}
          className="rounded-full bg-[#1c1714] text-[#f4efe7] px-5 py-[11px] text-[13.7px] font-[650] hover:bg-black transition disabled:opacity-70"
        >
          {testing ? 'Testing…' : 'Test connection'}
        </button>
        <button
          onClick={handleSave}
          disabled={testing || saving}
          className="rounded-full bg-[#fcf9f5] border border-[#d4c5b4] px-5 py-[11px] text-[13.7px] font-[650] text-[#2b2521] hover:bg-white disabled:opacity-70"
        >
          {saving ? 'Saving…' : 'Save credentials'}
        </button>
        <a href={catalog.docs} target="_blank" rel="noreferrer" className="rounded-full px-4 py-[11px] text-[13.3px] text-[#785d4b] hover:text-[#2c221b]">
          {catalog.name} docs ↗
        </a>
      </div>

      <div className="rounded-[14px] bg-[#f7f0e7] border border-[#e2d1c0] px-4 py-3 text-[12.65px] text-[#6b5846]">
        <span className="font-[700] text-[#3a2c20]">Node.js (Express) — how this is wired:</span>
        <pre className="mono text-[11.7px] leading-relaxed mt-2 text-[#4d3c2b] overflow-auto">{`// POST /api/admin/gateways/${gateway.id}/verify
// body: { publishableKey, secretKey, environment }
import Stripe from 'stripe'
const stripe = new Stripe(req.body.secretKey)
try {
  const acct = await stripe.balance.retrieve()
  res.json({ ok: true, account: acct.id })
} catch (e) {
  res.status(401).json({ ok: false, code: '401_unauthorized', message: e.message })
}
// Then PUT /api/admin/gateways/${gateway.id} to persist (AES-GCM + KMS)`}</pre>
      </div>
    </div>
  );
}

function GatewayStatusPill({ status }: { status: GatewayStatus }) {
  const map = {
    connected: { label: 'Connected', cls: 'bg-[#dff0e5] text-[#23623c]' },
    test: { label: 'Test mode', cls: 'bg-[#f1e6cf] text-[#775321]' },
    error: { label: 'Failed', cls: 'bg-[#f8ddd5] text-[#a4321f]' },
    disconnected: { label: 'Offline', cls: 'bg-[#ece3d7] text-[#6b5b49]' },
  }[status];
  return <span className={`text-[11.35px] font-[700] px-[9px] py-[3.5px] rounded-full ${map.cls}`}>{map.label}</span>;
}

function DiagnosticItem({ label, ok, warnText }: { label: string; ok: boolean; warnText?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-[8px] w-[8px] rounded-full ${ok ? 'bg-[#308454]' : 'bg-[#d2b08b]'}`} />
      <span className={ok ? 'text-[#2d2721]' : 'text-[#81685a]'}>
        {label}{!ok && warnText ? ` · ${warnText}` : ''}
      </span>
    </div>
  );
}

function AddGatewayModal({ installedIds, onClose, onAdd }: {
  installedIds: GatewayId[],
  onClose: () => void,
  onAdd: (id: GatewayId) => void
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-[#221c17]/45" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[530px] bg-[#fcf9f5] border-l border-[#decfc0] shadow-2xl overflow-y-auto">
        <div className="px-7 pt-7 pb-5 border-b border-[#eadbc9] flex items-center justify-between">
          <div>
            <div className="text-[11.5px] uppercase tracking-wider text-[#8a7b6b]">Payments / Add</div>
            <div className="display text-[28px]">Add a payment gateway</div>
          </div>
          <button onClick={onClose} className="text-[#877666] hover:text-black">✕</button>
        </div>
        <div className="px-7 py-6 space-y-3">
          {CATALOG.map(c => {
            const installed = installedIds.includes(c.id);
            return (
              <div key={c.id} className="flex items-center justify-between rounded-[16px] border border-[#e1cfbb] bg-white px-4 py-4">
                <div>
                  <div className="font-[650]">{c.name} <span className="text-[#847566] font-[500]">· {c.countries}</span></div>
                  <div className="text-[13.1px] text-[#65594a]">{c.blurb}</div>
                </div>
                <button
                  disabled={installed}
                  onClick={()=> onAdd(c.id)}
                  className={`rounded-full px-3.5 py-[7.5px] text-[12.7px] font-[650] border transition ${
                    installed
                      ? 'bg-[#f3e9de] text-[#977667] border-[#e2cfbe] cursor-not-allowed'
                      : 'bg-[#1b1715] text-[#f6efe5] border-[#1b1715] hover:bg-black'
                  }`}
                >
                  {installed ? 'Added' : 'Add'}
                </button>
              </div>
            );
          })}
          <div className="pt-2 text-[12.7px] text-[#7d6b5a]">
            Keys you enter are sent to <span className="mono">/api/admin/gateways</span> and encrypted at rest. They never hit the browser in production.
          </div>
        </div>
      </div>
    </div>
  );
}

/* — icons — */
function IconGrid({ active }: { active: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}><rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/></svg>; }
function IconFilm({ active }: { active: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7}><rect x="2" y="2" width="20" height="20" rx="2.3"/><path d="M7 2v20M17 2v20M2 7h20M2 12h20M2 17h20"/></svg>; }
function IconUsers({ active }: { active: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.15 : 1.7}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="3.2"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a3.2 3.2 0 0 1 0 6.26"/></svg>; }
function IconCard({ active }: { active: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.15 : 1.7}><rect x="2" y="5" width="20" height="14" rx="2.2"/><path d="M2 10h20"/></svg>; }
function IconChart({ active }: { active: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.15 : 1.7}><path d="M3 20V10"/><path d="M9 20V4"/><path d="M15 20v-7"/><path d="M21 20V13"/></svg>; }
function IconShield({ active }: { active: boolean }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.15 : 1.7}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
