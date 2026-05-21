import supabase from './_supabase.js';

const numericFields = new Set(['episode_number','duration_seconds','sort_order','price','duration_days','plan_id','amount','video_id','current_time','duration','watch_seconds','campaign_id','show_after_seconds','frequency_hours','reward_amount','coins','resource_id']);
const booleanFields = new Set(['is_premium','is_published','is_active','is_featured','enabled','maintenance_mode','completed','is_admin','download_enabled']);
const jsonFields = new Set(['value','features','metadata','subscription']);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sanitize(input = {}) {
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    if (key === 'id' || key === 'created_at') continue;
    if (value === undefined) continue;
    if (numericFields.has(key)) out[key] = value === '' || value === null ? null : Number(value);
    else if (booleanFields.has(key)) out[key] = Boolean(value);
    else if (jsonFields.has(key)) {
      if (typeof value === 'string') {
        try { out[key] = JSON.parse(value); } catch { out[key] = value; }
      } else out[key] = value;
    } else out[key] = value;
  }
  return out;
}

function applyDefault(resource, body) {
  const now = new Date().toISOString();
  const base = sanitize(body);
  if (resource === 'users') return { guest_id: body.guest_id || '', display_name: body.display_name || 'Guest Viewer', email: body.email || '', role: body.role || 'viewer', is_admin: !!body.is_admin };
  if (resource === 'subscriptions') return { user_id: body.user_id || '', plan: body.plan || 'monthly', status: body.status || 'active', expires_at: body.expires_at || new Date(Date.now() + 30 * 86400000).toISOString() };
  if (resource === 'platform_settings') return { site_name: body.site_name || 'ReelRamp Pro', hero_title: body.hero_title || '', hero_subtitle: body.hero_subtitle || '', pwa_message: body.pwa_message || '', maintenance_mode: !!body.maintenance_mode, updated_at: now };
  if (resource === 'popup_settings') return { title: body.title || 'Promo', message: body.message || '', cta_label: body.cta_label || 'Open', cta_url: body.cta_url || '#', enabled: body.enabled !== false, updated_at: now };
  if (resource === 'categories') return { name: body.name || 'Category', slug: body.slug || String(body.name || 'category').toLowerCase().replace(/[^a-z0-9]+/g, '-'), icon: body.icon || '🎬', sort_order: Number(body.sort_order || 0), is_active: body.is_active !== false };
  if (resource === 'series') return { title: body.title || 'Untitled Series', description: body.description || '', poster_url: body.poster_url || '', category: body.category || 'Drama', status: body.status || 'published', sort_order: Number(body.sort_order || 0), is_featured: !!body.is_featured };
  if (resource === 'plans') return { name: body.name || 'Premium', price: Number(body.price || 99), duration_days: Number(body.duration_days || 30), features: body.features || [], is_active: body.is_active !== false, sort_order: Number(body.sort_order || 0) };
  if (resource === 'banners') return { title: body.title || 'Banner', subtitle: body.subtitle || '', image_url: body.image_url || '', cta_label: body.cta_label || 'Watch', cta_action: body.cta_action || 'forYou', is_active: body.is_active !== false, sort_order: Number(body.sort_order || 0) };
  if (resource === 'payments') return { user_id: body.user_id || '', plan_id: body.plan_id ? Number(body.plan_id) : null, amount: Number(body.amount || 0), gateway: body.gateway || 'manual', status: body.status || 'pending', transaction_id: body.transaction_id || '', notes: body.notes || '' };
  if (resource === 'watch_history') return { user_id: body.user_id || '', video_id: Number(body.video_id || 0), current_time: Number(body.current_time || 0), duration: Number(body.duration || 0), completed: !!body.completed, updated_at: now };
  if (resource === 'likes' || resource === 'bookmarks') return { user_id: body.user_id || '', video_id: Number(body.video_id || 0) };
  if (resource === 'video_views') return { user_id: body.user_id || '', video_id: Number(body.video_id || 0), watch_seconds: Number(body.watch_seconds || 0), completed: !!body.completed, device: body.device || 'web' };
  if (resource === 'promo_campaigns') return { title: body.title || 'Special Offer', subtitle: body.subtitle || '', celebrity_name: body.celebrity_name || '', video_filename: body.video_filename || '', poster_url: body.poster_url || '', offer_text: body.offer_text || '', cta_label: body.cta_label || 'View Plan', cta_action: body.cta_action || 'plans', placement: body.placement || 'app_open', show_after_seconds: Number(body.show_after_seconds || 2), frequency_hours: Number(body.frequency_hours || 12), is_active: body.is_active !== false, sort_order: Number(body.sort_order || 0), start_at: body.start_at || null, end_at: body.end_at || null, target: body.target || 'free_users', updated_at: now };
  if (resource === 'legal_policies') return { title: body.title || 'Policy', body: body.body || '', type: body.type || 'policy', version: body.version || '2026.1', is_published: body.is_published !== false, updated_at: now };
  if (resource === 'admin_settings') return { key: body.key || 'setting', value: body.value || {}, updated_at: now };
  if (resource === 'help_articles') return { title: body.title || 'Help article', body: body.body || '', category: body.category || 'General', is_published: body.is_published !== false, sort_order: Number(body.sort_order || 0) };
  return base;
}

