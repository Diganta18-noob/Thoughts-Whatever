"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CardPiece } from "@/lib/pieces";
import { FeaturedHeroSlide } from "./featured-hero-slide";
import { FeaturedHeroNavigation } from "./featured-hero-navigation";

export interface FeaturedHeroSliderProps {
  pieces: CardPiece[];
  autoplayIntervalMs?: number;
  maxSlides?: number;
}

const AUTOPLAY_DURATION = 7000; // 7 seconds per slide

export function FeaturedHeroSlider({
  pieces,
  autoplayIntervalMs = AUTOPLAY_DURATION,
  maxSlides = 4,
}: FeaturedHeroSliderProps) {
  const slides = pieces.slice(0, maxSlides);
  const total = slides.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
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

  // Autoplay loop: advances every 7s when not hovered and more than 1 slide
  useEffect(() => {
    if (total <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      goToNext();
    }, autoplayIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isHovered, autoplayIntervalMs, goToNext, currentIndex]);

  // Keyboard navigation
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

  // Mobile Touch Swipe Handlers
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

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured Stories Slider"
      className="relative w-full overflow-hidden rounded-2xl border border-rule/60 bg-gradient-to-b from-surface-raised/30 via-surface/60 to-surface/90 p-5 sm:p-8 lg:p-10 shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-rule/80"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Active Slide Presentation */}
      <div className="relative min-h-[460px] sm:min-h-[480px] lg:min-h-[500px] flex items-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPiece.slug}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <FeaturedHeroSlide piece={currentPiece} priority={currentIndex === 0} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Editorial Timeline Navigation */}
      {total > 1 && (
        <FeaturedHeroNavigation
          total={total}
          current={currentIndex}
          onSelect={goToSlide}
          onPrev={goToPrev}
          onNext={goToNext}
          isPaused={isHovered}
          durationMs={autoplayIntervalMs}
        />
      )}
    </section>
  );
}
