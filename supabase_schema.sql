-- ReelRamp Pro verified schema for a blank Supabase/Postgres database
-- Safe to run multiple times. Payment gateway and Play Store are intentionally not included.

create extension if not exists pgcrypto;

create table if not exists videos (
  id serial primary key,
  title text not null default 'Untitled Video',
  description text default '',
  series_title text default 'ReelRamp Originals',
  episode_number integer default 1,
  video_filename text not null default '',
  thumbnail_url text default '',
  is_premium boolean not null default false,
  is_published boolean not null default true,
  duration_seconds integer not null default 0,
  category text default 'Drama',
  age_rating text default 'U/A 13+',
  publish_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists series (
  id serial primary key,
  title text not null default 'Untitled Series',
  description text default '',
  poster_url text default '',
  category text default 'Drama',
  status text default 'published',
  sort_order integer default 0,
  is_featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists categories (
  id serial primary key,
  name text not null,
  slug text,
  icon text default '🎬',
  sort_order integer default 0,
  is_active boolean default true
);

create table if not exists banners (
  id serial primary key,
  title text default 'Promo',
  subtitle text default '',
  image_url text default '',
  cta_label text default 'Watch Now',
  cta_action text default 'forYou',
  is_active boolean default true,
  sort_order integer default 0
);

create table if not exists popup_settings (
  id serial primary key,
  title text default 'Announcement',
  message text default '',
  cta_label text default 'Open',
  cta_url text default '#',
  enabled boolean default true,
  updated_at timestamptz default now()
);

create table if not exists platform_settings (
  id serial primary key,
  site_name text default 'ReelRamp Pro',
  hero_title text default 'Stories that are not just heard, but felt.',
  hero_subtitle text default '',
  pwa_message text default 'Install ReelRamp Pro for a cinematic app experience.',
  maintenance_mode boolean default false,
  updated_at timestamptz default now()
);

create table if not exists admin_settings (
  id serial primary key,
  key text not null unique,
  value jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists legal_policies (
  id serial primary key,
  title text not null,
  body text default '',
  type text default 'policy',
  version text default '2026.1',
  is_published boolean default true,
  updated_at timestamptz default now()
);

create table if not exists plans (
  id serial primary key,
  name text default 'Premium',
  price numeric default 99,
  duration_days integer default 30,
  features jsonb default '[]'::jsonb,
  is_active boolean default true,
  sort_order integer default 0
);

create table if not exists users (
  id serial primary key,
  guest_id text not null unique,
  display_name text default 'Guest Viewer',
  email text default '',
  role text default 'viewer',
  is_admin boolean default false,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id serial primary key,
  user_id text not null,
  plan text default 'monthly',
  status text default 'active',
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists payments (
  id serial primary key,
  user_id text default '',
  plan_id integer,
  amount numeric default 0,
  gateway text default 'manual',
  status text default 'pending',
  transaction_id text default '',
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists watch_history (
  id serial primary key,
  user_id text default '',
  video_id integer default 0,
  video_current_time numeric default 0,
  duration numeric default 0,
  completed boolean default false,
  updated_at timestamptz default now()
);

create table if not exists likes (
  id serial primary key,
  user_id text default '',
  video_id integer default 0,
  created_at timestamptz default now()
);

create table if not exists bookmarks (
  id serial primary key,
  user_id text default '',
  video_id integer default 0,
  created_at timestamptz default now()
);

create table if not exists video_views (
  id serial primary key,
  user_id text default '',
  video_id integer default 0,
  watch_seconds numeric default 0,
  completed boolean default false,
  device text default 'web',
  created_at timestamptz default now()
);

create table if not exists support_tickets (
  id serial primary key,
  user_id text default '',
  name text default '',
  contact text default '',
  message text default '',
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists promo_campaigns (
  id serial primary key,
  title text default 'Special Subscription Offer',
  subtitle text default '',
  celebrity_name text default '',
  video_filename text default '',
  poster_url text default '',
  offer_text text default '',
  cta_label text default 'View Plan',
  cta_action text default 'plans',
  placement text default 'app_open',
  show_after_seconds integer default 2,
  frequency_hours integer default 12,
  is_active boolean default true,
  sort_order integer default 0,
  start_at timestamptz,
  end_at timestamptz,
  target text default 'free_users',
  updated_at timestamptz default now()
);

create table if not exists notifications (
  id serial primary key,
  title text default 'New update',
  message text default '',
  target text default 'all',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists promo_events (
  id serial primary key,
  campaign_id integer default 0,
  user_id text default '',
  event_type text default 'impression',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id serial primary key,
  actor text default 'admin',
  action text default 'change',
  resource text default '',
  resource_id integer,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists referrals (
  id serial primary key,
  referrer_id text default '',
  referred_id text default '',
  code text default '',
  reward_status text default 'pending',
  reward_amount integer default 0,
  created_at timestamptz default now()
);

create table if not exists wallet_transactions (
  id serial primary key,
  user_id text default '',
  type text default 'credit',
  coins integer default 0,
  reason text default '',
  reference_id text default '',
  created_at timestamptz default now()
);

create table if not exists content_reports (
  id serial primary key,
  user_id text default '',
  video_id integer default 0,
  reason text default 'Other',
  details text default '',
  status text default 'open',
  created_at timestamptz default now()
);

create table if not exists error_logs (
  id serial primary key,
  source text default 'frontend',
  message text default '',
  stack text default '',
  metadata jsonb default '{}'::jsonb,
  severity text default 'error',
  created_at timestamptz default now()
);

create table if not exists help_articles (
  id serial primary key,
  title text default 'Help article',
  body text default '',
  category text default 'General',
  is_published boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

create table if not exists push_subscriptions (
  id serial primary key,
  user_id text default '',
  endpoint text default '',
  subscription jsonb default '{}'::jsonb,
  enabled boolean default true,
  created_at timestamptz default now()
);

-- Compatibility migration for databases that were created with older drafts.
alter table videos add column if not exists is_published boolean not null default true;
alter table videos add column if not exists is_premium boolean not null default false;
alter table videos add column if not exists age_rating text default 'U/A 13+';
alter table videos add column if not exists publish_at timestamptz;
alter table watch_history add column if not exists video_current_time numeric default 0;
alter table promo_campaigns add column if not exists start_at timestamptz;
alter table promo_campaigns add column if not exists end_at timestamptz;
alter table promo_campaigns add column if not exists target text default 'free_users';

-- Verified indexes: every referenced column exists above before indexes are created.
create index if not exists idx_videos_published on videos (is_published);
create index if not exists idx_videos_category on videos (category);
create index if not exists idx_videos_series_episode on videos (series_title, episode_number);
create index if not exists idx_videos_publish_at on videos (publish_at);
create index if not exists idx_categories_active_sort on categories (is_active, sort_order);
create index if not exists idx_series_status_sort on series (status, sort_order);
create index if not exists idx_banners_active_sort on banners (is_active, sort_order);
create index if not exists idx_subscriptions_user_status on subscriptions (user_id, status);
create index if not exists idx_payments_user_status on payments (user_id, status);
create index if not exists idx_watch_history_user_video on watch_history (user_id, video_id);
create index if not exists idx_likes_user_video on likes (user_id, video_id);
create index if not exists idx_bookmarks_user_video on bookmarks (user_id, video_id);
create index if not exists idx_video_views_video_created on video_views (video_id, created_at);
create index if not exists idx_promo_campaigns_active on promo_campaigns (is_active, placement);
create index if not exists idx_notifications_active on notifications (is_active, created_at);
create index if not exists idx_content_reports_status on content_reports (status, created_at);
create index if not exists idx_help_articles_published on help_articles (is_published, sort_order);
