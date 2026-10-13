"use client";

import Link from "next/link";
import { PortraitCover } from "@/components/pieces/portrait-cover";
import { piecePath, KIND_META } from "@/lib/nav";
import { formatDate, formatReading } from "@/lib/i18n/format";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import type { PieceCardData } from "@/components/pieces/piece-card";

export interface AlsoFeaturedStackedProps {
  pieces: PieceCardData[];
}

export function AlsoFeaturedStacked({ pieces }: AlsoFeaturedStackedProps) {
  const { locale, isBn } = useLanguage();

  if (!pieces || pieces.length === 0) return null;

  return (
    <div className="flex flex-col h-full justify-between space-y-6">
      <h3 className="label text-xs tracking-widest text-content-faint uppercase font-sans border-b border-rule/60 pb-2">
        Also Featured
      </h3>

      <div className="space-y-6 divide-y divide-rule/40">
        {pieces.map((piece, i) => {
          const meta = KIND_META[piece.kind];
          const summary = piece.dekBn || piece.excerptBn;

          return (
            <article
              key={piece.slug}
              className={cn("group/stacked flex gap-4 transition-all duration-300", i > 0 && "pt-6")}
            >
              {/* Thumbnail 9:16 portrait cover */}
              {piece.coverImage && (
                <Link href={piecePath(piece.kind, piece.slug)} className="block shrink-0 w-20">
                  <PortraitCover
                    src={piece.coverImage}
                    alt={piece.titleBn}
                    width={piece.coverImageWidth}
                    height={piece.coverImageHeight}
                    size="sm"
                    aspectRatio="9/16"
                    showAmbientBlur={false}
                  />
                </Link>
              )}

              {/* Text Meta */}
              <div className="flex flex-col justify-center min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="label !text-accent text-[0.6875rem] uppercase font-bengali-sans">
                    {isBn ? meta.labelBn : meta.labelEn}
                  </span>
                  <span className="text-rule">•</span>
                  <span className="text-[0.6875rem] text-content-faint">
                    {piece.publishedAt && formatDate(piece.publishedAt, locale)}
                  </span>
                </div>

                <h4
                  className="font-bengali text-base font-medium text-content leading-snug transition-colors group-hover/stacked:text-accent line-clamp-2"
                  lang="bn"
                >
                  <Link href={piecePath(piece.kind, piece.slug)}>
                    {piece.titleBn}
                  </Link>
                </h4>

                {summary && (
                  <p className="mt-1 font-bengali text-xs text-content-soft line-clamp-2 leading-normal" lang="bn">
                    {summary}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="pt-2 border-t border-rule/60">
        <Link
          href="/archive"
          className="inline-flex items-center gap-1.5 text-xs font-bengali-sans text-accent hover:opacity-80 transition"
          lang="bn"
        >
          <span>সব লেখা দেখুন</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}
