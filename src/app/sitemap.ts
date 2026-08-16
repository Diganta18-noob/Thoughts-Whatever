import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PUBLISHED } from "@/lib/pieces";
import { KIND_META } from "@/lib/nav";
import { absoluteUrl } from "@/lib/utils";

/**
 * Slugs are Bengali, so every URL here has to be percent-encoded. A raw
 * Bengali slug inside <loc> is not a valid sitemap URL — the spec wants
 * RFC 3986 escaping, and validators (including Search Console's) reject it.
 */
function url(path: string) {
  return absoluteUrl(path);
}

function pieceUrl(kind: keyof typeof KIND_META, slug: string) {
  return url(`${KIND_META[kind].path}/${encodeURIComponent(slug)}`);
}

/**
 * Regenerated on every request.
 *
 * `force-dynamic` is load-bearing for the same reason as `/rss.xml`: it stops a
 * Vercel build failing on database access. The consequence is that this route
 * has no ISR cache, which makes two things untrue that a `revalidate = 3600`
 * export sitting here used to imply — it is not rebuilt hourly, and
 * `revalidatePath("/sitemap.xml")` has no cache entry to invalidate, so an
 * admin mutation calling it does nothing here. The dead export is gone rather
 * than left as documentation of a behaviour that isn't happening.
 *
 * Next serves this with `Cache-Control: public, max-age=0, must-revalidate`, so
 * there is no CDN caching either and the three queries below run per request.
 * A metadata route cannot set its own headers; buying a CDN TTL means either
 * dropping `force-dynamic` (accepting build-time database access, as CI already
 * provides `DATABASE_URL`) or moving this to a route handler that can set
 * `s-maxage` the way `/rss.xml` does. Neither is urgent at 27 URLs.
 *
 * Note also that `public/sitemap.xml` currently shadows this route entirely.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pieces, authors, seriesList] = await Promise.all([
    prisma.piece.findMany({
      where: PUBLISHED,
      select: { slug: true, kind: true, publishedAt: true, updatedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.author.findMany({
      where: { pieces: { some: PUBLISHED } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.series.findMany({
      where: { pieces: { some: PUBLISHED } },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  // The newest published piece is a better lastModified for the section
  // indexes than "now" — it tells a crawler nothing changed when nothing did.
  const newest = pieces[0]?.publishedAt ?? new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: newest, changeFrequency: "daily", priority: 1 },
    { url: url("/writing"), lastModified: newest, changeFrequency: "daily", priority: 0.9 },
    { url: url("/blog"), lastModified: newest, changeFrequency: "weekly", priority: 0.9 },
    { url: url("/documentary"), lastModified: newest, changeFrequency: "weekly", priority: 0.9 },
    { url: url("/archive"), lastModified: newest, changeFrequency: "weekly", priority: 0.8 },
    { url: url("/series"), lastModified: newest, changeFrequency: "weekly", priority: 0.7 },
    { url: url("/letter"), lastModified: newest, changeFrequency: "monthly", priority: 0.5 },
    { url: url("/about"), lastModified: newest, changeFrequency: "monthly", priority: 0.5 },
  ];

  const pieceRoutes: MetadataRoute.Sitemap = pieces.map((piece) => ({
    url: pieceUrl(piece.kind, piece.slug),
    lastModified: piece.updatedAt,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const authorRoutes: MetadataRoute.Sitemap = authors.map((author) => ({
    url: url(`/authors/${encodeURIComponent(author.slug)}`),
    lastModified: author.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const seriesRoutes: MetadataRoute.Sitemap = seriesList.map((series) => ({
    url: url(`/series/${encodeURIComponent(series.slug)}`),
    lastModified: series.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // /search and /bookmarks are deliberately absent: both are noindex, and a
  // sitemap entry for a noindex page is a contradiction crawlers report.
  return [...staticRoutes, ...pieceRoutes, ...authorRoutes, ...seriesRoutes];
}
