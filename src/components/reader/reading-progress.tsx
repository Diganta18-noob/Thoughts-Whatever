"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { useProgress } from "@/components/providers/progress-provider";

export type ProgressSubject = {
  slug: string;
  kind: "RACHANA" | "BLOG" | "DOCUMENTARY";
  titleBn: string;
  seriesSlug: string | null;
  seriesOrder: number | null;
};

export function ReadingProgress({
  targetId,
  piece,
}: {
  targetId: string;
  piece?: ProgressSubject;
}) {
  const [percent, setPercent] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useLanguage();
  const { record } = useProgress();

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    let frame = 0;
    let lastPercent = -1;

    const measure = () => {
      const rect = target.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = rect.height - viewport;
      const scrolled = -rect.top;
      const ratio = total <= 0 ? (rect.bottom <= viewport ? 1 : 0) : scrolled / total;
      const progress = Math.min(1, Math.max(0, ratio));
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`;
      const nextPercent = Math.round(progress * 100);
      if (nextPercent !== lastPercent) {
        lastPercent = nextPercent;
        setPercent(nextPercent);
      }
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

  const slug = piece?.slug;
  const kind = piece?.kind;
  const titleBn = piece?.titleBn;
  const seriesSlug = piece?.seriesSlug ?? null;
  const seriesOrder = piece?.seriesOrder ?? null;

  useEffect(() => {
    if (!slug || !kind || !titleBn) return;
    record({ slug, kind, titleBn, seriesSlug, seriesOrder, percent: percent / 100 });
  }, [slug, kind, titleBn, seriesSlug, seriesOrder, percent, record]);

  return (
    <div
      data-print="hide"
      className="fixed inset-x-0 top-16 z-20 h-px bg-transparent"
      role="progressbar"
      lang={locale}
      aria-label={t("piece.readingProgress")}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div ref={barRef} className="h-px w-full origin-left scale-x-0 bg-accent/70" />
    </div>
  );
}
