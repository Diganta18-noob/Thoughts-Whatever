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

function FeaturedPrimaryStory({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const meta = KIND_META[piece.kind];
  const { cardMotionProps } = useCardHover();
  const authorName = piece.authors?.[0]?.nameBn;
  const summary = piece.dekBn || piece.excerptBn;

  return (
    <motion.article
      {...cardMotionProps}
      className="group relative overflow-hidden rounded-2xl border border-rule/60 bg-gradient-to-br from-surface-raised/40 via-surface-raised/20 to-surface/40 backdrop-blur-md transition-all duration-300 hover:border-accent/40"
    >
      <div className="grid lg:grid-cols-[1.2fr_1fr] items-stretch">
        {/* Left: Cinematic 16:10 / 4:3 Cover with Smooth Zoom */}
        <Link href={href} className="relative block h-full min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] overflow-hidden">
          {piece.coverImage && (
            <div className="absolute inset-0 h-full w-full">
              <CoverImageFrame
                owner="piece"
                slug={piece.slug}
                coverImage={piece.coverImage}
                aspect="aspect-auto h-full w-full"
                rounded="rounded-none"
                sizes="(max-width: 1024px) 100vw, 60vw"
                overlay
              />
            </div>
          )}
          {/* Subtle gradient vignette to blend seamlessly on mobile */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent lg:hidden pointer-events-none" />
        </Link>

        {/* Right: Editorial Narrative Content */}
        <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-12">
          <div>
            {/* Tagline / Category */}
            <div className="flex items-center gap-3">
              <span className="font-mono text-[0.6875rem] uppercase tracking-[0.25em] text-accent font-semibold">
                {meta ? meta.labelEn : "DOCUMENTARY"}
              </span>
              <span className="h-1 w-1 rounded-full bg-accent/60" />
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-content-faint">
                Editor’s Choice
              </span>
            </div>

            {/* Main Title */}
            <h3
              className="mt-4 font-bengali text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.15] text-content tracking-tight transition-colors duration-300 group-hover:text-accent"
              lang="bn"
            >
              <Link href={href}>
                {piece.titleBn}
              </Link>
            </h3>

            {/* Editorial Summary */}
            {summary && (
              <p
                className="mt-5 font-bengali text-sm sm:text-base leading-relaxed text-content-soft line-clamp-3 lg:line-clamp-4"
                lang="bn"
              >
                {summary}
              </p>
            )}
          </div>

          {/* Bottom Meta & Action */}
          <div className="mt-8 pt-6 border-t border-rule/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs font-sans text-content-faint">
              {authorName && (
                <>
                  <span className="font-bengali text-content-soft font-medium">{authorName}</span>
                  <span>·</span>
                </>
              )}
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

            <Link
              href={href}
              className="inline-flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-accent transition-all duration-200 hover:bg-accent hover:text-white"
            >
              <span>Read story</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SecondaryArticleCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const meta = KIND_META[piece.kind];
  const { cardMotionProps } = useCardHover();

  return (
    <motion.article
      {...cardMotionProps}
      className="group flex flex-col justify-between rounded-xl border border-rule/50 bg-gradient-to-b from-surface-raised/30 to-surface-raised/10 p-4 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:bg-surface-raised/40 hover:shadow-lg"
    >
      <Link href={href} className="block flex-1 flex flex-col">
        {/* Cover Artwork */}
        {piece.coverImage && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-surface-raised/40 shadow-inner">
            <CoverImageFrame
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              aspect="aspect-[16/10]"
              rounded="rounded-lg"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              overlay
            />
          </div>
        )}

        {/* Content Details */}
        <div className="mt-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[0.6875rem] font-sans text-content-faint">
              <time dateTime={piece.publishedAt?.toISOString()}>
                {piece.publishedAt && formatDate(piece.publishedAt, locale)}
              </time>
              <span>{formatReading(piece.readingMinutes, locale)}</span>
            </div>

            <h4
              className="mt-2.5 font-bengali text-lg sm:text-xl font-medium leading-snug text-content tracking-tight transition-colors duration-200 group-hover:text-accent line-clamp-2"
              lang="bn"
            >
              {piece.titleBn}
            </h4>

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

      {/* Card Footer */}
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

export function FeaturedWriting({ pieces }: { pieces: CardPiece[] }) {
  const { isBn, t } = useLanguage();

  if (!pieces.length) return null;

  const [lead, ...rest] = pieces;
  const secondaryPieces = rest.slice(0, 3);

  return (
    <section className="py-10">
      {/* Section Header */}
      <Reveal>
        <div className="mb-8 flex items-center justify-between border-b border-rule/50 pb-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-accent font-semibold">
              Curated
            </span>
            <h2 className="font-bengali text-2xl font-medium text-content" lang="bn">
              নির্বাচিত
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

      {/* Level 1: Primary Featured Story */}
      {lead && (
        <div className="mb-10">
          <Reveal delay={0.1}>
            <FeaturedPrimaryStory piece={lead} />
          </Reveal>
        </div>
      )}

      {/* Level 2: Secondary 3-Column Editorial Grid */}
      {secondaryPieces.length > 0 && (
        <Stagger as="div" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" delay={0.2}>
          {secondaryPieces.map((piece) => (
            <StaggerItem key={piece.slug}>
              <SecondaryArticleCard piece={piece} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}


