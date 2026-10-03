import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@supabase/supabase-js';
import supabase from '../../lib/supabase';
import { api } from './client';
import type { Category, Plan, Series, SeriesGroup, Subscription, Video } from '../types';

const STALE = 60_000;

export type WatchRow = { id: number; user_id: string; video_id: number; current_position: number; completed: boolean; updated_at: string };

export const useVideos = () => useQuery({ queryKey: ['videos'], queryFn: () => api<Video[]>('videos'), staleTime: STALE });
export const useSeriesList = () => useQuery({ queryKey: ['series'], queryFn: () => api<Series[]>('series'), staleTime: STALE });
export const useCategories = () => useQuery({ queryKey: ['categories'], queryFn: () => api<Category[]>('categories'), staleTime: STALE });
export const usePlans = () => useQuery({ queryKey: ['plans'], queryFn: () => api<Plan[]>('plans'), staleTime: STALE });

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready, userId: session?.user.id ?? null };
}

// Own watch progress (logged-in only; guests get nothing).
export function useWatchHistory() {
  const { userId } = useSession();
  return useQuery({
    queryKey: ['watch_history', userId],
    queryFn: () => api<WatchRow[]>('watch_history'),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

// Like / My List flag for one video, with instant (optimistic) UI. Guests see loggedIn=false.
export function useFlag(kind: 'likes' | 'bookmarks', videoId: number | undefined) {
  const { userId } = useSession();
  const qc = useQueryClient();
  const key = [kind, userId];
  const q = useQuery({ queryKey: key, queryFn: () => api<{ video_id: number }[]>(kind), enabled: !!userId, staleTime: 30_000 });
  const on = !!videoId && (q.data || []).some(r => r.video_id === videoId);
  const m = useMutation({
    mutationFn: (next: boolean) => api(kind, { method: next ? 'POST' : 'DELETE', body: { video_id: videoId } }),
    onMutate: async (next: boolean) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<{ video_id: number }[]>(key);
      qc.setQueryData<{ video_id: number }[]>(key, (old = []) => next ? [...old, { video_id: videoId as number }] : old.filter(r => r.video_id !== videoId));
      return { prev };
    },
    onError: (_e, _n, ctx) => qc.setQueryData(key, ctx?.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
  return { on, loggedIn: !!userId, set: (next: boolean) => m.mutate(next) };
}

export type Wallet = {
  loggedIn: boolean; balance: number; unlock_cost: number; rewards: number[];
  packs: { id: number; price: number; coins: number; tag: string }[];
  checkin: { claimed_today: boolean; streak: number; day: number } | null;
  unlocked: number[];
  history: { id: number; type: 'credit' | 'debit'; coins: number; reason: string; created_at: string }[];
};

// Coins, check-in, unlocked episodes, coin packs. Works for guests too (packs only).
export function useWallet() {
  const { userId, ready } = useSession();
  return useQuery({ queryKey: ['wallet', userId], queryFn: () => api<Wallet>('wallet'), enabled: ready, staleTime: 15_000 });
}

export function useWalletActions() {
  const qc = useQueryClient();
  const refresh = () => { qc.invalidateQueries({ queryKey: ['wallet'] }); qc.invalidateQueries({ queryKey: ['playback'] }); };
  const checkin = useMutation({
    mutationFn: () => api<{ claimed: boolean; day: number; reward: number; balance: number }>('wallet', { method: 'POST', body: { action: 'checkin' } }),
    onSuccess: refresh,
  });
  const unlock = useMutation({
    mutationFn: (videoId: number) => api<{ result: 'ok' | 'already' | 'insufficient' | 'free' | 'subscribed'; balance: number }>('wallet', { method: 'POST', body: { action: 'unlock', video_id: videoId } }),
    onSuccess: refresh,
  });
  return { checkin, unlock };
}

// Active entitlement comes from the server (webhook-written). Guests get [].
export function useSubscription() {
  const { userId } = useSession();
  const q = useQuery({
    queryKey: ['subscriptions', userId],
    queryFn: () => api<Subscription[]>('subscriptions'),
    enabled: !!userId,
    staleTime: 30_000,
  });
  const active = (q.data || []).find(s => s.status === 'active' && s.expires_at && new Date(s.expires_at).getTime() > Date.now()) || null;
  return { ...q, active, isPremium: !!active };
}

// Episodes grouped by series, sorted. This is what Home / Series / Explore read.
export function useCatalog() {
  const videos = useVideos();
  const series = useSeriesList();
  const groups = useMemo<SeriesGroup[]>(() => {
    const meta = new Map((series.data || []).map(s => [s.title, s]));
    const map = new Map<string, SeriesGroup>();
    for (const v of videos.data || []) {
      const m = meta.get(v.series_title);
      const g = map.get(v.series_title) || {
        title: v.series_title, description: m?.description || '', poster: m?.poster_url || v.thumbnail_url || '',
        category: m?.category || v.category, featured: !!m?.is_featured, episodes: [],
      };
      g.episodes.push(v);
      map.set(v.series_title, g);
    }
    const out = [...map.values()];
    out.forEach(g => g.episodes.sort((a, b) => a.episode_number - b.episode_number));
    return out.sort((a, b) => Number(b.featured) - Number(a.featured) || a.title.localeCompare(b.title));
  }, [videos.data, series.data]);
  return { groups, isLoading: videos.isLoading || series.isLoading, error: videos.error || series.error };
}
