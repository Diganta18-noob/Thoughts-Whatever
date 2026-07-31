"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";
import { bengaliSearchKey } from "@/lib/bengali";

/**
 * Shared search machinery for the ⌘K dialog and the /search page.
 *
 * The index is a single JSON payload fetched from /api/search-index and matched
 * entirely in the browser. For a corpus of this size that is both faster and
 * cheaper than a query per keystroke — and it means the third keystroke is
 * instant, which is the one that decides whether search feels usable.
 */

export type SearchDoc = {
  slug: string;
  kind: "RACHANA" | "BLOG" | "DOCUMENTARY";
  titleBn: string;
  titleEn: string | null;
  excerptBn: string;
  tagsText: string;
  authorsText: string;
  readingMinutes: number;
  /** Consonant skeleton of title + tags + authors, built server-side. */
  key: string;
};

/** Matched against the display text a reader actually typed. */
const DISPLAY_OPTIONS: IFuseOptions<SearchDoc> = {
  includeScore: true,
  threshold: 0.38,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: "titleBn", weight: 3 },
    { name: "titleEn", weight: 1 },
    { name: "authorsText", weight: 2 },
    { name: "tagsText", weight: 1.5 },
    { name: "excerptBn", weight: 1 },
  ],
};

/** Matched against the folded skeleton, which absorbs Bengali spelling drift. */
const SKELETON_OPTIONS: IFuseOptions<SearchDoc> = {
  includeScore: true,
  threshold: 0.34,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [{ name: "key", weight: 1 }],
};

export const MIN_QUERY = 2;

/**
 * Two passes, merged by best score. The display pass catches what the reader
 * literally typed; the skeleton pass catches রবিন্দ্রনাথ when the piece says
 * রবীন্দ্রনাথ. Running both and keeping the better score is far more forgiving
 * than either alone.
 */
export function matchDocs(
  indexes: { display: Fuse<SearchDoc>; skeleton: Fuse<SearchDoc> } | null,
  query: string,
  limit = 12,
): SearchDoc[] {
  const trimmed = query.trim();
  if (!indexes || trimmed.length < MIN_QUERY) return [];

  const best = new Map<string, { doc: SearchDoc; score: number }>();
  const absorb = (hits: { item: SearchDoc; score?: number }[]) => {
    for (const hit of hits) {
      const score = hit.score ?? 1;
      const existing = best.get(hit.item.slug);
      if (!existing || score < existing.score) {
        best.set(hit.item.slug, { doc: hit.item, score });
      }
    }
  };

  absorb(indexes.display.search(trimmed));

  const skeleton = bengaliSearchKey(trimmed);
  if (skeleton.length >= MIN_QUERY) absorb(indexes.skeleton.search(skeleton));

  return [...best.values()]
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) => r.doc);
}

export function useSearchIndex({ eager = false }: { eager?: boolean } = {}) {
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    // A ref-free guard is fine here: both callers are idempotent, and the
    // worst case is one redundant fetch of a cached JSON file.
    if (docs || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/search-index");
      setDocs(res.ok ? ((await res.json()) as SearchDoc[]) : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [docs, loading]);

  useEffect(() => {
    if (eager) void load();
    // Only on mount — `load` changes identity as its own state settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eager]);

  const indexes = useMemo(() => {
    if (!docs) return null;
    return {
      display: new Fuse(docs, DISPLAY_OPTIONS),
      skeleton: new Fuse(docs, SKELETON_OPTIONS),
    };
  }, [docs]);

  return { docs, indexes, loading, load };
}

export const KIND_PATH: Record<SearchDoc["kind"], string> = {
  RACHANA: "/writing",
  BLOG: "/blog",
  DOCUMENTARY: "/documentary",
};

export const KIND_LABEL: Record<SearchDoc["kind"], string> = {
  RACHANA: "রচনা",
  BLOG: "ব্লগ",
  DOCUMENTARY: "ডকুমেন্টারি",
};
