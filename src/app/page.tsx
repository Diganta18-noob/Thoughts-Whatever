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

export default async function HomePage() {
  const [series, recentPieces, featuredPieces, facets, timeline, kindCounts, quoteCandidates] =
    await Promise.all([
      getFeaturedSeries(3),
      getRecentPieces({ take: 20 }),
      getFeaturedPieces(12),
      getFilterFacets(),
      getPublishingTimeline(),
      getKindCounts(),
      getPullQuoteCandidates(8),
    ]);

  const leadSeries = series[0];
  const leadSlugs = new Set(leadSeries?.pieces.map((p) => p.slug) ?? []);

  // 1. The newest piece is selected for the single New Upload / Latest section
  const latestPiece = recentPieces[0] ?? null;

  // 2. Exclude the latest piece and series pieces from secondary lists to prevent duplication
  const excludedSlugs = new Set([...leadSlugs, ...(latestPiece ? [latestPiece.slug] : [])]);

  const latestEpisodes = recentPieces.filter((p) => !excludedSlugs.has(p.slug)).slice(0, 3);
  const featuredWriting = featuredPieces.filter((p) => !excludedSlugs.has(p.slug)).slice(0, 5);


  const quotes = extractPullQuotes(quoteCandidates);
  const quote = quotes[0] ?? null;

  const kinds = [
    { kind: "RACHANA" as const, count: kindCounts.RACHANA ?? 0 },
    { kind: "DOCUMENTARY" as const, count: kindCounts.DOCUMENTARY ?? 0 },
    { kind: "BLOG" as const, count: kindCounts.BLOG ?? 0 },
  ];
  const formTags = facets.tags
    .filter((t) => t.kind === "FORM")
    .map((t) => ({ slug: t.slug, labelBn: t.labelBn, count: t._count.pieces }));

  const authors = facets.authors.map((a) => ({
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
        {latestPiece && <LatestEpisodes latestPiece={latestPiece} secondaryPieces={latestEpisodes} />}
        {featuredWriting.length > 0 && <FeaturedWriting pieces={featuredWriting} />}

        <Categories kinds={kinds} forms={formTags} />
        <Timeline entries={timeline} />
        <ArchiveTeaser years={facets.years} />
        {authors.length > 0 && <Authors authors={authors} />}
      </div>

      <Quote quote={quote} />

      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <section className="border-t border-rule pt-14">
          <LetterBlock source="home" />
        </section>
      </div>
    </div>
  );
}
