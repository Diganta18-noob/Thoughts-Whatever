import { Instagram } from "lucide-react";
import { ArticleCard } from "@/components/pieces/article-card";
import { SectionHeading } from "@/components/layout/page-header";
import { LetterBlock } from "@/components/newsletter/letter-block";
import { T, Localized } from "@/components/i18n/t";
import { getFeaturedPieces, getRecentPieces } from "@/lib/pieces";
import { siteConfig } from "@/lib/utils";
import { toBanglaDate } from "@/lib/bengali";

// Five minutes ISR cache so database is not queried on every page refresh.
export const revalidate = 300;

export default async function HomePage() {
  const [featured, rachana, documentary, blog] = await Promise.all([
    getFeaturedPieces(3),
    getRecentPieces({ kind: "RACHANA", take: 7 }),
    getRecentPieces({ kind: "DOCUMENTARY", take: 3 }),
    getRecentPieces({ kind: "BLOG", take: 4 }),
  ]);

  // If nothing has been marked featured, lead with the most recent writing
  // rather than showing an empty slot.
  const lead = featured[0] ?? rachana[0];
  const secondary = featured.slice(1);
  const rest = rachana.filter((p) => p.slug !== lead?.slug).slice(0, 6);
  const today = toBanglaDate(new Date());

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* ─── Masthead ───────────────────────────────────────── */}
      <section className="border-b border-rule py-14 text-center sm:py-20">
        <Localized
          as="p"
          className="label"
          bnClassName="font-bengali-sans tracking-normal"
          en={siteConfig.taglineEn}
          bn={siteConfig.tagline}
        />
        <h1
          className="mt-4 font-display text-[2.75rem] leading-none text-content sm:text-[4rem]"
        >
          Thoughts Whatever
        </h1>
        <p
          className="mx-auto mt-5 max-w-measure font-bengali text-bengali-base text-content-soft"
          lang="bn"
        >
          রিলে যা কয়েক মিনিটে বলা যায়, তার পুরোটা এখানে লেখা থাকে। সাহিত্য,
          পাঠ, আর তার পিছনের ইতিহাস — সূত্র সমেত।
        </p>
        {today && (
          <p className="mt-6 font-bengali-sans text-xs text-content-faint" lang="bn">
            {today.formatted} · {today.season}
          </p>
        )}
      </section>

      {/* ─── Lead ───────────────────────────────────────────── */}
      {lead && (
        <section className="border-b border-rule py-12">
          <div className="grid gap-10 lg:grid-cols-[1.8fr_1fr] lg:gap-12">
            <ArticleCard piece={lead} layout="hero" showKind priority />

            {secondary.length > 0 && (
              <div className="space-y-6 lg:border-l lg:border-rule lg:pl-10">
                <T
                  k="home.alsoFeatured"
                  className="label block"
                  bnClassName="font-bengali-sans tracking-normal"
                />
                <div className="space-y-6">
                  {secondary.map((piece) => (
                    <ArticleCard key={piece.slug} piece={piece} layout="stacked" showKind />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── Writing ────────────────────────────────────────── */}
      {rest.length > 0 && (
        <section className="py-14">
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

      {/* ─── Documentary ────────────────────────────────────── */}
      {documentary.length > 0 && (
        <section
          data-surface="archive"
          className="-mx-4 bg-surface px-4 py-14 sm:-mx-6 sm:px-6"
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

      {/* ─── Blog ───────────────────────────────────────────── */}
      {blog.length > 0 && (
        <section className="py-14">
          <SectionHeading labelEn="Blog" titleBn="ব্লগ" href="/blog" />
          <div className="grid gap-8 sm:grid-cols-2">
            {blog.map((piece) => (
              <ArticleCard key={piece.slug} piece={piece} layout="stacked" />
            ))}
          </div>
        </section>
      )}

      {/* ─── Letter + Instagram ─────────────────────────────── */}
      <section className="grid gap-6 border-t border-rule pt-14 md:grid-cols-[1.4fr_1fr]">
        <LetterBlock source="home" />

        <a
          href={siteConfig.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col justify-between rounded-sm border border-rule px-6 py-7 transition hover:border-accent/40"
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
