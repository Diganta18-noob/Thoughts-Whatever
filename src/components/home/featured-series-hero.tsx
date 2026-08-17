"use client";

import Link from "next/link";
import Image from "next/image";
import { piecePath, KIND_META } from "@/lib/nav";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import type { PieceCardData } from "@/components/pieces/piece-card";

export interface FeaturedSeriesHeroProps {
  piece: PieceCardData;
  totalEpisodesInSeries?: number;
  currentEpisodeNumber?: number;
  seriesTitleBn?: string;
  seriesSlug?: string;
}

export function FeaturedSeriesHero({
  piece,
  totalEpisodesInSeries = 12,
  currentEpisodeNumber = 6,
  seriesTitleBn,
  seriesSlug,
}: FeaturedSeriesHeroProps) {
  const { locale, isBn, t } = useLanguage();
  const summary = piece.dekBn || piece.excerptBn;

  return (
    <section className="relative my-4">
      <div className="relative overflow-hidden rounded-lg border border-rule/70 bg-surface-raised/40 p-6 sm:p-8 transition-colors hover:border-rule">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr_260px] lg:items-center">
          {/* 1. Left: Square / Portrait Cover */}
          <div className="relative aspect-square w-full max-w-[220px] mx-auto lg:mx-0 overflow-hidden rounded border border-rule/60 bg-surface shadow-md">
            {piece.coverImage ? (
              <Image
                src={piece.coverImage}
                alt={piece.titleBn}
                fill
                sizes="(max-width: 768px) 220px, 220px"
                className="object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-content/5 font-serif text-content-faint">
                {piece.titleBn}
              </div>
            )}
          </div>

          {/* 2. Center: Editorial Metadata, Title & CTA */}
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[0.7rem] uppercase tracking-[0.16em] text-accent font-mono font-medium mb-2.5">
              {isBn ? "নির্বাচিত তথ্যচিত্র" : "FEATURED DOCUMENTARY"}
            </span>

            <h2 className="font-display text-2xl sm:text-3xl text-content font-medium leading-tight mb-3" lang="bn">
              <Link
                href={piecePath(piece.kind, piece.slug)}
                className="transition hover:text-accent"
              >
                {piece.titleBn}
              </Link>
            </h2>

            {summary && (
              <p
                className="font-bengali text-sm leading-relaxed text-content-soft line-clamp-3 mb-6"
                lang="bn"
              >
                {summary}
              </p>
            )}

            <div className="flex items-center gap-4">
              <Link
                href={piecePath(piece.kind, piece.slug)}
                className="inline-flex items-center gap-2 rounded-sm border border-accent/40 bg-accent/5 px-4 py-2 text-xs font-medium text-accent transition hover:bg-accent hover:text-white"
              >
                <span>{isBn ? "এখনই দেখুন" : "Watch now"}</span>
                <span aria-hidden>→</span>
              </Link>

              {seriesSlug && (
                <Link
                  href={`/series/${seriesSlug}`}
                  className="text-xs font-bengali-sans text-content-soft hover:text-accent transition"
                  lang="bn"
                >
                  সব পর্ব ({totalEpisodesInSeries}) →
                </Link>
              )}
            </div>
          </div>

          {/* 3. Right: Manifesto / Literary Pull Quote */}
          <div className="relative border-t lg:border-t-0 lg:border-l border-rule/70 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-center">
            <span className="font-serif text-3xl text-accent leading-none -mb-1 select-none">
              “
            </span>
            <blockquote className="space-y-1 text-xs sm:text-sm font-sans text-content-soft leading-relaxed">
              <p>We read closely.</p>
              <p>We question gently.</p>
              <p>We document truthfully.</p>
              <p>We keep going.</p>
            </blockquote>
            <p className="mt-3 text-[0.7rem] font-mono tracking-wider text-content-faint">
              — Thoughts Whatever
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
