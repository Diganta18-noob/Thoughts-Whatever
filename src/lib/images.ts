import { absoluteUrl } from "@/lib/utils";

export type CoverOwner = "piece" | "series";

function fingerprint(value: string): string {
  const sample = `${value.length}|${value.slice(0, 64)}|${value.slice(-64)}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < sample.length; i += 1) {
    hash ^= sample.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function coverSrc(
  owner: CoverOwner,
  slug: string,
  coverImage?: string | null,
): string | null {
  const value = coverImage?.trim();
  if (!value) {
    return `/api/cover/${owner}/${encodeURIComponent(slug)}`;
  }
  if (!value.startsWith("data:")) return value;
  return `/api/cover/${owner}/${encodeURIComponent(slug)}?v=${fingerprint(value)}`;
}

function absolutize(src: string): string {
  return src.startsWith("/") ? absoluteUrl(src) : src;
}

export function absoluteCoverUrl(
  owner: CoverOwner,
  slug: string,
  coverImage?: string | null,
): string | null {
  const src = coverSrc(owner, slug, coverImage);
  return src ? absolutize(src) : null;
}

export function absoluteImageUrl(src?: string | null): string | null {
  const value = src?.trim();
  if (!value || value.startsWith("data:")) return null;
  return absolutize(value);
}

const DATA_MIME = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,/i;

const MIME_ALIASES: Record<string, string> = {
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
};

export function normalizeMime(mime: string): string {
  const value = mime.trim().toLowerCase();
  return MIME_ALIASES[value] ?? value;
}

const EXTENSION_MIME: Record<string, string> = {
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export function coverMime(coverImage?: string | null): string {
  const value = coverImage?.trim() ?? "";
  const data = DATA_MIME.exec(value);
  if (data) return normalizeMime(data[1]!);

  const extension = value.split(/[?#]/)[0]!.split(".").pop()?.toLowerCase();
  return (extension && EXTENSION_MIME[extension]) || "image/jpeg";
}

const REMOTE_PATTERNS: { exact?: string; suffix?: string }[] = [
  { suffix: ".cdninstagram.com" },
  { suffix: ".fbcdn.net" },
  { exact: "i.ytimg.com" },
  { exact: "images.unsplash.com" },
];

export function isOptimizable(src: string): boolean {
  if (src.startsWith("/")) return true;

  try {
    const { hostname, protocol } = new URL(src);
    if (protocol !== "https:") return false;
    return REMOTE_PATTERNS.some(
      (pattern) =>
        (pattern.exact && hostname === pattern.exact) ||
        (pattern.suffix && hostname.endsWith(pattern.suffix)),
    );
  } catch {
    return false;
  }
}
