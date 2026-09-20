import { Hero } from "@/components/home/hero";
import { FeaturedSeriesHero } from "@/components/home/featured-series-hero";
import { FeaturedSeries } from "@/components/home/featured-series";
import { LatestEpisodes } from "@/components/home/latest-episodes";
import { FeaturedWriting } from "@/components/home/featured-writing";
import { Categories } from "@/components/home/categories";
import { Timeline } from "@/components/home/timeline";
import { ArchiveTeaser } from "@/components/home/archive-teaser";
import { Authors } from "@/components/home/authors";
import { Quote } from "@/components/home/quote";
import {
  getFeaturedSeries,
  getRecentPieces,
  getFilterFacets,
  getFirstPiecesForSeriesIds,
  countPieces,
} from "@/lib/pieces";
import { extractPullQuotes } from "@/lib/markdown";
import { JsonLd, seriesJsonLd, homeWebPageJsonLd } from "@/lib/seo";

export const revalidate = 300;

const DEFAULT_FACETS: Awaited<ReturnType<typeof getFilterFacets>> = {
  tags: [],
  authors: [],
  series: [],
  years: [],
};

export default async function HomePage() {
  let recentPieces: Awaited<ReturnType<typeof getRecentPieces>> = [];
  let series: Awaited<ReturnType<typeof getFeaturedSeries>> = [];
  let facets: Awaited<ReturnType<typeof getFilterFacets>> = DEFAULT_FACETS;

  let countRachana = 0;
  let countDocumentary = 0;
  let countBlog = 0;

  try {
    const [p, s, f, cr, cd, cb] = await Promise.all([
      getRecentPieces({ take: 20 }),
      getFeaturedSeries(3),
      getFilterFacets(),
      countPieces("RACHANA"),
      countPieces("DOCUMENTARY"),
      countPieces("BLOG"),
    ]);
    recentPieces = p;
    series = s;
    facets = f;
    countRachana = cr;
    countDocumentary = cd;
    countBlog = cb;
  } catch {
    recentPieces = [];
    series = [];
    facets = DEFAULT_FACETS;
  }

  const leadSeries = series?.[0];
  const leadSlugs = new Set(
    leadSeries?.pieces ? (leadSeries.pieces as Array<{ slug: string }>).map((p) => p.slug) : []
  );

  // Primary hero content glimpse (latest uploaded piece)
  const primaryGlimpsePiece = recentPieces[0] ?? null;

  // Latest episodes & featured writing
  const filteredRecent = recentPieces.filter((p) => !leadSlugs.has(p.slug));

  // Deduplicate by series so multi-episode series only occupy ONE poster in the Latest section.
  // Feature the first part (Part 1 / episode 1) so it shows the clean title without part suffixes.
  const seenSeriesInLatest = new Set<string>();
  const candidateSeriesIds: string[] = [];
  for (const piece of filteredRecent) {
    const sId = piece.seriesId || piece.series?.slug;
    if (sId) {
      if (!seenSeriesInLatest.has(sId)) {
        seenSeriesInLatest.add(sId);
        if (piece.seriesId) {
          candidateSeriesIds.push(piece.seriesId);
        }
      }
    }
  }

  const firstPiecesMap = await getFirstPiecesForSeriesIds(candidateSeriesIds);

  const seenSeries = new Set<string>();
  const uniqueSeriesRecent: typeof recentPieces = [];
  for (const piece of filteredRecent) {
    const sId = piece.seriesId || piece.series?.slug;
    if (sId) {
      if (seenSeries.has(sId)) {
        continue;
      }
      seenSeries.add(sId);
      const firstPiece = piece.seriesId ? firstPiecesMap.get(piece.seriesId) : null;
      uniqueSeriesRecent.push(firstPiece || piece);
    } else {
      uniqueSeriesRecent.push(piece);
    }
  }

  const latestEpisodes = uniqueSeriesRecent.slice(0, 4);
  const latestSlugs = new Set(latestEpisodes.map((p) => p.slug));
  const latestSeriesIds = new Set(latestEpisodes.map((p) => p.seriesId).filter(Boolean));

  const nonLatestRecent = recentPieces.filter(
    (p) =>
      !leadSlugs.has(p.slug) &&
      !latestSlugs.has(p.slug) &&
      (!p.seriesId || !latestSeriesIds.has(p.seriesId)),
  );
  const featuredPieces = nonLatestRecent.filter((p) => p.featured);
  const featuredWriting =
    featuredPieces.length > 0
      ? featuredPieces.slice(0, 5)
      : nonLatestRecent.slice(0, 5);

  const quoteCandidates = recentPieces.map((p) => ({
    slug: p.slug,
    titleBn: p.titleBn,
    kind: p.kind,
    bodyBn: (p as any).bodyBn || "",
  }));
  const quotes = extractPullQuotes(quoteCandidates);
  const quote = quotes[0] ?? null;

  const timelineGroups = new Map<string, { year: number; month: number; count: number }>();
  for (const p of recentPieces) {
    if (!p.publishedAt) continue;
    const d = new Date(p.publishedAt);
    if (Number.isNaN(d.getTime())) continue;
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const key = `${year}-${month}`;
    const existing = timelineGroups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      timelineGroups.set(key, { year, month, count: 1 });
    }
  }
  const timeline = Array.from(timelineGroups.values());

  const kinds = [
    { kind: "RACHANA" as const, count: countRachana },
    { kind: "DOCUMENTARY" as const, count: countDocumentary },
    { kind: "BLOG" as const, count: countBlog },
  ];

  const formTags = (facets?.tags ?? [])
    .filter((t) => t.kind === "FORM")
    .map((t) => ({ slug: t.slug, labelBn: t.labelBn, count: t._count?.pieces ?? 1 }));

  const authors = (facets?.authors ?? []).map((a) => ({
    slug: a.slug,
    nameBn: a.nameBn,
    count: a._count?.pieces ?? 1,
  }));

  return (
    <div className="min-h-screen">
      <JsonLd data={homeWebPageJsonLd()} />
      {leadSeries && <JsonLd data={seriesJsonLd(leadSeries)} />}

      <Hero />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-16">
        {/* Featured Card (Top) */}
        {primaryGlimpsePiece && (
          <section className="pt-2">
            <FeaturedSeriesHero
              piece={primaryGlimpsePiece}
              totalEpisodesInSeries={6}
              currentEpisodeNumber={6}
              seriesTitleBn={primaryGlimpsePiece.seriesOrder ? "মেঘনাদবধ কাব্য" : undefined}
            />
          </section>
        )}

        {/* Latest Episodes 4-Card Grid */}
        {latestEpisodes.length > 0 && (
          <LatestEpisodes pieces={latestEpisodes} />
        )}

        {/* Series Section */}
        {series.length > 0 && (
          <FeaturedSeries series={series} />
        )}

        {/* Featured Longform Writing */}
        {featuredWriting.length > 0 && <FeaturedWriting pieces={featuredWriting} leadPriority={false} />}
        <Categories kinds={kinds} forms={formTags} />
        {timeline.length > 0 && <Timeline entries={timeline} />}
        <ArchiveTeaser years={facets.years ?? []} />
        {authors.length > 0 && <Authors authors={authors} />}
      </div>

      {quote && <Quote quote={quote} />}
    </div>
  );
}
