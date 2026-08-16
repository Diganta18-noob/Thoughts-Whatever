import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { getSiteName } from "./transliterate";

export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Thoughts Whatever",
  nameBn: "Thoughts Whatever",
  nameEn: "Thoughts Whatever",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM ||
    "https://www.instagram.com/thoughts.whatever_/",
  tagline: "বাংলা সাহিত্য, পাঠ ও তথ্যচিত্র",
  taglineEn: "Bengali literature, close reading, and documentary",
} as const;

/** Absolute URL — needed for OG tags, JSON-LD, and sitemaps. */
export function absoluteUrl(path = "") {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Pull the shortcode out of an Instagram reel or post URL.
 * Accepts /reel/, /reels/, /p/, and /tv/ with or without query strings.
 */
export function instagramShortcode(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

/** YouTube video id from watch, youtu.be, embed, or shorts URLs. */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return match?.[1] ?? null;
}

/**
 * Executes a promise with a timeout fallback, preventing static build lockups
 * during connection pool contention or database delays.
 *
 * Degradation is logged here rather than at the call site, because here is the
 * only place that still knows why the fallback is being used. Callers cannot
 * tell: this never rejects, so `Promise.allSettled` around it always reports
 * `fulfilled` and a `res.status === "rejected"` check is dead code. A silent
 * empty fallback is exactly what hid a 9 MB query for weeks — the whole point
 * of logging it is that the next such regression shows up in the server log
 * instead of looking like an empty section.
 *
 * `label` names the query in that log. It is optional so the ~20 existing call
 * sites keep working; an unlabelled failure still logs its error, which is the
 * part that carries a stack.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  fallback: T,
  ms = 5000,
  label = "query",
): Promise<T> {
  // Cleared in `finally` below: an uncleared timer keeps the event loop alive
  // for up to `ms` after the response is already sent.
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => {
          console.error(`[withTimeout] ${label} exceeded ${ms}ms — serving fallback`);
          resolve(fallback);
        }, ms);
      }),
    ]);
  } catch (error) {
    console.error(`[withTimeout] ${label} failed — serving fallback:`, error);
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
