
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSeriesBySlug, getSeriesList } from "@/lib/pieces";
import { piecePath } from "@/lib/nav";
import { Count, LocalDate, Num, Reading } from "@/components/i18n/values";
import { SeriesHeroBanner } from "@/components/series/series-hero-banner";
import { absoluteUrl, withTimeout } from "@/lib/utils";
import { JsonLd, seriesJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { SERIES_ENHANCEMENTS } from "@/lib/series-enhancements";
import { SeriesEnhancementsView } from "@/components/series/series-enhancements-view";

export const revalidate = 300;

function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateStaticParams() {
  try {
    const list = await withTimeout(getSeriesList(), [], 8000);
    return list.slice(0, 10).map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

type RouteProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export async function generateMetadata(props: RouteProps): Promise<Metadata> {
  const params = await props?.params;
  const rawSlug = params?.slug || "";
  const decoded = decodeSlug(rawSlug);
  try {
    const series = await withTimeout(
      getSeriesBySlug(decoded),
      null,
      8000,
    );
    if (!series) return { title: "পাওয়া গেল না" };

    const enhancement = SERIES_ENHANCEMENTS[decoded] || SERIES_ENHANCEMENTS[series.slug];
    const description =
      series.descBn ||
      (enhancement
        ? `${series.titleBn} — ${enhancement.englishTitle}. সম্পূর্ণ তথ্যচিত্র, চরিত্র বিশ্লেষণ ও ঐতিহাসিক পটভূমি।`
        : undefined);

    return {
      title: `${series.titleBn} — সম্পূর্ণ পাঠ ও তথ্যচিত্র সিরিজ`,
      description,
      alternates: { canonical: absoluteUrl(`/series/${series.slug}`) },
      openGraph: {
        type: "article",
        title: `${series.titleBn} — Thoughts Whatever`,
        description,
        url: absoluteUrl(`/series/${series.slug}`),
        siteName: "Thoughts Whatever",
      },
    };
  } catch {
    return { title: "পাওয়া গেল না" };
  }
}

import { SeriesTracker } from "@/components/analytics/series-tracker";

export default async function SeriesPage(props: RouteProps) {
  const params = await props?.params;
  const rawSlug = params?.slug || "";
  const decoded = decodeSlug(rawSlug);
  const series = await getSeriesBySlug(decoded);
  if (!series) notFound();

  const enhancement = SERIES_ENHANCEMENTS[decoded] || SERIES_ENHANCEMENTS[series.slug] || null;

  const totalReadingMinutes = series.pieces.reduce(
    (acc, p) => acc + (p.readingMinutes || 0),
    0
  );
  const firstPiece = series.pieces[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <JsonLd
        data={seriesJsonLd({
          slug: series.slug,
          titleBn: series.titleBn,
          descriptionBn: series.descBn,
          coverImage: series.coverImage,
          pieces: series.pieces,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "ধারাবাহিক", path: "/series" },
          { name: series.titleBn, path: `/series/${series.slug}` },
        ])}
      />
      {enhancement && <JsonLd data={faqJsonLd(enhancement.faqs)} />}
      <SeriesTracker
        seriesId={series.id}
        seriesName={series.titleBn}
        totalEpisodes={series.pieces.length}
      />

      {/* Series Hero Section */}
      <SeriesHeroBanner
        slug={series.slug}
        titleBn={series.titleBn}
        descBn={series.descBn}
        bannerImage={series.bannerImage}
        coverImage={series.coverImage}
        pieceCount={series.pieces.length}
        totalReadingMinutes={totalReadingMinutes}
        firstPieceHref={firstPiece ? piecePath(firstPiece.kind, firstPiece.slug) : null}
      />

      {/* Episode Grid & Reading Order */}
      <div className="mx-auto max-w-measure-wide py-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-content-faint mb-6">
          পর্বের তালিকা ({series.pieces.length})
        </h2>

        <ol className="divide-y divide-rule/60">
          {series.pieces.map((piece, i) => (
            <li key={piece.slug}>
              <Link
                href={piecePath(piece.kind, piece.slug)}
                className="group flex gap-5 py-6 transition hover:bg-surface-raised/20 rounded-lg px-3 -mx-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rule/60 bg-surface text-content-soft transition group-hover:border-accent group-hover:text-accent">
                  <Num value={piece.seriesOrder ?? i + 1} className="font-mono text-sm" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    className="font-bengali text-xl font-medium leading-snug text-content transition-colors group-hover:text-accent"
                    lang="bn"
                  >
                    {piece.titleBn}
                  </h3>
                  {(piece.dekBn || piece.excerptBn) && (
                    <p
                      className="mt-2 font-bengali text-bengali-sm text-content-soft line-clamp-2"
                      lang="bn"
                    >
                      {piece.dekBn || piece.excerptBn}
                    </p>
                  )}
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 text-[0.6875rem] text-content-faint">
                    {piece.publishedAt && <LocalDate value={piece.publishedAt} />}
                    <span>·</span>
                    <Reading minutes={piece.readingMinutes} />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      {/* Deep-dive Historical & Critical Enhancements */}
      {enhancement && <SeriesEnhancementsView enhancement={enhancement} />}
    </div>
  );
}
