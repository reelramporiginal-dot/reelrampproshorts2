import { supabase } from './supabase.js';

export const FREE_EPISODES = parseInt(process.env.FREE_EPISODES || '5', 10);
export const UNLOCK_COINS = parseInt(process.env.UNLOCK_COINS || '10', 10);

export const isFreeEpisode = v => !v.is_premium || Number(v.episode_number) <= FREE_EPISODES;

export async function hasActiveSubscription(userId) {
  const { data } = await supabase.from('subscriptions').select('id')
    .eq('user_id', userId).eq('status', 'active').gt('expires_at', new Date().toISOString()).limit(1).maybeSingle();
  return !!data;
}

export async function hasUnlock(userId, videoId) {
  const { data } = await supabase.from('episode_unlocks').select('id').eq('user_id', userId).eq('video_id', videoId).maybeSingle();
  return !!data;
}
