import { prisma } from "@/lib/prisma";
import { resolveCover, resolveRemoteTarget } from "@/lib/cover-resolver";

// This route owns its cache headers outright: `next.config.js` excludes
// `/api/cover` from its catch-all, because config headers are appended to a
// Route Handler's own and cannot vary by status code — which would leave a 404
// carrying both `max-age=60` and a year-long `immutable`.
const MISS = {
  status: 404,
  headers: {
    "Cache-Control": "public, max-age=60",
    "CDN-Cache-Control": "public, max-age=60",
  },
} as const;

const IMMUTABLE = "public, max-age=31536000, s-maxage=31536000, immutable";

/**
 * An upstream failure must never inherit `IMMUTABLE` — caching it for a year
 * would strand a cover behind one bad fetch until the URL changed.
 */
const UPSTREAM_FAIL = {
  status: 502,
  headers: {
    "Cache-Control": "public, max-age=30",
    "CDN-Cache-Control": "public, max-age=30",
  },
} as const;

/** A hung upstream would otherwise hold the function open until the platform kills it. */
const UPSTREAM_TIMEOUT_MS = 8_000;

function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function findCover(owner: string, rawSlug: string) {
  const slug = decodeSlug(rawSlug);

  if (owner === "piece") {
    const piece = await prisma.piece.findFirst({
      where: { slug },
      select: { coverImage: true },
    });
    return piece?.coverImage ?? null;
  }

  if (owner === "series") {
    const series = await prisma.series.findFirst({
      where: { slug },
      select: { coverImage: true, pieces: { select: { coverImage: true }, take: 1 } },
    });
    if (!series) return null;
    return series.coverImage || series.pieces[0]?.coverImage || null;
  }

  return null;
}

/**
 * Stream a migrated cover's bytes through this endpoint instead of redirecting.
 *
 * A 307 here is unusable by `next/image`. Next resolves a `/`-prefixed src
 * in-process — `next/dist/server/image-optimizer.js` `fetchInternalImage`
 * invokes the handler against a mocked response and reads `res.buffers`,
 * ignoring `Location` entirely. A redirect carries no body, so the optimizer
 * sees a zero-length buffer and fails with "The requested resource isn't a
 * valid image" (verified against the installed next@14.2.35, and reproduced
 * end-to-end: bytes -> 200, 307 -> 500). Because `cardSelect` omits
 * `coverImage`, every rendered cover src is `/api/cover/...`, so that failure
 * would hit every image on the site the moment the Cloudinary migration lands.
 */
async function proxyRemote(url: string, requestUrl: string): Promise<Response> {
  const target = resolveRemoteTarget(url, requestUrl);
  if (!target) return new Response(null, MISS);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      redirect: "follow",
    });
  } catch {
    return new Response(null, UPSTREAM_FAIL);
  }

  // A 200 carrying an HTML error page must not be served as an image.
  const type = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !type.startsWith("image/")) {
    return new Response(null, UPSTREAM_FAIL);
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": IMMUTABLE,
      "CDN-Cache-Control": IMMUTABLE,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: { owner: string; slug: string } },
) {
  const stored = await findCover(params.owner, params.slug);
  const resolved = resolveCover(stored);

  if (resolved.kind === "missing") return new Response(null, MISS);

  if (resolved.kind === "remote") return proxyRemote(resolved.url, request.url);

  return new Response(resolved.bytes, {
    headers: {
      "Content-Type": resolved.mime,
      "Content-Length": String(resolved.bytes.byteLength),
      "Cache-Control": IMMUTABLE,
      "CDN-Cache-Control": IMMUTABLE,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
