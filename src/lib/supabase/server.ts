import { isSupabaseConfigured, supabase } from "./client";
import { MOCK_ARTICLES, MOCK_CATEGORIES, MOCK_SERIES, MOCK_OVERVIEW_STATS } from "@/lib/mock-data";
import { Article, Category, Series, OverviewStats } from "@/types/database";

export async function getArticles(options?: {
  categorySlug?: string;
  seriesSlug?: string;
  searchQuery?: string;
  limit?: number;
  featuredOnly?: boolean;
}): Promise<Article[]> {
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from("articles").select("*, category:categories(*), series:series(*)").eq("is_published", true);

      if (options?.featuredOnly) {
        query = query.eq("is_featured", true);
      }

      if (options?.searchQuery) {
        query = query.ilike("title", `%${options.searchQuery}%`);
      }

      query = query.order("published_at", { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (!error && data) return data as Article[];
    } catch (e) {
      console.warn("Supabase fetch failed, falling back to mock data:", e);
    }
  }

  // Fallback to MOCK data
  let result = [...MOCK_ARTICLES];

  if (options?.featuredOnly) {
    result = result.filter((a) => a.is_featured);
  }

  if (options?.categorySlug) {
    result = result.filter((a) => a.category?.slug === options.categorySlug);
  }

  if (options?.seriesSlug) {
    result = result.filter((a) => a.series?.slug === options.seriesSlug);
  }

  if (options?.searchQuery) {
    const q = options.searchQuery.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (options?.limit) {
    result = result.slice(0, options.limit);
  }

  return result;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("articles")
        .select("*, category:categories(*), series:series(*)")
        .eq("slug", slug)
        .single();
      if (!error && data) return data as Article;
    } catch (e) {
      console.warn("Supabase fetch article by slug failed:", e);
    }
  }

  return MOCK_ARTICLES.find((a) => a.slug === slug) || null;
}

export async function getSeries(): Promise<Series[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("series").select("*");
      if (!error && data) return data as Series[];
    } catch (e) {
      console.warn("Supabase fetch series failed:", e);
    }
  }
  return MOCK_SERIES;
}

export async function getSeriesBySlug(slug: string): Promise<Series | null> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("series").select("*").eq("slug", slug).single();
      if (!error && data) return data as Series;
    } catch (e) {
      console.warn("Supabase fetch series by slug failed:", e);
    }
  }
  return MOCK_SERIES.find((s) => s.slug === slug) || null;
}

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("categories").select("*");
      if (!error && data) return data as Category[];
    } catch (e) {
      console.warn("Supabase fetch categories failed:", e);
    }
  }
  return MOCK_CATEGORIES;
}

export async function getOverviewStats(): Promise<OverviewStats> {
  return MOCK_OVERVIEW_STATS;
}
