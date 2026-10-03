import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
