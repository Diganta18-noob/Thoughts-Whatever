"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatDate } from "@/lib/i18n/format";
import { KIND_META, piecePath } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";
import { motion } from "framer-motion";
import { CoverImageFrame } from "@/components/media/cover-image-frame";
import { useCardHover } from "@/lib/hooks/use-card-hover";
import { coverSrc } from "@/lib/images";

/**
 * NEW UPLOAD / LATEST PUBLICATION ANNOUNCEMENT
 *
 * Compact, restrained, and quiet editorial announcement card for the newest published piece.
 * Total vertical footprint: ~420px-520px (Desktop).
 * Single instance on the page, never repeated.
 */
function NewUploadCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";
  const { cardMotionProps } = useCardHover();
  const resolvedCover = coverSrc("piece", piece.slug, piece.coverImage);
  const kindInfo = KIND_META[piece.kind];

  return (
    <section className="my-10 sm:my-14 border-y border-rule/60 py-8 sm:py-10">
      {/* Editorial Category & Header Rule */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold">
            {isBn ? "সদ্য সংযোজন" : "NEW UPLOAD"}
          </span>
        </div>

        <div className={`flex items-center gap-3 text-xs text-content-faint ${monoFace}`}>
          <span className="uppercase tracking-wider">
            {isBn ? kindInfo.labelBn : kindInfo.labelEn}
          </span>
          {piece.publishedAt && (
            <>
              <span>·</span>
              <time dateTime={piece.publishedAt.toISOString()}>
                {formatDate(piece.publishedAt, locale)}
              </time>
            </>
          )}
        </div>
      </div>

      {/* Restrained Horizontal Composition */}
      <motion.article
        className="group grid gap-6 sm:gap-8 md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] md:items-center"
        {...cardMotionProps}
      >
        {/* Artwork Image Container (300-360px width, 4:5 ratio) */}
        {resolvedCover && (
          <Link
            href={href}
            className="relative block aspect-[4/5] w-full overflow-hidden rounded-sm border border-rule/70 bg-journal-paperEdge shadow-sm transition-shadow duration-300 group-hover:shadow-md"
          >
            <Image
              src={resolvedCover}
              alt={piece.titleBn}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 360px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
            />
          </Link>
        )}

        {/* Editorial Text Block */}
        <div className="flex flex-col justify-center space-y-4">
          <div className="space-y-2.5">
            <Link href={href} className="block group/title">
              <h3
                className="font-bengali text-2xl sm:text-3xl font-semibold leading-snug text-content transition-colors duration-200 group-hover/title:text-accent"
                lang="bn"
              >
                {piece.titleBn}
              </h3>
            </Link>

            <div className={`flex items-center gap-2 text-xs text-content-faint ${monoFace}`}>
              <Clock className="h-3.5 w-3.5" />
              <span>{formatReading(piece.readingMinutes, locale)}</span>
            </div>

            {piece.dekBn && (
              <p
                className="line-clamp-2 font-bengali text-base leading-relaxed text-content-soft"
                lang="bn"
              >
                {piece.dekBn}
              </p>
            )}

            {piece.excerptBn && (
              <p
                className="line-clamp-2 font-bengali text-sm leading-relaxed text-content-faint"
                lang="bn"
              >
                {piece.excerptBn}
              </p>
            )}
          </div>

          <div className="pt-2">
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 font-bengali text-sm font-medium text-accent transition-all duration-200 group/link"
            >
              <span lang="bn">{isBn ? "লেখাটি পড়ুন" : "Read Story"}</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-1" />
            </Link>
          </div>
        </div>
      </motion.article>
    </section>
  );
}

function SecondaryCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";
  const { cardMotionProps } = useCardHover();

  return (
    <motion.article
      className="group relative rounded-sm border border-rule/40 bg-surface/40 p-4 transition-colors duration-200 hover:border-rule/80"
      {...cardMotionProps}
    >
      <Link href={href} className="flex gap-4 items-center">
        {piece.coverImage && (
          <div className="w-20 shrink-0">
            <CoverImageFrame
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              aspect="aspect-[3/4]"
              rounded="rounded-sm"
              sizes="80px"
              overlay
            />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1">
          <div className={`flex items-center gap-2 text-[0.6875rem] text-content-faint ${monoFace}`}>
            <span className="text-accent uppercase tracking-wider font-medium">
              {KIND_META[piece.kind].labelEn}
            </span>
            <span>·</span>
            {piece.publishedAt && (
              <time dateTime={piece.publishedAt.toISOString()}>
                {formatDate(piece.publishedAt, locale)}
              </time>
            )}
          </div>

          <h4
            className="font-bengali text-base font-medium leading-snug text-content transition-colors group-hover:text-accent line-clamp-1"
            lang="bn"
          >
            {piece.titleBn}
          </h4>

          {piece.dekBn && (
            <p
              className="line-clamp-1 font-bengali text-xs text-content-soft"
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

export function LatestEpisodes({
  latestPiece,
  secondaryPieces = [],
}: {
  latestPiece: CardPiece;
  secondaryPieces?: CardPiece[];
}) {
  return (
    <div>
      {/* 1. Single Compact Editorial New Upload Announcement */}
      <Reveal>
        <NewUploadCard piece={latestPiece} />
      </Reveal>

      {/* 2. Compact Secondary Content Grid (Excluded from duplicate rendering) */}
      {secondaryPieces.length > 0 && (
        <Stagger as="div" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-12" delay={0.1}>
          {secondaryPieces.map((piece) => (
            <StaggerItem key={piece.slug}>
              <SecondaryCard piece={piece} />
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
