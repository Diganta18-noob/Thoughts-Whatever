"use client";

import { useEffect } from "react";
import { analyticsAllowed, CONSENT_EVENT } from "@/lib/analytics-consent";
import { trackEvent, type EventPayload } from "@/lib/tracker";

type ReferenceEvent = Extract<EventPayload["eventType"], `reference_${string}`>;

export function ReferenceActivityTracker({ event, workId }: { event: ReferenceEvent; workId?: string }) {
  useEffect(() => {
    let sent = false;
    const send = () => {
      if (sent || !analyticsAllowed()) return;
      sent = true;
      trackEvent({ eventType: event, metadata: workId ? { referenceWorkId: workId } : undefined });
    };
    send();
    window.addEventListener(CONSENT_EVENT, send);
    return () => window.removeEventListener(CONSENT_EVENT, send);
  }, [event, workId]);
  return null;
}
