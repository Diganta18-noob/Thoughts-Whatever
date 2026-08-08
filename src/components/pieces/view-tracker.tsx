"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/tracker";
import { posthog } from "@/lib/posthog-client";

interface ViewTrackerProps {
  pieceId?: string;
  pieceProps?: {
    slug: string;
    kind: "DOCUMENTARY" | "RACHANA" | "BLOG";
    titleBn: string;
    seriesId?: string | null;
    seriesName?: string | null;
    seriesOrder?: number | null;
    category?: string | null;
    readingMinutes?: number;
    publishedAt?: Date | string | null;
  };
}

export function ViewTracker({ pieceId, pieceProps }: ViewTrackerProps) {
  const scrollMilestones = useRef(new Set<number>());

  useEffect(() => {
    // Track initial page view (Prisma)
    trackEvent({ pieceId, eventType: "view" });

    // Track PostHog piece / documentary / series opening event
    if (pieceProps) {
      const eventName =
        pieceProps.kind === "DOCUMENTARY"
          ? "documentary_opened"
          : pieceProps.kind === "RACHANA"
          ? "article_opened"
          : "episode_opened";

      posthog.capture(eventName, {
        piece_id: pieceId,
        slug: pieceProps.slug,
        content_type: pieceProps.kind,
        title_bn: pieceProps.titleBn,
        series_id: pieceProps.seriesId || undefined,
        series_name: pieceProps.seriesName || undefined,
        series_order: pieceProps.seriesOrder || undefined,
        reading_time_estimate: pieceProps.readingMinutes,
        published_at: pieceProps.publishedAt,
      });
    }

    // Track scroll milestones
    const handleScroll = () => {
      const el = document.documentElement;
      const totalHeight = el.scrollHeight - el.clientHeight;
      if (totalHeight <= 0) return;

      const percentage = Math.round((window.scrollY / totalHeight) * 100);

      const milestones = [50, 90, 100];
      for (const m of milestones) {
        if (percentage >= m && !scrollMilestones.current.has(m)) {

          scrollMilestones.current.add(m);
          trackEvent({
            pieceId,
            eventType: `scroll_${m}` as any,
            metadata: { scrollDepth: m },
          });

          if (pieceProps) {
            posthog.capture("reading_progress", {
              piece_id: pieceId,
              slug: pieceProps.slug,
              content_type: pieceProps.kind,
              progress_percentage: m,
              viewport_height: window.innerHeight,
            });

            if (m === 100) {
              const completeEvent =
                pieceProps.kind === "DOCUMENTARY"
                  ? "episode_completed"
                  : "article_completed";

              posthog.capture(completeEvent, {
                piece_id: pieceId,
                slug: pieceProps.slug,
                content_type: pieceProps.kind,
              });
            }
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pieceId, pieceProps]);

  return null;
}

