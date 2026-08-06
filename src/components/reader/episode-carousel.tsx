"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { piecePath } from "@/lib/nav";
import { formatDate, formatReading } from "@/lib/i18n/format";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import type { PieceCardData } from "@/components/pieces/piece-card";

export interface EpisodeCarouselProps {
  episodes: PieceCardData[];
  currentSlug: string;
}

export function EpisodeCarousel({ episodes, currentSlug }: EpisodeCarouselProps) {
  const { locale } = useLanguage();

  if (!episodes || episodes.length === 0) return null;

  return (
    <section className="py-12 border-t border-rule/60">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="label !text-accent uppercase text-xs tracking-wider block mb-1">
            Continue The Journey
          </span>
          <h3 className="font-bengali text-xl font-medium text-content" lang="bn">
            ধারাবাহিক পর্বসমূহ
          </h3>
        </div>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
        {episodes.map((ep, i) => {
          const isCurrent = ep.slug === currentSlug;
          const isLocked = i > 7; // demo state for future locked upcoming episodes

          return (
            <motion.div
              key={ep.slug}
              whileHover={{ y: isLocked ? 0 : -4, scale: isLocked ? 1 : 1.02 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "snap-start shrink-0 w-64 rounded-xl border p-4 transition-all duration-300 flex flex-col justify-between",
                isCurrent
                  ? "border-accent bg-accent/10 shadow-md ring-1 ring-accent"
                  : isLocked
                  ? "border-rule/40 bg-surface-raised/20 opacity-60"
                  : "border-rule/60 bg-surface-raised/40 hover:border-rule hover:bg-surface-raised/70"
              )}
            >
              {/* Episode Cover & Status Badge */}
              <div className="relative mb-3 aspect-[3/4] w-full overflow-hidden rounded-lg border border-rule/40 bg-transparent">
                {ep.coverImage && (
                  <Image
                    src={ep.coverImage}
                    alt={ep.titleBn}
                    fill
                    className="object-cover"
                    sizes="250px"
                  />
                )}


                {/* Status Indicator */}
                <div className="absolute top-2 right-2 rounded-full bg-surface/90 px-2 py-0.5 text-[0.625rem] font-sans text-content-soft shadow">
                  {isCurrent ? (
                    <span className="text-accent font-medium">✓ Current</span>
                  ) : isLocked ? (
                    <span>🔒 Locked</span>
                  ) : (
                    <span>Ep {i + 1}</span>
                  )}
                </div>
              </div>

              {/* Title & Info */}
              <div>
                <span className="text-[0.6875rem] text-content-faint font-sans">
                  Episode {i + 1}
                </span>

                <h4
                  className="font-bengali text-sm font-medium text-content leading-snug line-clamp-2 mt-0.5 mb-2"
                  lang="bn"
                >
                  <Link href={piecePath(ep.kind, ep.slug)}>
                    {ep.titleBn}
                  </Link>
                </h4>

                <div className="flex items-center justify-between text-[0.6875rem] text-content-faint font-sans pt-2 border-t border-rule/40">
                  <span>{ep.publishedAt && formatDate(ep.publishedAt, locale)}</span>
                  <span>{formatReading(ep.readingMinutes, locale)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
