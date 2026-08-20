"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatDate } from "@/lib/i18n/format";
import { piecePath, KIND_META } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";
import { motion } from "framer-motion";
import { CoverImageFrame } from "@/components/media/cover-image-frame";
import { useCardHover } from "@/lib/hooks/use-card-hover";

function EpisodeCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const meta = KIND_META[piece.kind];
  const { cardMotionProps } = useCardHover();

  return (
    <motion.article
      className="group relative flex flex-col justify-between rounded-xl border border-rule/50 bg-gradient-to-b from-surface-raised/30 to-surface-raised/10 p-3.5 sm:p-4 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:bg-surface-raised/40 hover:shadow-lg"
      {...cardMotionProps}
    >
      <Link href={href} className="block flex-1 flex flex-col">
        {/* 3:4 Portrait Book Poster Artwork */}
        {piece.coverImage && (
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-surface-raised/40 shadow-inner">
            <CoverImageFrame
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              aspect="aspect-[3/4]"
              rounded="rounded-lg"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              overlay
            />
          </div>
        )}

        {/* Content Details */}
        <div className="mt-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Meta row */}
            <div className="flex items-center justify-between text-[0.6875rem] font-sans text-content-faint">
              <time dateTime={piece.publishedAt?.toISOString()}>
                {piece.publishedAt && formatDate(piece.publishedAt, locale)}
              </time>
              <span>{formatReading(piece.readingMinutes, locale)}</span>
            </div>

            {/* Title */}
            <h3
              className="mt-2.5 font-bengali text-lg sm:text-xl font-medium leading-snug text-content tracking-tight transition-colors duration-200 group-hover:text-accent line-clamp-2"
              lang="bn"
            >
              {piece.titleBn}
            </h3>

            {/* Synopsis Dek */}
            {piece.dekBn && (
              <p
                className="mt-2 line-clamp-2 font-bengali text-xs sm:text-[0.8125rem] leading-relaxed text-content-soft"
                lang="bn"
              >
                {piece.dekBn}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Footer Action */}
      <div className="mt-4 pt-3 border-t border-rule/30 flex items-center justify-between">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-transform duration-200 group-hover:translate-x-0.5 hover:opacity-80"
        >
          <span>Read essay</span>
          <span>→</span>
        </Link>
        {meta && (
          <span className="font-mono text-[0.625rem] uppercase tracking-wider text-content-faint">
            {isBn ? meta.labelBn : meta.labelEn}
          </span>
        )}
      </div>
    </motion.article>
  );
}

export function LatestEpisodes({ pieces }: { pieces: CardPiece[] }) {
  const { isBn, t } = useLanguage();

  if (!pieces.length) return null;

  return (
    <section className="py-6">
      <Reveal>
        <div className="mb-6 flex items-center justify-between border-b border-rule/50 pb-2.5">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-accent font-medium">
              Latest
            </span>
            <h2 className="font-bengali text-xl font-medium text-content" lang="bn">
              সাম্প্রতিক
            </h2>
          </div>
          <Link
            href="/writing"
            className="group/link inline-flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-widest text-content-soft transition-colors hover:text-accent"
          >
            <span>View all</span>
            <span className="transition-transform group-hover/link:translate-x-0.5">→</span>
          </Link>
        </div>
      </Reveal>

      <Stagger as="div" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" delay={0.1}>
        {pieces.slice(0, 4).map((piece) => (
          <StaggerItem key={piece.slug}>
            <EpisodeCard piece={piece} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}


