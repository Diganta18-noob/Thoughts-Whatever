import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { FeaturedSeriesHero } from "@/components/home/featured-series-hero";
import { LatestEpisodes } from "@/components/home/latest-episodes";
import { FeaturedWriting } from "@/components/home/featured-writing";
import { LetterBlock } from "@/components/newsletter/letter-block";
import {
  HeroCardSkeleton,
  EpisodesSkeleton,
} from "@/components/home/section-skeletons";
import {
  getFeaturedSeries,
  getRecentPieces,
  getFilterFacets,
  type CardPiece,
} from "@/lib/pieces";
import { JsonLd, websiteJsonLd, seriesJsonLd } from "@/lib/seo";
import { withTimeout } from "@/lib/utils";

export const revalidate = 300;

const DEFAULT_FACETS = {
  tags: [] as Array<{ slug: string; labelBn: string; kind: string; _count: { pieces: number } }>,
  authors: [] as Array<{ slug: string; nameBn: string; era: string | null; _count: { pieces: number } }>,
  series: [] as Array<{ slug: string; titleBn: string }>,
  years: [] as number[],
};

export default async function HomePage() {
  const [recentPieces, series, facets] = await Promise.all([
    withTimeout(getRecentPieces({ take: 20 }), [] as CardPiece[], 5000, "home getRecentPieces"),
    withTimeout(getFeaturedSeries(3), [] as any[], 2500, "home getFeaturedSeries"),
    withTimeout(getFilterFacets(), DEFAULT_FACETS, 5000, "home getFilterFacets"),
  ]);

  if (recentPieces.length === 0) {
    console.error("[home] rendering with zero pieces — query timed out or returned empty");
  }

  const leadSeries = series[0];

  // Primary hero content glimpse (featured piece or first documentary)
  const primaryGlimpsePiece =
    recentPieces.find((p) => p.kind === "DOCUMENTARY") || recentPieces[0] || null;

  // Latest documentaries (filter out lead if present, take 4)
  const documentaryPieces = recentPieces.filter((p) => p.kind === "DOCUMENTARY");
  const latestEpisodes =
    documentaryPieces.length >= 4
      ? documentaryPieces.slice(0, 4)
      : recentPieces.slice(0, 4);

  // Recent writing (essays/blogs/rachana)
  const writingPieces = recentPieces.filter((p) => p.kind !== "DOCUMENTARY");
  const featuredWriting =
    writingPieces.length >= 5
      ? writingPieces.slice(0, 5)
      : recentPieces.slice(0, 5);

  return (
    <div className="min-h-screen bg-surface text-content">
      <JsonLd data={websiteJsonLd()} />
      {leadSeries && <JsonLd data={seriesJsonLd(leadSeries)} />}

      {/* 1. Hero Section (Original Text-Based Branding) */}
      <Hero />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12 sm:space-y-16">
        {/* 2. Featured Documentary Spotlight */}
        {primaryGlimpsePiece && (
          <Suspense fallback={<HeroCardSkeleton />}>
            <FeaturedSeriesHero
              piece={primaryGlimpsePiece}
              totalEpisodesInSeries={6}
              currentEpisodeNumber={1}
              seriesTitleBn={primaryGlimpsePiece.seriesOrder ? "মেঘনাদবধ কাব্য" : undefined}
            />
          </Suspense>
        )}

        {/* 3. Latest Documentaries Grid */}
        {latestEpisodes.length > 0 && (
          <Suspense fallback={<EpisodesSkeleton />}>
            <LatestEpisodes pieces={latestEpisodes} />
          </Suspense>
        )}

        {/* 4. Recent Writing Asymmetric Editorial Layout */}
        {featuredWriting.length > 0 && (
          <FeaturedWriting pieces={featuredWriting} />
        )}

        {/* 5. The Letter (Newsletter Banner) */}
        <section className="pt-4 pb-12">
          <LetterBlock source="home" />
        </section>
      </div>
    </div>
  );
}
