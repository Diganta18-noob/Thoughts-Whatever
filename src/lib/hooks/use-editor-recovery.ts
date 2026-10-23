"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Recovery<T> = { version: 1; savedAt: number; value: T };

/** Browser-only safety copy. This hook never sends content to the server. */
export function useEditorRecovery<T>(key: string, value: T, dirty: boolean, validate: (value: unknown) => value is T) {
  const [recovered, setRecovered] = useState<Recovery<T> | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef({ value, dirty });
  const blocked = useRef(false);
  const committed = useRef<string | null>(null);
  const validator = useRef(validate);
  useEffect(() => { latest.current = { value, dirty }; validator.current = validate; });

  const flush = useCallback(() => {
    const current = latest.current;
    if (!current.dirty || blocked.current || JSON.stringify(current.value) === committed.current) return;
    try {
      const timestamp = Date.now();
      localStorage.setItem(key, JSON.stringify({ version: 1, savedAt: timestamp, value: current.value }));
      setSavedAt(timestamp);
      setError(null);
    } catch {
      setError("Browser recovery is unavailable. Save your work to the server before leaving.");
    }
  }, [key]);

  useEffect(() => {
    blocked.current = false;
    committed.current = null;
    setRecovered(null);
    setSavedAt(null);
    setError(null);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const draft: unknown = JSON.parse(raw);
        const record = draft as Partial<Recovery<unknown>> | null;
        if (!record || record.version !== 1 || typeof record.savedAt !== "number" || !Number.isFinite(record.savedAt) || !validator.current(record.value)) {
          throw new Error("Invalid draft");
        }
        blocked.current = true;
        setRecovered(record as Recovery<T>);
      }
    } catch {
      setError("The browser recovery copy could not be read. Your saved server version is unchanged.");
    }
    const onHidden = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [key, flush]);

  useEffect(() => {
    if (!dirty || recovered) return;
    const timer = window.setTimeout(flush, 500);
    return () => window.clearTimeout(timer);
  }, [value, dirty, recovered, flush]);

  const remove = () => {
    try { localStorage.removeItem(key); setError(null); }
    catch { setError("The recovery copy could not be removed from this browser."); }
    blocked.current = false;
    setRecovered(null);
    setSavedAt(null);
  };

  return {
    recovered, savedAt, error,
    restore: () => { blocked.current = false; setRecovered(null); return recovered?.value; },
    discard: remove,
    commit: () => { committed.current = JSON.stringify(latest.current.value); remove(); },
  };
}
