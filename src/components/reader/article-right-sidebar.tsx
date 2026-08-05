"use client";

import Link from "next/link";
import Image from "next/image";
import { formatDate } from "@/lib/i18n/format";
import { useLanguage } from "@/components/providers/language-provider";
import { KIND_META } from "@/lib/nav";
import type { FullPiece } from "@/lib/pieces";

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
            <div className="pt-2 flex justify-between gap-2">
              <span className="text-content-faint">Series</span>
              <span className="font-bengali text-content text-right" lang="bn">{piece.series.titleBn}</span>
            </div>
          )}

          {piece.seriesOrder && (
            <div className="pt-2 flex justify-between gap-2">
              <span className="text-content-faint">Episode</span>
              <span className="text-content">{piece.seriesOrder} / 12</span>
            </div>
          )}

          <div className="pt-2 flex justify-between gap-2">
            <span className="text-content-faint">Category</span>
            <span className="text-accent uppercase">{isBn ? meta.labelBn : meta.labelEn}</span>
          </div>

          {piece.publishedAt && (
            <div className="pt-2 flex justify-between gap-2">
              <span className="text-content-faint">Published</span>
              <span className="text-content">{formatDate(piece.publishedAt, locale)}</span>
            </div>
          )}

          {piece.authors && piece.authors.length > 0 && (
            <div className="pt-2 flex justify-between gap-2">
              <span className="text-content-faint">Author</span>
              <span className="font-bengali text-content" lang="bn">{piece.authors[0].nameBn}</span>
            </div>
          )}
        </div>

        {piece.tags && piece.tags.length > 0 && (
          <div className="pt-3 border-t border-rule/50 flex flex-wrap gap-1.5">
            {piece.tags.map((tag) => (
              <span
                key={tag.slug}
                className="rounded bg-surface-raised/80 px-2 py-0.5 text-[0.6875rem] text-content-soft font-bengali"
                lang="bn"
              >
                {tag.labelBn}
              </span>
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

          <div className="flex gap-3 items-center">
            {nextEpisode.coverImage && (
              <div className="h-16 w-12 shrink-0 overflow-hidden rounded border border-rule/60 relative">
                <Image
                  src={nextEpisode.coverImage}
                  alt={nextEpisode.titleBn}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0">
              <h5 className="font-bengali text-sm text-content line-clamp-2" lang="bn">
                {nextEpisode.titleBn}
              </h5>
            </div>
          </div>

          <Link
            href={`/documentary/${nextEpisode.slug}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 text-accent px-3 py-1.5 text-xs transition hover:bg-accent/20 w-full justify-center"
          >
            <span>Next Episode</span>
            <span>→</span>
          </Link>
        </div>
      )}

      {/* 3. Related Works */}
      <div className="space-y-3">
        <h4 className="label text-[0.6875rem] uppercase tracking-widest text-content-faint">
          Related Literature Works
        </h4>
        <ul className="space-y-2 text-xs text-content-soft font-serif">
          <li className="flex items-center gap-2"><span>📖</span><span>Ramayana (Valmiki)</span></li>
          <li className="flex items-center gap-2"><span>📖</span><span>Paradise Lost (John Milton)</span></li>
          <li className="flex items-center gap-2"><span>📖</span><span>The Iliad (Homer)</span></li>
          <li className="flex items-center gap-2"><span>📖</span><span>Hamlet (Shakespeare)</span></li>
        </ul>
      </div>
    </aside>
  );
}
