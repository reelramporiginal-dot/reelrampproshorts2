// GET  /api/wallet                      -> balance, check-in state, unlocked ids, history, coin packs (guests get packs only)
// POST /api/wallet {action:'checkin'}   -> claim today's reward
// POST /api/wallet {action:'unlock', video_id} -> spend coins on one premium episode
import { supabase } from './_lib/supabase.js';
import { setCors, getUser, fail } from './_lib/auth.js';
import { isFreeEpisode, hasActiveSubscription, UNLOCK_COINS } from './_lib/entitlement.js';

const REWARDS = [10, 10, 10, 10, 10, 10, 50]; // keep in sync with claim_checkin() in SQL

const first = d => (Array.isArray(d) ? d[0] : d);
const balanceOf = async id => {
  const { data } = await supabase.rpc('wallet_balance', { p_user: id });
  return Number(data) || 0;
};

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.setHeader('Cache-Control', 'no-store');

  try {
    const user = await getUser(req);

    if (req.method === 'GET') {
      const { data: packs } = await supabase.from('coin_packs').select('id,price,coins,tag').eq('is_active', true).order('sort_order');
      const base = { packs: packs || [], unlock_cost: UNLOCK_COINS, rewards: REWARDS };
      if (!user) return res.status(200).json({ ...base, loggedIn: false, balance: 0, checkin: null, unlocked: [], history: [] });

      const [balance, st, un, hist] = await Promise.all([
        balanceOf(user.id),
        supabase.rpc('checkin_state', { p_user: user.id }),
        supabase.from('episode_unlocks').select('video_id').eq('user_id', user.id),
        supabase.from('wallet_transactions').select('id,type,coins,reason,created_at').eq('user_id', user.id).order('id', { ascending: false }).limit(20),
      ]);
      const s = first(st.data) || { claimed_today: false, streak: 0 };
      const day = s.claimed_today ? ((s.streak - 1) % 7) + 1 : (s.streak % 7) + 1;
      return res.status(200).json({
        ...base, loggedIn: true, balance,
        checkin: { claimed_today: !!s.claimed_today, streak: s.streak, day },
        unlocked: (un.data || []).map(r => r.video_id),
        history: hist.data || [],
      });
    }

    if (req.method === 'POST') {
      if (!user) return fail(res, 401, 'login_required');
      const body = req.body || {};

      if (body.action === 'checkin') {
        const { data, error } = await supabase.rpc('claim_checkin', { p_user: user.id });
        if (error) return fail(res, 400, error.message);
        const r = first(data);
        return res.status(200).json({ claimed: !!r?.claimed, day: r?.day_no, reward: r?.reward, balance: await balanceOf(user.id) });
      }

      if (body.action === 'unlock') {
        const vid = Number(body.video_id);
        if (!Number.isInteger(vid)) return fail(res, 400, 'video_id required');
        const { data: v } = await supabase.from('videos').select('id,is_premium,episode_number,is_published').eq('id', vid).maybeSingle();
        if (!v || !v.is_published) return fail(res, 404, 'Video not found');
        if (isFreeEpisode(v)) return res.status(200).json({ result: 'free', balance: await balanceOf(user.id) });
        if (await hasActiveSubscription(user.id)) return res.status(200).json({ result: 'subscribed', balance: await balanceOf(user.id) });
        const { data, error } = await supabase.rpc('unlock_episode', { p_user: user.id, p_video: vid, p_cost: UNLOCK_COINS });
        if (error) return fail(res, 400, error.message);
        return res.status(200).json({ result: data, balance: await balanceOf(user.id) });
      }
      return fail(res, 400, 'Unknown action');
    }

    return fail(res, 405, 'Method not allowed');
  } catch (e) {
    console.error('wallet error:', e.message);
    return fail(res, 500, 'Internal server error');
  }
}
