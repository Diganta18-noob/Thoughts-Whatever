"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FeaturedHeroNavigationProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
  onPrev: () => void;
  onNext: () => void;
  isPaused: boolean;
  durationMs: number;
}

export function FeaturedHeroNavigation({
  total,
  current,
  onSelect,
  onPrev,
  onNext,
  isPaused,
  durationMs,
}: FeaturedHeroNavigationProps) {
  if (total <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-rule/30">
      {/* Editorial Numbered Timeline Progress: 01 ━━━━━━ 02 ────── 03 ────── */}
      <div className="flex items-center gap-3 sm:gap-6" role="tablist" aria-label="Featured stories selection">
        {Array.from({ length: total }, (_, i) => {
          const isActive = i === current;
          const numStr = String(i + 1).padStart(2, "0");

          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => onSelect(i)}
              className="group flex items-center gap-2 sm:gap-2.5 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <span
                className={`font-mono text-xs tracking-wider transition-colors duration-300 ${
                  isActive
                    ? "font-semibold text-accent"
                    : "text-content-faint group-hover:text-content"
                }`}
              >
                {numStr}
              </span>

              {/* Progress track */}
              <div className="relative h-[2px] w-8 sm:w-14 overflow-hidden rounded-full bg-rule/50">
                {isActive ? (
                  <motion.div
                    key={`progress-${current}-${isPaused}`}
                    className="absolute inset-y-0 left-0 bg-accent"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: isPaused ? 0 : durationMs / 1000,
                      ease: "linear",
                    }}
                  />
                ) : (
                  <div
                    className={`h-full w-0 transition-all duration-300 ${
                      i < current ? "w-full bg-content-faint/40" : ""
                    }`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Prev / Next Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous story"
          className="group inline-flex h-8 items-center gap-1 rounded-sm border border-rule/60 px-2.5 font-mono text-[0.6875rem] uppercase tracking-widest text-content-soft transition-all hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span className="hidden sm:inline">PREV</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          aria-label="Next story"
          className="group inline-flex h-8 items-center gap-1 rounded-sm border border-rule/60 px-2.5 font-mono text-[0.6875rem] uppercase tracking-widest text-content-soft transition-all hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <span className="hidden sm:inline">NEXT</span>
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
