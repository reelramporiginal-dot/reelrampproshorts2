export type Video = {
  id: number; title: string; description: string; series_title: string; episode_number: number;
  thumbnail_url: string; is_premium: boolean; duration_seconds: number; category: string;
  video_filename: string; bunny_video_id: string; created_at: string;
};
export type Series = {
  id: number; title: string; description: string; poster_url: string; category: string;
  is_featured: boolean; sort_order: number;
};
export type Category = { id: number; name: string; slug: string; icon: string; sort_order: number };
export type Plan = { id: number; name: string; price: number; duration_days: number; features: string[]; sort_order: number };
export type Subscription = { id: number; user_id: string; plan: string; status: string; expires_at: string | null };
export type SeriesGroup = {
  title: string; description: string; poster: string; category: string; featured: boolean;
  episodes: Video[];
};

