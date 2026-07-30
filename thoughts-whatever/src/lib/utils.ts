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
