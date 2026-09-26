"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import {
  ArrowRight,
  FileText,
  FolderTree,
  Loader2,
  Search,
  Tag,
  User,
  X,
} from "lucide-react";
import {
  ADMIN_NAV_ITEMS,
  ADMIN_QUICK_ACTIONS,
  type AdminNavSearchItem,
} from "@/lib/admin-nav";
import { NavIcon } from "@/components/admin/nav-icon";
import { useBodyScrollLock } from "@/lib/hooks/use-body-scroll-lock";
import { cn } from "@/lib/utils";

interface SearchResultItem {
  id?: string;
  title: string;
  subtitle?: string;
  url: string;
  kind?: string;
  status?: string;
}

type RecordResults = {
  pieces: SearchResultItem[];
  series: SearchResultItem[];
  authors: SearchResultItem[];
  tags: SearchResultItem[];
};

const EMPTY_RESULTS: RecordResults = { pieces: [], series: [], authors: [], tags: [] };

/**
 * Pages are matched here rather than on the server.
 *
 * The route list is static and tiny, so a round-trip bought nothing but latency
 * — and the server's old `includes()` filter could not survive a typo or an
 * abbreviation. Fuzzy-matching locally means "analitcs", "geo" and "cron" all
 * land, and they land before the first keystroke reaches the database.
 */
