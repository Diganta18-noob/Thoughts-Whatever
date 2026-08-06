"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const KEY = "tw:progress";
const FINISHED_AT = 0.9;
const THROTTLE_MS = 1500;
const MAX_ENTRIES = 60;

export type ProgressEntry = {
  slug: string;
  percent: number;
  updatedAt: number;
  kind: "RACHANA" | "BLOG" | "DOCUMENTARY";
  titleBn: string;
  seriesSlug: string | null;
  seriesOrder: number | null;
};

export type ProgressInput = Omit<ProgressEntry, "updatedAt">;

type Store = {
  entries: Record<string, ProgressEntry>;
  lastRead: string | null;
};

type SeriesProgress = {
  percent: number;
  finished: number;
  started: number;
  resumeSlug: string | null;
};

type Ctx = {
  entries: Record<string, ProgressEntry>;
  lastRead: ProgressEntry | null;
  record: (input: ProgressInput) => void;
  percentFor: (slug: string) => number;
  isFinished: (slug: string) => boolean;
  seriesProgress: (slugs: string[]) => SeriesProgress;
  reset: (slug: string) => void;
  clear: () => void;
  ready: boolean;
};

const ProgressContext = createContext<Ctx | null>(null);

const EMPTY: Store = { entries: {}, lastRead: null };

function isEntry(value: unknown): value is ProgressEntry {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return typeof e.slug === "string" && typeof e.percent === "number";
}

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;

    const { entries, lastRead } = parsed as Partial<Store>;
    const clean: Record<string, ProgressEntry> = {};
    if (entries && typeof entries === "object") {
      for (const [slug, entry] of Object.entries(entries)) {
        if (isEntry(entry)) clean[slug] = entry;
      }
    }
    return { entries: clean, lastRead: typeof lastRead === "string" ? lastRead : null };
  } catch {
    return EMPTY;
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* private browsing or quota exceeded */
  }
}

function trim(entries: Record<string, ProgressEntry>): Record<string, ProgressEntry> {
  const list = Object.values(entries);
  if (list.length <= MAX_ENTRIES) return entries;
  const keep = list
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_ENTRIES);
  return Object.fromEntries(keep.map((e) => [e.slug, e]));
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>(EMPTY);
  const [ready, setReady] = useState(false);

  const live = useRef<Store>(EMPTY);
  const pending = useRef<ProgressEntry | null>(null);
  const lastWrite = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const entry = pending.current;
    if (!entry) return;
    pending.current = null;
    lastWrite.current = Date.now();

    const next: Store = {
      entries: trim({ ...live.current.entries, [entry.slug]: entry }),
      lastRead: entry.slug,
    };
    live.current = next;
    write(next);
    setStore(next);
  }, []);

  useEffect(() => {
    const initial = read();
    live.current = initial;
    setStore(initial);
    setReady(true);

    const flush = () => commit();
    const onHidden = () => {
      if (document.visibilityState === "hidden") commit();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      const fresh = read();
      live.current = fresh;
      setStore(fresh);
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("storage", onStorage);
    return () => {
      commit();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("storage", onStorage);
    };
  }, [commit]);

  const record = useCallback(
    (input: ProgressInput) => {
      const previous = live.current.entries[input.slug];
      const percent = Math.max(
        previous?.percent ?? 0,
        Math.round(Math.min(1, Math.max(0, input.percent)) * 100) / 100,
      );

      const isNew = !previous;
      const moved = previous ? percent > previous.percent : true;
      const becameLast = live.current.lastRead !== input.slug;
      if (!isNew && !moved && !becameLast) return;

      pending.current = { ...input, percent, updatedAt: Date.now() };

      const elapsed = Date.now() - lastWrite.current;
      if (elapsed >= THROTTLE_MS) {
        commit();
      } else if (!timer.current) {
        timer.current = setTimeout(commit, THROTTLE_MS - elapsed);
      }
    },
    [commit],
  );

  const percentFor = useCallback(
    (slug: string) => store.entries[slug]?.percent ?? 0,
    [store],
  );

  const isFinished = useCallback(
    (slug: string) => (store.entries[slug]?.percent ?? 0) >= FINISHED_AT,
    [store],
  );

  const seriesProgress = useCallback(
    (slugs: string[]): SeriesProgress => {
      if (slugs.length === 0) {
        return { percent: 0, finished: 0, started: 0, resumeSlug: null };
      }
      let total = 0;
      let finished = 0;
      let started = 0;
      let resumeSlug: string | null = null;

      for (const slug of slugs) {
        const percent = store.entries[slug]?.percent ?? 0;
        const done = percent >= FINISHED_AT;
        total += done ? 1 : percent;
        if (done) finished += 1;
        if (percent > 0) started += 1;
        if (!done && !resumeSlug) resumeSlug = slug;
      }

      return {
        percent: Math.round((total / slugs.length) * 100) / 100,
        finished,
        started,
        resumeSlug,
      };
    },
    [store],
  );

  const reset = useCallback((slug: string) => {
    const entries = { ...live.current.entries };
    delete entries[slug];
    const next: Store = {
      entries,
      lastRead: live.current.lastRead === slug ? null : live.current.lastRead,
    };
    live.current = next;
    pending.current = null;
    write(next);
    setStore(next);
  }, []);

  const clear = useCallback(() => {
    live.current = EMPTY;
    pending.current = null;
    write(EMPTY);
    setStore(EMPTY);
  }, []);

  const lastRead = useMemo(
    () => (store.lastRead ? store.entries[store.lastRead] ?? null : null),
    [store],
  );

  const value = useMemo(
    () => ({
      entries: store.entries,
      lastRead,
      record,
      percentFor,
      isFinished,
      seriesProgress,
      reset,
      clear,
      ready,
    }),
    [
      store.entries,
      lastRead,
      record,
      percentFor,
      isFinished,
      seriesProgress,
      reset,
      clear,
      ready,
    ],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}

export { FINISHED_AT };
