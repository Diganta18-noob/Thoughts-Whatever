"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookmarkButton } from "@/components/reader/bookmark-button";
import { NarrationButton } from "@/components/audio/narration-button";
import { toBanglaDate } from "@/lib/bengali";
import { formatDate, formatReading } from "@/lib/i18n/format";
import { useLanguage } from "@/components/providers/language-provider";
import { KIND_META, piecePath } from "@/lib/nav";
import { cn } from "@/lib/utils";
import type { FullPiece } from "@/lib/pieces";

export interface ArticleHeroProps {
  piece: FullPiece;
  onScrollToContent?: () => void;
}

export function ArticleHero({ piece, onScrollToContent }: ArticleHeroProps) {
  const { locale, isBn } = useLanguage();
  const kindMeta = KIND_META[piece.kind];
  const banglaDate = piece.publishedAt ? toBanglaDate(piece.publishedAt) : null;
  const metaFace = isBn ? "font-bengali-sans" : "font-sans";

  return (
    <header className="relative pt-6 pb-12">
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-14">
        {/* Left Column: Title, Subtitle, Meta & Actions */}
        <div className="flex flex-col justify-center min-w-0">
          {/* Eyebrow / Category */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="label !text-accent font-bengali-sans uppercase text-xs tracking-wider">
              {isBn ? kindMeta.labelBn : kindMeta.labelEn}
            </span>

            {piece.series && (
              <>
                <span className="text-rule">•</span>
                <Link
                  href={`/series/${piece.series.slug}`}
                  className="font-bengali-sans text-xs text-content-soft hover:text-accent transition"
                  lang="bn"
                >
                  {piece.series.titleBn}
                  {piece.seriesOrder && ` · পর্ব ${piece.seriesOrder}`}
                </Link>
              </>
            )}
          </div>

          {/* Large Title */}
          <h1
            className="font-bengali text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.25] text-content tracking-tight mb-4"
            lang="bn"
          >
            {piece.titleBn}
          </h1>

          {/* Subtitle / Standfirst Quote */}
          {piece.subtitleBn && (
            <p
              className="font-bengali text-bengali-lg text-content-soft leading-relaxed mb-6 border-l-2 border-accent/60 pl-4"
              lang="bn"
            >
              “{piece.subtitleBn}”
            </p>
          )}

          {/* Metadata Row */}
          <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-content-faint border-y border-rule/50 py-3">
            {piece.publishedAt && (
              <span className={cn(metaFace, "flex items-center gap-1.5")}>
                <span>📅</span>
                <span>{formatDate(piece.publishedAt, locale)}</span>
                {banglaDate && <span lang="bn" className="font-bengali-sans">({banglaDate.formatted})</span>}
              </span>
            )}

            <span className="text-rule">•</span>

            <span className={cn(metaFace, "flex items-center gap-1.5")}>
              <span>⏱</span>
              <span>{formatReading(piece.readingMinutes, locale)}</span>
            </span>

            <span className="text-rule">•</span>

            <span className={cn(metaFace, "flex items-center gap-1.5")}>
              <span>👁</span>
              <span>430 readers</span>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onScrollToContent}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-accent/90"
            >
              <span>Continue Reading</span>
              <span>↓</span>
            </button>

            {piece.audioUrl && (
              <NarrationButton
                track={{
                  id: piece.slug,
                  src: piece.audioUrl,
                  titleBn: piece.titleBn,
                  href: piecePath(piece.kind, piece.slug),
                  durationSec: piece.audioSec ?? undefined,
                }}
              />
            )}

            <BookmarkButton
              slug={piece.slug}
              kind={piece.kind}
              titleBn={piece.titleBn}
              withLabel
            />
          </div>
        </div>

        {/* Right Column: Portrait Cover Artwork Frame with Ambient Glow */}
        {piece.coverImage && (
          <div className="relative flex items-center justify-center">
            {/* Ambient Warm Glow Backdrop */}
            <div
              className="absolute -inset-4 rounded-3xl bg-cover bg-center blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundImage: `url(${piece.coverImage})` }}
            />

            {/* Main Portrait Frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-2xl border border-rule/80 bg-surface-raised/80 shadow-2xl w-full max-w-sm max-h-[32rem] sm:max-h-[36rem]"
              style={{ aspectRatio: "9/16" }}
            >
              <Image
                src={piece.coverImage}
                alt={piece.titleBn}
                width={piece.coverImageWidth || 600}
                height={piece.coverImageHeight || 1000}
                priority
                unoptimized={piece.coverImage.startsWith("data:")}
                className="w-full h-full object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </motion.div>
          </div>
        )}
      </div>
    </header>
  );
}
