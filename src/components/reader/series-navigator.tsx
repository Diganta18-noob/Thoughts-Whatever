"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { piecePath, type PieceKindKey } from "@/lib/nav";
import { useLanguage } from "@/components/providers/language-provider";
import { toBengaliNumber } from "@/lib/bengali";

export type SeriesNeighbour = {
  slug: string;
  kind: PieceKindKey;
  titleBn: string;
  seriesOrder?: number | null;
};

export function SeriesNavigator({
  series,
  currentOrder,
  prev,
  next,
}: {
  series: { slug: string; titleBn: string };
  currentOrder?: number | null;
  prev: SeriesNeighbour | null;
  next: SeriesNeighbour | null;
}) {
  const { isBn } = useLanguage();

  if (!prev && !next) return null;

  return (
    <nav className="my-10 rounded-lg border border-rule/80 bg-surface-raised/40 p-6 backdrop-blur shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-rule/60 pb-3">
        <Link
          href={`/series/${series.slug}`}
          className="inline-flex items-center gap-2 font-mono text-xs text-accent transition hover:opacity-80"
        >
          <Layers className="h-4 w-4" />
          <span className={isBn ? "font-bengali-sans text-sm" : "font-sans"}>
            {series.titleBn}
          </span>
        </Link>

        {currentOrder && (
          <span className="font-mono text-xs text-content-faint">
            {isBn
              ? `পর্ব ${toBengaliNumber(currentOrder)}`
              : `Episode ${currentOrder}`}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {prev ? (
          <Link
            href={piecePath(prev.kind, prev.slug)}
            className="group flex flex-col gap-1 rounded-md border border-rule/50 bg-surface/60 p-4 transition-all hover:border-accent hover:shadow-sm"
          >
            <span className="flex items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-wider text-content-faint group-hover:text-accent">
              <ChevronLeft className="h-3.5 w-3.5" />
              {isBn ? "পূর্ববর্তী পর্ব" : "Previous Episode"}
            </span>
            <span className="font-bengali text-base font-medium text-content group-hover:text-accent">
              {prev.titleBn}
            </span>
          </Link>
        ) : (
          <div />
        )}

        {next ? (
          <Link
            href={piecePath(next.kind, next.slug)}
            className="group flex flex-col gap-1 rounded-md border border-rule/50 bg-surface/60 p-4 text-right transition-all hover:border-accent hover:shadow-sm sm:col-start-2"
          >
            <span className="flex items-center justify-end gap-1 font-mono text-[0.6875rem] uppercase tracking-wider text-content-faint group-hover:text-accent">
              {isBn ? "পরবর্তী পর্ব" : "Next Episode"}
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
            <span className="font-bengali text-base font-medium text-content group-hover:text-accent">
              {next.titleBn}
            </span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
