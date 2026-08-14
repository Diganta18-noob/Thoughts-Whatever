"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LOCALE_KEY } from "./theme-script";
import { en, type Dictionary, type TranslationKey } from "@/lib/i18n/en";
import { bn } from "@/lib/i18n/bn";
import {
  DEFAULT_LOCALE,
  isLocale,
  type Locale,
  type TranslationParams,
} from "@/lib/i18n/types";

import { posthog } from "@/lib/posthog-client";

const DICTIONARIES: Record<Locale, Dictionary> = { en, bn };


/**
 * Fills `{placeholders}`. Anything the caller did not supply is left as-is
 * rather than blanked — a visible `{count}` in development is easier to catch
 * than a silent gap in production.
 */
function interpolate(
  template?: string,
  params?: TranslationParams,
  fallbackKey?: string,
) {
  if (template === undefined || template === null) return fallbackKey || "";
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

type Ctx = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggle: () => void;
  /** Chrome only. Never call this on a title, body, author, or tag. */
  t: (key: TranslationKey, params?: TranslationParams) => string;
  /** `true` for Bengali chrome — handy for switching font classes. */
  isBn: boolean;
  ready: boolean;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  // Read back what ThemeScript already put on <html lang>, so React state
  // agrees with the DOM instead of fighting it on hydration.
  useEffect(() => {
    const applied = document.documentElement.lang;
    if (isLocale(applied)) setLocaleState(applied);
    setReady(true);
  }, []);


  const setLocale = useCallback((next: Locale) => {
    setLocaleState((prev) => {
      posthog.capture("language_changed", {
        from_language: prev,
        to_language: next,
      });
      return next;
    });
    document.documentElement.lang = next;
    try {
      localStorage.setItem(LOCALE_KEY, next);
      document.cookie = `tw_lang=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      /* storage disabled — the choice just won't outlive the tab */
    }
  }, []);

  const toggle = useCallback(() => {
    setLocaleState((prev) => {
      const next: Locale = prev === "en" ? "bn" : "en";
      posthog.capture("language_changed", {
        from_language: prev,
        to_language: next,
      });
      document.documentElement.lang = next;
      try {
        localStorage.setItem(LOCALE_KEY, next);
        document.cookie = `tw_lang=${next}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);


  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => {
      const template =
        DICTIONARIES[locale]?.[key] ?? DICTIONARIES[DEFAULT_LOCALE]?.[key];
      return interpolate(template, params, key);
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggle, t, isBn: locale === "bn", ready }),
    [locale, setLocale, toggle, t, ready],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
}

/**
 * Same, but never throws — for error boundaries.
 *
 * If the thing that broke is the provider tree itself, an error page that
 * insists on context would throw while rendering the error, and the reader
 * would get Next's default screen instead of ours. Falling back to English is
 * a worse experience than the right locale and a much better one than that.
 */
export function useLanguageSafe(): Ctx {
  const ctx = useContext(LanguageContext);
  if (ctx) return ctx;
  return {
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    toggle: () => {},
    t: (key, params) => {
      const template = DICTIONARIES[DEFAULT_LOCALE]?.[key];
      return interpolate(template, params, key);
    },
    isBn: DEFAULT_LOCALE === "bn",
    ready: false,
  };
}

/** Sugar for the common case: `const t = useTranslation()`. */
export function useTranslation() {
  return useLanguage().t;
}
