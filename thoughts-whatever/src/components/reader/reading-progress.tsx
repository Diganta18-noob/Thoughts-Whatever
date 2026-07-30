"use client";

import { useEffect, useState } from "react";

/**
 * A hairline progress bar for long essays.
 *
 * Measures the article element rather than the whole document, so the bar
 * reaches 100% when the prose ends — not after the reader has also scrolled
 * past related pieces, the newsletter box, and the footer.
 */
export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    let frame = 0;

    const measure = () => {
      const rect = target.getBoundingClientRect();
      const viewport = window.innerHeight;
      // Distance scrolled into the article, over its scrollable length.
      const total = rect.height - viewport;
      const scrolled = -rect.top;
      const ratio = total <= 0 ? (rect.bottom <= viewport ? 1 : 0) : scrolled / total;
      setProgress(Math.min(1, Math.max(0, ratio)));
      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [targetId]);

  return (
    <div
      data-print="hide"
      className="fixed inset-x-0 top-16 z-20 h-px bg-transparent"
      role="progressbar"
      aria-label="পাঠের অগ্রগতি"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      <div
        className="h-px origin-left bg-accent/70 transition-transform duration-100 ease-out"
        style={{ transform: `scaleX(${progress})`, width: "100%" }}
      />
    </div>
  );
}
