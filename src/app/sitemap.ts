import { MetadataRoute } from "next";
import { getArticles, getSeries, getCategories } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://katha-kahini.com";

  const [articles, seriesList, categories] = await Promise.all([
    getArticles(),
    getSeries(),
    getCategories(),
  ]);

  const articleEntries = articles.map((article) => ({
    url: `${baseUrl}/article/${article.slug}`,
    lastModified: new Date(article.published_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const seriesEntries = seriesList.map((series) => ({
    url: `${baseUrl}/series/${series.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const categoryEntries = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...articleEntries,
    ...seriesEntries,
    ...categoryEntries,
  ];
}
