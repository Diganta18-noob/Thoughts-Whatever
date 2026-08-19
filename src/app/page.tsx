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
} from "@/lib/pieces";
import { JsonLd, websiteJsonLd, seriesJsonLd } from "@/lib/seo";
import { debug } from "@/lib/debug";

export const revalidate = 300;

async function getHomepageDataWithTimeout() {
  const TIMEOUT_MS = 8000; // 8 seconds max

  const dataPromise = Promise.all([
    getRecentPieces({ take: 20 }),
    getFeaturedSeries(3),
    getFilterFacets(),
  ]);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Homepage data timeout after 8s")), TIMEOUT_MS),
  );

  return Promise.race([dataPromise, timeoutPromise]);
}

export default async function HomePage() {
  const end = debug.time("HOME", "Promise.all data fetch");
  const [recentPieces, series, facets] = await getHomepageDataWithTimeout();
  end();
  debug.log("HOME", "All homepage data resolved", {
    series: series.length,
    pieces: recentPieces.length,
  });

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
