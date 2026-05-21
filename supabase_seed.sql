-- ReelRamp Pro safe seed data. Run after schema.
insert into categories (name, slug, icon, sort_order, is_active) values
('Drama','drama','🎭',1,true),('Romance','romance','💖',2,true),('Thriller','thriller','⚡',3,true),('Horror','horror','👻',4,true),('Motivation','motivation','🔥',5,true),('Family','family','🏠',6,true)
on conflict do nothing;
insert into plans (name, price, duration_days, features, is_active, sort_order) values
('Monthly Premium',99,30,'["All premium episodes","HD Bunny.net streaming","Save and resume","Priority support"]'::jsonb,true,1),
('Annual Premium',899,365,'["Best value","All premium episodes","Early premieres","Member offers"]'::jsonb,true,2)
on conflict do nothing;
insert into admin_settings (key, value) values
('theme','{"brand":"ReelRamp Pro","logoText":"RR","primary":"#c5a26f","accent":"#ff4f8b","bg":"#fff7ed","surface":"#ffffff","text":"#23170f","radius":"30px"}'::jsonb),
('payment','{"gateway":"Manual / Razorpay Ready","razorpayKey":"","upiId":"","monthlyPrice":99,"annualPrice":899,"whatsapp":"+917307493338","instructions":"Admin panel me Razorpay/UPI details dal kar live payment connect karein."}'::jsonb),
('player','{"mode":"default","bunnyEmbedBase":"https://iframe.mediadelivery.net/embed","bunnyLibraryId":"","autoplay":true,"muted":false,"responsive":true,"controls":true}'::jsonb)
on conflict do nothing;
insert into platform_settings (site_name,hero_title,hero_subtitle,pwa_message,maintenance_mode) values
('ReelRamp Pro','Stories that are not just heard, but felt.','A premium short-story OTT app powered by Supabase and Bunny.net.','Install ReelRamp Pro for a cinematic app experience.',false)
on conflict do nothing;
insert into banners (title,subtitle,image_url,cta_label,cta_action,is_active,sort_order) values
('ReelRamp Pro 2026 Originals','Kuku TV style short episodes, premium stories and smooth Bunny.net playback.','https://images.pexels.com/photos/7991373/pexels-photo-7991373.jpeg?auto=compress&cs=tinysrgb&w=1200','Start Watching','forYou',true,1)
on conflict do nothing;
insert into series (title,description,poster_url,category,status,sort_order,is_featured) values
('Kahaniyan Mehsoos Karo','Short emotional drama series for mobile-first ReelRamp viewers.','https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=900','Drama','published',1,true)
on conflict do nothing;
insert into videos (title,description,series_title,episode_number,video_filename,thumbnail_url,is_premium,is_published,duration_seconds,category,age_rating) values
('Sample Episode','Replace video_filename with your Bunny MP4 filename or set bunny_video_id for iframe mode.','Kahaniyan Mehsoos Karo',1,'sample.mp4','https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1200',false,true,90,'Drama','U/A 13+')
on conflict do nothing;
insert into legal_policies (title,type,version,is_published,body) values
('Privacy Policy','privacy','2026.1',true,'ReelRamp Pro collects only essential account, playback, subscription and support information needed to operate the service.'),
('Terms, Refunds & Content Policy','terms','2026.1',true,'Digital subscriptions unlock premium stories. Users must not redistribute paid content.'),
('Account Deletion Policy','account_deletion','2026.1',true,'Users may request account deletion through support with their registered email or mobile.'),
('Grievance & Copyright Policy','grievance','2026.1',true,'For content or copyright concerns contact reelramporiginal@gmail.com with details.'),
('Child Safety & Content Rating Policy','child_safety','2026.1',true,'ReelRamp Pro supports content ratings and moderation controls.')
on conflict do nothing;
insert into help_articles (title,body,category,is_published,sort_order) values
('Video not playing?','Check internet and confirm Bunny filename/video id is correct in admin.','Video',true,1),
('How subscription works','Plans unlock premium ReelRamp stories. Payment gateway can be connected later.','Plans',true,2),
('Account deletion request','Send request from support with registered email/mobile.','Account',true,3)
on conflict do nothing;
insert into promo_campaigns (title,subtitle,celebrity_name,video_filename,poster_url,offer_text,cta_label,cta_action,placement,is_active,sort_order) values
('Limited Launch Offer','Special ReelRamp Pro invite.','ReelRamp Guest Star','promo-launch-offer.mp4','https://images.pexels.com/photos/7991373/pexels-photo-7991373.jpeg?auto=compress&cs=tinysrgb&w=1200','2026 launch par premium stories ka special offer.','Unlock Offer','plans','app_open',true,1)
on conflict do nothing;
