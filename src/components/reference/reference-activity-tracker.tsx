"use client";

import { useEffect } from "react";
import { trackEvent, type EventPayload } from "@/lib/tracker";

type ReferenceEvent = Extract<EventPayload["eventType"], `reference_${string}`>;

export function ReferenceActivityTracker({ event, workId }: { event: ReferenceEvent; workId?: string }) {
  useEffect(() => {
    trackEvent({ eventType: event, metadata: workId ? { referenceWorkId: workId } : undefined });
  }, [event, workId]);
  return null;
}
