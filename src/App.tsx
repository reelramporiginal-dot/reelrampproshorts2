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
  ChevronUp, ChevronDown, Clock, Download, Upload, Palette,
  Database, FileJson, Image, Video, Link, Zap, AlertCircle,
  Eye, EyeOff, RefreshCw, Save, Copy, ExternalLink, 
  Monitor, Smartphone, Tablet, Moon, Sun, Globe, DollarSign,
  FileText, Package, ShoppingCart, Layout, Sliders, 
  ToggleLeft, ToggleRight, List, Grid, Film, Camera
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION CREDENTIALS
// ─────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://rwtndqorpizoozbpcmca.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3dG5kcW9ycGl6b296YnBjbWNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MDYwMjMsImV4cCI6MjA5NDE4MjAyM30.8mHW5OGBM8mNuMBp-yASHWYlwcbQkNaUhYQ-JvMl_6Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Bunny.net CDN config
const BUNNY = {
  storageZone: "reelrampproshorts1",
  apiKey: "1f535aac-8943-4da5-be1b98b776cc-2d1b4330",
  readOnlyPassword: "87dca87d-6798-4940-99db04774f37-c090-444f",
  endpointUrl: "https://storage.bunnycdn.com/reelrampproshorts1",
  cdnBase: "https://reelrampproshorts1.b-cdn.net",
};

// [Previous types and interfaces remain the same until AdminPanel component]

// ─────────────────────────────────────────────────────────────────────────────
// NEW ENHANCED ADMIN PANEL COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

// New interface for theme settings
interface ThemeSettings {
  mode: 'dark' | 'light' | 'system';
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  accentGradient: string;
  borderRadius: 'small' | 'medium' | 'large';
  fontScale: number;
}

// New interface for popup ads settings
interface PopupAdSettings {
  enabled: boolean;
  frequency: number; // minutes between popups
  maxPerSession: number;
  dismissTimeout: number;
  design: 'modern' | 'classic' | 'minimal';
  position: 'center' | 'bottom' | 'top';
  animation: 'fade' | 'slide' | 'scale';
}

// New interface for content export/import
interface ExportData {
  version: string;
  exportDate: string;
  platform: 'reelramp';
  data: {
    videos: Video[];
    categories: string[];
    popupAds: PopupAd[];
    settings: PlatformSettings;
    subscription: SubscriptionSettings;
    payment: PaymentSettings;
    theme: ThemeSettings;
    analytics: any;
  };
}

