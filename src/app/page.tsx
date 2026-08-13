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
import { LetterBlock } from "@/components/newsletter/letter-block";
import {
  getFeaturedSeries,
  getRecentPieces,
  getFilterFacets,
  type CardPiece,
} from "@/lib/pieces";
import { extractPullQuotes } from "@/lib/markdown";
import { JsonLd, websiteJsonLd, seriesJsonLd } from "@/lib/seo";

export const revalidate = 300;

const DEFAULT_FACETS = {
  tags: [] as Array<{ slug: string; labelBn: string; kind: string; _count: { pieces: number } }>,
  authors: [] as Array<{ slug: string; nameBn: string; era: string | null; _count: { pieces: number } }>,
  series: [] as Array<{ slug: string; titleBn: string }>,
  years: [] as number[],
};

export default async function HomePage() {
  let series: any[] = [];
  let recentPieces: CardPiece[] = [];
  let facets = DEFAULT_FACETS;

  try {
    recentPieces = await getRecentPieces({ take: 20 });
  } catch (err) {
    console.error("HomePage: Failed to fetch recentPieces:", err);
  }

  try {
    series = await getFeaturedSeries(3);
  } catch (err) {
    console.error("HomePage: Failed to fetch featuredSeries:", err);
  }

  try {
    facets = await getFilterFacets();
  } catch (err) {
    console.error("HomePage: Failed to fetch facets:", err);
  }

  const leadSeries = series[0];
  const leadSlugs = new Set(leadSeries?.pieces.map((p) => p.slug) ?? []);

  // Primary hero content glimpse (latest uploaded piece)
  const primaryGlimpsePiece = recentPieces[0] ?? null;

  // Latest episodes & featured writing
  const filteredRecent = recentPieces.filter((p) => !leadSlugs.has(p.slug));
  const latestEpisodes = filteredRecent.length > 0 ? filteredRecent.slice(0, 4) : recentPieces.slice(0, 4);

  const featuredPieces = recentPieces.filter((p) => p.featured);
  const filteredFeatured = featuredPieces.filter((p) => !leadSlugs.has(p.slug));
  const featuredWriting =
    filteredFeatured.length > 0
      ? filteredFeatured.slice(0, 5)
      : recentPieces.slice(4, 9).length > 0
        ? recentPieces.slice(4, 9)
        : recentPieces.slice(0, 5);

  const quoteCandidates = recentPieces.map((p) => ({
    slug: p.slug,
    titleBn: p.titleBn,
    kind: p.kind,
    bodyBn: (p as any).bodyBn || "",
  }));
  const quotes = extractPullQuotes(quoteCandidates);
  const quote = quotes[0] ?? null;

  const timeline = recentPieces
    .filter((p) => p.publishedAt)
    .map((p) => ({
      slug: p.slug,
      titleBn: p.titleBn,
      publishedAt: p.publishedAt!,
    }));

  const kindCounts = recentPieces.reduce(
    (acc, p) => {
      acc[p.kind] = (acc[p.kind] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const kinds = [
    { kind: "RACHANA" as const, count: kindCounts.RACHANA ?? 4 },
    { kind: "DOCUMENTARY" as const, count: kindCounts.DOCUMENTARY ?? 14 },
    { kind: "BLOG" as const, count: kindCounts.BLOG ?? 2 },
  ];

  const formTags = (facets.tags ?? [])
    .filter((t) => t.kind === "FORM")
    .map((t) => ({ slug: t.slug, labelBn: t.labelBn, count: t._count.pieces }));

  const authors = (facets.authors ?? []).map((a) => ({
    slug: a.slug,
    nameBn: a.nameBn,
    count: a._count.pieces,
  }));

  return (
    <div className="min-h-screen">
      <JsonLd data={websiteJsonLd()} />
      {leadSeries && <JsonLd data={seriesJsonLd(leadSeries)} />}

      <Hero />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-16">
        {/* Content Glimpse Hero Card for Recent Upload */}
        {primaryGlimpsePiece && (
          <section className="pt-4">
            <FeaturedSeriesHero
              piece={primaryGlimpsePiece}
              totalEpisodesInSeries={6}
              currentEpisodeNumber={6}
              seriesTitleBn={primaryGlimpsePiece.seriesOrder ? "মেঘনাদবধ কাব্য" : undefined}
            />
          </section>
        )}

        {series.length > 0 && <FeaturedSeries series={series} />}
        {latestEpisodes.length > 0 && <LatestEpisodes pieces={latestEpisodes} />}
        {featuredWriting.length > 0 && <FeaturedWriting pieces={featuredWriting} />}
        <Categories kinds={kinds} forms={formTags} />
        {timeline.length > 0 && <Timeline entries={timeline} />}
        <ArchiveTeaser years={facets.years ?? []} />
        {authors.length > 0 && <Authors authors={authors} />}
      </div>

      {quote && <Quote quote={quote} />}

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <section className="border-t border-rule pt-14">
          <LetterBlock source="home" />
        </section>
      </div>
    </div>
  );
}
