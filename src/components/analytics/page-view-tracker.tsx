"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, Suspense } from "react";
import { posthog } from "@/lib/posthog-client";

function PostHogPageViewTrackerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    let url = window.origin + pathname;
    const searchString = searchParams?.toString();
    if (searchString) {
      url += `?${searchString}`;
    }

    if (lastTrackedPath.current === url) return;
    lastTrackedPath.current = url;

    // Content type detection
    let contentType = "general";
    if (pathname === "/") contentType = "home";
    else if (pathname.startsWith("/documentary/")) contentType = "documentary";
    else if (pathname.startsWith("/series/")) contentType = "series";
    else if (pathname.startsWith("/writing/")) contentType = "rachana";
    else if (pathname.startsWith("/blog/")) contentType = "blog";
    else if (pathname.startsWith("/search")) contentType = "search";
    else if (pathname.startsWith("/archive")) contentType = "archive";
    else if (pathname.startsWith("/admin")) contentType = "admin";

    posthog.capture("$pageview", {
      $current_url: url,
      pathname,
      content_type: contentType,
      theme: document.documentElement.dataset.theme || "cream",
      locale: document.documentElement.lang || "en",
    });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogPageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViewTrackerContent />
    </Suspense>
  );
}
