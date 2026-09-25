"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatDate, toIsoString } from "@/lib/i18n/format";
import { piecePath, KIND_META } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";
import { thumbnailSrc } from "@/lib/images";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { StoryReadLink } from "@/components/ui/story-read-link";

const SLIDE_DURATION = 4000; // 4 seconds auto-play

export function LatestEpisodes({ pieces }: { pieces: CardPiece[] }) {
  const { locale, isBn } = useLanguage();
  
  // Deduplicate pieces by series: only one poster/episode per series
  const seenSeries = new Set<string>();
  const uniquePieces = pieces.filter((p) => {
    const sId = p.seriesId || p.series?.slug;
    if (sId) {
      if (seenSeries.has(sId)) return false;
      seenSeries.add(sId);
    }
    return true;
  });

  const slides = uniquePieces.slice(0, 4);
  const total = slides.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Pause when browser tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // 6-second auto-play loop (pauses on hover, inactive tab, or single item)
  useEffect(() => {
    if (total <= 1 || isHovered || !isTabActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isHovered, isTabActive, goToNext, currentIndex]);

  // Keyboard navigation listener (Left/Right arrows)
  useEffect(() => {
    if (total <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrev();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [total, goToPrev, goToNext]);

  // Touch swipe support for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;

    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
    setTouchStartX(null);
  };

  if (!slides.length) return null;

  const currentPiece = slides[currentIndex];
  const href = piecePath(currentPiece.kind, currentPiece.slug);
  const meta = KIND_META[currentPiece.kind];
  const summary = currentPiece.dekBn || currentPiece.excerptBn;
  const imageSrc = thumbnailSrc(currentPiece.slug, currentPiece.thumbnailImage, currentPiece.coverImage);
  const isPaused = isHovered || !isTabActive;
  const displayTitle =
    currentPiece.titleBn
      .replace(/\s*\|\s*(পর্ব[-\s]*\d+|অন্তিম\s*পর্ব|part[-\s]*\d+).*$/i, "")
      .trim() || currentPiece.titleBn;

  return (
    <section className="py-6">
      {/* ─── Section Heading (Issue 11: View all placement and accessible font scale) ─── */}
      <Reveal>
        <div className="mb-6 flex items-center justify-between border-b border-rule/50 pb-2.5">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent font-medium">
              Latest
            </span>
            <h2 className="font-bengali text-xl font-medium text-content" lang="bn">
              সাম্প্রতিক
            </h2>
          </div>
          <Link
            href="/archive"
            className="group/link inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-content-soft transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <span>View all</span>
            <span className="transition-transform duration-200 group-hover/link:translate-x-1">→</span>
          </Link>
        </div>
      </Reveal>

      {/* ─── Cinematic Hero Carousel Container ─── */}
      <div
        aria-roledescription="carousel"
        aria-label="Latest stories carousel"
        className="group/carousel relative w-full overflow-hidden rounded-xl border border-rule/60 bg-[#0d0e10] shadow-2xl transition-all duration-300 hover:border-rule/80 aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9] min-h-[460px] sm:min-h-[480px] lg:min-h-[520px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Artwork Layer with Crossfade + Ken Burns Scale Animation */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPiece.slug}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-0 h-full w-full"
          >
            {imageSrc ? (
              <Image
                src={imageSrc}
                alt={currentPiece.titleBn}
                fill
                priority={currentIndex === 0}
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 1200px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-raised/40 font-mono text-xs text-content-faint">
                No Landscape Artwork
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ─── Cinematic Gradient Overlays (Issue 16: Scrim & Contrast Over Archival Text) ─── */}
        {/* Overall base scrim to suppress high-contrast archival manuscript text from photo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-black/40"
        />
        {/* Desktop Left-to-Right directional darkening where text sits */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 hidden sm:block bg-gradient-to-r from-[#0a0a0c]/98 via-[#0a0a0c]/85 via-45% to-[#0a0a0c]/30"
        />
        {/* Mobile & Overall Bottom-to-Top directional darkening */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 sm:hidden bg-gradient-to-t from-[#0a0a0c]/98 via-[#0a0a0c]/75 via-50% to-[#0a0a0c]/30"
        />
        {/* Subtle Vignette border ring */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 ring-1 ring-inset ring-rule/40 rounded-xl"
        />

        {/* ─── Carousel Prev/Next Side Controls (Issue 15: Conventional, Accessible, >=44px) ─── */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous story"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white shadow-xl backdrop-blur-md transition-all hover:bg-accent hover:border-accent hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              aria-label="Next story"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white shadow-xl backdrop-blur-md transition-all hover:bg-accent hover:border-accent hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* ─── Left Editorial Content Area ─── */}
        <div className="relative z-20 flex h-full flex-col justify-between p-6 sm:p-10 lg:p-12 pl-14 sm:pl-16 lg:pl-20">
          {/* Top Row: Category label & Slide Indicator */}
          <div className="flex items-center justify-between gap-4">
            <motion.div
              key={`category-${currentPiece.slug}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent font-semibold"
            >
              <span>{meta ? (isBn ? meta.labelBn : meta.labelEn) : "DOCUMENTARY"}</span>
              {currentPiece.series?.titleBn &&
                currentPiece.series.titleBn.trim().toLowerCase() !== displayTitle.trim().toLowerCase() && (
                  <>
                    <span className="text-white/30 tracking-normal">•</span>
                    <span className="font-bengali text-xs tracking-normal font-normal text-white/80">
                      {currentPiece.series.titleBn}
                    </span>
                  </>
                )}
            </motion.div>

            {total > 1 && (
              <span className="font-mono text-xs tracking-widest text-white/60">
                {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            )}
          </div>

          {/* Middle: Dominant Title, Synopsis & CTA */}
          <div className="my-auto max-w-2xl py-4">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`text-${currentPiece.slug}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4"
              >
                {/* Story Title */}
                <h3
                  className="font-bengali text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-medium leading-[1.18] text-white tracking-tight drop-shadow-md transition-colors hover:text-accent"
                  lang="bn"
                >
                  <Link href={href}>{displayTitle}</Link>
                </h3>

                {/* Short Literary Description (max 2-3 lines) */}
                {summary && (
                  <p
                    className="font-bengali text-xs sm:text-sm lg:text-base leading-relaxed text-white/90 line-clamp-2 sm:line-clamp-3 max-w-xl drop-shadow"
                    lang="bn"
                  >
                    {summary}
                  </p>
                )}

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-x-3 text-xs font-mono text-white/70 pt-1">
                  {currentPiece.publishedAt && (
                    <>
                      <time dateTime={toIsoString(currentPiece.publishedAt)}>
                        {formatDate(currentPiece.publishedAt, locale)}
                      </time>
                      <span>•</span>
                    </>
                  )}
                  <span>{formatReading(currentPiece.readingMinutes, locale)}</span>
                </div>

                {/* Editorial CTA (Issue 8: Standardized StoryReadLink) */}
                <div className="pt-2">
                  <StoryReadLink href={href} variant="pill" />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ─── Bottom: Editorial Numbered Timeline Progress (01 ━━━━ 02 ──── 03 ──── 04 ────) ─── */}
          {total > 1 && (
            <div
              className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-white/10"
              role="tablist"
              aria-label="Carousel slide selection"
            >
              {slides.map((_, i) => {
                const isActive = i === currentIndex;
                const numStr = String(i + 1).padStart(2, "0");

                return (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => goToSlide(i)}
                    className="group flex items-center gap-2.5 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                  >
                    <span
                      className={`font-mono text-xs tracking-wider transition-colors duration-300 ${
                        isActive
                          ? "font-semibold text-accent"
                          : "text-white/50 group-hover:text-white"
                      }`}
                    >
                      {numStr}
                    </span>

                    {/* Progress Track */}
                    <div className="relative h-[2px] w-8 sm:w-14 overflow-hidden rounded-full bg-white/20">
                      {isActive ? (
                        <motion.div
                          key={`progress-${currentIndex}-${isPaused}`}
                          className="absolute inset-y-0 left-0 bg-accent"
                          initial={{ width: "0%" }}
                          animate={{ width: "100%" }}
                          transition={{
                            duration: isPaused ? 0 : SLIDE_DURATION / 1000,
                            ease: "linear",
                          }}
                        />
                      ) : (
                        <div
                          className={`h-full w-0 transition-all duration-300 ${
                            i < currentIndex ? "w-full bg-white/40" : ""
                          }`}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
