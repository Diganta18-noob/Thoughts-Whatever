import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody, revalidatePiece } from "@/lib/admin-api";
import { isSlugTaken, updatePiece } from "@/lib/admin-pieces";
import { pieceInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, pieceInputSchema);
  if ("response" in body) return body.response;

  // Read the old slug and kind first: after the update they are gone, and both
  // old URLs need their caches cleared or a renamed piece stays live at two
  // addresses until the next revalidation window.
  const before = await prisma.piece.findUnique({
    where: { id: params.id },
    select: { slug: true, kind: true },
  });
  if (!before) return fail("লেখাটি পাওয়া যায়নি।", 404);

  try {
    const piece = await updatePiece(params.id, body.data);
    revalidatePiece({
      kind: piece.kind,
      slug: piece.slug,
      previousSlug: before.slug,
      previousKind: before.kind,
    });
    return ok({ id: piece.id, slug: piece.slug });
  } catch (error) {
    if (isSlugTaken(error)) {
      return fail("এই স্লাগটি অন্য একটি লেখায় ব্যবহার হয়েছে।", 409);
    }
    console.error("updatePiece failed", error);
    return fail("সংরক্ষণ করা যায়নি।", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const piece = await prisma.piece.findUnique({
    where: { id: params.id },
    select: { slug: true, kind: true },
  });
  if (!piece) return fail("লেখাটি পাওয়া যায়নি।", 404);

  await prisma.piece.delete({ where: { id: params.id } });
  revalidatePiece({ kind: piece.kind, slug: piece.slug });

  return ok();
}
