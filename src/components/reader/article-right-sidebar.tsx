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
    <aside className="sticky top-24 space-y-8 pl-4 hidden lg:block">
      {/* 1. About This Episode Card */}
      <div className="rounded-xl border border-rule/60 bg-surface-raised/30 p-5 space-y-4 text-xs">
        <h4 className="label text-[0.6875rem] uppercase tracking-widest text-content-faint">
          About This Episode
        </h4>

        <div className="space-y-2.5 divide-y divide-rule/40">
          {piece.series && (
            <div className="pt-2 flex justify-between gap-2 items-center">
              <span className="text-content-faint">Series</span>
              <Link
                href={`/series/${piece.series.slug}`}
                className="font-bengali text-content text-right hover:text-accent transition-colors"
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
              className="text-accent uppercase hover:underline transition-all"
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
          <div className="pt-3 border-t border-rule/50 flex flex-wrap gap-1.5">
            {piece.tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/archive?tag=${tag.slug}`}
                className="rounded bg-surface-raised/80 px-2 py-0.5 text-[0.6875rem] text-content-soft font-bengali hover:text-accent hover:bg-surface-raised transition-colors"
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
        <div className="rounded-xl border border-rule/60 bg-surface-raised/30 p-5 space-y-3">
          <h4 className="label text-[0.6875rem] uppercase tracking-widest text-content-faint">
            Next Episode
          </h4>

          <Link
            href={`/${piece.kind.toLowerCase()}/${nextEpisode.slug}`}
            className="group block space-y-3"
          >
            <div className="flex gap-3 items-center">
              {nextEpisode.coverImage && (
                <div className="h-16 w-12 shrink-0">
                  <CoverImageFrame
                    owner="piece"
                    slug={nextEpisode.slug}
                    coverImage={nextEpisode.coverImage}
                    aspect="aspect-[3/4]"
                    rounded="rounded"
                    scale={1.05}
                    sizes="48px"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h5 className="font-bengali text-sm text-content line-clamp-2 group-hover:text-accent transition-colors" lang="bn">
                  {nextEpisode.titleBn}
                </h5>
              </div>
            </div>

            <div className="block w-full text-center rounded-md bg-surface-raised/60 py-2 text-xs text-content-soft font-mono uppercase tracking-wider group-hover:bg-accent group-hover:text-surface transition-colors">
              Next Episode →
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}

