import { isOptimizable, normalizeMime } from "@/lib/images";

/**
 * `bytes` is `Buffer<ArrayBuffer>` rather than a bare `Buffer`: the default
 * `ArrayBufferLike` type parameter is not assignable to `BodyInit`, so
 * `new Response(bytes)` in the route would not typecheck.
 */
export type CoverResolution =
  | { kind: "data"; mime: string; bytes: Buffer<ArrayBuffer> }
  | { kind: "remote"; url: string }
  | { kind: "missing" };

const DATA_URI = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.*)$/is;

/**
 * The endpoint must never point at itself. It now fetches the target
 * server-side rather than redirecting, so a self-reference would recurse
 * through the function instead of merely looping in the browser.
 */
function isSelfReference(value: string): boolean {
  if (value.startsWith("/api/cover")) return true;
  try {
    return new URL(value).pathname.startsWith("/api/cover");
  } catch {
    return false;
  }
}

/**
 * Turn a stored `coverImage` column value into something servable.
 *
 * Legacy rows hold a full base64 data URI (hundreds of KB); migrated rows hold
 * a Cloudinary URL. Both shapes reach this endpoint, so both are handled here
 * rather than at each call site.
 */
export function resolveCover(stored: string | null | undefined): CoverResolution {
  const value = stored?.trim();
  if (!value) return { kind: "missing" };

  const match = DATA_URI.exec(value);
  if (match) {
    const mime = normalizeMime(match[1]!);
    if (!mime.startsWith("image/")) return { kind: "missing" };
    const bytes = Buffer.from(match[2]!, "base64");
    if (bytes.byteLength === 0) return { kind: "missing" };
    return { kind: "data", mime, bytes };
  }

  // A protocol-relative value would send this endpoint off-origin to an
  // arbitrary host, and `new URL()` cannot parse it, so the loop guard below
  // would miss it too.
  if (value.startsWith("//")) return { kind: "missing" };

  const isUrl = /^https?:\/\//i.test(value) || value.startsWith("/");
  if (!isUrl || isSelfReference(value)) return { kind: "missing" };

  return { kind: "remote", url: value };
}

/**
 * Absolute URL the cover endpoint is willing to fetch, or `null` to refuse.
 *
 * The endpoint proxies a migrated cover's bytes instead of redirecting to it,
 * which changes who performs the fetch. A 307 was safe precisely because the
 * *browser* followed it; doing it server-side means an arbitrary stored
 * `coverImage` value would make our own function issue that request. So the
 * host is checked against the same allowlist `next.config.js` permits for
 * images — a cover on any other host could not be optimized by `next/image`
 * anyway, so nothing legitimate is lost. `isOptimizable` also requires https,
 * which keeps `http://169.254.169.254/...`-style values out.
 *
 * Site-relative covers are legal (`resolveCover` classifies them as `remote`)
 * and a redirect handled them for free, but `fetch` cannot take a relative
 * URL — they are resolved against this request's own origin.
 */
export function resolveRemoteTarget(
  url: string,
  requestUrl: string,
): URL | null {
  let target: URL;
  let origin: string;
  try {
    origin = new URL(requestUrl).origin;
    target = new URL(url, requestUrl);
  } catch {
    return null;
  }

  // Re-check after resolution: `/api/cover/x` and a value that resolves onto
  // this endpoint are both self-references, and fetching one would recurse.
  if (isSelfReference(target.href)) return null;

  if (target.origin === origin) return target;
  return isOptimizable(target.href) ? target : null;
}
