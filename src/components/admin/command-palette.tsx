"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  FolderTree,
  User,
  Tag,
  ArrowRight,
  Sparkles,
  Command,
  X,
  PlusCircle,
  BarChart2,
  Shield,
  Activity,
  Bell,
  Settings,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultItem {
  id?: string;
  title: string;
  subtitle?: string;
  url: string;
  kind?: string;
  status?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<{
    actions: SearchResultItem[];
    pieces: SearchResultItem[];
    series: SearchResultItem[];
    authors: SearchResultItem[];
    tags: SearchResultItem[];
  }>({
    actions: [],
    pieces: [],
    series: [],
    authors: [],
    tags: [],
  });

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard shortcut listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced search query
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.ok) {
          setResults(data.results);
          setSelectedIndex(0);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, open]);

  // Flattened list for keyboard navigation
  const flatItems = [
    ...results.actions.map((item) => ({ ...item, group: "Actions" })),
    ...results.pieces.map((item) => ({ ...item, group: "Pieces & Articles" })),
    ...results.series.map((item) => ({ ...item, group: "Series" })),
    ...results.authors.map((item) => ({ ...item, group: "Authors" })),
    ...results.tags.map((item) => ({ ...item, group: "Tags" })),
  ];

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatItems[selectedIndex]) {
        handleSelect(flatItems[selectedIndex].url);
      }
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 rounded-sm border border-rule/80 bg-surface/60 px-2.5 py-1.5 font-sans text-xs text-content-faint transition hover:border-accent hover:text-content"
        title="Search & Command Palette (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5 text-content-faint" />
        <span className="hidden lg:inline">Search anything...</span>
        <kbd className="rounded border border-rule bg-surface-raised px-1.5 py-0.5 font-mono text-[10px] text-content-soft">
          Ctrl K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-content/30 backdrop-blur-sm px-4 pt-16 sm:pt-24 animate-fade-in">
      <div className="w-full max-w-2xl rounded-sm border border-rule bg-surface-raised shadow-2xl overflow-hidden animate-fade-up">
        {/* Search input bar */}
        <div className="flex items-center gap-3 border-b border-rule px-4 py-3">
          <Search className="h-4 w-4 text-accent shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, article title, series, or author..."
            className="w-full bg-transparent font-sans text-sm text-content placeholder:text-content-faint focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-content-faint hover:text-content text-xs"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded border border-rule px-1.5 py-0.5 font-mono text-[10px] text-content-soft">
            ESC
          </kbd>
        </div>

        {/* Results Body */}
        <div className="max-h-96 overflow-y-auto p-2">
          {loading && flatItems.length === 0 && (
            <p className="py-8 text-center font-sans text-xs text-content-faint">
              Searching across publications, taxonomy, and system tools...
            </p>
          )}

          {!loading && flatItems.length === 0 && query.length >= 2 && (
            <div className="py-10 text-center">
              <p className="font-sans text-sm text-content-soft">
                No matching results found for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 font-sans text-xs text-content-faint">
                Try searching by Bengali title, English name, or keyword.
              </p>
            </div>
          )}

          {/* Quick default suggestions when query is empty */}
          {query.length < 2 && (
            <div className="space-y-4 p-2">
              <div>
                <p className="px-2 font-mono text-[10px] uppercase tracking-wider text-content-faint">
                  Quick Actions
                </p>
                <div className="mt-1 space-y-1">
                  {[
                    { title: "Create New Piece", url: "/admin/pieces/new", icon: PlusCircle },
                    { title: "View Analytics & Trends", url: "/admin/analytics", icon: BarChart2 },
                    { title: "Real-Time Activity Feed", url: "/admin/activity", icon: Activity },
                    { title: "Security & Sessions", url: "/admin/security", icon: Shield },
                    { title: "Notification Center", url: "/admin/notifications", icon: Bell },
                    { title: "System Maintenance", url: "/admin/system", icon: Database },
                    { title: "Settings & Backups", url: "/admin/settings", icon: Settings },
                  ].map((action, idx) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.url}
                        type="button"
                        onClick={() => handleSelect(action.url)}
                        className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left font-sans text-xs text-content hover:bg-accent/10 hover:text-accent transition"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="h-3.5 w-3.5 text-content-faint" />
                          {action.title}
                        </span>
                        <ArrowRight className="h-3 w-3 text-content-faint" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Grouped Search Results */}
          {flatItems.length > 0 && query.length >= 2 && (
            <div className="space-y-1">
              {flatItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.url}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(item.url)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-sm px-3 py-2 text-left transition",
                      isSelected
                        ? "bg-accent/10 text-accent font-medium"
                        : "text-content hover:bg-surface"
                    )}
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      {item.group === "Actions" ? (
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
                      ) : item.group === "Pieces & Articles" ? (
                        <FileText className="h-3.5 w-3.5 shrink-0 text-content-soft" />
                      ) : item.group === "Series" ? (
                        <FolderTree className="h-3.5 w-3.5 shrink-0 text-content-soft" />
                      ) : item.group === "Authors" ? (
                        <User className="h-3.5 w-3.5 shrink-0 text-content-soft" />
                      ) : (
                        <Tag className="h-3.5 w-3.5 shrink-0 text-content-soft" />
                      )}

                      <div className="min-w-0">
                        <span className="font-sans text-xs text-content block truncate font-medium">
                          {item.title}
                        </span>
                        {item.subtitle && (
                          <span className="font-sans text-[10px] text-content-faint block truncate">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-content-faint">
                        {item.group}
                      </span>
                      <ArrowRight className="h-3 w-3 text-content-faint" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-rule bg-surface/50 px-4 py-2 text-[11px] font-sans text-content-faint">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Thoughts Whatever &bull; Editor&apos;s Room</span>
        </div>
      </div>
    </div>
  );
}
