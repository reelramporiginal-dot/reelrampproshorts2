-- ReelRamp Pro verified seed data. Run after supabase_schema.sql.

insert into categories (name, slug, icon, sort_order, is_active) values
('Drama', 'drama', '🎭', 1, true),
('Romance', 'romance', '💖', 2, true),
('Thriller', 'thriller', '⚡', 3, true),
('Horror', 'horror', '👻', 4, true),
('Motivation', 'motivation', '🔥', 5, true),
('Family', 'family', '🏠', 6, true)
on conflict do nothing;

insert into series (title, description, poster_url, category, status, sort_order, is_featured) values
('Kahaniyan Mehsoos Karo', 'Short emotional drama series for mobile-first ReelRamp viewers.', 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=900', 'Drama', 'published', 1, true),
('Raat Ki Awaaz', 'Thriller micro episodes with premium cliffhangers.', 'https://images.pexels.com/photos/7709297/pexels-photo-7709297.jpeg?auto=compress&cs=tinysrgb&w=900', 'Thriller', 'published', 2, true)
on conflict do nothing;

insert into videos (title, description, series_title, episode_number, video_filename, thumbnail_url, is_premium, is_published, duration_seconds, category, age_rating) values
('Thoda Thehro', 'A quiet Lucknow evening changes two strangers forever when a delayed ride becomes a confession of dreams, regret, and hope.', 'Kahaniyan Mehsoos Karo', 1, 'reelramp-sample-1.mp4', 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200', false, true, 96, 'Drama', 'U/A 13+'),
('Aakhri Message', 'A premium emotional thriller about a creator who receives one last voice note before the city sleeps.', 'Kahaniyan Mehsoos Karo', 2, 'reelramp-sample-2.mp4', 'https://images.pexels.com/photos/7709297/pexels-photo-7709297.jpeg?auto=compress&cs=tinysrgb&w=1200', true, true, 118, 'Thriller', 'U/A 16+')
on conflict do nothing;

insert into banners (title, subtitle, image_url, cta_label, cta_action, is_active, sort_order) values
('ReelRamp Pro 2026 Originals', 'Kuku TV style short episodes, premium stories and smooth Bunny.net playback.', 'https://images.pexels.com/photos/7991373/pexels-photo-7991373.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Start Watching', 'forYou', true, 1)
on conflict do nothing;

insert into platform_settings (site_name, hero_title, hero_subtitle, pwa_message, maintenance_mode) values
('ReelRamp Pro', 'Stories that are not just heard, but felt.', 'A premium mobile-first streaming platform for ReelRamp Originals, powered by Supabase and Bunny.net CDN delivery.', 'Install ReelRamp Pro for a cinematic app experience, faster premieres and one-tap story access.', false)
on conflict do nothing;

insert into popup_settings (title, message, cta_label, cta_url, enabled) values
('New Original Premiere', 'Watch Thoda Thehro now and unlock premium episodes with ReelRamp Pro membership.', 'Start Watching', '#watch', true)
on conflict do nothing;

insert into admin_settings (key, value) values
('theme', '{"brand":"ReelRamp Pro","logoText":"RR","primary":"#c5a26f","accent":"#ff4f8b","bg":"#fff7ed","surface":"#ffffff","text":"#23170f","radius":"30px"}'::jsonb),
('payment', '{"gateway":"Manual / Razorpay Ready","razorpayKey":"","upiId":"","monthlyPrice":99,"annualPrice":899,"whatsapp":"+917307493338","instructions":"Admin panel me Razorpay/UPI details dal kar live payment connect karein.","testMode":"true","webhookSecret":""}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into plans (name, price, duration_days, features, is_active, sort_order) values
('Monthly Premium', 99, 30, '["All premium episodes", "HD Bunny.net streaming", "Save and resume", "Priority support"]'::jsonb, true, 1),
('Annual Premium', 899, 365, '["Best value", "All premium episodes", "Early premieres", "Member offers"]'::jsonb, true, 2)
on conflict do nothing;

insert into promo_campaigns (title, subtitle, celebrity_name, video_filename, poster_url, offer_text, cta_label, cta_action, placement, show_after_seconds, frequency_hours, is_active, sort_order, target) values
('Limited Launch Offer', 'Aapke favourite creator ki taraf se special ReelRamp Pro invite.', 'ReelRamp Guest Star', 'promo-launch-offer.mp4', 'https://images.pexels.com/photos/7991373/pexels-photo-7991373.jpeg?auto=compress&cs=tinysrgb&w=1200', '2026 launch par premium stories ka special subscription offer. Aaj join karein aur early access unlock karein.', 'Unlock Offer', 'plans', 'app_open', 2, 12, true, 1, 'free_users')
on conflict do nothing;

insert into notifications (title, message, target, is_active) values
('Welcome to ReelRamp Pro', 'New stories, premium episodes and subscription offers will appear here.', 'all', true)
on conflict do nothing;

insert into users (guest_id, display_name, email, role, is_admin) values
('demo_guest_reelramp', 'Demo Viewer', 'demo@reelramp.pro', 'viewer', false)
on conflict (guest_id) do update set display_name = excluded.display_name, email = excluded.email;

insert into subscriptions (user_id, plan, status, expires_at) values
('demo_guest_reelramp', 'Monthly Premium', 'active', '2027-12-31T23:59:59.000Z')
on conflict do nothing;

insert into legal_policies (title, type, version, is_published, body) values
('Privacy Policy', 'privacy', '2026.1', true, 'Effective from 2026. ReelRamp Pro collects only essential account, playback, subscription and support information needed to operate the service. Payment data is processed by the selected payment gateway.'),
('Terms, Refunds & Content Policy', 'terms', '2026.1', true, 'ReelRamp Pro is operated by ReelRamp Originals Pvt. Ltd. Digital subscriptions unlock premium stories. Users must not redistribute paid content. Refunds and cancellations follow company and payment gateway policy.'),
('Account Deletion Policy', 'account_deletion', '2026.1', true, 'Users may request account deletion by contacting ReelRamp support with their registered email or mobile.'),
('Grievance & Copyright Policy', 'grievance', '2026.1', true, 'For content, copyright or grievance concerns, contact ReelRamp Originals Pvt. Ltd. at reelramporiginal@gmail.com.'),
('Child Safety & Content Rating Policy', 'child_safety', '2026.1', true, 'ReelRamp Pro supports content ratings and moderation controls. Users should report unsafe or inappropriate content through the app report feature.')
on conflict do nothing;

insert into help_articles (title, body, category, is_published, sort_order) values
('Video not playing?', 'Check your internet, confirm the Bunny.net filename is correct in admin, and tap Retry on the player. Premium videos need an active plan.', 'Video', true, 1),
('How subscription works', 'Plans unlock premium ReelRamp stories. Razorpay/live gateway can be connected from Admin > Theme > Payment Setup when your payment account is ready.', 'Plans', true, 2),
('Account deletion request', 'Send an account deletion request from support with your registered email/mobile.', 'Account', true, 3)
on conflict do nothing;

insert into wallet_transactions (user_id, type, coins, reason, reference_id) values
('demo_guest_reelramp', 'credit', 50, 'Welcome bonus', 'welcome-2026')
on conflict do nothing;

insert into referrals (referrer_id, referred_id, code, reward_status, reward_amount) values
('demo_guest_reelramp', '', 'REEL2026', 'ready', 25)
on conflict do nothing;

insert into support_tickets (user_id, name, contact, message, status) values
('demo_guest_reelramp', 'Demo Viewer', 'demo@reelramp.pro', 'Sample launch support ticket for admin workflow.', 'open')
on conflict do nothing;

insert into audit_logs (actor, action, resource, resource_id, metadata) values
('system', 'launch_setup', 'app', 0, '{"note":"ReelRamp Pro verified seed installed"}'::jsonb)
on conflict do nothing;
