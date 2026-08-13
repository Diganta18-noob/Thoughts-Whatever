import { auditPieceAction } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody, revalidatePiece } from "@/lib/admin-api";
import { createPiece, isSlugTaken } from "@/lib/admin-pieces";
import { pieceInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, pieceInputSchema);
  if ("response" in body) return body.response;

  try {
    const piece = await createPiece(body.data);
    revalidatePiece({ kind: piece.kind, slug: piece.slug });
    return ok({ id: piece.id, slug: piece.slug });
  } catch (error) {
    if (isSlugTaken(error)) {
      return fail("This slug is already taken.", 409);
    }
    console.error("createPiece failed", error);
    return fail("Could not save.", 500);
  }
}

/** The editor's own list view: drafts included, bodies excluded. */
export async function GET(request: Request) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  const pieces = await prisma.piece.findMany({
    where: q
      ? {
          OR: [
            { titleBn: { contains: q } },
            { titleEn: { contains: q, mode: "insensitive" } },
            { slug: { contains: q } },
          ],
        }
      : undefined,
    select: {
      id: true,
      slug: true,
      kind: true,
      status: true,
      titleBn: true,
      publishedAt: true,
      updatedAt: true,
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
  });

  return ok({ pieces });
}
