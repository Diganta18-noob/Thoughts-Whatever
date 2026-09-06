"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { piecePath, KIND_META } from "@/lib/nav";
import { formatDate, formatReading, toIsoString } from "@/lib/i18n/format";
import { useLanguage } from "@/components/providers/language-provider";
import { thumbnailSrc } from "@/lib/images";
import type { CardPiece } from "@/lib/pieces";
import { ArrowRight } from "lucide-react";

interface FeaturedHeroSlideProps {
  piece: CardPiece;
  priority?: boolean;
}

export function FeaturedHeroSlide({ piece, priority = false }: FeaturedHeroSlideProps) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const meta = KIND_META[piece.kind];
  const summary = piece.dekBn || piece.excerptBn;
  const authorName = piece.authors?.[0]?.nameBn;
  const imageSrc = thumbnailSrc(piece.slug, piece.thumbnailImage, piece.coverImage);

  return (
    <article className="relative grid w-full grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
      {/* ─── Mobile: Image Stacked on Top (Desktop: Right Column) ─── */}
      <div className="order-1 lg:order-2 lg:col-span-7">
        <Link href={href} className="group relative block overflow-hidden rounded-xl bg-surface-raised/20">
          {/* 16:9 Cinematic Canvas Container */}
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            {imageSrc ? (
              <motion.div
                className="relative h-full w-full"
                initial={{ scale: 1.04 }}
                animate={{ scale: 1 }}
                transition={{ duration: 7, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src={imageSrc}
                  alt={piece.titleBn}
                  fill
                  priority={priority}
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 750px"
                />
              </motion.div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-raised/40 text-content-faint font-mono text-xs">
                No Artwork
              </div>
            )}

            {/* Seamless Dark Gradient Vignette — blends into left content area on desktop */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden lg:block bg-gradient-to-r from-surface via-surface/40 to-transparent"
            />
            {/* Subtle top/bottom/right vignette */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface/90 via-transparent to-black/30 lg:from-surface/50"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-rule/40 rounded-xl"
            />
          </div>
        </Link>
      </div>

      {/* ─── Left Content Area: Editorial Narrative (40–45% Desktop) ─── */}
      <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col justify-center">
        {/* Eyebrow / Curator Mark */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.25em] text-accent font-semibold"
        >
          <span>FEATURED STORY</span>
          <span className="text-rule">•</span>
          <span className="text-content-faint tracking-widest font-normal">
            {meta ? (isBn ? meta.labelBn : meta.labelEn) : "DOCUMENTARY"}
          </span>
        </motion.div>

        {/* Story Title */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-bengali text-3xl sm:text-4xl lg:text-[2.65rem] font-medium leading-[1.18] text-content tracking-tight transition-colors duration-200 hover:text-accent"
          lang="bn"
        >
          <Link href={href}>{piece.titleBn}</Link>
        </motion.h2>

        {/* Literary Synopsis / Dek */}
        {summary && (
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-bengali text-sm sm:text-base leading-relaxed text-content-soft line-clamp-2 sm:line-clamp-3"
            lang="bn"
          >
            {summary}
          </motion.p>
        )}

        {/* Metadata Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-content-faint"
        >
          {authorName && (
            <>
              <span className="font-bengali uppercase tracking-wider text-content font-medium">
                {authorName}
              </span>
              <span className="text-rule">•</span>
            </>
          )}
          {piece.publishedAt && (
            <>
              <time dateTime={toIsoString(piece.publishedAt)}>
                {formatDate(piece.publishedAt, locale)}
              </time>
              <span className="text-rule">•</span>
            </>
          )}
          <span>{formatReading(piece.readingMinutes, locale)}</span>
        </motion.div>

        {/* Editorial Action CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <Link
            href={href}
            className="group/cta inline-flex items-center gap-2.5 rounded-sm border border-rule/70 bg-surface-raised/40 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.2em] text-content transition-all duration-300 hover:border-accent hover:bg-accent/10 hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <span>{isBn ? "রচনাটি পড়ুন" : "READ STORY"}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </article>
  );
}
