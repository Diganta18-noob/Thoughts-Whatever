import sdk from "posthog-js";
import { analyticsAllowed } from "@/lib/analytics-consent";

export function initPostHog() {
  if (!analyticsAllowed()) {
    if (sdk.__loaded) { sdk.opt_out_capturing(); sdk.reset(); }
    return;
  }
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  if (!sdk.__loaded) {
    sdk.init(key, {
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      persistence: "memory",
      respect_dnt: true,
      before_send: (event) => {
        if (!analyticsAllowed()) return null;
        if (event?.properties) {
          for (const key of ["$current_url", "$referrer"]) {
            try { const url = new URL(event.properties[key]); event.properties[key] = url.origin + url.pathname; } catch { delete event.properties[key]; }
          }
          delete event.properties.search_query;
          delete event.properties.query;
          delete event.properties.$initial_current_url;
          delete event.properties.$initial_referrer;
        }
        return event;
      },
    });
  } else { sdk.opt_in_capturing(); }
}

// All callers share this consent gate; rejected events are never queued.
export const posthog = {
  capture: (...args: Parameters<typeof sdk.capture>) => {
    if (!analyticsAllowed() || window.location.pathname.startsWith("/admin")) return;
    initPostHog();
    if (sdk.__loaded) return sdk.capture(...args);
  },
  reset: () => { if (sdk.__loaded) sdk.reset(); },
};
