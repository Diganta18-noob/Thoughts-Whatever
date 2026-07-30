export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at?: string;
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  total_parts: number;
  created_at?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  thumbnail_url: string;
  instagram_link?: string;
  category_id: string;
  category?: Category;
  series_id?: string;
  series?: Series;
  part_number?: number;
  published_at: string;
  is_published: boolean;
  is_featured?: boolean;
  view_count: number;
  reading_time_minutes: number;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AnalyticsEvent {
  id?: string;
  article_id: string;
  event_type: 'view' | 'scroll_25' | 'scroll_50' | 'scroll_75' | 'scroll_100' | 'instagram_click' | 'reading_time';
  session_id: string;
  referrer?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface Subscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
}

export interface OverviewStats {
  totalViews: number;
  totalArticles: number;
  totalSeries: number;
  totalSubscribers: number;
  instagramClicks: number;
  avgReadingTimeMinutes: number;
  recentViewsTrend: { date: string; views: number; instagramClicks: number }[];
  topArticles: Article[];
}