const PAGE_FUSE = new Fuse(ADMIN_NAV_ITEMS, {
  keys: [
    { name: "label", weight: 0.6 },
    { name: "keywords", weight: 0.3 },
    { name: "group", weight: 0.1 },
  ],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

type PaletteItem = {
  key: string;
  title: string;
  subtitle?: string;
  url: string;
  group: string;
  page?: AdminNavSearchItem;
};

const MIN_QUERY = 2;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [records, setRecords] = useState<RecordResults>(EMPTY_RESULTS);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(open);

  // Global shortcut. Escape only closes while open, so the palette does not
  // swallow Escape from the other dialogs mounted in the admin layout.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Open clean, and hand focus back to the trigger on close so keyboard users
  // are not dropped at the top of the document.
  //
  // `hasOpened` guards the close branch: `open` starts false, so without it this
  // effect fires once on mount and pulls focus to the search button on every
  // admin page load.
  const hasOpened = useRef(false);

  useEffect(() => {
    if (open) {
      hasOpened.current = true;
      setQuery("");
      setRecords(EMPTY_RESULTS);
      setSelectedIndex(0);
      const frame = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(frame);
    }

    if (!hasOpened.current) return;
    triggerRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Debounced record search.
  //
  // Two guards the previous version lacked. Short queries never leave the
  // browser at all — the route answers them with empty arrays anyway, so every
  // open and every first keystroke was a wasted authenticated round-trip. And
  // each response is checked against the request that is still current: typing
  // quickly used to let a slow early reply overwrite the results for a longer,
  // more specific query.
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setRecords(EMPTY_RESULTS);
      setLoading(false);
      return;
    }

    const id = ++requestId.current;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (id !== requestId.current) return;
        if (data.ok) setRecords({ ...EMPTY_RESULTS, ...data.results });
      } catch {
        // Aborts are the common case here and mean a newer query is in flight.
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open]);

  const pageMatches = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) return [];
    return PAGE_FUSE.search(trimmed, { limit: 6 }).map((result) => result.item);
  }, [query]);

  // Pages lead the list on purpose: they resolve synchronously, so the
  // highlighted row never jumps out from under a Return keypress when the
  // slower database results arrive and append below.
  const flatItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = pageMatches.map((page) => ({
      key: `page:${page.href}`,
      title: page.label,
      subtitle: page.group,
      url: page.href,
      group: "Pages",
      page,
    }));

    const record = (list: SearchResultItem[], group: string) =>
      list.forEach((item, idx) =>
        items.push({
          key: `${group}:${item.id ?? item.url}:${idx}`,
          title: item.title,
          subtitle: item.subtitle,
          url: item.url,
          group,
        })
      );

    record(records.pieces, "Pieces & Articles");
    record(records.series, "Series");
    record(records.authors, "Authors");
    record(records.tags, "Tags");

    return items;
  }, [pageMatches, records]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const resultCount = flatItems.length;

  // Arrowing past the visible rows used to scroll nothing — the highlight simply
  // left the 24rem results box while the list stayed put.
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector(`[data-index="${selectedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, open, resultCount]);

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (!flatItems.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[selectedIndex];
      if (item) handleSelect(item.url);
    }
  };

  const trimmed = query.trim();
  const searching = trimmed.length >= MIN_QUERY;
  const showEmptyState = searching && !loading && flatItems.length === 0;
  const activeItem = flatItems[selectedIndex];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="hidden md:flex items-center gap-2 rounded-sm border border-rule/80 bg-surface/60 px-2.5 py-1.5 font-sans text-xs text-content-faint transition hover:border-accent hover:text-content"
        title="Search & Command Palette (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5 text-content-faint" aria-hidden />
        <span className="hidden lg:inline">Search anything...</span>
        <kbd className="rounded border border-rule bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-content-soft">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-16 sm:pt-24 animate-fade-in">
          <div
            className="absolute inset-0 bg-content/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative w-full max-w-2xl rounded-sm border border-rule bg-surface-raised shadow-2xl overflow-hidden animate-fade-up"
          >
            {/* Search input bar */}
            <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
              {loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" aria-hidden />
              ) : (
                <Search className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              )}
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={searching && resultCount > 0}
                aria-controls="palette-listbox"
                aria-activedescendant={activeItem ? `palette-option-${selectedIndex}` : undefined}
                aria-label="Search pages, articles, series, authors, and tags"
                autoComplete="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Jump to a page, or search an article, series, or author..."
                className="w-full bg-transparent font-sans text-sm text-content placeholder:text-content-faint focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="text-content-faint hover:text-content"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-block rounded border border-rule px-1.5 py-0.5 font-mono text-[10px] text-content-soft">
                ESC
              </kbd>
            </div>

            {/* Results. The scroll container is a plain element: the listbox
                below owns the options directly, so the quick-action shortcuts
                and the empty state do not end up as stray listbox children. */}
            <div ref={listRef} className="max-h-96 overflow-y-auto p-2">
              {showEmptyState && (
                <div className="py-10 text-center">
                  <p className="font-sans text-sm text-content-soft">
                    No matching results found for &ldquo;{trimmed}&rdquo;
                  </p>
                  <p className="mt-1 font-sans text-xs text-content-faint">
                    Try a Bengali title, an English name, or a section like
                    &ldquo;analytics&rdquo;.
                  </p>
                </div>
              )}

              {!searching && (
                <div className="p-2">
                  <p className="px-2 font-mono text-[10px] uppercase tracking-wider text-content-faint">
                    Quick Actions
                  </p>
                  <div className="mt-1 space-y-1">
                    {ADMIN_QUICK_ACTIONS.map((action) => (
                      <button
                        key={action.href}
                        type="button"
                        onClick={() => handleSelect(action.href)}
                        className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left font-sans text-xs text-content transition hover:bg-accent/10 hover:text-accent"
                      >
                        <span className="flex items-center gap-2.5">
                          <NavIcon
                            name={action.icon}
                            className="h-3.5 w-3.5 text-content-faint"
                          />
                          {action.label}
                        </span>
                        <ArrowRight className="h-3 w-3 text-content-faint" aria-hidden />
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 px-2 font-sans text-[11px] text-content-faint">
                    Type at least {MIN_QUERY} characters to search every page, article,
                    series, author, and tag.
                  </p>
                </div>
              )}

              {searching && flatItems.length > 0 && (
                <div
                  id="palette-listbox"
                  role="listbox"
                  aria-label="Search results"
                  className="space-y-0.5"
                >
                  {flatItems.map((item, idx) => {
                    const isSelected = idx === selectedIndex;

                    return (
                      <button
                        key={item.key}
                        id={`palette-option-${idx}`}
                        data-index={idx}
                        role="option"
                        aria-selected={isSelected}
                        type="button"
                        onClick={() => handleSelect(item.url)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left transition",
                          isSelected ? "bg-accent/10" : "hover:bg-surface"
                        )}
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <PaletteItemIcon item={item} isSelected={isSelected} />

                          <div className="min-w-0">
                            <span
                              className={cn(
                                "block truncate font-sans text-xs font-medium",
                                isSelected ? "text-accent" : "text-content"
                              )}
                            >
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="block truncate font-sans text-[10px] text-content-faint">
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {item.page?.badge && (
                            <span className="rounded bg-accent px-1.5 py-0.5 font-mono text-[9px] font-bold leading-none text-surface">
                              {item.page.badge}
                            </span>
                          )}
                          <span className="font-mono text-[9px] uppercase tracking-wider text-content-faint">
                            {item.group}
                          </span>
                          <ArrowRight className="h-3 w-3 text-content-faint" aria-hidden />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-between border-t border-rule bg-surface/50 px-4 py-2 font-sans text-[11px] text-content-faint">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>ESC Close</span>
              </div>
              <span>Thoughts Whatever &bull; Editor&apos;s Room</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PaletteItemIcon({ item, isSelected }: { item: PaletteItem; isSelected: boolean }) {
  const tone = isSelected ? "text-accent" : "text-content-soft";

  if (item.page) {
    return <NavIcon name={item.page.icon} className={cn("h-3.5 w-3.5 shrink-0", tone)} />;
  }

  const Icon =
    item.group === "Pieces & Articles"
      ? FileText
      : item.group === "Series"
        ? FolderTree
        : item.group === "Authors"
          ? User
          : Tag;

  return <Icon className={cn("h-3.5 w-3.5 shrink-0", tone)} aria-hidden />;
}
