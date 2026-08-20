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

  return (
    <motion.article
      {...cardMotionProps}
      className="group relative overflow-hidden rounded-2xl border border-rule/70 bg-gradient-to-b from-surface-raised/35 to-surface-raised/15 p-6 sm:p-8 lg:p-10 backdrop-blur-sm transition-all duration-300 hover:border-rule"
    >
      <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        {/* Left: 16:10 Cinematic Cover Artwork */}
        <Link href={href} className="block overflow-hidden rounded-xl bg-surface-raised/40 shadow-inner">
          {piece.coverImage && (
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <CoverImageFrame
                owner="piece"
                slug={piece.slug}
                coverImage={piece.coverImage}
                aspect="aspect-[16/10]"
                rounded="rounded-xl"
                sizes="(max-width: 1024px) 100vw, 55vw"
                overlay
              />
            </div>
          )}
        </Link>

        {/* Right: Editorial Narrative Block */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-accent font-semibold">
            <span>{meta ? meta.labelEn : "DOCUMENTARY"}</span>
          </div>

          <h3
            className="mt-3.5 font-bengali text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight text-content tracking-tight transition-colors duration-200 group-hover:text-accent"
            lang="bn"
          >
            <Link href={href}>
              {piece.titleBn}
            </Link>
          </h3>

          {piece.dekBn && (
            <p
              className="mt-4 font-bengali text-xs sm:text-sm leading-relaxed text-content-soft line-clamp-3"
              lang="bn"
            >
              {piece.dekBn}
            </p>
          )}

          {/* Metadata Row */}
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-sans text-content-faint">
            {authorName && (
              <>
                <span className="font-bengali text-content-soft font-medium">{authorName}</span>
                <span className="text-rule">•</span>
              </>
            )}
            {piece.publishedAt && (
              <>
                <time dateTime={piece.publishedAt.toISOString()}>
                  {formatDate(piece.publishedAt, locale)}
                </time>
                <span className="text-rule">•</span>
              </>
            )}
            <span>{formatReading(piece.readingMinutes, locale)}</span>
          </div>

          {/* Action Button */}
          <div className="mt-7">
            <Link
              href={href}
              className="inline-flex items-center gap-2 rounded-sm border border-rule bg-surface/70 px-4 py-2 font-mono text-xs uppercase tracking-wider text-content transition-all duration-200 hover:border-accent hover:text-accent"
            >
              <span>Read story</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
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
      className="group flex flex-col justify-between rounded-xl border border-rule/60 bg-gradient-to-b from-surface-raised/25 to-surface-raised/10 p-4 backdrop-blur-sm transition-all duration-300 hover:border-accent/40 hover:bg-surface-raised/35 hover:shadow-md"
    >
      <Link href={href} className="block flex-1 flex flex-col">
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

        <div className="mt-4 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[0.6875rem] font-sans text-content-faint">
              <time dateTime={piece.publishedAt?.toISOString()}>
                {piece.publishedAt && formatDate(piece.publishedAt, locale)}
              </time>
              <span>{formatReading(piece.readingMinutes, locale)}</span>
            </div>

            <h4
              className="mt-2.5 font-bengali text-base sm:text-lg font-medium leading-snug text-content tracking-tight transition-colors duration-200 group-hover:text-accent line-clamp-2"
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
    <section className="py-8">
      {/* Section Header */}
      <Reveal>
        <div className="mb-8 flex items-center justify-between border-b border-rule/50 pb-3">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-accent font-medium">
              Curated
            </span>
            <h2 className="font-bengali text-2xl font-medium text-content" lang="bn">
              নির্বাচিত
            </h2>
          </div>
          {!isBn && (
            <p className="font-serif text-xs italic text-content-faint hidden sm:inline" lang="en">
              {t("home.featuredGloss")}
            </p>
          )}
        </div>
      </Reveal>

      {/* Level 1: Primary Featured Story */}
      {lead && (
        <div className="mb-8">
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

