import { normalizeMime } from "@/lib/images";

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

/** The endpoint must never redirect to itself. */
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

  const isUrl = /^https?:\/\//i.test(value) || value.startsWith("/");
  if (!isUrl || isSelfReference(value)) return { kind: "missing" };

  return { kind: "remote", url: value };
}
