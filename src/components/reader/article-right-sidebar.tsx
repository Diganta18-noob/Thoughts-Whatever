"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/i18n/format";
import { useLanguage } from "@/components/providers/language-provider";
import { KIND_META } from "@/lib/nav";
import type { FullPiece } from "@/lib/pieces";

import { CoverImageFrame } from "@/components/media/cover-image-frame";

export interface ArticleRightSidebarProps {
  piece: FullPiece;
  nextEpisode?: { slug: string; titleBn: string; coverImage?: string | null };
}

export function ArticleRightSidebar({ piece, nextEpisode }: ArticleRightSidebarProps) {
  const { locale, isBn } = useLanguage();
  const meta = KIND_META[piece.kind];

  return (
    <aside className="sticky top-28 space-y-6 pl-2 hidden lg:block">
      {/* 1. About This Episode Card */}
      <div className="rounded-md border border-rule/40 bg-surface-raised/20 p-4 space-y-3 text-xs">
        <h4 className="label text-[0.625rem] uppercase tracking-widest text-content-faint">
          About This Episode
        </h4>

        <div className="space-y-2 divide-y divide-rule/30">
          {piece.series && (
            <div className="pt-2 flex justify-between gap-2 items-center">
              <span className="text-content-faint">Series</span>
              <Link
                href={`/series/${piece.series.slug}`}
                className="font-bengali text-content text-right hover:text-accent transition-colors truncate max-w-[140px]"
                lang="bn"
              >
                {piece.series.titleBn}
              </Link>
            </div>
          )}

          {piece.seriesOrder && (
            <div className="pt-2 flex justify-between gap-2 items-center">
              <span className="text-content-faint">Episode</span>
              <span className="text-content font-mono">{piece.seriesOrder} / {piece.series?._count?.pieces || 6}</span>
            </div>
          )}

          <div className="pt-2 flex justify-between gap-2 items-center">
            <span className="text-content-faint">Category</span>
            <Link
              href={meta.path}
              className="text-accent uppercase font-medium hover:underline transition-all"
            >
              {isBn ? meta.labelBn : meta.labelEn}
            </Link>
          </div>

          {piece.publishedAt && (
            <div className="pt-2 flex justify-between gap-2 items-center">
              <span className="text-content-faint">Published</span>
              <span className="text-content font-sans">{formatDate(piece.publishedAt, locale)}</span>
            </div>
          )}

          {piece.authors && piece.authors.length > 0 && (
            <div className="pt-2 flex justify-between gap-2 items-center">
              <span className="text-content-faint">Author</span>
              <Link
                href={`/authors/${piece.authors[0].slug}`}
                className="font-bengali text-content hover:text-accent transition-colors"
                lang="bn"
              >
                {piece.authors[0].nameBn}
              </Link>
            </div>
          )}
        </div>

        {piece.tags && piece.tags.length > 0 && (
          <div className="pt-2.5 border-t border-rule/40 flex flex-wrap gap-1">
            {piece.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/archive?tag=${tag.slug}`}
                className="rounded bg-surface-raised/60 px-2 py-0.5 text-[0.65rem] text-content-soft font-bengali hover:text-accent hover:bg-surface-raised transition-colors"
                lang="bn"
              >
                {tag.labelBn}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 2. Next Episode Card */}
      {nextEpisode && (
        <div className="rounded-md border border-rule/40 bg-surface-raised/20 p-4 space-y-2.5">
          <h4 className="label text-[0.625rem] uppercase tracking-widest text-content-faint">
            Next Episode
          </h4>

          <Link
            href={`/${piece.kind.toLowerCase()}/${nextEpisode.slug}`}
            className="group block space-y-2.5"
          >
            <div className="flex gap-3 items-center">
              {nextEpisode.coverImage && (
                <div className="h-14 w-11 shrink-0 overflow-hidden rounded border border-rule/40 shadow-xs">
                  <CoverImageFrame
                    owner="piece"
                    slug={nextEpisode.slug}
                    coverImage={nextEpisode.coverImage}
                    aspect="aspect-[3/4]"
                    rounded="rounded"
                    scale={1.05}
                    sizes="44px"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <span className="font-bengali text-xs font-medium text-content group-hover:text-accent transition-colors line-clamp-2" lang="bn">
                  {nextEpisode.titleBn}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 text-[0.725rem] font-sans text-content-faint group-hover:text-accent transition-colors">
              <span>NEXT EPISODE</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}
