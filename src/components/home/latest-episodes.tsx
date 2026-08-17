"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatDate } from "@/lib/i18n/format";
import { piecePath } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";
import { motion } from "framer-motion";
import { CoverImageFrame } from "@/components/media/cover-image-frame";
import { useCardHover } from "@/lib/hooks/use-card-hover";

function DocumentaryCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-wider";
  const { cardMotionProps } = useCardHover();

  return (
    <motion.article className="group flex flex-col" {...cardMotionProps}>
      <Link href={href} className="block group">
        <div className="overflow-hidden rounded-sm border border-rule/60 bg-surface-raised transition-all duration-300 group-hover:border-accent/40">
          {piece.coverImage && (
            <CoverImageFrame
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              aspect="aspect-[16/9]"
              rounded="rounded-none"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              overlay
            />
          )}
        </div>

        <div className="mt-3.5">
          <div className={`flex items-center gap-2 text-[0.72rem] text-content-faint ${monoFace}`}>
            <time dateTime={piece.publishedAt ? new Date(piece.publishedAt).toISOString() : undefined}>
              {piece.publishedAt && formatDate(piece.publishedAt, locale)}
            </time>
            <span>·</span>
            <span>{formatReading(piece.readingMinutes, locale)}</span>
          </div>

          <h3
            className="mt-2 font-display text-base font-medium leading-snug text-content transition-colors group-hover:text-accent line-clamp-1"
            lang="bn"
          >
            {piece.titleBn}
          </h3>

          {piece.dekBn && (
            <p
              className="mt-1.5 font-bengali text-xs leading-relaxed text-content-soft line-clamp-2"
              lang="bn"
            >
              {piece.dekBn}
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

export function LatestEpisodes({ pieces }: { pieces: CardPiece[] }) {
  const { isBn } = useLanguage();

  if (!pieces.length) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mb-6 sm:mb-8 flex items-end justify-between border-b border-rule/60 pb-3">
        <div>
          <h2 className="text-[0.75rem] sm:text-xs font-mono uppercase tracking-[0.18em] text-content font-medium">
            {isBn ? "সাম্প্রতিক তথ্যচিত্র" : "LATEST DOCUMENTARIES"}
          </h2>
        </div>
        <Link
          href="/documentary"
          className="text-xs font-sans text-accent hover:underline flex items-center gap-1 transition"
        >
          <span>{isBn ? "সব দেখুন" : "View all"}</span>
          <span aria-hidden>→</span>
        </Link>
      </div>

      <Stagger as="div" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pieces.slice(0, 4).map((piece) => (
          <StaggerItem key={piece.slug} as="div">
            <DocumentaryCard piece={piece} />
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
