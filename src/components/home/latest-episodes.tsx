"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { CoverImage } from "@/components/media/cover-image";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatDate } from "@/lib/i18n/format";
import { piecePath } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";

import { motion } from "framer-motion";
import { CoverImageFrame } from "@/components/media/cover-image-frame";
import { useCardHover } from "@/lib/hooks/use-card-hover";

function EpisodeCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const { cardMotionProps } = useCardHover();

  return (
    <motion.article className="group flex flex-col justify-between rounded-xl border border-rule/70 bg-surface-raised/20 p-4 transition-all duration-300 hover:border-rule hover:bg-surface-raised/40" {...cardMotionProps}>
      <Link href={href} className="block">
        {piece.coverImage && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg">
            <CoverImageFrame
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              aspect="aspect-[16/10]"
              rounded="rounded-lg"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              overlay
            />
          </div>
        )}

        <div className="mt-4">
          <div className="flex items-baseline gap-2 text-[0.6875rem] text-content-faint font-sans">
            <time dateTime={piece.publishedAt?.toISOString()}>
              {piece.publishedAt && formatDate(piece.publishedAt, locale)}
            </time>
            <span>·</span>
            <span>{formatReading(piece.readingMinutes, locale)}</span>
          </div>

          <h3
            className="mt-2 font-bengali text-lg font-medium leading-snug text-content transition-colors group-hover:text-accent"
            lang="bn"
          >
            {piece.titleBn}
          </h3>

          {piece.dekBn && (
            <p
              className="mt-2 line-clamp-2 font-bengali text-xs leading-relaxed text-content-soft"
              lang="bn"
            >
              {piece.dekBn}
            </p>
          )}
        </div>
      </Link>

      <div className="mt-4 pt-3 border-t border-rule/30">
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-medium text-accent transition hover:opacity-80"
        >
          <span>Read essay</span>
          <span>→</span>
        </Link>
      </div>
    </motion.article>
  );
}

export function LatestEpisodes({ pieces }: { pieces: CardPiece[] }) {
  const { isBn, t } = useLanguage();

  if (!pieces.length) return null;

  return (
    <section className="py-8">
      <Reveal>
        <div className="mb-6 flex items-center justify-between border-b border-rule/50 pb-2">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-accent/90">
              Latest
            </span>
            <h2 className="font-bengali text-xl font-medium text-content hidden sm:inline" lang="bn">
              সাম্প্রতিক
            </h2>
          </div>
          <Link
            href="/writing"
            className="inline-flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-wider text-content-soft transition hover:text-accent"
          >
            <span>View all</span>
            <span>→</span>
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

