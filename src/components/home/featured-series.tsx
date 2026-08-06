"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { CoverImage } from "@/components/media/cover-image";
import { useProgress } from "@/components/providers/progress-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatNumber } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/types";
import { KIND_META } from "@/lib/nav";

type SeriesWithPieces = {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string | null;
  descBn: string | null;
  coverImage: string | null;
  pieces: Array<{
    slug: string;
    kind: string;
    titleBn: string;
    readingMinutes: number;
    seriesOrder: number | null;
  }>;
};

function SeriesCard({
  series,
  locale,
  isBn,
}: {
  series: SeriesWithPieces;
  locale: Locale;
  isBn: boolean;
}) {
  const { t } = useLanguage();
  const { seriesProgress } = useProgress();

  const slugs = series.pieces.map((p) => p.slug);
  const progress = seriesProgress(slugs);
  const totalReading = series.pieces.reduce((sum, p) => sum + p.readingMinutes, 0);
  const kindPath = series.pieces[0]?.kind
    ? KIND_META[series.pieces[0].kind as keyof typeof KIND_META].path
    : "/writing";
  const resumeHref = progress.resumeSlug
    ? `${kindPath}/${progress.resumeSlug}`
    : `${kindPath}/${series.pieces[0]?.slug}`;

  const face = isBn ? "font-bengali" : "font-serif";
  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";

  return (
    <article className="group relative">
      <Link href={`/series/${series.slug}`} className="block">
        {series.coverImage && (
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-surface-raised">
            <CoverImage
              owner="series"
              slug={series.slug}
              coverImage={series.coverImage}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        )}

        <div className="mt-4">
          <div className={`flex items-baseline gap-3 text-xs text-content-faint ${monoFace}`}>
            <span>
              {t("series.episodes", {
                count: formatNumber(series.pieces.length, locale),
              })}
            </span>
            <span>·</span>
            <span>{formatReading(totalReading, locale)}</span>
          </div>

          <h3
            className="mt-2 font-bengali text-xl font-medium leading-snug text-content transition group-hover:text-accent"
            lang="bn"
          >
            {series.titleBn}
          </h3>

          {series.descBn && (
            <p
              className="mt-3 line-clamp-3 font-bengali text-sm leading-relaxed text-content-soft"
              lang="bn"
            >
              {series.descBn}
            </p>
          )}
        </div>
      </Link>

      {progress.started > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className={`text-xs text-content-faint ${monoFace}`}>
              {t("series.progress")}
            </span>
            <span className={`text-xs font-medium text-accent ${monoFace}`}>
              {formatNumber(Math.round(progress.percent * 100), locale)}%
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface-raised">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${progress.percent * 100}%` }}
            />
          </div>

          <Magnetic strength={6}>
            <Link
              href={resumeHref}
              className={`mt-4 inline-flex items-center gap-2 rounded-sm border border-accent/20 bg-accent/5 px-4 py-2 text-sm transition hover:border-accent/30 hover:bg-accent/10 ${face}`}
              lang={locale}
            >
              {progress.finished ? t("series.readAgain") : t("series.resume")}
            </Link>
          </Magnetic>
        </div>
      )}
    </article>
  );
}

export function FeaturedSeries({ series }: { series: SeriesWithPieces[] }) {
  const { locale, isBn, t } = useLanguage();

  if (!series.length) return null;

  return (
    <section className="py-16">
      <Reveal>
        <div className="mb-8 border-b border-rule pb-3">
          <h2 className="font-bengali text-2xl font-medium text-content" lang="bn">
            ধারাবাহিক
          </h2>
          {!isBn && (
            <p className="mt-1 font-serif text-sm italic text-content-faint" lang="en">
              {t("home.seriesGloss")}
            </p>
          )}
        </div>
      </Reveal>

      <Stagger as="div" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" delay={0.1}>
        {series.map((s) => (
          <StaggerItem key={s.id} as="div">
            <SeriesCard series={s} locale={locale} isBn={isBn} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