export default async function handleResource(req, res, resource) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    if (req.method === 'GET') {
      let query = supabase.from(resource).select('*');
      if (['categories','series','banners','plans','help_articles'].includes(resource)) query = query.order('sort_order', { ascending: true });
      else if (resource === 'users' && req.query.guest_id) query = query.eq('guest_id', req.query.guest_id);
      else if (['subscriptions','payments','watch_history','likes','bookmarks','wallet_transactions','referrals'].includes(resource) && req.query.user_id) query = query.eq(resource === 'referrals' ? 'referrer_id' : 'user_id', req.query.user_id);
      else query = query.order('id', { ascending: true });
      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data || []);
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      if (resource === 'users' && body.guest_id) {
        const existing = await supabase.from('users').select('*').eq('guest_id', body.guest_id).limit(1);
        if (existing.error) throw existing.error;
        if (existing.data?.[0]) return res.status(200).json(existing.data[0]);
      }
      const payload = applyDefault(resource, body);
      const { data, error } = await supabase.from(resource).insert(payload).select().single();
      if (error) throw error;
      await supabase.from('audit_logs').insert({ actor: body.actor || 'system', action: 'create', resource, resource_id: data?.id || null, metadata: { via: 'resource_api' } });
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, ...updates } = req.body || {};
      if (!id) return res.status(400).json({ error: 'id required' });
      const set = sanitize(updates);
      if (['platform_settings','popup_settings','admin_settings','promo_campaigns','legal_policies'].includes(resource)) set.updated_at = new Date().toISOString();
      const { data, error } = await supabase.from(resource).update(set).eq('id', id).select().single();
      if (error) throw error;
      await supabase.from('audit_logs').insert({ actor: updates.actor || 'admin', action: 'update', resource, resource_id: Number(id), metadata: { fields: Object.keys(set) } });
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id, user_id, video_id } = req.body || {};
      let query = supabase.from(resource).delete();
      if (id) query = query.eq('id', id);
      else if ((resource === 'likes' || resource === 'bookmarks') && user_id && video_id) query = query.eq('user_id', user_id).eq('video_id', video_id);
      else return res.status(400).json({ error: 'id required' });
      const { error } = await query;
      if (error) throw error;
      await supabase.from('audit_logs').insert({ actor: 'admin', action: 'delete', resource, resource_id: id ? Number(id) : null, metadata: {} });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(`${resource} api`, err);
    return res.status(500).json({ error: err.message });
  }
}
