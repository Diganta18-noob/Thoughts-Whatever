"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { READING_KEY, THEME_KEY, THEME_COOKIE } from "./theme-script";

export type Theme = "cream" | "sepia" | "night";
export type ReadingFamily = "serif" | "sans";

export type ReadingSettings = {
  size: number; // px
  leading: number;
  family: ReadingFamily;
};

export const READING_DEFAULTS: ReadingSettings = {
  size: 19,
  leading: 1.9,
  family: "serif",
};

export const SIZE_RANGE = { min: 16, max: 26, step: 1 };
export const LEADING_RANGE = { min: 1.6, max: 2.3, step: 0.05 };

type Ctx = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  reading: ReadingSettings;
  setReading: (patch: Partial<ReadingSettings>) => void;
  reset: () => void;
  ready: boolean;
};

const ReadingContext = createContext<Ctx | null>(null);

export function ReadingProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("cream");
  const [reading, setReadingState] = useState<ReadingSettings>(READING_DEFAULTS);
  const [ready, setReady] = useState(false);

  // Read back what ThemeScript already applied, so React state agrees with
  // the DOM instead of fighting it on hydration.
  useEffect(() => {
    const root = document.documentElement;
    const applied = root.dataset.theme as Theme | undefined;
    if (applied) setThemeState(applied);

    try {
      const raw = localStorage.getItem(READING_KEY);
      if (raw) setReadingState({ ...READING_DEFAULTS, ...JSON.parse(raw) });
    } catch {
      /* storage disabled — defaults are fine */
    }
    setReady(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
      document.cookie = `${THEME_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      /* ignore */
    }
  }, []);

  const setReading = useCallback((patch: Partial<ReadingSettings>) => {
    setReadingState((prev) => {
      const next = { ...prev, ...patch };
      const root = document.documentElement;
      root.style.setProperty("--reading-size", `${next.size}px`);
      root.style.setProperty("--reading-leading", String(next.leading));
      root.style.setProperty(
        "--reading-family",
        next.family === "sans"
          ? "var(--font-bengali-sans), sans-serif"
          : "var(--font-bengali-serif), serif",
      );
      try {
        localStorage.setItem(READING_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => setReading(READING_DEFAULTS), [setReading]);

  const value = useMemo(
    () => ({ theme, setTheme, reading, setReading, reset, ready }),
    [theme, setTheme, reading, setReading, reset, ready],
  );

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>;
}

export function useReading() {
  const ctx = useContext(ReadingContext);
  if (!ctx) throw new Error("useReading must be used inside <ReadingProvider>");
  return ctx;
}
