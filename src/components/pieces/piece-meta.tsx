"use client";

import Link from "next/link";
import { toBanglaDate } from "@/lib/bengali";
import { formatDate, formatReading, formatWeekday } from "@/lib/i18n/format";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export type AuthorRef = { slug: string; nameBn: string; era?: string | null };
export type TagRef = { slug: string; labelBn: string; kind?: string };

/**
 * The dateline under a title.
 *
 * Both calendars are shown. The Gregorian date is what a reader needs in order
 * to place the piece; the Bangla date is what makes the page feel like it was
 * written in the language rather than translated into it. The weekday and ঋতু
 * are there for the same reason — they cost one line and they read as native.
 *
 * Under an English interface the Gregorian half and the reading time follow the
 * locale; the Bangla date does not, because ১৪ শ্রাবণ ১৪৩৩ has no English form.
 * Author names never change — they are content, and they carry their own
 * `lang="bn"` so a screen reader keeps the right voice even in English chrome.
 */
export function PieceMeta({
  publishedAt,
  readingMinutes,
  authors,
  className,
}: {
  publishedAt: Date | string | null;
  readingMinutes: number;
  authors?: AuthorRef[];
  className?: string;
}) {
  const { t, locale, isBn } = useLanguage();
  const bangla = publishedAt ? toBanglaDate(publishedAt) : null;

  return (
    <div
      className={cn(
        "text-[0.8125rem] text-content-faint",
        isBn ? "font-bengali-sans" : "font-sans",
        className,
      )}
    >
      {authors && authors.length > 0 && (
        <p className="mb-1.5 text-[0.9375rem] text-content-soft">
          <span lang={locale} className={isBn ? "font-bengali" : "font-sans text-[0.8125rem]"}>
            {t("piece.about")}
          </span>{" "}
          {authors.map((author, i) => (
            <span key={author.slug} className="font-bengali" lang="bn">
              <Link
                href={`/authors/${author.slug}`}
                className="underline decoration-rule underline-offset-[0.28em] transition hover:text-accent hover:decoration-accent"
              >
                {author.nameBn}
              </Link>
              {i < authors.length - 1 && ", "}
            </span>
          ))}
        </p>
      )}

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1" lang={locale}>
        {publishedAt && (
          <>
            <span>{formatWeekday(publishedAt, locale)}</span>
            <span aria-hidden className="text-rule">
              ·
            </span>
            <span>{formatDate(publishedAt, locale)}</span>
            {bangla && (
              <>
                <span aria-hidden className="text-rule">
                  ·
                </span>
                <span
                  lang="bn"
                  className={isBn ? undefined : "font-bengali-sans"}
                  title={`${bangla.season} ঋতু`}
                >
                  {bangla.formatted}
                </span>
              </>
            )}
            <span aria-hidden className="text-rule">
              ·
            </span>
          </>
        )}
        <span>{formatReading(readingMinutes, locale)}</span>
      </p>
    </div>
  );
}

/** বিষয়সূত্র — the tag row at the foot of a piece and on index cards. */
export function TagList({
  tags,
  className,
  size = "base",
}: {
  tags: TagRef[];
  className?: string;
  size?: "sm" | "base";
}) {
  if (!tags.length) return null;

  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <li key={tag.slug}>
          <Link
            href={`/archive?tag=${encodeURIComponent(tag.slug)}`}
            className={cn(
              "inline-block rounded-sm border border-rule px-2.5 py-1 font-bengali text-content-soft transition hover:border-accent/50 hover:text-accent",
              size === "sm" ? "text-xs" : "text-[0.8125rem]",
            )}
            lang="bn"
          >
            {tag.labelBn}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * The eyebrow above a title — section name, series, or কিস্তি number.
 *
 * The label arrives as a node because it is not always one language. A series
 * eyebrow is a Bengali title followed by an instalment number that follows the
 * interface locale, so no single `lang` is right for the whole line. Each child
 * brings its own `lang`, its own face, and its own tracking; this supplies the
 * small-caps frame and nothing else.
 */
export function PieceEyebrow({
  label,
  href,
  className,
}: {
  label: React.ReactNode;
  href?: string;
  className?: string;
}) {
  const content = <span className="label !text-accent">{label}</span>;

  return (
    <div className={cn("mb-3", className)}>
      {href ? (
        <Link href={href} className="transition hover:opacity-70">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}