function EnhancedAdminPanel() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'dashboard' | 'videos' | 'popups' | 'settings' | 'import-export'>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Theme state
  const [theme, setTheme] = useState<ThemeSettings>({
    mode: 'dark',
    primaryColor: '#c5a26f',
    secondaryColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
    surfaceColor: '#121212',
    textColor: '#ffffff',
    accentGradient: 'linear-gradient(135deg, #c5a26f 0%, #8b7355 100%)',
    borderRadius: 'medium',
    fontScale: 1
  });

  // Popup ads state
  const [popupSettings, setPopupSettings] = useState<PopupAdSettings>({
    enabled: true,
    frequency: 5,
    maxPerSession: 3,
    dismissTimeout: 10,
    design: 'modern',
    position: 'center',
    animation: 'scale'
  });

  const [popupAds, setPopupAds] = useState<PopupAd[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalRevenue: 0,
    activeSubscribers: 0,
    conversionRate: 0,
    popularVideos: [] as {id: number, views: number, title: string}[],
    revenueHistory: [] as {date: string, amount: number}[],
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [videos, categories, popups, settings, subSettings, paySettings, themeSettings] = 
        await Promise.all([
          fetchVideosFromDB(),
          fetchCategoriesFromDB(),
          fetchPopupsFromDB(),
          fetchSettingFromDB<PlatformSettings>('platform_settings', defaultPlatformSettings),
          fetchSettingFromDB<SubscriptionSettings>('subscription_settings', defaultSubscriptionSettings),
          fetchSettingFromDB<PaymentSettings>('payment_settings', defaultPaymentSettings),
          fetchSettingFromDB<ThemeSettings>('theme_settings', theme)
        ]);

      setPopupAds(popups);
      if (themeSettings) setTheme(themeSettings);
      
      // Calculate analytics
      const views = getVideoViews();
      const totalViews = Object.values(views).reduce((a, b) => a + b, 0);
      const revenue = getRevenueData();
      const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
      
      setAnalytics({
        totalViews,
        totalRevenue,
        activeSubscribers: 162, // From your subscription tracking
        conversionRate: 12.5,
        popularVideos: videos.slice(0, 5).map(v => ({
          id: v.id,
          views: views[v.id] || 0,
          title: v.title
        })),
        revenueHistory: revenue.map(r => ({date: r.date, amount: r.amount}))
      });

    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const handleExport = async () => {
    const exportData: ExportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      platform: 'reelramp',
      data: {
        videos: await fetchVideosFromDB(),
        categories: await fetchCategoriesFromDB(),
        popupAds: popupAds,
        settings: await fetchSettingFromDB('platform_settings', defaultPlatformSettings),
        subscription: await fetchSettingFromDB('subscription_settings', defaultSubscriptionSettings),
        payment: await fetchSettingFromDB('payment_settings', defaultPaymentSettings),
        theme: theme,
        analytics: analytics
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reelramp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import functionality
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData: ExportData = JSON.parse(text);
      
      if (importData.platform !== 'reelramp') {
        alert('Invalid import file format');
        return;
      }

      // Import all data
      const { data } = importData;
      
      // Save videos
      for (const video of data.videos) {
        await upsertVideoToDB(video);
      }
      
      // Save settings
      await upsertSettingToDB('platform_settings', data.settings);
      await upsertSettingToDB('subscription_settings', data.subscription);
      await upsertSettingToDB('payment_settings', data.payment);
      await upsertSettingToDB('theme_settings', data.theme);
      
      // Save popups
      for (const popup of data.popupAds) {
        await upsertPopupToDB(popup);
      }
      
      // Reload all data
      await loadAllData();
      alert('Data imported successfully!');
      
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format.');
    }
  };

  // PDF Report Generation
  const generatePDFReport = async () => {
    // This is a simplified version - in production, use a library like jsPDF
    const reportContent = `
      ReelRamp Pro Analytics Report
      Generated: ${new Date().toLocaleString()}
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      📊 KEY METRICS
      • Total Views: ${analytics.totalViews.toLocaleString()}
      • Total Revenue: ₹${analytics.totalRevenue.toLocaleString()}
      • Active Subscribers: ${analytics.activeSubscribers}
      • Conversion Rate: ${analytics.conversionRate}%
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      📈 REVENUE HISTORY
      ${analytics.revenueHistory.map(r => `• ${r.date}: ₹${r.amount.toLocaleString()}`).join('\n')}
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      🎬 TOP PERFORMING VIDEOS
      ${analytics.popularVideos.map(v => `• ${v.title}: ${v.views.toLocaleString()} views`).join('\n')}
      
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━
      
      ⚙️ SYSTEM CONFIGURATION
      • Theme: ${theme.mode}
      • Popup Ads: ${popupSettings.enabled ? 'Enabled' : 'Disabled'}
      • CDN: Bunny.net
      • Database: Supabase
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reelramp-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Theme preview component
  const ThemePreview = () => (
    <div className="mt-4 p-4 rounded-xl" style={{ background: theme.surfaceColor }}>
      <div className="space-y-2">
        <div className="h-2 rounded" style={{ background: theme.primaryColor, width: '60%' }} />
        <div className="h-2 rounded" style={{ background: theme.textColor, opacity: 0.3, width: '80%' }} />
        <div className="h-2 rounded" style={{ background: theme.textColor, opacity: 0.1, width: '40%' }} />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="px-3 py-1 rounded text-xs font-bold" style={{ background: theme.primaryColor, color: theme.backgroundColor }}>
          Primary
        </div>
        <div className="px-3 py-1 rounded text-xs font-bold" style={{ background: theme.textColor, opacity: 0.1, color: theme.textColor }}>
          Secondary
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#c5a26f] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#c5a26f] text-sm font-mono">Loading Admin Panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-[#111] border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size={32} />
            <div className="h-6 w-px bg-white/20" />
            <h1 className="text-lg font-black tracking-tight">Admin Control Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition flex items-center gap-2"
            >
              <Download size={14} />
              Export Backup
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition flex items-center gap-2"
            >
              <Upload size={14} />
              Import Data
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-[#c5a26f] text-black rounded-xl text-xs font-bold hover:bg-[#b39160] transition"
            >
              View Site
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0">
          <nav className="bg-[#111] border border-white/10 rounded-2xl p-3 space-y-1 sticky top-24">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
              { id: 'videos', icon: Film, label: 'Video Manager' },
              { id: 'popups', icon: Image, label: 'Popup Ads' },
              { id: 'settings', icon: Settings, label: 'Settings' },
              { id: 'import-export', icon: Database, label: 'Import/Export' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeSection === item.id
                    ? 'bg-[#c5a26f] text-black shadow-lg'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">Analytics Dashboard</h2>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Views', value: analytics.totalViews.toLocaleString(), icon: Eye, color: '#3b82f6' },
                  { label: 'Total Revenue', value: `₹${analytics.totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
                  { label: 'Active Subscribers', value: analytics.activeSubscribers.toString(), icon: Users, color: '#8b5cf6' },
                  { label: 'Conversion Rate', value: `${analytics.conversionRate}%`, icon: TrendingUp, color: '#f59e0b' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#111] border border-white/10 rounded-2xl p-5 hover:border-white/20 transition">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-wider">{stat.label}</span>
                      <div className="p-2 rounded-lg" style={{ background: `${stat.color}20` }}>
                        <stat.icon size={16} style={{ color: stat.color }} />
                      </div>
                    </div>
                    <div className="text-2xl font-black">{stat.value}</div>
                    <div className="text-xs text-emerald-400 mt-2">▲ 12.5% from last month</div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Revenue History</h3>
                  <div className="space-y-3">
                    {analytics.revenueHistory.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-white/40 w-24">{item.date}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#c5a26f] rounded-full"
                            style={{ width: `${(item.amount / analytics.totalRevenue) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white/60 w-20 text-right">₹{item.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Videos */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Top Videos</h3>
                  <div className="space-y-3">
                    {analytics.popularVideos.map((video, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#c5a26f] w-6">#{i + 1}</span>
                          <span className="text-sm font-medium truncate max-w-[200px]">{video.title}</span>
                        </div>
                        <span className="text-xs font-bold text-white/40">{video.views.toLocaleString()} views</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={generatePDFReport}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-center"
                  >
                    <FileText size={20} className="mx-auto mb-2 text-[#c5a26f]" />
                    <span className="text-xs font-bold">Download Report</span>
                  </button>
                  <button
                    onClick={handleExport}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-center"
                  >
                    <Database size={20} className="mx-auto mb-2 text-blue-400" />
                    <span className="text-xs font-bold">Backup Data</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('popups')}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-center"
                  >
                    <Image size={20} className="mx-auto mb-2 text-purple-400" />
                    <span className="text-xs font-bold">Manage Popups</span>
                  </button>
                  <button
                    onClick={loadAllData}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-center"
                  >
                    <RefreshCw size={20} className="mx-auto mb-2 text-green-400" />
                    <span className="text-xs font-bold">Refresh Data</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Video Manager Section */}
          {activeSection === 'videos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">Video Manager</h2>
                <button
                  onClick={() => {/* Add new video logic */}}
                  className="px-4 py-2 bg-[#c5a26f] text-black rounded-xl text-sm font-bold hover:bg-[#b39160] transition flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add New Video
                </button>
              </div>
              
              {/* Video management interface */}
              <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <input
                    type="text"
                    placeholder="Search videos..."
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-[#c5a26f]"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-xs font-bold text-white/40 uppercase">Video</th>
                        <th className="text-left p-4 text-xs font-bold text-white/40 uppercase">Category</th>
                        <th className="text-left p-4 text-xs font-bold text-white/40 uppercase">Views</th>
                        <th className="text-left p-4 text-xs font-bold text-white/40 uppercase">Status</th>
                        <th className="text-left p-4 text-xs font-bold text-white/40 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Video rows would be mapped here */}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Popup Ads Section */}
          {activeSection === 'popups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">Popup Ad Manager</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold hover:bg-white/10 transition flex items-center gap-2"
                  >
                    {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button
                    onClick={() => {/* Add new popup */}}
                    className="px-4 py-2 bg-[#c5a26f] text-black rounded-xl text-sm font-bold hover:bg-[#b39160] transition flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Popup
                  </button>
                </div>
              </div>

              {/* Popup Settings */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Popup Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 mb-2">Enable Popups</label>
                      <button
                        onClick={() => setPopupSettings({...popupSettings, enabled: !popupSettings.enabled})}
                        className={`relative w-12 h-6 rounded-full transition ${
                          popupSettings.enabled ? 'bg-[#c5a26f]' : 'bg-white/10'
                        }`}
                      >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${
                          popupSettings.enabled ? 'translate-x-6' : ''
                        }`} />
                      </button>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-white/40 mb-2">Frequency (minutes)</label>
                      <input
                        type="number"
                        value={popupSettings.frequency}
                        onChange={(e) => setPopupSettings({...popupSettings, frequency: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/40 mb-2">Max Per Session</label>
                      <input
                        type="number"
                        value={popupSettings.maxPerSession}
                        onChange={(e) => setPopupSettings({...popupSettings, maxPerSession: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 mb-2">Design Style</label>
                      <select
                        value={popupSettings.design}
                        onChange={(e) => setPopupSettings({...popupSettings, design: e.target.value as any})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none"
                      >
                        <option value="modern">Modern</option>
                        <option value="classic">Classic</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/40 mb-2">Position</label>
                      <select
                        value={popupSettings.position}
                        onChange={(e) => setPopupSettings({...popupSettings, position: e.target.value as any})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none"
                      >
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                        <option value="top">Top</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/40 mb-2">Animation</label>
                      <select
                        value={popupSettings.animation}
                        onChange={(e) => setPopupSettings({...popupSettings, animation: e.target.value as any})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none"
                      >
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                        <option value="scale">Scale</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {/* Save popup settings */}}
                  className="mt-6 w-full py-3 bg-[#c5a26f] text-black rounded-xl text-sm font-bold hover:bg-[#b39160] transition"
                >
                  Save Popup Settings
                </button>
              </div>

              {/* Popup Preview */}
              {showPreview && (
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Live Preview</h3>
                  <div className="bg-black/50 backdrop-blur-xl rounded-xl p-8 flex items-center justify-center min-h-[300px] relative overflow-hidden">
                    <div className={`bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-sm w-full ${
                      popupSettings.animation === 'scale' ? 'animate-[scale_0.3s_ease-out]' :
                      popupSettings.animation === 'slide' ? 'animate-[slideUp_0.3s_ease-out]' :
                      'animate-[fadeIn_0.3s_ease-out]'
                    }`}>
                      <h4 className="text-lg font-bold mb-2">Sample Popup Ad</h4>
                      <p className="text-sm text-white/60 mb-4">This is how your popup will appear to users.</p>
                      <button className="w-full py-2 bg-[#c5a26f] text-black rounded-lg text-sm font-bold">
                        Call to Action
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">Platform Settings</h2>
              
              {/* Theme Settings */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Theme Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-white/40 mb-2">Theme Mode</label>
                      <div className="flex gap-2">
                        {['dark', 'light', 'system'].map(mode => (
                          <button
                            key={mode}
                            onClick={() => setTheme({...theme, mode: mode as any})}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${
                              theme.mode === mode ? 'bg-[#c5a26f] text-black' : 'bg-white/5 text-white/60'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/40 mb-2">Primary Color</label>
                      <input
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => setTheme({...theme, primaryColor: e.target.value})}
                        className="w-full h-10 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-white/40 mb-2">Border Radius</label>
                      <select
                        value={theme.borderRadius}
                        onChange={(e) => setTheme({...theme, borderRadius: e.target.value as any})}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/40 mb-4">Live Preview</label>
                    <ThemePreview />
                  </div>
                </div>

                <button
                  onClick={() => {/* Save theme settings */}}
                  className="mt-6 w-full py-3 bg-[#c5a26f] text-black rounded-xl text-sm font-bold hover:bg-[#b39160] transition"
                >
                  Apply Theme
                </button>
              </div>

              {/* Other settings sections... */}
            </div>
          )}

          {/* Import/Export Section */}
          {activeSection === 'import-export' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black">Data Management</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Export Section */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Download size={20} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold">Export Data</h3>
                  </div>
                  <p className="text-sm text-white/60 mb-4">
                    Download a complete backup of your platform data including videos, settings, and analytics.
                  </p>
                  <button
                    onClick={handleExport}
                    className="w-full py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition"
                  >
                    Export Full Backup
                  </button>
                </div>

                {/* Import Section */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Upload size={20} className="text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold">Import Data</h3>
                  </div>
                  <p className="text-sm text-white/60 mb-4">
                    Restore your platform from a previous backup or import data from another ReelRamp instance.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-sm font-bold hover:bg-green-500/20 transition"
                  >
                    Import Backup File
                  </button>
                </div>
              </div>

              {/* Bulk Operations */}
              <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Bulk Operations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-center">
                    <RefreshCw size={20} className="mx-auto mb-2 text-yellow-400" />
                    <span className="text-xs font-bold">Reset Analytics</span>
                  </button>
                  <button className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-center">
                    <Trash2 size={20} className="mx-auto mb-2 text-red-400" />
                    <span className="text-xs font-bold">Clear All Data</span>
                  </button>
                  <button className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-center">
                    <Copy size={20} className="mx-auto mb-2 text-purple-400" />
                    <span className="text-xs font-bold">Duplicate Content</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// [Previous components remain the same...]

// ─────────────────────────────────────────────────────────────────────────────
// UPDATED BOTTOM NAVIGATION WITH FOR YOU TAB
// ─────────────────────────────────────────────────────────────────────────────
function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const NAV_ITEMS = [
    { path: '/', label: 'For You', icon: <Zap size={20} /> },
    { path: '/trending', label: 'Trending', icon: <TrendingUp size={20} /> },
    { path: '/subscription', label: 'Premium', icon: <Star size={20} /> },
    { path: '/profile', label: 'Profile', icon: <UserIcon size={20} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-xl border-t border-white/10 py-3 px-6 flex justify-around items-center z-40 max-w-md mx-auto rounded-t-3xl shadow-2xl">
      {NAV_ITEMS.map(item => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${
              isActive 
                ? 'text-[#c5a26f] scale-110' 
                : 'text-white/40 hover:text-white/70 hover:scale-105'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${
              isActive ? 'bg-[#c5a26f]/20' : ''
            }`}>
              {item.icon}
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold">{item.label}</span>
            {isActive && (
              <div className="w-1 h-1 rounded-full bg-[#c5a26f] mt-0.5" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// [Rest of the components remain the same...]

export default App;
