"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading } from "@/lib/i18n/format";
import { piecePath, KIND_META } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";
import { CoverImageFrame } from "@/components/media/cover-image-frame";
import { useCardHover } from "@/lib/hooks/use-card-hover";
import { motion } from "framer-motion";

function LargeFeaturedCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const meta = KIND_META[piece.kind];
  const { cardMotionProps } = useCardHover();

  return (
    <motion.article className="group h-full flex flex-col justify-between" {...cardMotionProps}>
      <Link href={href} className="block group">
        <div className="overflow-hidden rounded-sm border border-rule/60 bg-surface-raised transition-all duration-300 group-hover:border-accent/40">
          {piece.coverImage && (
            <CoverImageFrame
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              aspect="aspect-[16/9]"
              rounded="rounded-none"
              sizes="(max-width: 1024px) 100vw, 50vw"
              overlay
            />
          )}
        </div>

        <div className="mt-5">
          <span className="text-[0.7rem] uppercase tracking-[0.16em] text-accent font-mono font-medium">
            {isBn ? meta.labelBn : meta.labelEn || "ESSAY"}
          </span>

          <h3
            className="mt-2 font-display text-xl sm:text-2xl font-medium leading-snug text-content transition-colors group-hover:text-accent"
            lang="bn"
          >
            {piece.titleBn}
          </h3>

          {piece.dekBn && (
            <p
              className="mt-2.5 font-bengali text-sm leading-relaxed text-content-soft line-clamp-3"
              lang="bn"
            >
              {piece.dekBn}
            </p>
          )}

          <div className="mt-4 flex items-center gap-3 text-xs text-content-faint">
            <span>{formatReading(piece.readingMinutes, locale)}</span>
            <span>·</span>
            <span className="text-accent font-medium group-hover:underline inline-flex items-center gap-1">
              {isBn ? "প্রবন্ধ পড়ুন" : "Read essay"}
              <span aria-hidden>→</span>
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function CompactWritingRow({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const meta = KIND_META[piece.kind];

  return (
    <article className="group">
      <Link href={href} className="flex items-center gap-4 py-2.5 transition">
        {/* Small thumbnail */}
        <div className="relative aspect-[16/10] w-24 sm:w-28 shrink-0 overflow-hidden rounded border border-rule/60 bg-surface-raised transition-all group-hover:border-accent/40">
          {piece.coverImage && (
            <CoverImageFrame
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              aspect="aspect-[16/10]"
              rounded="rounded-none"
              sizes="112px"
              overlay
            />
          )}
        </div>

        {/* Text details */}
        <div className="flex-1 min-w-0">
          <span className="text-[0.65rem] uppercase tracking-[0.14em] text-accent font-mono font-medium block">
            {isBn ? meta.labelBn : meta.labelEn || "ESSAY"}
          </span>

          <h4
            className="mt-0.5 font-display text-sm font-medium leading-snug text-content transition-colors group-hover:text-accent line-clamp-2"
            lang="bn"
          >
            {piece.titleBn}
          </h4>

          <span className="mt-1 text-[0.7rem] text-content-faint block">
            {formatReading(piece.readingMinutes, locale)}
          </span>
        </div>
      </Link>
    </article>
  );
}

export function FeaturedWriting({ pieces }: { pieces: CardPiece[] }) {
  const { isBn } = useLanguage();

  if (!pieces.length) return null;

  const [lead, ...rest] = pieces;

  return (
    <section className="py-12 sm:py-16">
      <div className="mb-6 sm:mb-8 flex items-end justify-between border-b border-rule/60 pb-3">
        <div>
          <h2 className="text-[0.75rem] sm:text-xs font-mono uppercase tracking-[0.18em] text-content font-medium">
            {isBn ? "নির্বাচিত প্রবন্ধ ও নিবন্ধ" : "RECENT WRITING"}
          </h2>
        </div>
        <Link
          href="/writing"
          className="text-xs font-sans text-accent hover:underline flex items-center gap-1 transition"
        >
          <span>{isBn ? "সব দেখুন" : "View all"}</span>
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12 items-start">
        {/* Left Column — Large Featured Essay Card */}
        {lead && (
          <Reveal delay={0.1}>
            <LargeFeaturedCard piece={lead} />
          </Reveal>
        )}

        {/* Right Column — Stack of compact editorial rows */}
        {rest.length > 0 && (
          <Stagger as="div" className="divide-y divide-rule/40 -my-2.5" delay={0.2}>
            {rest.slice(0, 4).map((piece) => (
              <StaggerItem key={piece.slug} as="div">
                <CompactWritingRow piece={piece} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}
