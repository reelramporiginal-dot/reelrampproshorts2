
import type { SeriesGroup } from '../types';

export const FREE_EPISODES = 5;

const PALETTE: [string, string][] = [
  ['#7a2a3c', '#1a0d18'], ['#9a5a2c', '#241008'], ['#2c6a7a', '#08181e'],
  ['#6a2c9a', '#12081e'], ['#9a8a2c', '#1e1a08'], ['#2c4a9a', '#080e1e'],
];

// Series without a poster still get a stable, premium-looking gradient.
export function gradientFor(title: string) {
  let h = 0;
  for (const c of title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const [a, b] = PALETTE[h % PALETTE.length];
  return `radial-gradient(90% 60% at 60% 25%, ${a}, transparent 75%), ${b}`;
}

export const seriesPath = (title: string) => `/v2/series/${encodeURIComponent(title)}`;
export const watchPath = (id: number) => `/v2/watch/${id}`;

export const avgSeconds = (g: SeriesGroup) =>
  g.episodes.length ? g.episodes.reduce((s, e) => s + (e.duration_seconds || 0), 0) / g.episodes.length : 0;

export function badgeFor(g: SeriesGroup): 'FREE' | 'NEW' | '' {
  if (g.episodes.length && g.episodes.every(e => !e.is_premium)) return 'FREE';
  const newest = Math.max(...g.episodes.map(e => new Date(e.created_at).getTime() || 0));
  return Date.now() - newest < 7 * 86400000 ? 'NEW' : '';
}

export const isLocked = (episodeNumber: number, isPremiumEp: boolean, userPremium: boolean) =>
  isPremiumEp && episodeNumber > FREE_EPISODES && !userPremium;
