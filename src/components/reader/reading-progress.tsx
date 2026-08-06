"use client";

import { useEffect, useState } from "react";
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
  const [progress, setProgress] = useState(0);
  const { t, locale } = useLanguage();
  const { record } = useProgress();

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    let frame = 0;

    const measure = () => {
      const rect = target.getBoundingClientRect();
      const viewport = window.innerHeight;
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

  const slug = piece?.slug;
  const kind = piece?.kind;
  const titleBn = piece?.titleBn;
  const seriesSlug = piece?.seriesSlug ?? null;
  const seriesOrder = piece?.seriesOrder ?? null;

  useEffect(() => {
    if (!slug || !kind || !titleBn) return;
    record({ slug, kind, titleBn, seriesSlug, seriesOrder, percent: progress });
  }, [slug, kind, titleBn, seriesSlug, seriesOrder, progress, record]);

  return (
    <div
      data-print="hide"
      className="fixed inset-x-0 top-16 z-20 h-px bg-transparent"
      role="progressbar"
      lang={locale}
      aria-label={t("piece.readingProgress")}
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
