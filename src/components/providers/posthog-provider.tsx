"use client";

import { useEffect, useState } from "react";
import { initPostHog } from "@/lib/posthog-client";
import { PostHogPageViewTracker } from "@/components/analytics/page-view-tracker";

import { analyticsAllowed, CONSENT_EVENT } from "@/lib/analytics-consent";
import { CookieConsent } from "./cookie-consent";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const update = () => { initPostHog(); setEnabled(analyticsAllowed()); };
    update();
    window.addEventListener(CONSENT_EVENT, update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener(CONSENT_EVENT, update); window.removeEventListener("storage", update); };
  }, []);

  return (
    <>
      {enabled && <PostHogPageViewTracker />}
      <CookieConsent />
      {children}
    </>
  );
}
