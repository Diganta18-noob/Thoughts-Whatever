import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody, revalidateTaxonomy } from "@/lib/admin-api";
import { isSlugTaken } from "@/lib/admin-pieces";
import { tagInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, tagInputSchema);
  if ("response" in body) return body.response;

  try {
    const tag = await prisma.tag.update({
      where: { id: params.id },
      data: {
        slug: body.data.slug,
        labelBn: body.data.labelBn,
        labelEn: body.data.labelEn ?? null,
        kind: body.data.kind,
      },
      select: { id: true, slug: true },
    });
    revalidateTaxonomy();
    return ok({ id: tag.id, slug: tag.slug });
  } catch (error) {
    if (isSlugTaken(error)) return fail("This slug is already taken.", 409);
    console.error("update tag failed", error);
    return fail("Could not save.", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const tag = await prisma.tag.findUnique({
    where: { id: params.id },
    select: { _count: { select: { pieces: true } } },
  });
  if (!tag) return fail("Tag not found.", 404);

  // A tag in use is a live filter link in the archive; removing it breaks URLs
  // readers have already shared.
  if (tag._count.pieces > 0) {
    return fail(
      `This tag is used in ${tag._count.pieces} pieces — remove it from those first.`,
      409,
    );
  }

  await prisma.tag.delete({ where: { id: params.id } });
  revalidateTaxonomy();

  return ok();
}
