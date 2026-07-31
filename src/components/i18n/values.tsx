"use client";

/**
 * Numbers, counts and datelines for pages that cannot use a hook.
 *
 * `lib/i18n/format.ts` needs a `locale`, and only a client component can read
 * one. Most index pages here are async server components, so these leaves exist
 * to be dropped into their markup: each is small, takes only serialisable
 * props, and looks the locale up itself.
 *
 * They also carry the font switch. The chrome sets figures in the mono face,
 * which has no Bengali numerals, and `.label` adds `letter-spacing: 0.14em`
 * with `text-transform: uppercase` on top — fine for `ARCHIVE`, wrong for
 * `৯ জন`. So each leaf ends its class list with the locale's face. Last
 * position is deliberate: it lets `twMerge` drop a `font-mono` the caller
 * passed in rather than keep both.
 *
 * Only `Count` and `CountLink` also reset the tracking. Those two sit inside
 * `.label` badges; `Num` is used for bare figures in already-plain classes, so
 * there is nothing there to undo.
 */

import Link from "next/link";
import { toBanglaDate } from "@/lib/bengali";
import { useLanguage } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/en";
import { formatDate, formatNumber, formatReading } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";

/** A bare figure — an index number, a tally. `২৩` or `23`. */
export function Num({
  value,
  className,
}: {
  value: number | string;
  className?: string;
}) {
  const { locale, isBn } = useLanguage();

  return (
    <span
      lang={locale}
      className={cn(className, isBn ? "font-bengali-sans" : "font-mono")}
    >
      {formatNumber(value, locale)}
    </span>
  );
}

/**
 * A tally with its noun — `9 authors`, `৯ জন`.
 *
 * The figure goes through `formatNumber` before it reaches the dictionary, so
 * the Bengali string only has to supply the classifier. Bengali also drops the
 * tracking here: this usually sits inside a `.label`, and 0.14em between
 * Bengali glyphs breaks the conjuncts apart.
 */
export function Count({
  k,
  value,
  className,
}: {
  k: TranslationKey;
  value: number;
  className?: string;
}) {
  const { t, locale, isBn } = useLanguage();

  return (
    <span
      lang={locale}
      className={cn(
        className,
        isBn ? "font-bengali-sans tracking-normal" : "font-mono",
      )}
    >
      {t(k, { count: formatNumber(value, locale) })}
    </span>
  );
}

/**
 * The dual dateline, one span per calendar.
 *
 * Same reasoning as the card version: a single span holding `29 July 2026 ·
 * ১৪ শ্রাবণ ১৪৩৩` cannot be tagged correctly, and a screen reader would read
 * half of it in the wrong voice. The Bangla half stays Bengali under English
 * chrome because it has no English form worth printing.
 */
export function LocalDate({
  value,
  className,
}: {
  value: Date | string;
  className?: string;
}) {
  const { locale, isBn } = useLanguage();
  const bangla = toBanglaDate(value);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span lang={locale} className={isBn ? "font-bengali-sans" : "font-sans"}>
        {formatDate(value, locale)}
      </span>
      {bangla && (
        <>
          <span aria-hidden className="text-rule">
            ·
          </span>
          <span lang="bn" className="font-bengali-sans">
            {bangla.formatted}
          </span>
        </>
      )}
    </span>
  );
}

/** `৭ মিনিট পাঠ` · `7 min read`. */
export function Reading({
  minutes,
  className,
}: {
  minutes: number;
  className?: string;
}) {
  const { locale, isBn } = useLanguage();

  return (
    <span
      lang={locale}
      className={cn(className, isBn ? "font-bengali-sans" : "font-sans")}
    >
      {formatReading(minutes, locale)}
    </span>
  );
}

/**
 * A count that is also a link — `All 12 parts →`, `সব ১২ কিস্তি →`.
 *
 * The series index is a server component, so it cannot pick the face or the
 * `lang` for its own link. The arrow stays outside the translated string, the
 * way `SectionHeading` does it.
 */
export function CountLink({
  href,
  k,
  value,
  className,
}: {
  href: string;
  k: TranslationKey;
  value: number;
  className?: string;
}) {
  const { t, locale, isBn } = useLanguage();

  return (
    <Link
      href={href}
      lang={locale}
      className={cn(className, isBn ? "font-bengali" : "font-serif")}
    >
      {t(k, { count: formatNumber(value, locale) })} →
    </Link>
  );
}
