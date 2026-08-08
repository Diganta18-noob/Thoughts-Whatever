"use client";

import { useEffect } from "react";
import { posthog } from "@/lib/posthog-client";

interface SeriesTrackerProps {
  seriesId: string;
  seriesName: string;
  totalEpisodes: number;
}

export function SeriesTracker({ seriesId, seriesName, totalEpisodes }: SeriesTrackerProps) {
  useEffect(() => {
    posthog.capture("series_opened", {
      series_id: seriesId,
      series_name: seriesName,
      total_episodes: totalEpisodes,
    });
  }, [seriesId, seriesName, totalEpisodes]);

  return null;
}
