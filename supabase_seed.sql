-- ReelRamp Pro Seed Data

insert into categories (name, slug, icon, sort_order, is_active) values
('Drama','drama','🎭',1,true),
('Romance','romance','💖',2,true),
('Thriller','thriller','⚡',3,true),
('Horror','horror','👻',4,true),
('Motivation','motivation','🔥',5,true),
('Family','family','🏠',6,true)
on conflict do nothing;

insert into series (title, description, poster_url, category, status, sort_order, is_featured) values
('Kahaniyan Mehsoos Karo','Short emotional drama series for mobile-first ReelRamp viewers.','https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=900','Drama','published',1,true),
('Raat Ki Awaaz','Thriller micro episodes with premium cliffhangers.','https://images.pexels.com/photos/7709297/pexels-photo-7709297.jpeg?auto=compress&cs=tinysrgb&w=900','Thriller','published',2,true)
on conflict do nothing;

insert into videos (title, description, series_title, episode_number, video_filename, thumbnail_url, is_premium, is_published, duration_seconds, category, age_rating) values
('Thoda Thehro','A short emotional story from ReelRamp Originals.','Kahaniyan Mehsoos Karo',1,'your-video-file.mp4','https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200',false,true,120,'Drama','U/A 13+'),
('Aakhri Message','A premium emotional thriller episode.','Raat Ki Awaaz',2,'your-premium-video-file.mp4','https://images.pexels.com/photos/7709297/pexels-photo-7709297.jpeg?auto=compress&cs=tinysrgb&w=1200',true,true,120,'Thriller','U/A 16+')
on conflict do nothing;

insert into plans (name, price, duration_days, features, is_active, sort_order) values
('Monthly Premium',99,30,'["All premium episodes","HD Bunny.net streaming","Save and resume","Priority support"]'::jsonb,true,1),
('Annual Premium',899,365,'["Best value","All premium episodes","Early premieres","Member offers"]'::jsonb,true,2)
on conflict do nothing;

insert into admin_settings (key, value) values
('theme','{"brand":"ReelRamp Pro","logoText":"RR","primary":"#c5a26f","accent":"#ff4f8b","bg":"#fff7ed","surface":"#ffffff","text":"#23170f","radius":"30px"}'::jsonb),
('payment','{"gateway":"Manual / Razorpay Ready","razorpayKey":"","upiId":"","monthlyPrice":99,"annualPrice":899,"whatsapp":"+917307493338","instructions":"Admin panel me Razorpay/UPI details dal kar live payment connect karein.","testMode":"true","webhookSecret":""}'::jsonb)
on conflict do nothing;

insert into banners (title, subtitle, image_url, cta_label, cta_action, is_active, sort_order) values
('ReelRamp Pro 2026 Originals','Kuku TV style short episodes, premium stories and makkhan-smooth Bunny.net playback.','https://images.pexels.com/photos/7991373/pexels-photo-7991373.jpeg?auto=compress&cs=tinysrgb&w=1200','Start Watching','forYou',true,1)
on conflict do nothing;

insert into popup_settings (title, message, cta_label, cta_url, enabled) values
('New Original Premiere','Watch free episodes and unlock premium stories with ReelRamp Pro.','Start Watching','#watch',true)
on conflict do nothing;

insert into promo_campaigns (title, subtitle, celebrity_name, video_filename, poster_url, offer_text, cta_label, cta_action, placement, show_after_seconds, frequency_hours, is_active, sort_order, target) values
('Limited Launch Offer','Aapke favourite creator ki taraf se special ReelRamp Pro invite.','ReelRamp Guest Star','promo-launch-offer.mp4','https://images.pexels.com/photos/7991373/pexels-photo-7991373.jpeg?auto=compress&cs=tinysrgb&w=1200','2026 launch par premium stories ka special subscription offer. Aaj join karein aur early access unlock karein.','Unlock Offer','plans','app_open',2,12,true,1,'free_users')
on conflict do nothing;

insert into notifications (title, message, target, is_active) values
('Welcome to ReelRamp Pro','New stories, premium episodes and subscription offers will appear here.','all',true)
on conflict do nothing;

insert into legal_policies (title, type, version, is_published, body) values
('Privacy Policy','privacy','2026.1',true,'Effective from 2026. ReelRamp Pro collects only essential account, playback, subscription and support information needed to operate the service. Payment data is processed by the selected payment gateway.'),
('Terms, Refunds & Content Policy','terms','2026.1',true,'ReelRamp Pro is operated by ReelRamp Originals Pvt. Ltd. Digital subscriptions unlock premium stories. Users must not redistribute paid content. Refunds and cancellations follow company and payment gateway policy.'),
('Account Deletion Policy','account_deletion','2026.1',true,'Users may request account deletion by contacting ReelRamp support with their registered email or mobile. We will delete or anonymize eligible account data subject to legal, payment, fraud-prevention and compliance retention requirements.'),
('Grievance & Copyright Policy','grievance','2026.1',true,'For content, copyright or grievance concerns, contact ReelRamp Originals Pvt. Ltd. at reelramporiginal@gmail.com with details of the issue, affected content URL/title, ownership proof if applicable, and contact details.'),
('Child Safety & Content Rating Policy','child_safety','2026.1',true,'ReelRamp Pro supports content ratings and moderation controls. Mature or sensitive content may be restricted, labeled, reviewed or removed. Users should report unsafe or inappropriate content through the app report feature.')
on conflict do nothing;

insert into help_articles (title, body, category, is_published, sort_order) values
('Video not playing?','Check your internet, confirm the Bunny.net filename is correct in admin, and tap Retry on the player. Premium videos need an active plan.','Video',true,1),
('How subscription works','Plans unlock premium ReelRamp stories. Razorpay/live gateway can be connected from Admin > Theme > Payment Setup when your payment account is ready.','Plans',true,2),
('Account deletion request','Send an account deletion request from support with your registered email/mobile. ReelRamp Originals Pvt. Ltd. will process eligible requests as per policy.','Account',true,3)
on conflict do nothing;

insert into users (guest_id, display_name, email, role, is_admin) values
('demo_guest_reelramp','Demo Viewer','demo@reelramp.pro','viewer',false)
on conflict do nothing;

insert into subscriptions (user_id, plan, status, expires_at) values
('demo_guest_reelramp','Monthly Premium','active','2027-12-31T23:59:59.000Z')
on conflict do nothing;
