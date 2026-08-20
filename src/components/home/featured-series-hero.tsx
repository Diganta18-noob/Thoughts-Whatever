"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
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
}: FeaturedSeriesHeroProps) {
  const { locale, isBn } = useLanguage();
  const meta = KIND_META[piece.kind];
  const summary = piece.dekBn || piece.excerptBn;
  const authorName = piece.authors?.[0]?.nameBn || "Rabindranath Tagore";
  const { cardMotionProps } = useCardHover();

  return (
    <section className="relative">
      {/* Small Section Header */}
      <div className="mb-4 flex items-center justify-between border-b border-rule/50 pb-2">
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-accent/90">
          Featured
        </span>
      </div>

      {/* Main Glass/Dark Frame */}
      <motion.div
        {...cardMotionProps}
        className="group relative overflow-hidden rounded-xl border border-rule/70 bg-surface-raised/30 backdrop-blur-sm transition-all duration-300 hover:border-rule"
      >
        <div className="grid lg:grid-cols-[1.1fr_1fr_0.9fr] items-center">
          {/* 1. Left: Widescreen / 16:9 Artwork */}
          <Link href={piecePath(piece.kind, piece.slug)} className="relative block h-full min-h-[260px] sm:min-h-[320px] overflow-hidden">
            {piece.coverImage && (
              <div className="relative h-full w-full">
                <Image
                  src={piece.coverImage}
                  alt={piece.titleBn}
                  fill
                  priority
                  unoptimized={piece.coverImage.startsWith("data:")}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface/80 via-transparent to-transparent lg:hidden" />
              </div>
            )}
          </Link>

          {/* 2. Middle: Content & Metadata Block */}
          <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10 border-t lg:border-t-0 lg:border-l border-rule/50">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-accent">
              {meta ? meta.labelEn : "DOCUMENTARY"}
            </span>

            <h2
              className="mt-3 font-bengali text-3xl sm:text-4xl font-medium leading-tight text-content tracking-tight transition-colors group-hover:text-accent"
              lang="bn"
            >
              <Link href={piecePath(piece.kind, piece.slug)}>
                {piece.titleBn}
              </Link>
            </h2>

            {piece.titleEn && (
              <p className="mt-1 font-serif text-sm italic text-content-faint">
                {piece.titleEn}
              </p>
            )}

            {summary && (
              <p
                className="mt-4 font-bengali text-xs sm:text-sm leading-relaxed text-content-soft line-clamp-3"
                lang="bn"
              >
                {summary}
              </p>
            )}

            {/* Meta Details Row */}
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.75rem] text-content-faint font-sans">
              <span className="font-medium text-content-soft">{authorName}</span>
              <span>·</span>
              {piece.publishedAt && (
                <>
                  <time dateTime={piece.publishedAt.toISOString()}>
                    {formatDate(piece.publishedAt, locale)}
                  </time>
                  <span>·</span>
                </>
              )}
              <span>{formatReading(piece.readingMinutes, locale)}</span>
            </div>

            {/* CTA Button */}
            <div className="mt-6">
              <Link
                href={piecePath(piece.kind, piece.slug)}
                className="inline-flex items-center gap-2 rounded-sm border border-rule bg-surface/80 px-4 py-2 text-xs font-medium text-content transition-all duration-200 hover:border-accent hover:text-accent"
              >
                <span>Read now</span>
                <span>→</span>
              </Link>
            </div>
          </div>

          {/* 3. Right: Curated Literary Pull Quote Block */}
          <div className="hidden lg:flex flex-col justify-center p-8 lg:p-10 border-l border-rule/50 self-stretch bg-surface-raised/10">
            <span className="text-3xl text-accent font-serif leading-none opacity-60">“</span>
            <blockquote className="mt-2 font-serif text-xs leading-relaxed text-content-soft italic space-y-2">
              <p>We read closely.</p>
              <p>We question gently.</p>
              <p>We document truthfully.</p>
              <p>We keep going.</p>
            </blockquote>
            <cite className="mt-6 block font-mono text-[0.6875rem] not-italic text-content-faint uppercase tracking-wider">
              — Thoughts Whatever
            </cite>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

