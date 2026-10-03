import { useQuery, type QueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export type Playback = { url: string; kind: 'hls' | 'mp4'; expires_at: number };

const fetchPlayback = (id: number) => api<Playback>('playback', { method: 'POST', body: { video_id: id } });
const STALE = 30 * 60_000; // server URL lives 1h

export const usePlayback = (id: number | null) =>
  useQuery({ queryKey: ['playback', id], queryFn: () => fetchPlayback(id as number), enabled: id != null, staleTime: STALE, retry: false });

// Warm the next episode's signed URL so swipe-to-next starts fast.
export const prefetchPlayback = (qc: QueryClient, id: number) =>
  qc.prefetchQuery({ queryKey: ['playback', id], queryFn: () => fetchPlayback(id), staleTime: STALE });

