"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

/**
 * সূচিপত্র — the jump list above a long piece.
 *
 * This is a client component for one reason: the `<nav>` needs an `aria-label`,
 * and an attribute cannot hold a `<T>`. Anything that puts chrome inside an
 * attribute has to read the locale itself.
 *
 * The heading text is the writing's own, so it stays `lang="bn"` in both
 * interface languages. Only the label above it moves.
 */
export function ContentsNav({
  headings,
}: {
  headings: { id: string; text: string; level: number }[];
}) {
  const { t, locale, isBn } = useLanguage();

  return (
    <nav
      data-print="hide"
      aria-label={t("piece.contents")}
      className="mx-auto mt-10 max-w-measure rounded-sm border border-rule bg-surface-raised px-5 py-4"
    >
      <span
        lang={locale}
        className={cn("label", isBn && "font-bengali-sans tracking-normal")}
      >
        {t("piece.contents")}
      </span>

      <ol className="mt-3 space-y-2">
        {headings.map((heading) => (
          <li
            key={heading.id}
            className={heading.level === 3 ? "pl-4" : undefined}
          >
            <a
              href={`#${heading.id}`}
              className="font-bengali text-[0.9375rem] text-content-soft transition hover:text-accent"
              lang="bn"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
