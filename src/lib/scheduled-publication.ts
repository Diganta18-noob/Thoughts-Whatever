import { prisma } from "@/lib/prisma";
import { revalidatePiece } from "@/lib/admin-api";

/** Idempotent across overlapping cron invocations. */
export async function publishDuePieces(now = new Date()) {
  const due = await prisma.piece.findMany({
    where: { status: "DRAFT", reviewStatus: "scheduled", publishedAt: { lte: now } },
    select: { id: true, kind: true, slug: true },
    take: 100,
    orderBy: { publishedAt: "asc" },
  });
  let published = 0;
  for (const piece of due) {
    const claimed = await prisma.piece.updateMany({
      where: { id: piece.id, status: "DRAFT", reviewStatus: "scheduled", publishedAt: { lte: now } },
      data: { status: "PUBLISHED", reviewStatus: "published", previewToken: null, previewExpiresAt: null },
    });
    if (claimed.count) {
      published++;
      revalidatePiece({ kind: piece.kind, slug: piece.slug });
    }
  }
  return published;
}
