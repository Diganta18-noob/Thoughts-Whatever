"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { formatReadingTime, toBengaliNumber } from "@/lib/bengali";
import {
  KIND_LABEL,
  KIND_PATH,
  MIN_QUERY,
  matchDocs,
  useSearchIndex,
  type SearchDoc,
} from "@/components/search/use-search";
import { cn } from "@/lib/utils";

const KINDS = ["RACHANA", "BLOG", "DOCUMENTARY"] as const;

/**
 * The full-page search, for when the ⌘K dialog's twelve results are not
 * enough — and, more importantly, so that a search is a URL. `/search?q=নজরুল`
 * can be linked, bookmarked, and shared; a modal cannot.
 */
export function SearchClient() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params.get("q") ?? "";

  const [query, setQuery] = useState(initial);
  const [kind, setKind] = useState<SearchDoc["kind"] | null>(null);
  const { docs, indexes, loading } = useSearchIndex({ eager: true });

  // Keep the URL in step with the box, without a history entry per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      const next = query.trim()
        ? `/search?q=${encodeURIComponent(query.trim())}`
        : "/search";
      router.replace(next, { scroll: false });
    }, 400);
    return () => clearTimeout(id);
  }, [query, router]);

  const all = useMemo(() => matchDocs(indexes, query, 60), [indexes, query]);
  const results = kind ? all.filter((doc) => doc.kind === kind) : all;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <header className="border-b border-rule pb-8 pt-12 sm:pt-16">
        <span className="label" lang="en">
          Search
        </span>
        <h1
          className="mt-3 font-bengali text-[2rem] font-medium leading-tight text-content sm:text-[2.5rem]"
          lang="bn"
        >
          খুঁজুন
        </h1>

        <div className="mt-7 flex items-center gap-3 border-b border-rule">
          {loading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-content-faint" />
          ) : (
            <SearchIcon className="h-5 w-5 shrink-0 text-content-faint" />
          )}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="লেখক, বিষয়, শিরোনাম…"
            lang="bn"
            aria-label="খুঁজুন"
            className="w-full bg-transparent py-3 font-bengali text-bengali-lg text-content outline-none placeholder:text-content-faint"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <FilterPill active={kind === null} onClick={() => setKind(null)}>
            সব
          </FilterPill>
          {KINDS.map((value) => (
            <FilterPill
              key={value}
              active={kind === value}
              onClick={() => setKind(kind === value ? null : value)}
            >
              {KIND_LABEL[value]}
            </FilterPill>
          ))}

          {docs && (
            <span className="ml-auto label">
              {query.trim().length >= MIN_QUERY
                ? `${toBengaliNumber(results.length)} টি মিলল`
                : `${toBengaliNumber(docs.length)} টি লেখা`}
            </span>
          )}
        </div>
      </header>

      {query.trim().length < MIN_QUERY ? (
        <p
          className="py-24 text-center font-bengali text-bengali-base text-content-faint"
          lang="bn"
        >
          অন্তত দুটি অক্ষর লিখুন। বানান একটু এদিক-ওদিক হলেও চলবে।
        </p>
      ) : results.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-bengali text-bengali-base text-content-soft" lang="bn">
            কিছু পাওয়া গেল না।
          </p>
          <p className="mt-2 font-bengali text-bengali-sm text-content-faint" lang="bn">
            অন্য বানানে বা কেবল লেখকের নাম দিয়ে খুঁজে দেখুন।
          </p>
          <Link
            href="/archive"
            className="mt-5 inline-block font-serif text-sm text-accent hover:opacity-75"
            lang="en"
          >
            Browse the archive →
          </Link>
        </div>
      ) : (
        <ol className="divide-y divide-rule">
          {results.map((doc) => (
            <li key={doc.slug}>
              <Link
                href={`${KIND_PATH[doc.kind]}/${doc.slug}`}
                className="group block py-5 transition"
              >
                <div className="mb-1.5 flex items-center gap-3">
                  <span className="label !text-accent">{KIND_LABEL[doc.kind]}</span>
                  <span className="label">
                    {formatReadingTime(doc.readingMinutes)}
                  </span>
                </div>
                <h2
                  className="font-bengali text-xl leading-snug text-content transition-colors group-hover:text-accent"
                  lang="bn"
                >
                  {doc.titleBn}
                </h2>
                {doc.excerptBn && (
                  <p
                    className="mt-1.5 line-clamp-2 max-w-measure-wide font-bengali text-bengali-sm text-content-soft"
                    lang="bn"
                  >
                    {doc.excerptBn}
                  </p>
                )}
                {doc.authorsText && (
                  <p className="mt-1.5 font-bengali text-xs text-content-faint" lang="bn">
                    {doc.authorsText}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-sm border px-3 py-1 font-bengali text-[0.8125rem] transition",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-rule text-content-soft hover:border-content-faint hover:text-content",
      )}
      lang="bn"
    >
      {children}
    </button>
  );
}
