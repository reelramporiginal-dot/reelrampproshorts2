-- ReelRamp Pro Live - Master Supabase SQL
-- Run this complete file once in Supabase SQL Editor.
-- It creates schema, constraints, realtime publication entries, and launch seed data.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  icon TEXT DEFAULT '🎬',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.series (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  poster_url TEXT DEFAULT '',
  category TEXT DEFAULT 'Drama',
  status TEXT DEFAULT 'published',
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.videos (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  series_title TEXT DEFAULT 'ReelRamp Originals',
  episode_number INTEGER DEFAULT 1,
  video_filename TEXT DEFAULT '',
  bunny_video_id TEXT DEFAULT '',
  bunny_embed_url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  is_premium BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  duration_seconds INTEGER DEFAULT 0,
  category TEXT DEFAULT 'Drama',
  age_rating TEXT DEFAULT 'U/A 13+',
  publish_at TIMESTAMPTZ,
  download_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_published ON public.videos(is_published);
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_series_episode ON public.videos(series_title, episode_number);

CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  guest_id TEXT NOT NULL UNIQUE,
  display_name TEXT DEFAULT 'Guest Viewer',
  email TEXT DEFAULT '',
  role TEXT DEFAULT 'viewer',
  is_admin BOOLEAN DEFAULT FALSE,
  blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan TEXT DEFAULT 'monthly',
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);

CREATE TABLE IF NOT EXISTS public.watch_history (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id BIGINT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  current_position NUMERIC DEFAULT 0,
  watched_duration NUMERIC DEFAULT 0,
  duration NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id);

CREATE TABLE IF NOT EXISTS public.likes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id BIGINT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  video_id BIGINT NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.video_views (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  video_id BIGINT REFERENCES public.videos(id) ON DELETE SET NULL,
  watch_seconds NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  device TEXT DEFAULT 'web',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.plans (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  duration_days INTEGER DEFAULT 30,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.payments (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  plan_id BIGINT REFERENCES public.plans(id) ON DELETE SET NULL,
  amount NUMERIC DEFAULT 0,
  gateway TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending',
  transaction_id TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banners (
  id BIGSERIAL PRIMARY KEY,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  cta_label TEXT DEFAULT 'Watch Now',
  cta_action TEXT DEFAULT 'forYou',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.popup_settings (
  id BIGSERIAL PRIMARY KEY,
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  cta_label TEXT DEFAULT 'Open',
  cta_url TEXT DEFAULT '#',
  enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id BIGSERIAL PRIMARY KEY,
  site_name TEXT DEFAULT 'ReelRamp Pro',
  hero_title TEXT DEFAULT '',
  hero_subtitle TEXT DEFAULT '',
  pwa_message TEXT DEFAULT '',
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.legal_policies (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  type TEXT DEFAULT 'policy',
  version TEXT DEFAULT '2026.1',
  is_published BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promo_campaigns (
  id BIGSERIAL PRIMARY KEY,
  title TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  celebrity_name TEXT DEFAULT '',
  video_filename TEXT DEFAULT '',
  poster_url TEXT DEFAULT '',
  offer_text TEXT DEFAULT '',
  cta_label TEXT DEFAULT 'View Plan',
  cta_action TEXT DEFAULT 'plans',
  placement TEXT DEFAULT 'app_open',
  show_after_seconds INTEGER DEFAULT 2,
  frequency_hours INTEGER DEFAULT 12,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  target TEXT DEFAULT 'free_users',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promo_events (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT REFERENCES public.promo_campaigns(id) ON DELETE SET NULL,
  user_id TEXT DEFAULT '',
  event_type TEXT DEFAULT 'impression',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id BIGSERIAL PRIMARY KEY,
  title TEXT DEFAULT '',
  message TEXT DEFAULT '',
  target TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  name TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.content_reports (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  video_id BIGINT REFERENCES public.videos(id) ON DELETE SET NULL,
  reason TEXT DEFAULT 'Other',
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  type TEXT DEFAULT 'credit',
  coins INTEGER DEFAULT 0,
  reason TEXT DEFAULT '',
  reference_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_id TEXT DEFAULT '',
  referred_id TEXT DEFAULT '',
  code TEXT DEFAULT '',
  reward_status TEXT DEFAULT 'pending',
  reward_amount INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor TEXT DEFAULT 'system',
  action TEXT DEFAULT 'change',
  resource TEXT DEFAULT '',
  resource_id BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.error_logs (
  id BIGSERIAL PRIMARY KEY,
  source TEXT DEFAULT 'frontend',
  message TEXT DEFAULT '',
  stack TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'error',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.help_articles (
  id BIGSERIAL PRIMARY KEY,
  title TEXT DEFAULT '',
  body TEXT DEFAULT '',
  category TEXT DEFAULT 'General',
  is_published BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT DEFAULT '',
  endpoint TEXT DEFAULT '',
  subscription JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS safely for future policy hardening. API routes use service role.
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read published videos" ON public.videos;
CREATE POLICY "Public can read published videos" ON public.videos FOR SELECT USING (is_published = TRUE);

-- Supabase Realtime. Ignore duplicate publication errors.
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.videos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_history; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- Seed categories
INSERT INTO public.categories (name, slug, icon, sort_order, is_active) VALUES
('Premium Stories','premium-stories','👑',1,TRUE),
('Romance','romance','💖',2,TRUE),
('Drama','drama','🎭',3,TRUE),
('Action','action','⚔️',4,TRUE),
('Thriller','thriller','⚡',5,TRUE)
ON CONFLICT (name) DO UPDATE SET slug=EXCLUDED.slug, icon=EXCLUDED.icon, sort_order=EXCLUDED.sort_order, is_active=EXCLUDED.is_active;

INSERT INTO public.series (title, description, poster_url, category, status, sort_order, is_featured) VALUES
('ReelRamp Originals','Premium short stories for mobile-first viewers.','', 'Premium Stories','published',1,TRUE),
('Dil Se Drama','Emotional romance and drama episodes.','', 'Drama','published',2,TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.videos (title, description, series_title, episode_number, video_filename, bunny_video_id, bunny_embed_url, thumbnail_url, is_premium, is_published, duration_seconds, category, age_rating) VALUES
('Welcome to ReelRamp','Launch preview episode. Replace video_filename with your Bunny file in admin.','ReelRamp Originals',1,'sample-welcome.mp4','','','',FALSE,TRUE,90,'Premium Stories','U/A 13+'),
('Premium Twist','Premium sample episode for paywall testing.','ReelRamp Originals',2,'sample-premium.mp4','','','',TRUE,TRUE,120,'Thriller','U/A 13+'),
('Dil Ki Baat','Romance story sample episode.','Dil Se Drama',1,'sample-romance.mp4','','','',FALSE,TRUE,110,'Romance','U/A 13+')
ON CONFLICT DO NOTHING;

INSERT INTO public.plans (name, price, duration_days, features, is_active, sort_order) VALUES
('Monthly Premium',99,30,'["All premium episodes","HD streaming","Save and resume","Priority support"]'::jsonb,TRUE,1),
('Annual Premium',899,365,'["Best value","All premium episodes","Early premieres","Member offers"]'::jsonb,TRUE,2)
ON CONFLICT DO NOTHING;

INSERT INTO public.banners (title, subtitle, image_url, cta_label, cta_action, is_active, sort_order) VALUES
('ReelRamp Pro 2026 Originals','Kuku TV style short episodes, premium stories and smooth Bunny.net playback.','','Start Watching','forYou',TRUE,1)
ON CONFLICT DO NOTHING;

INSERT INTO public.popup_settings (title, message, cta_label, cta_url, enabled) VALUES
('Launch Offer','Unlock ReelRamp premium stories and early episodes.','View Plan','#plans',TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.admin_settings (key, value) VALUES
('theme','{"brand":"ReelRamp Pro","logoText":"RR","primary":"#c5a26f","accent":"#ff4f8b","bg":"#fff7ed","surface":"#ffffff","text":"#23170f","radius":"30px"}'::jsonb),
('payment','{"gateway":"Manual / Razorpay Ready","razorpayKey":"","upiId":"","monthlyPrice":99,"annualPrice":899,"whatsapp":"+917307493338","instructions":"Admin panel me Razorpay/UPI details dal kar live payment connect karein.","testMode":"true","webhookSecret":""}'::jsonb),
('player','{"mode":"default","bunnyEmbedBase":"https://iframe.mediadelivery.net/embed","bunnyLibraryId":"","autoplay":true,"muted":false,"responsive":true,"controls":true}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value, updated_at=NOW();

INSERT INTO public.legal_policies (title, type, version, is_published, body) VALUES
('Privacy Policy','privacy','2026.1',TRUE,'ReelRamp Pro collects essential account, playback, subscription and support data to operate the service. Payment data is processed by selected payment providers.'),
('Terms, Refunds & Content Policy','terms','2026.1',TRUE,'ReelRamp Pro is operated by ReelRamp Originals Pvt. Ltd. Users must not redistribute paid content. Refunds and cancellations follow company and gateway policy.'),
('Account Deletion Policy','account_deletion','2026.1',TRUE,'Users may request account deletion through support with registered email/mobile. Eligible data will be deleted or anonymized subject to legal retention.'),
('Grievance & Copyright Policy','grievance','2026.1',TRUE,'For copyright or grievance concerns contact reelramporiginal@gmail.com with content details and ownership proof if applicable.'),
('Child Safety & Content Rating Policy','child_safety','2026.1',TRUE,'ReelRamp Pro supports content ratings, reporting and moderation controls for safer viewing.')
ON CONFLICT DO NOTHING;

INSERT INTO public.promo_campaigns (title, subtitle, celebrity_name, video_filename, poster_url, offer_text, cta_label, cta_action, placement, show_after_seconds, frequency_hours, is_active, sort_order) VALUES
('Limited Launch Offer','Special ReelRamp Pro invite.','ReelRamp Guest Star','promo-launch-offer.mp4','','2026 launch par premium stories ka special subscription offer.','Unlock Offer','plans','app_open',2,12,TRUE,1)
ON CONFLICT DO NOTHING;

INSERT INTO public.notifications (title, message, target, is_active) VALUES
('Welcome to ReelRamp Pro','New stories, premium episodes and subscription offers will appear here.','all',TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.help_articles (title, body, category, is_published, sort_order) VALUES
('Video not playing?','Check internet, confirm Bunny filename in admin, and tap Retry on the player. Premium videos need an active plan.','Video',TRUE,1),
('How subscription works','Plans unlock premium ReelRamp stories. Razorpay/live gateway can be connected from Admin > Theme > Payment Setup.','Plans',TRUE,2),
('Account deletion request','Send account deletion request from support with your registered email/mobile.','Account',TRUE,3)
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_logs (actor, action, resource, resource_id, metadata) VALUES
('system','master_sql_seed','database',0,'{"version":"2026.1","status":"ready"}'::jsonb);

COMMIT;
