"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PortraitCover } from "@/components/pieces/portrait-cover";
import { piecePath, KIND_META } from "@/lib/nav";
import { toBanglaDate } from "@/lib/bengali";
import { formatDate, formatReading } from "@/lib/i18n/format";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
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
  totalEpisodesInSeries = 12,
  currentEpisodeNumber = 6,
  seriesTitleBn,
  seriesSlug,
}: FeaturedSeriesHeroProps) {
  const { locale, isBn, t } = useLanguage();
  const meta = KIND_META[piece.kind];
  const summary = piece.dekBn || piece.excerptBn;
  const metaFace = isBn ? "font-bengali-sans" : "font-sans";
  const banglaDate = piece.publishedAt ? toBanglaDate(piece.publishedAt) : null;

  const episodeText = `${currentEpisodeNumber} / ${totalEpisodesInSeries}`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-rule/70 bg-gradient-to-b from-surface-raised/50 to-surface-raised/20 p-6 sm:p-8 lg:p-12 shadow-sm transition-all duration-300 hover:border-rule">
      <div className="grid gap-8 lg:grid-cols-[2fr_3fr] lg:items-center lg:gap-12 min-h-[500px]">
        {/* 1. Left 40% — Portrait Cover Frame */}
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
                aspectRatio="9/16"
              />
            </Link>
          )}
        </div>

        {/* 2. Right 60% — Text Block */}
        <div className="flex flex-col justify-center min-w-0">
          {/* Badges & Meta */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="label !text-accent font-bengali-sans uppercase tracking-wider text-xs">
              {isBn ? meta.labelBn : meta.labelEn}
            </span>

            {seriesTitleBn && (
              <>
                <span className="text-rule">•</span>
                <span className="font-bengali-sans text-xs text-content-soft">
                  {seriesTitleBn}
                </span>
              </>
            )}

            {piece.publishedAt && (
              <>
                <span className="text-rule">•</span>
                <span className={cn(metaFace, "text-xs text-content-faint")}>
                  {formatDate(piece.publishedAt, locale)}
                </span>
              </>
            )}

            <span className="text-rule">•</span>
            <span className={cn(metaFace, "text-xs text-content-faint")}>
              {formatReading(piece.readingMinutes, locale)}
            </span>
          </div>

          {/* Episode Progress Bar Pill */}
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-rule/60 bg-surface/80 px-3.5 py-1 text-xs text-content-soft self-start">
            <span className="font-bengali-sans" lang="bn">পর্ব {currentEpisodeNumber} / {totalEpisodesInSeries}</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-rule/50">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${(currentEpisodeNumber / totalEpisodesInSeries) * 100}%` }}
              />
            </div>
          </div>

          {/* Huge Bengali Title */}
          <h2
            className="font-bengali font-medium text-3xl sm:text-4xl lg:text-5xl leading-tight text-content tracking-tight mb-4 transition-colors hover:text-accent"
            lang="bn"
          >
            <Link href={piecePath(piece.kind, piece.slug)}>
              {piece.titleBn}
            </Link>
          </h2>

          {/* Short Editorial Description (2-3 lines) */}
          {summary && (
            <p
              className="font-bengali text-bengali-base sm:text-bengali-lg text-content-soft leading-relaxed line-clamp-3 mb-8"
              lang="bn"
            >
              {summary}
            </p>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            <Link
              href={piecePath(piece.kind, piece.slug)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow"
            >
              <span>Continue Reading</span>
              <span>→</span>
            </Link>

            {seriesSlug && (
              <Link
                href={`/series/${seriesSlug}`}
                className="text-xs font-bengali-sans text-content-soft hover:text-accent transition"
                lang="bn"
              >
                সব পর্ব দেখুন ({totalEpisodesInSeries}) →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
