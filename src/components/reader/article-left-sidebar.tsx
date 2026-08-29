"use client";

import Link from "next/link";
import { BookmarkButton } from "@/components/reader/bookmark-button";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

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
          <nav className="space-y-1">
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
                className={cn(
                  "block truncate text-[0.8125rem] text-content-soft transition hover:text-accent font-sans",
                  h.level === 3 && "pl-3 text-xs text-content-faint"
                )}
                title={h.text}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* 2. Series Episode Tracker (if applicable) */}
      {seriesTitleBn && seriesSlug && (
        <div className="space-y-3 rounded-lg border border-rule/60 bg-surface-raised/30 p-3.5">
          <span className="font-mono text-[10px] uppercase text-accent font-bold tracking-wider">
            Series Hub
          </span>
          <h4 className="font-serif text-sm font-semibold text-content line-clamp-2">
            {seriesTitleBn}
          </h4>
          <div className="flex items-center justify-between text-xs text-content-soft font-mono">
            <span>
              Part {currentEpisode} of {totalEpisodes}
            </span>
          </div>
          <div className="h-1 w-full bg-rule/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((currentEpisode / totalEpisodes) * 100))}%`,
              }}
            />
          </div>
          {seriesSlug && (
            <Link
              href={`/series/${seriesSlug}`}
              className="group flex items-center justify-between pt-1 font-mono text-[11px] text-accent hover:underline"
            >
              <span>View Series</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
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
                toast.success("Link copied to clipboard!");
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
