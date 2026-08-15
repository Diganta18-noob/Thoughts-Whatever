import { prisma } from "@/lib/prisma";
import { resolveCover } from "@/lib/cover-resolver";

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

export async function GET(
  _request: Request,
  { params }: { params: { owner: string; slug: string } },
) {
  const stored = await findCover(params.owner, params.slug);
  const resolved = resolveCover(stored);

  if (resolved.kind === "missing") return new Response(null, MISS);

  if (resolved.kind === "remote") {
    return new Response(null, {
      status: 307,
      headers: {
        Location: resolved.url,
        "Cache-Control": IMMUTABLE,
        "CDN-Cache-Control": IMMUTABLE,
      },
    });
  }

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
