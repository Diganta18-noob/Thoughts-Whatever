"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/tracker";

interface ViewTrackerProps {
  pieceId?: string;
}

export function ViewTracker({ pieceId }: ViewTrackerProps) {
  const scrollMilestones = useRef(new Set<number>());

  useEffect(() => {
    // Track initial page view
    trackEvent({ pieceId, eventType: "view" });

    // Track scroll milestones
    const handleScroll = () => {
      const el = document.documentElement;
      const totalHeight = el.scrollHeight - el.clientHeight;
      if (totalHeight <= 0) return;

      const percentage = Math.round((window.scrollY / totalHeight) * 100);

      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (percentage >= m && !scrollMilestones.current.has(m)) {
          scrollMilestones.current.add(m);
          trackEvent({
            pieceId,
            eventType: `scroll_${m}` as any,
            metadata: { scrollDepth: m },
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pieceId]);

  return null;
}
