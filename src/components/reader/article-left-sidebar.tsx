"use client";

import Link from "next/link";
import { BookmarkButton } from "@/components/reader/bookmark-button";
import { cn } from "@/lib/utils";

export interface ArticleLeftSidebarProps {
  headings: { id: string; text: string; level: number }[];
  seriesTitleBn?: string;
  seriesSlug?: string;
  currentEpisode?: number;
  totalEpisodes?: number;
  slug: string;
  kind: any;
  titleBn: string;
}

export function ArticleLeftSidebar({
  headings,
  seriesTitleBn,
  seriesSlug,
  currentEpisode = 6,
  totalEpisodes = 12,
  slug,
  kind,
  titleBn,
}: ArticleLeftSidebarProps) {
  return (
    <aside className="sticky top-24 space-y-8 pr-4 hidden lg:block">
      {/* 1. On This Page Navigation (Scrollspy) */}
      {headings.length > 0 && (
        <div className="space-y-3">
          <h4 className="label text-[0.6875rem] uppercase tracking-widest text-content-faint">
            On This Page
          </h4>
          <nav className="space-y-1.5 border-l border-rule/60 pl-3 text-xs">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(h.id);
                  if (el) {
                    const top = el.getBoundingClientRect().top + window.scrollY - 90;
                    window.scrollTo({ top, behavior: "smooth" });
                    window.history.replaceState(null, "", `#${h.id}`);
                  }
                }}
                className="block text-content-soft transition hover:text-accent font-bengali line-clamp-1 py-0.5"
                lang="bn"
              >
                {h.text}
              </a>
            ))}

          </nav>
        </div>
      )}

      {/* 2. Series Progress Card */}
      {seriesTitleBn && (
        <div className="rounded-xl border border-rule/60 bg-surface-raised/30 p-4 space-y-3">
          <h4 className="label text-[0.6875rem] uppercase tracking-widest text-content-faint">
            Series Progress
          </h4>
          <div className="font-bengali text-xs text-content" lang="bn">
            {seriesTitleBn}
          </div>
          <div className="text-xs text-content-soft font-sans">
            Episode {currentEpisode} / {totalEpisodes}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-rule/50">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${(currentEpisode / totalEpisodes) * 100}%` }}
            />
          </div>
          {seriesSlug && (
            <Link
              href={`/series/${seriesSlug}`}
              className="inline-flex items-center gap-1 text-xs text-accent hover:opacity-80 transition pt-1"
            >
              <span>View Series</span>
              <span>→</span>
            </Link>
          )}
        </div>
      )}

      {/* 3. Share & Bookmark Buttons */}
      <div className="space-y-3">
        <h4 className="label text-[0.6875rem] uppercase tracking-widest text-content-faint">
          Share
        </h4>
        <div className="flex items-center gap-2">
          <BookmarkButton slug={slug} kind={kind} titleBn={titleBn} />
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }
            }}
            title="Copy Link"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rule/70 bg-surface-raised/40 text-content-soft transition hover:border-accent hover:text-accent text-xs"
          >
            🔗
          </button>
        </div>
      </div>
    </aside>
  );
}
