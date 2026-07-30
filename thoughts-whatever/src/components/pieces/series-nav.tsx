"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { KIND_META, piecePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

export type Neighbour = {
  slug: string;
  kind: keyof typeof KIND_META;
  titleBn: string;
  seriesOrder: number | null;
} | null;

/**
 * The previous/next pair at the foot of an instalment.
 *
 * A client component for the same reason as `ContentsNav`: the `<nav>` carries
 * an `aria-label`, which has to be a string rather than a node.
 *
 * The two labels are chrome and follow the interface; the two titles are the
 * pieces themselves and stay `lang="bn"`. `.label`'s 0.14em tracking is undone
 * under Bengali — it is spacing meant for Latin small caps, and it pulls
 * Bengali conjuncts apart.
 */
export function SeriesNav({ prev, next }: { prev: Neighbour; next: Neighbour }) {
  const { t, locale, isBn } = useLanguage();

  if (!prev && !next) return null;

  const label = cn(
    "label flex items-center gap-1.5",
    isBn && "font-bengali-sans tracking-normal",
  );
  const title =
    "mt-2 block font-bengali text-[0.9375rem] text-content transition group-hover:text-accent";

  return (
    <nav
      data-print="hide"
      aria-label={t("piece.seriesNav")}
      className="mx-auto mt-14 grid max-w-measure gap-3 sm:grid-cols-2"
    >
      {prev ? (
        <Link
          href={piecePath(prev.kind, prev.slug)}
          className="group rounded-sm border border-rule p-4 transition hover:border-accent/40"
        >
          <span className={label} lang={locale}>
            <ArrowLeft className="h-3 w-3" /> {t("piece.previous")}
          </span>
          <span className={title} lang="bn">
            {prev.titleBn}
          </span>
        </Link>
      ) : (
        <span />
      )}

      {next && (
        <Link
          href={piecePath(next.kind, next.slug)}
          className="group rounded-sm border border-rule p-4 text-right transition hover:border-accent/40 sm:col-start-2"
        >
          <span className={cn(label, "justify-end")} lang={locale}>
            {t("piece.next")} <ArrowRight className="h-3 w-3" />
          </span>
          <span className={title} lang="bn">
            {next.titleBn}
          </span>
        </Link>
      )}
    </nav>
  );
}
