import { Hero } from "@/components/home/hero";
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
  getFeaturedPieces,
  getFilterFacets,
  getPublishingTimeline,
  getKindCounts,
  getPullQuoteCandidates,
} from "@/lib/pieces";
import { extractPullQuotes } from "@/lib/markdown";
import { JsonLd, websiteJsonLd, seriesJsonLd } from "@/lib/seo";

export const revalidate = 300;

async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]).catch(() => fallback);
}

const DEFAULT_FACETS = {
  tags: [] as Array<{ slug: string; labelBn: string; kind: string; _count: { pieces: number } }>,
  authors: [] as Array<{ slug: string; nameBn: string; era: string | null; _count: { pieces: number } }>,
  series: [] as Array<{ slug: string; titleBn: string }>,
  years: [] as number[],
};

export default async function HomePage() {
  const [
    seriesRes,
    recentPiecesRes,
    featuredPiecesRes,
    facetsRes,
    timelineRes,
    kindCountsRes,
    quoteCandidatesRes,
  ] = await Promise.allSettled([
    withTimeout(getFeaturedSeries(3), [], 10000),
    withTimeout(getRecentPieces({ take: 20 }), [], 10000),
    withTimeout(getFeaturedPieces(12), [], 10000),
    withTimeout(getFilterFacets(), DEFAULT_FACETS, 10000),
    withTimeout(getPublishingTimeline(), [], 10000),
    withTimeout(getKindCounts(), {} as Record<string, number>, 10000),
    withTimeout(getPullQuoteCandidates(8), [], 10000),
  ]);

  const series = seriesRes.status === "fulfilled" ? seriesRes.value : [];
  const recentPieces = recentPiecesRes.status === "fulfilled" ? recentPiecesRes.value : [];
  const featuredPieces = featuredPiecesRes.status === "fulfilled" ? featuredPiecesRes.value : [];
  const facets = facetsRes.status === "fulfilled" ? facetsRes.value : DEFAULT_FACETS;
  const timeline = timelineRes.status === "fulfilled" ? timelineRes.value : [];
  const kindCounts = kindCountsRes.status === "fulfilled" ? kindCountsRes.value : {};
  const quoteCandidates = quoteCandidatesRes.status === "fulfilled" ? quoteCandidatesRes.value : [];

  const leadSeries = series[0];
  const leadSlugs = new Set(leadSeries?.pieces.map((p) => p.slug) ?? []);

  const filteredRecent = recentPieces.filter((p) => !leadSlugs.has(p.slug));
  const latestEpisodes = filteredRecent.length > 0 ? filteredRecent.slice(0, 4) : recentPieces.slice(0, 4);

  const filteredFeatured = featuredPieces.filter((p) => !leadSlugs.has(p.slug));
  const featuredWriting =
    filteredFeatured.length > 0
      ? filteredFeatured.slice(0, 5)
      : recentPieces.slice(4, 9).length > 0
        ? recentPieces.slice(4, 9)
        : recentPieces.slice(0, 5);

  const quotes = extractPullQuotes(quoteCandidates);
  const quote = quotes[0] ?? null;

  const kinds = [
    { kind: "RACHANA" as const, count: kindCounts.RACHANA ?? 0 },
    { kind: "DOCUMENTARY" as const, count: kindCounts.DOCUMENTARY ?? 0 },
    { kind: "BLOG" as const, count: kindCounts.BLOG ?? 0 },
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

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
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
