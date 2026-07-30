"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * পরে পড়ব — save for later.
 *
 * Deliberately localStorage and not an account. Asking a reader to register
 * before they can bookmark an essay loses more readers than the feature wins,
 * and it would mean holding personal data for no editorial benefit.
 *
 * The trade-off is honest and worth stating: bookmarks do not follow a reader
 * to another device. The /bookmarks page says so in Bengali.
 */

const KEY = "tw:bookmarks";

export type Bookmark = {
  slug: string;
  kind: "RACHANA" | "BLOG" | "DOCUMENTARY";
  titleBn: string;
  savedAt: number;
};

type Ctx = {
  bookmarks: Bookmark[];
  has: (slug: string) => boolean;
  toggle: (bookmark: Omit<Bookmark, "savedAt">) => boolean;
  remove: (slug: string) => void;
  clear: () => void;
  ready: boolean;
};

const BookmarksContext = createContext<Ctx | null>(null);

function read(): Bookmark[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: Bookmark[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* private browsing or a full quota — the UI still works for this session */
  }
}

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBookmarks(read());
    setReady(true);

    // Keep two open tabs in agreement.
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setBookmarks(read());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = useCallback(
    (slug: string) => bookmarks.some((b) => b.slug === slug),
    [bookmarks],
  );

  /** Returns the new state: true if it is now saved. */
  const toggle = useCallback((entry: Omit<Bookmark, "savedAt">) => {
    let nowSaved = false;
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.slug === entry.slug);
      const next = exists
        ? prev.filter((b) => b.slug !== entry.slug)
        : [{ ...entry, savedAt: Date.now() }, ...prev];
      nowSaved = !exists;
      write(next);
      return next;
    });
    return nowSaved;
  }, []);

  const remove = useCallback((slug: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.slug !== slug);
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setBookmarks([]);
    write([]);
  }, []);

  const value = useMemo(
    () => ({ bookmarks, has, toggle, remove, clear, ready }),
    [bookmarks, has, toggle, remove, clear, ready],
  );

  return (
    <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>
  );
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used inside <BookmarksProvider>");
  return ctx;
}
