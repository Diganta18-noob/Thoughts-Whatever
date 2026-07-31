/**
 * Client-side analytics tracker.
 * Anonymous session-based tracking for views, scroll depth, reading time, and Instagram/reel clicks.
 */

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("tw_analytics_session");
  if (!id) {
    id = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem("tw_analytics_session", id);
  }
  return id;
}

export type EventPayload = {
  pieceId?: string;
  eventType: "view" | "scroll_25" | "scroll_50" | "scroll_75" | "scroll_100" | "instagram_click" | "reel_click" | "ping";
  metadata?: Record<string, unknown>;
};

export function trackEvent(payload: EventPayload) {
  if (typeof window === "undefined") return;
  
  // Do Not Track check
  if (navigator.doNotTrack === "1") return;

  const body = JSON.stringify({
    ...payload,
    sessionId: getSessionId(),
    referrer: document.referrer || undefined,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/event", blob);
  } else {
    fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}
