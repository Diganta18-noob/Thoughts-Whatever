"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search as SearchIcon, X, Loader2, CornerDownLeft } from "lucide-react";
import { formatReadingTime } from "@/lib/bengali";
import {
  KIND_LABEL,
  KIND_PATH,
  MIN_QUERY,
  matchDocs,
  useSearchIndex,
} from "@/components/search/use-search";

export type { SearchDoc } from "@/components/search/use-search";

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { docs, indexes, loading, load } = useSearchIndex();

  // ⌘K / Ctrl+K, and / when not already typing somewhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typingElsewhere =
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        void load();
      } else if (e.key === "/" && !typingElsewhere && !open) {
        e.preventDefault();
        setOpen(true);
        void load();
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, load]);

  useEffect(() => {
    if (open) {
      // Wait a frame so the input exists before focusing it.
      requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const results = useMemo(() => matchDocs(indexes, query), [indexes, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void load();
        }}
        aria-label="Search"
        title="Search  ⌘K"
        data-print="hide"
        className="grid h-9 w-9 place-items-center rounded-full text-content-soft transition hover:bg-content/5 hover:text-content"
      >
        <SearchIcon className="h-[1.05rem] w-[1.05rem]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/35 backdrop-blur-[2px]"
          />

          <div className="relative w-full max-w-xl animate-fade-up overflow-hidden rounded-sm border border-rule bg-surface-raised shadow-2xl">
            <div className="flex items-center gap-3 border-b border-rule px-4">
              {loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-content-faint" />
              ) : (
                <SearchIcon className="h-4 w-4 shrink-0 text-content-faint" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="খুঁজুন — লেখক, বিষয়, শিরোনাম…"
                lang="bn"
                className="flex-1 bg-transparent py-4 font-bengali text-[1.0625rem] text-content outline-none placeholder:text-content-faint"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid h-7 w-7 place-items-center rounded-full text-content-faint hover:text-content"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto">
              {query.trim().length < MIN_QUERY ? (
                <p className="px-4 py-8 text-center font-bengali-sans text-sm text-content-faint">
                  অন্তত দুটি অক্ষর লিখুন
                </p>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-bengali text-[0.9375rem] text-content-soft">
                    কিছু পাওয়া গেল না
                  </p>
                  <p className="mt-1.5 font-bengali-sans text-xs text-content-faint">
                    বানান একটু অন্যভাবে লিখে দেখুন
                  </p>
                </div>
              ) : (
                <ul>
                  {results.map((doc) => (
                    <li key={doc.slug}>
                      <Link
                        href={`${KIND_PATH[doc.kind]}/${doc.slug}`}
                        onClick={() => setOpen(false)}
                        className="block border-b border-rule/60 px-4 py-3 transition hover:bg-accent/5"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="label !text-accent">
                            {KIND_LABEL[doc.kind]}
                          </span>
                          <span className="label">
                            {formatReadingTime(doc.readingMinutes)}
                          </span>
                        </div>
                        <p className="font-bengali text-[1.0625rem] leading-snug text-content" lang="bn">
                          {doc.titleBn}
                        </p>
                        {doc.excerptBn && (
                          <p
                            className="mt-1 line-clamp-1 font-bengali text-sm text-content-faint"
                            lang="bn"
                          >
                            {doc.excerptBn}
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-rule px-4 py-2">
              <span className="label">Esc to close</span>
              {query.trim().length >= MIN_QUERY ? (
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onClick={() => setOpen(false)}
                  className="label flex items-center gap-1.5 !text-accent"
                >
                  All results <CornerDownLeft className="h-3 w-3" />
                </Link>
              ) : (
                <span className="label">
                  {docs ? `${docs.length} pieces indexed` : "…"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
