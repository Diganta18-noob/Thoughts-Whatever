import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PUBLISHED } from "@/lib/pieces";
import { bengaliSearchKey } from "@/lib/bengali";
import { deriveExcerpt } from "@/lib/markdown";

/**
 * The whole search index as one JSON payload.
 *
 * Search runs in the browser against this file rather than as a query per
 * keystroke. For a corpus in the hundreds that is faster, cheaper, and — the
 * real reason — it means the fuzzy Bengali matching can be as expensive as it
 * needs to be without a round trip.
 *
 * The consonant skeleton is computed here, not in the browser, so the client
 * does not fold the same few hundred strings on every page load.
 */

export const revalidate = 300;

export async function GET() {
  const pieces = await prisma.piece.findMany({
    where: PUBLISHED,
    select: {
      slug: true,
      kind: true,
      titleBn: true,
      titleEn: true,
      dekBn: true,
      excerptBn: true,
      bodyBn: true,
      readingMinutes: true,
      tags: { select: { labelBn: true } },
      authors: { select: { nameBn: true } },
    },
    orderBy: [{ publishedAt: "desc" }],
  });

  const docs = pieces.map((piece) => {
    const tagsText = piece.tags.map((t) => t.labelBn).join(" ");
    const authorsText = piece.authors.map((a) => a.nameBn).join(" ");

    return {
      slug: piece.slug,
      kind: piece.kind,
      titleBn: piece.titleBn,
      titleEn: piece.titleEn,
      excerptBn:
        piece.dekBn || piece.excerptBn || deriveExcerpt(piece.bodyBn, 150),
      tagsText,
      authorsText,
      readingMinutes: piece.readingMinutes,
      key: bengaliSearchKey(
        `${piece.titleBn} ${piece.titleEn ?? ""} ${authorsText} ${tagsText}`,
      ),
    };
  });

  return NextResponse.json(docs, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
