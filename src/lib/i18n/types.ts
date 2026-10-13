/**
 * The locale selects both interface and content language. English content
 * comes from the bundled translation dictionary; Bengali preserves originals.
 */

export type Locale = "en" | "bn";

export const LOCALES = ["en", "bn"] as const satisfies readonly Locale[];

/** New readers land in English. Bengali is a deliberate choice, not a guess. */
export const DEFAULT_LOCALE: Locale = "en";

export type LocaleMeta = {
  code: Locale;
  /** The language's name in itself, the way a speaker would recognise it. */
  name: string;
  /** Two or three glyphs, for the toggle button face. */
  short: string;
};

export const LOCALE_META: Record<Locale, LocaleMeta> = {
  en: { code: "en", name: "English", short: "EN" },
  bn: { code: "bn", name: "বাংলা", short: "বাং" },
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "bn";
}

/** Values substituted into `{placeholders}` — counts, names, that sort of thing. */
export type TranslationParams = Record<string, string | number>;
