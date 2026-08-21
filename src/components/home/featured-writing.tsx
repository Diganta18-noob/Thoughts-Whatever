"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatDate, toIsoString } from "@/lib/i18n/format";
import { piecePath, KIND_META } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";
import { motion } from "framer-motion";
import { CoverImageFrame } from "@/components/media/cover-image-frame";
import { useCardHover } from "@/lib/hooks/use-card-hover";

function FeaturedHeroSpread({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const meta = KIND_META[piece.kind];
  const { cardMotionProps } = useCardHover();
  const authorName = piece.authors?.[0]?.nameBn || "রবীন্দ্রনাথ ঠাকুর";
  const summary = piece.dekBn || piece.excerptBn;

  return (
    <motion.article
      {...cardMotionProps}
      className="group relative border-b border-rule/50 pb-12 lg:pb-16"
    >
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 lg:items-center">
        {/* Left: 7 Columns Cinematic Artwork (58%) */}
        <div className="lg:col-span-7">
          <Link href={href} className="block overflow-hidden rounded-sm bg-surface-raised/20">
            {piece.coverImage && (
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <CoverImageFrame
                  owner="piece"
                  slug={piece.slug}
                  coverImage={piece.coverImage}
                  aspect="aspect-[16/10]"
                  rounded="rounded-sm"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  scale={1.03}
                  overlay
                />
              </div>
            )}
          </Link>
        </div>

        {/* Right: 5 Columns Editorial Narrative (42%) */}
        <div className="flex flex-col justify-center lg:col-span-5 lg:pl-2">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.25em] text-accent font-semibold">
            <span>{meta ? meta.labelEn : "DOCUMENTARY"}</span>
            <span className="text-rule">•</span>
            <span className="text-content-faint tracking-widest font-normal">EDITOR’S SELECTION</span>
          </div>

          {/* Large Editorial Title */}
          <h3
            className="mt-4 font-bengali text-3xl sm:text-4xl lg:text-[2.75rem] font-medium leading-[1.18] text-content tracking-tight transition-colors duration-300 group-hover:text-accent"
            lang="bn"
          >
            <Link href={href}>
              {piece.titleBn}
            </Link>
          </h3>

          {/* Literary Description */}
          {summary && (
            <p
              className="mt-5 font-bengali text-sm sm:text-base leading-relaxed text-content-soft line-clamp-3"
              lang="bn"
            >
              {summary}
            </p>
          )}

          {/* Thin Hairline Divider */}
          <div className="my-6 w-16 border-t border-rule" />

          {/* Author & Meta Row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-content-faint">
            <span className="font-bengali uppercase tracking-wider text-content font-medium">{authorName}</span>
            <span className="text-rule">•</span>
            {piece.publishedAt && (
              <>
                <time dateTime={toIsoString(piece.publishedAt)}>
                  {formatDate(piece.publishedAt, locale)}
                </time>
                <span className="text-rule">•</span>
              </>
            )}
            <span>{formatReading(piece.readingMinutes, locale)}</span>
          </div>

          {/* Pure Editorial Link CTA */}
          <div className="mt-8">
            <Link
              href={href}
              className="group/cta inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent transition-colors duration-200 hover:text-accent/80"
            >
              <span>Read story</span>
              <span className="transition-transform duration-200 group-hover/cta:translate-x-1.5">→</span>
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SupportingEditorialItem({
  piece,
  index,
}: {
  piece: CardPiece;
  index: number;
}) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const meta = KIND_META[piece.kind];
  const { cardMotionProps } = useCardHover();
  const indexStr = String(index + 1).padStart(2, "0");

  return (
    <motion.article
      {...cardMotionProps}
      className="group flex flex-col justify-between"
    >
      <Link href={href} className="block flex-1 flex flex-col">
        {/* Index Header Track */}
        <div className="mb-3 flex items-center justify-between border-b border-rule/30 pb-2">
          <span className="font-mono text-[0.6875rem] font-semibold text-content-faint transition-colors group-hover:text-accent">
            {indexStr}
          </span>
          <time
            dateTime={toIsoString(piece.publishedAt)}
            className="font-mono text-[0.6875rem] uppercase tracking-wider text-content-faint"
          >
            {piece.publishedAt && formatDate(piece.publishedAt, locale)}
          </time>
        </div>

        {/* 16:10 Cinematic Artwork */}
        {piece.coverImage && (
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-sm bg-surface-raised/20">
            <CoverImageFrame
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              aspect="aspect-[16/10]"
              rounded="rounded-sm"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              scale={1.03}
              overlay
            />
          </div>
        )}

        {/* Narrative Details */}
        <div className="mt-4 flex-1 flex flex-col justify-between">
          <div>
            <h4
              className="font-bengali text-lg sm:text-xl font-medium leading-snug text-content tracking-tight transition-colors duration-200 group-hover:text-accent line-clamp-2"
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

      {/* Editorial Footer */}
      <div className="mt-5 pt-3 border-t border-rule/30 flex items-center justify-between">
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-accent font-medium">
          {meta ? (isBn ? meta.labelBn : meta.labelEn) : "STORY"}
        </span>
        <Link
          href={href}
          className="inline-flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-wider text-content-soft transition-colors group-hover:text-accent"
        >
          <span>Read</span>
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
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
    <section className="py-12">
      {/* 1. Refined Editorial Section Header */}
      <Reveal>
        <div className="mb-10 flex items-end justify-between border-b border-rule/50 pb-4">
          <div>
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.25em] text-accent font-semibold block mb-1">
              Curated Stories
            </span>
            <h2 className="font-bengali text-2xl sm:text-3xl font-medium text-content" lang="bn">
              নির্বাচিত
            </h2>
          </div>
          <Link
            href="/archive"
            className="group/link inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.2em] text-content-soft transition-colors hover:text-accent"
          >
            <span>View archive</span>
            <span className="transition-transform duration-200 group-hover/link:translate-x-1">→</span>
          </Link>
        </div>
      </Reveal>

      {/* 2. Primary Featured Story — Dominant Hero Composition */}
      {lead && (
        <div className="mb-12">
          <Reveal delay={0.1}>
            <FeaturedHeroSpread piece={lead} />
          </Reveal>
        </div>
      )}

      {/* 3. Supporting Editorial Story Rail (01 / 02 / 03) */}
      {secondaryPieces.length > 0 && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.25em] text-content-faint">
              Latest Stories
            </span>
          </div>

          <Stagger as="div" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" delay={0.2}>
            {secondaryPieces.map((piece, i) => (
              <StaggerItem key={piece.slug}>
                <SupportingEditorialItem piece={piece} index={i} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      )}
    </section>
  );
}



