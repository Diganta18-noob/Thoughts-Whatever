"use client";

import { useEffect, useRef } from "react";

/** Background refresh only. Initial loads and explicit refreshes stay with the caller. */
export function useAdminPolling(refresh: () => void | Promise<void>, intervalMs: number, enabled = true) {
  const latest = useRef(refresh);
  const running = useRef(false);
  useEffect(() => { latest.current = refresh; }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== "visible" || !navigator.onLine || running.current) return;
      running.current = true;
      try {
        await latest.current();
      } catch {
        // Callers own error feedback. A rejected refresh must not stop future ticks.
      } finally {
        running.current = false;
      }
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, enabled]);
}
