import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody, revalidateTaxonomy } from "@/lib/admin-api";
import { isSlugTaken } from "@/lib/admin-pieces";
import { authorInputSchema } from "@/lib/validation";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, authorInputSchema);
  if ("response" in body) return body.response;

  const before = await prisma.author.findUnique({
    where: { id: params.id },
    select: { slug: true },
  });
  if (!before) return fail("এই নামটি পাওয়া যায়নি।", 404);

  try {
    const author = await prisma.author.update({
      where: { id: params.id },
      data: {
        slug: body.data.slug,
        nameBn: body.data.nameBn,
        nameEn: body.data.nameEn ?? null,
        era: body.data.era ?? null,
        bioBn: body.data.bioBn ?? null,
        portrait: body.data.portrait ?? null,
      },
      select: { id: true, slug: true },
    });

    revalidateTaxonomy();
    revalidatePath(`/authors/${author.slug}`);
    if (before.slug !== author.slug) revalidatePath(`/authors/${before.slug}`);

    return ok({ id: author.id, slug: author.slug });
  } catch (error) {
    if (isSlugTaken(error)) return fail("এই স্লাগটি আগেই ব্যবহার হয়েছে।", 409);
    console.error("update author failed", error);
    return fail("সংরক্ষণ করা যায়নি।", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const author = await prisma.author.findUnique({
    where: { id: params.id },
    select: { slug: true, _count: { select: { pieces: true } } },
  });
  if (!author) return fail("এই নামটি পাওয়া যায়নি।", 404);

  // Deleting would silently strip the name off every piece it is on. Better to
  // refuse and let the publisher unpick it deliberately.
  if (author._count.pieces > 0) {
    return fail(
      `এই নামটি ${author._count.pieces}টি লেখায় আছে — আগে সেগুলো থেকে সরান।`,
      409,
    );
  }

  await prisma.author.delete({ where: { id: params.id } });
  revalidateTaxonomy();
  revalidatePath(`/authors/${author.slug}`);

  return ok();
}
