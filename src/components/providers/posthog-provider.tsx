"use client";

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog-client";
import { PostHogPageViewTracker } from "@/components/analytics/page-view-tracker";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <>
      <PostHogPageViewTracker />
      {children}
    </>
  );
}
