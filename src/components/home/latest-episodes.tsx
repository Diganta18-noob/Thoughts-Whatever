"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles, BookOpen, Clock } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatDate } from "@/lib/i18n/format";
import { KIND_META, piecePath } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";
import { motion } from "framer-motion";
import { CoverImageFrame } from "@/components/media/cover-image-frame";
import { useCardHover } from "@/lib/hooks/use-card-hover";
import { coverSrc } from "@/lib/images";

function HeroShowcase({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";
  const { cardMotionProps } = useCardHover();
  const resolvedCover = coverSrc("piece", piece.slug, piece.coverImage);
  const kindInfo = KIND_META[piece.kind];

  return (
    <motion.article className="group relative overflow-hidden rounded-xl border border-rule/60 bg-surface-raised/40 p-5 sm:p-8 backdrop-blur-md shadow-xl transition-all duration-500 hover:border-accent/40" {...cardMotionProps}>
      {/* Editorial Header Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-rule/50 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent"></span>
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-accent font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {isBn ? "সদ্য প্রকাশিত" : "LATEST PUBLICATION"}
          </span>
        </div>

        <div className={`flex items-center gap-3 text-xs text-content-faint ${monoFace}`}>
          <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-accent font-medium">
            {isBn ? kindInfo.labelBn : kindInfo.labelEn}
          </span>
          {piece.publishedAt && (
            <time dateTime={piece.publishedAt.toISOString()}>
              {formatDate(piece.publishedAt, locale)}
            </time>
          )}
        </div>
      </div>

      {/* Editorial Grid: 60% Visual Cover / 40% Story Content */}
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
        {/* Left Column: Dominated Artwork Showcase */}
        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          {/* Ambient Depth Backdrop Glow */}
          {resolvedCover && (
            <div className="absolute -inset-2 rounded-2xl opacity-25 blur-2xl transition-opacity duration-700 group-hover:opacity-40 pointer-events-none overflow-hidden">
              <Image
                src={resolvedCover}
                alt=""
                fill
                className="object-cover scale-110"
                aria-hidden="true"
              />
            </div>
          )}

          <Link href={href} className="relative block group/img overflow-hidden rounded-lg border border-rule/70 bg-journal-paperEdge shadow-2xl transition-all duration-500 group-hover:shadow-accent/10">
            {resolvedCover && (
              <div className="relative aspect-[3/4] w-full overflow-hidden">
                <Image
                  src={resolvedCover}
                  alt={piece.titleBn}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-cover object-top transition-transform duration-700 ease-out group-hover/img:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 transition-opacity group-hover/img:opacity-20" />
              </div>
            )}
          </Link>
        </div>

        {/* Right Column: Story Copy & CTA */}
        <div className="flex flex-col justify-center space-y-5">
          <div className="space-y-3">
            <Link href={href} className="block group/title">
              <h3
                className="font-bengali text-2xl sm:text-3xl lg:text-4xl font-semibold leading-[1.18] text-content transition-colors duration-300 group-hover/title:text-accent"
                lang="bn"
              >
                {piece.titleBn}
              </h3>
            </Link>

            {piece.dekBn && (
              <p
                className="font-bengali text-base sm:text-lg leading-relaxed text-content-soft border-l-2 border-accent/40 pl-4 py-0.5"
                lang="bn"
              >
                {piece.dekBn}
              </p>
            )}

            {piece.excerptBn && (
              <p
                className="line-clamp-3 font-bengali text-sm sm:text-base leading-relaxed text-content-faint"
                lang="bn"
              >
                {piece.excerptBn}
              </p>
            )}
          </div>

          {/* Meta & Interactive CTA */}
          <div className="pt-4 border-t border-rule/40 flex flex-wrap items-center justify-between gap-4">
            <div className={`flex items-center gap-2 text-xs text-content-faint ${monoFace}`}>
              <Clock className="h-3.5 w-3.5 text-accent/70" />
              <span>{formatReading(piece.readingMinutes, locale)}</span>
            </div>

            <Link
              href={href}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-bengali text-sm font-medium text-surface shadow-md transition-all duration-300 hover:opacity-95 hover:shadow-lg group/btn"
            >
              <span lang="bn">{isBn ? "সম্পূর্ণ রচনা পড়ুন" : "Read Story"}</span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function SecondaryCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";
  const { cardMotionProps } = useCardHover();

  return (
    <motion.article className="group relative rounded-lg border border-rule/50 bg-surface-raised/20 p-4 transition-all duration-300 hover:border-accent/30 hover:bg-surface-raised/40" {...cardMotionProps}>
      <Link href={href} className="flex gap-4 items-center">
        {piece.coverImage && (
          <div className="w-24 shrink-0">
            <CoverImageFrame
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              aspect="aspect-[3/4]"
              rounded="rounded-md"
              sizes="96px"
              overlay
            />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className={`flex items-center gap-2 text-[0.6875rem] text-content-faint ${monoFace}`}>
            <span className="text-accent uppercase tracking-wider font-semibold">
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
            className="font-bengali text-base font-medium leading-snug text-content transition-colors group-hover:text-accent line-clamp-2"
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

export function LatestEpisodes({ pieces }: { pieces: CardPiece[] }) {
  const { isBn, t } = useLanguage();

  if (!pieces.length) return null;

  const [lead, ...rest] = pieces;

  return (
    <section className="py-12 sm:py-16">
      <Reveal>
        <div className="mb-8 border-b border-rule pb-3 flex items-baseline justify-between">
          <div>
            <h2 className="font-bengali text-2xl font-medium text-content" lang="bn">
              সাম্প্রতিক লেখা
            </h2>
            {!isBn && (
              <p className="mt-1 font-serif text-sm italic text-content-faint" lang="en">
                {t("home.latestGloss")}
              </p>
            )}
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-content-faint">
            Archive Highlights
          </span>
        </div>
      </Reveal>

      <div className="space-y-8">
        {lead && (
          <Reveal delay={0.1}>
            <HeroShowcase piece={lead} />
          </Reveal>
        )}

        {rest.length > 0 && (
          <Stagger as="div" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" delay={0.2}>
            {rest.slice(0, 3).map((piece) => (
              <StaggerItem key={piece.slug}>
                <SecondaryCard piece={piece} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}
