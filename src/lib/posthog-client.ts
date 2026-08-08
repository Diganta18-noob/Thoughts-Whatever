import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window === "undefined") return;

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  if (!key) return;

  if (!posthog.__loaded) {
    posthog.init(key, {
      api_host: "/ingest",
      ui_host: host,
      capture_pageview: false, // Explicit pageviews only on App Router transitions
      capture_pageleave: true,
      autocapture: false, // Disabled DOM click/autocapture to preserve monthly event quota (1M/mo)
      respect_dnt: true,
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
        },
      },

      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          // debug mode in dev
        }
      },
    });
  }
}

export { posthog };
