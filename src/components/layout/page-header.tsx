"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";

/**
 * Section masthead.
 *
 * In English the small-caps label sits above and the Bengali title carries the
 * weight — English tells you where you are, Bengali is what you came to read.
 *
 * In Bengali the label and the italic English gloss are dropped rather than
 * translated. `titleBn` already *is* the section's Bengali name, so translating
 * `labelEn` would print the same word twice, and `descEn` is a gloss for people
 * who don't read the line above it.
 */
export function PageHeader({
  labelEn,
  titleBn,
  descEn,
  descBn,
  count,
  className,
}: {
  labelEn: string;
  titleBn: string;
  descEn?: string;
  descBn?: string;
  count?: React.ReactNode;
  className?: string;
}) {
  const { isBn } = useLanguage();

  return (
    <header className={cn("border-b border-rule pb-8 pt-12 sm:pt-16", className)}>
      <div className="flex items-baseline justify-between gap-4">
        {!isBn && (
          <span className="label" lang="en">
            {labelEn}
          </span>
        )}
        {/* `count` is a node, not a string, because the pages that render this
            header are async server components and cannot read the locale. They
            pass a client leaf from `components/i18n/values` instead, which
            carries its own `lang` and its own Bengali face — `.label`'s mono
            stack and 0.14em tracking are inherited otherwise, and neither
            suits Bengali. */}
        {count && <span className="label ml-auto">{count}</span>}
      </div>

      <h1
        className="mt-3 font-bengali text-[2rem] font-medium leading-tight text-content sm:text-[2.5rem]"
        lang="bn"
      >
        {titleBn}
      </h1>

      {descBn && (
        <p className="mt-4 max-w-measure-wide font-bengali text-bengali-base text-content-soft" lang="bn">
          {descBn}
        </p>
      )}

      {descEn && !isBn && (
        <p className="mt-2 max-w-measure-wide font-serif text-sm italic text-content-faint" lang="en">
          {descEn}
        </p>
      )}
    </header>
  );
}

/** A smaller heading used to divide a page into runs of cards. */
export function SectionHeading({
  labelEn,
  titleBn,
  href,
  hrefLabel,
  className,
}: {
  labelEn?: string;
  titleBn: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  const { t, locale, isBn } = useLanguage();

  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4 border-b border-rule pb-3", className)}>
      <div>
        {labelEn && !isBn && (
          <span className="label block" lang="en">
            {labelEn}
          </span>
        )}
        <h2 className="mt-1 font-bengali text-xl text-content" lang="bn">
          {titleBn}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            "shrink-0 text-sm text-accent transition hover:opacity-75",
            isBn ? "font-bengali" : "font-serif",
          )}
          lang={locale}
        >
          {hrefLabel ?? t("common.all")} →
        </Link>
      )}
    </div>
  );
}
