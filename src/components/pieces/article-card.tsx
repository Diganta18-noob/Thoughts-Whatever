"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { toBanglaDate } from "@/lib/bengali";
import { formatDate, formatNumber, formatReading } from "@/lib/i18n/format";
import { KIND_META, piecePath, type PieceKindKey } from "@/lib/nav";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { PortraitCover } from "@/components/pieces/portrait-cover";
import type { PieceCardData } from "@/components/pieces/piece-card";

function KindLabel({ kind }: { kind: PieceKindKey }) {
  const { locale, isBn } = useLanguage();
  const meta = KIND_META[kind];

  return (
    <span
      className={cn("label !text-accent", isBn && "font-bengali-sans tracking-normal")}
      lang={locale}
    >
      {isBn ? meta.labelBn : meta.labelEn}
    </span>
  );
}

function CardDate({ publishedAt }: { publishedAt: Date | string }) {
  const { locale, isBn } = useLanguage();
  const bangla = toBanglaDate(publishedAt);

  return (
    <span className="flex items-center gap-1.5 text-[0.6875rem] text-content-faint">
      <span lang={locale} className={isBn ? "font-bengali-sans" : "font-sans"}>
        {formatDate(publishedAt, locale)}
      </span>
      {bangla && (
        <>
          <span aria-hidden className="text-rule">
            ·
          </span>
          <span lang="bn" className="font-bengali-sans">
            {bangla.formatted}
          </span>
        </>
      )}
    </span>
  );
}

export interface ArticleCardProps {
  piece: PieceCardData;
  variant?: "journal" | "archive";
  layout?: "split" | "stacked" | "hero";
  showKind?: boolean;
  priority?: boolean;
  className?: string;
}

export function ArticleCard({
  piece,
  variant = "journal",
  layout = "stacked",
  showKind = false,
  priority = false,
  className,
}: ArticleCardProps) {
  const { t, locale, isBn } = useLanguage();
  const archive = variant === "archive";
  const summary = piece.dekBn || piece.excerptBn;
  const metaFace = isBn ? "font-bengali-sans" : "font-sans";

  // 1. Desktop Split Layout (Image 35-40% left, Text 60-65% right)
  if (layout === "split" || layout === "hero") {
    return (
      <article
        className={cn(
          "group/article-card relative overflow-hidden rounded-2xl border border-rule/60 bg-surface-raised/30 p-6 md:p-8 transition-all duration-300 hover:border-rule hover:bg-surface-raised/60",
          className
        )}
      >
        <div className="grid gap-6 md:grid-cols-[2fr_3fr] md:items-center lg:gap-10">
          {/* Portrait Cover Frame */}
          {piece.coverImage ? (
            <Link href={piecePath(piece.kind, piece.slug)} className="block shrink-0">
              <PortraitCover
                src={piece.coverImage}
                alt={piece.titleBn}
                width={piece.coverImageWidth}
                height={piece.coverImageHeight}
                priority={priority}
                size={layout === "hero" ? "hero" : "lg"}
              />
            </Link>
          ) : null}

          {/* Text Content */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
              {showKind && <KindLabel kind={piece.kind} />}
              {piece.publishedAt && <CardDate publishedAt={piece.publishedAt} />}
              <span className={cn(metaFace, "text-[0.6875rem] text-content-faint")} lang={locale}>
                {formatReading(piece.readingMinutes, locale)}
              </span>
              {piece.audioUrl && (
                <span className={cn(metaFace, "text-[0.6875rem] text-accent")} lang={locale}>
                  {t("piece.hasNarration")}
                </span>
              )}
            </div>

            <h2
              className={cn(
                "font-bengali font-medium text-content transition-colors group-hover/article-card:text-accent",
                layout === "hero"
                  ? "text-2xl leading-tight sm:text-3xl lg:text-4xl"
                  : "text-xl leading-snug sm:text-2xl"
              )}
              lang="bn"
            >
              <Link href={piecePath(piece.kind, piece.slug)}>
                {piece.titleBn}
              </Link>
            </h2>

            {summary && (
              <p
                className={cn(
                  "mt-3 font-bengali text-content-soft leading-relaxed",
                  layout === "hero" ? "text-bengali-lg line-clamp-4" : "text-bengali-base line-clamp-3"
                )}
                lang="bn"
              >
                {summary}
              </p>
            )}

            {piece.authors && piece.authors.length > 0 && (
              <p className="mt-4 flex flex-wrap gap-x-2 font-bengali text-xs text-content-faint" lang="bn">
                {piece.authors.map((author, i) => (
                  <span key={author.slug}>
                    <Link href={`/authors/${author.slug}`} className="transition hover:text-accent">
                      {author.nameBn}
                    </Link>
                    {i < piece.authors!.length - 1 && " ·"}
                  </span>
                ))}
              </p>
            )}

            <div className="mt-6">
              <Link
                href={piecePath(piece.kind, piece.slug)}
                className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent transition-transform group-hover/article-card:translate-x-1"
              >
                <span>পড়ুন</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // 2. Stacked Grid Card
  return (
    <article
      className={cn(
        "group/article-card flex flex-col h-full rounded-xl border border-rule/50 bg-surface-raised/20 p-4 sm:p-5 transition-all duration-300 hover:border-rule hover:bg-surface-raised/50 shadow-sm hover:shadow-md",
        className
      )}
    >
      {piece.coverImage && (
        <Link href={piecePath(piece.kind, piece.slug)} className="block mb-4 overflow-hidden rounded-lg">
          <PortraitCover
            src={piece.coverImage}
            alt={piece.titleBn}
            width={piece.coverImageWidth}
            height={piece.coverImageHeight}
            priority={priority}
            size="md"
            className="w-full"
          />
        </Link>
      )}


      <div className="flex flex-col flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {showKind && <KindLabel kind={piece.kind} />}
          {piece.publishedAt && <CardDate publishedAt={piece.publishedAt} />}
          <span className={cn(metaFace, "text-[0.6875rem] text-content-faint")} lang={locale}>
            {formatReading(piece.readingMinutes, locale)}
          </span>
        </div>

        <h3
          className="font-bengali font-medium text-lg leading-snug text-content transition-colors group-hover/article-card:text-accent"
          lang="bn"
        >
          <Link href={piecePath(piece.kind, piece.slug)}>
            {piece.titleBn}
          </Link>
        </h3>

        {summary && (
          <p className="mt-2.5 font-bengali text-bengali-sm text-content-soft line-clamp-3 leading-relaxed" lang="bn">
            {summary}
          </p>
        )}

        {piece.authors && piece.authors.length > 0 && (
          <p className="mt-auto pt-4 flex flex-wrap gap-x-2 font-bengali text-xs text-content-faint" lang="bn">
            {piece.authors.map((author, i) => (
              <span key={author.slug}>
                <Link href={`/authors/${author.slug}`} className="transition hover:text-accent">
                  {author.nameBn}
                </Link>
                {i < piece.authors!.length - 1 && " ·"}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
}
