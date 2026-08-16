import { absoluteUrl } from "@/lib/utils";

export type CoverOwner = "piece" | "series";

/**
 * Resolve a cover to something safe to put in the render tree.
 *
 * Legacy rows store the whole image as a base64 data URI. Returning that
 * verbatim inlines hundreds of KB into every HTML and RSC payload, and
 * `next/image` cannot optimize a `data:` URI. So any data URI is swapped for
 * the `/api/cover` path, which is CDN-cacheable, browser-cacheable, and
 * optimizable. Real URLs pass through untouched.
 */
export function coverSrc(
  owner: CoverOwner,
  slug: string,
  coverImage?: string | null,
): string {
  const proxied = `/api/cover/${owner}/${encodeURIComponent(slug)}`;
  const value = coverImage?.trim();
  if (!value) return proxied;
  if (value.startsWith("data:")) return proxied;
  return value;
}

function absolutize(src: string): string {
  return src.startsWith("/") ? absoluteUrl(src) : src;
}

/**
 * Always a URL, never null: `coverSrc` falls back to the `/api/cover` path, and
 * that endpoint answers for every slug — with bytes, or with a 404 the
 * component's `onError` turns into the placeholder. A nullable return type here
 * would push a fallback onto every caller for a case that cannot arise.
 */
export function absoluteCoverUrl(
  owner: CoverOwner,
  slug: string,
  coverImage?: string | null,
): string {
  return absolutize(coverSrc(owner, slug, coverImage));
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
  { exact: "res.cloudinary.com" },
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
