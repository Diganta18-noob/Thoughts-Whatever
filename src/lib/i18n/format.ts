/**
 * Numbers and dates that sit in the chrome.
 *
 * `lib/bengali.ts` argues, correctly, that `৭ মিনিট পাঠ` reads as native where
 * `7 min read` reads as a translation. That argument holds for a reader who
 * reads Bengali. For one who has switched the interface to English it inverts:
 * a dateline they cannot read is not native, it is opaque.
 *
 * So the rule is drawn at the same line as everything else here — numbers in
 * the *chrome* follow the interface locale; numbers inside the *writing* are
 * Bengali always, because they are part of the text.
 *
 * The month and weekday names are hand-listed rather than taken from `Intl`,
 * matching how the Bengali side does it. Two reasons: it is deterministic
 * across server and browser, so it cannot cause a hydration mismatch, and the
 * day-first order deliberately mirrors the Bengali dateline.
 */

import {
  formatBengaliDate,
  formatBengaliDuration,
  formatBengaliWeekday,
  formatReadingTime,
  toBanglaDate,
  toBengaliNumber,
} from "@/lib/bengali";
import type { Locale } from "./types";

const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const EN_WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const asDate = (date: Date | string) =>
  typeof date === "string" ? new Date(date) : date;

/** Safely format a Date or string to ISO string, returning undefined on invalid or missing date */
export function toIsoString(date?: Date | string | null): string | undefined {
  if (!date) return undefined;
  if (typeof date === "string") return date;
  if (date instanceof Date && !Number.isNaN(date.getTime())) {
    return date.toISOString();
  }
  try {
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  } catch {
    return undefined;
  }
}

/** ২০২৬ under Bengali, 2026 under English. */
export function formatNumber(input: number | string, locale: Locale): string {
  return locale === "bn" ? toBengaliNumber(input) : String(input);
}

/** ২৯ জুলাই ২০২৬ · 29 July 2026 */
export function formatDate(date: Date | string, locale: Locale): string {
  if (locale === "bn") return formatBengaliDate(date);
  const d = asDate(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** বুধবার · Wednesday */
export function formatWeekday(date: Date | string, locale: Locale): string {
  if (locale === "bn") return formatBengaliWeekday(date);
  const d = asDate(date);
  if (Number.isNaN(d.getTime())) return "";
  return EN_WEEKDAYS[d.getDay()];
}

/**
 * ৭ মিনিট পাঠ · 7 min read
 *
 * `readingMinutes()` already returns a clamped integer, so the rounding here
 * only guards against a caller that computed its own figure.
 */
export function formatReading(minutes: number, locale: Locale): string {
  if (locale === "bn") return formatReadingTime(minutes);
  return `${Math.max(1, Math.round(minutes))} min read`;
}

/** ১৮:৪২ · 18:42 */
export function formatDuration(totalSeconds: number, locale: Locale): string {
  if (locale === "bn") return formatBengaliDuration(totalSeconds);
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

/**
 * The dual dateline. The Gregorian half follows the locale; the Bangla half
 * stays Bengali in both, because ১৪ শ্রাবণ ১৪৩৩ has no English form worth
 * printing — transliterating it would lose the calendar it belongs to.
 */
export function formatDualDate(date: Date | string, locale: Locale): string {
  const bangla = toBanglaDate(date);
  const gregorian = formatDate(date, locale);
  return bangla ? `${gregorian} · ${bangla.formatted}` : gregorian;
}
