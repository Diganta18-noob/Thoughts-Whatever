import { Instagram } from "lucide-react";
import { ArticleCard } from "@/components/pieces/article-card";
import { SectionHeading } from "@/components/layout/page-header";
import { LetterBlock } from "@/components/newsletter/letter-block";
import { T } from "@/components/i18n/t";
import { getFeaturedPieces, getRecentPieces, countPieces } from "@/lib/pieces";
import { siteConfig } from "@/lib/utils";
import { toBanglaDate } from "@/lib/bengali";
import { HomeHero } from "@/components/home/home-hero";
import { FeaturedSeriesHero } from "@/components/home/featured-series-hero";
import { AlsoFeaturedStacked } from "@/components/home/also-featured-stacked";
import { EditorialDivider } from "@/components/layout/editorial-divider";

// Five minutes ISR cache so database is not queried on every page refresh.
export const revalidate = 300;

export default async function HomePage() {
  const [featured, rachana, documentary, blog, totalPieces] = await Promise.all([
    getFeaturedPieces(4),
    getRecentPieces({ kind: "RACHANA", take: 7 }),
    getRecentPieces({ kind: "DOCUMENTARY", take: 3 }),
    getRecentPieces({ kind: "BLOG", take: 4 }),
    countPieces(),
  ]);

  // Lead piece for the Featured Series centerpiece hero
  const lead = featured[0] ?? rachana[0];
  const secondary = featured.slice(1, 4);
  const rest = rachana.filter((p) => p.slug !== lead?.slug).slice(0, 6);
  const today = toBanglaDate(new Date());

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* 1. Home Editorial Hero Header */}
      <HomeHero today={today} totalPieces={totalPieces} />

      <EditorialDivider variant="ornament" />

      {/* 2. Featured Series Centerpiece Hero + Also Featured Sidebar */}
      {lead && (
        <section className="py-6">
          <div className="grid gap-10 lg:grid-cols-[1.85fr_1fr] lg:gap-12 items-start">
            <FeaturedSeriesHero
              piece={lead}
              totalEpisodesInSeries={12}
              currentEpisodeNumber={6}
              seriesTitleBn="মেঘনাদবধ কাব্য"
              seriesSlug="meghnadbadh-kavya"
            />

            {secondary.length > 0 && (
              <div className="lg:border-l lg:border-rule/60 lg:pl-10 h-full">
                <AlsoFeaturedStacked pieces={secondary} />
              </div>
            )}
          </div>
        </section>
      )}

      <EditorialDivider variant="diamond" />

      {/* 3. Writing Section */}
      {rest.length > 0 && (
        <section className="py-10">
          <SectionHeading
            labelEn="Writing"
            titleBn="রচনা — রিলের পুরো লেখা"
            href="/writing"
          />
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((piece) => (
              <ArticleCard key={piece.slug} piece={piece} layout="stacked" />
            ))}
          </div>
        </section>
      )}

      <EditorialDivider variant="ornament" />

      {/* 4. Documentary Section (Cinematic Dark Surface) */}
      {documentary.length > 0 && (
        <section
          data-surface="archive"
          className="-mx-4 bg-surface px-4 py-14 rounded-2xl sm:-mx-6 sm:px-6 my-10"
        >
          <SectionHeading
            labelEn="Documentary"
            titleBn="তথ্যচিত্র"
            href="/documentary"
          />

          <div className="grid gap-6 md:grid-cols-3">
            {documentary.map((piece) => (
              <ArticleCard key={piece.slug} piece={piece} variant="archive" layout="stacked" />
            ))}
          </div>
        </section>
      )}

      <EditorialDivider variant="diamond" />

      {/* 5. Blog Section */}
      {blog.length > 0 && (
        <section className="py-10">
          <SectionHeading labelEn="Blog" titleBn="ব্লগ" href="/blog" />
          <div className="grid gap-8 sm:grid-cols-2">
            {blog.map((piece) => (
              <ArticleCard key={piece.slug} piece={piece} layout="stacked" />
            ))}
          </div>
        </section>
      )}

      <EditorialDivider variant="simple" />

      {/* 6. Letter + Instagram Footer */}
      <section className="grid gap-6 border-t border-rule/60 pt-12 md:grid-cols-[1.4fr_1fr]">
        <LetterBlock source="home" />

        <a
          href={siteConfig.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col justify-between rounded-xl border border-rule/70 bg-surface-raised/30 px-6 py-7 transition hover:border-accent/40 hover:bg-surface-raised/50"
        >
          <div>
            <T
              k="home.whereItStarts"
              className="label"
              bnClassName="font-bengali-sans tracking-normal"
            />
            <p
              className="mt-2 font-bengali text-bengali-base text-content-soft"
              lang="bn"
            >
              প্রতিটি লেখা শুরু হয় একটা রিল থেকে। সেগুলো ইনস্টাগ্রামে।
            </p>
          </div>
          <span className="mt-6 inline-flex items-center gap-2 font-serif text-sm text-accent">
            <Instagram className="h-4 w-4" />
            @thoughts.whatever_
          </span>
        </a>
      </section>
    </div>
  );
}
