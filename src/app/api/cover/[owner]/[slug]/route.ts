import { prisma } from "@/lib/prisma";
import { normalizeMime } from "@/lib/images";

const DATA_URI = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.*)$/is;

const MISS = {
  status: 404,
  headers: { "Cache-Control": "public, max-age=60" },
} as const;

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
  if (!stored) return new Response(null, MISS);

  const match = DATA_URI.exec(stored.trim());
  if (!match) return new Response(null, MISS);

  const [, mime, base64] = match;
  const type = normalizeMime(mime!);
  if (!type.startsWith("image/")) return new Response(null, MISS);

  const bytes = Buffer.from(base64!, "base64");
  if (bytes.byteLength === 0) return new Response(null, MISS);

  return new Response(bytes, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
