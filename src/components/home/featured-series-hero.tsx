"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PortraitCover } from "@/components/pieces/portrait-cover";
import { piecePath, KIND_META } from "@/lib/nav";
import { formatDate, formatReading } from "@/lib/i18n/format";
import { useLanguage } from "@/components/providers/language-provider";
import { useCardHover } from "@/lib/hooks/use-card-hover";
import type { PieceCardData } from "@/components/pieces/piece-card";

export interface FeaturedSeriesHeroProps {
  piece: PieceCardData;
  totalEpisodesInSeries?: number;
  currentEpisodeNumber?: number;
  seriesTitleBn?: string;
  seriesSlug?: string;
}

export function FeaturedSeriesHero({
  piece,
  totalEpisodesInSeries = 6,
  currentEpisodeNumber = 6,
}: FeaturedSeriesHeroProps) {
  const { locale } = useLanguage();
  const meta = KIND_META[piece.kind];
  const summary = piece.dekBn || piece.excerptBn;
  const { cardMotionProps } = useCardHover();

  return (
    <motion.div
      {...cardMotionProps}
      className="group relative overflow-hidden rounded-2xl border border-rule/70 bg-surface-raised/20 p-6 sm:p-10 lg:p-14 backdrop-blur-sm transition-all duration-300 hover:border-rule"
    >
      <div className="grid gap-10 md:grid-cols-[1.1fr_1.4fr] lg:grid-cols-[1fr_1.4fr] items-center">
        {/* Left: Premium Portrait Cover Frame */}
        <div className="flex items-center justify-center">
          {piece.coverImage && (
            <Link href={piecePath(piece.kind, piece.slug)} className="block w-full max-w-sm">
              <PortraitCover
                src={piece.coverImage}
                alt={piece.titleBn}
                width={piece.coverImageWidth}
                height={piece.coverImageHeight}
                priority
                size="hero"
                aspectRatio="3/4"
              />
            </Link>
          )}
        </div>

        {/* Right: Metadata & Content Details */}
        <div className="flex flex-col justify-center">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono tracking-wider">
            <span className="uppercase text-accent font-semibold">
              {meta ? meta.labelEn : "DOCUMENTARY"}
            </span>
            <span className="text-content-faint">·</span>
            {piece.publishedAt && (
              <>
                <time dateTime={piece.publishedAt.toISOString()} className="text-content-faint">
                  {formatDate(piece.publishedAt, locale)}
                </time>
                <span className="text-content-faint">·</span>
              </>
            )}
            <span className="text-content-faint">
              {formatReading(piece.readingMinutes, locale)}
            </span>
          </div>

          {/* Episode Progress Pill */}
          <div className="mt-5 flex items-center gap-3">
            <span className="font-bengali-sans text-xs text-content-faint" lang="bn">
              পর্ব {currentEpisodeNumber}/{totalEpisodesInSeries}
            </span>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-rule/50">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${(currentEpisodeNumber / totalEpisodesInSeries) * 100}%` }}
              />
            </div>
          </div>

          {/* Big Bengali Title */}
          <h2
            className="mt-6 font-bengali text-3xl sm:text-4xl lg:text-5xl font-medium leading-tight text-content tracking-tight transition-colors group-hover:text-accent"
            lang="bn"
          >
            <Link href={piecePath(piece.kind, piece.slug)}>
              {piece.titleBn}
            </Link>
          </h2>

          {/* Bengali Description */}
          {summary && (
            <p
              className="mt-5 font-bengali text-sm sm:text-base leading-relaxed text-content-soft line-clamp-3"
              lang="bn"
            >
              {summary}
            </p>
          )}

          {/* Action CTA Button */}
          <div className="mt-8">
            <Link
              href={piecePath(piece.kind, piece.slug)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-accent/90 hover:shadow"
            >
              <span>Continue Reading</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


