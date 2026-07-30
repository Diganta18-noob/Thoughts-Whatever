import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody, revalidateTaxonomy } from "@/lib/admin-api";
import { isSlugTaken } from "@/lib/admin-pieces";
import { seriesInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, seriesInputSchema);
  if ("response" in body) return body.response;

  const before = await prisma.series.findUnique({
    where: { id: params.id },
    select: { slug: true },
  });
  if (!before) return fail("ধারাবাহিকটি পাওয়া যায়নি।", 404);

  try {
    const series = await prisma.series.update({
      where: { id: params.id },
      data: {
        slug: body.data.slug,
        titleBn: body.data.titleBn,
        titleEn: body.data.titleEn ?? null,
        descBn: body.data.descBn ?? null,
        coverImage: body.data.coverImage ?? null,
      },
      select: { id: true, slug: true },
    });

    revalidateTaxonomy();
    revalidatePath(`/series/${series.slug}`);
    if (before.slug !== series.slug) revalidatePath(`/series/${before.slug}`);

    return ok({ id: series.id, slug: series.slug });
  } catch (error) {
    if (isSlugTaken(error)) return fail("এই স্লাগটি আগেই ব্যবহার হয়েছে।", 409);
    console.error("update series failed", error);
    return fail("সংরক্ষণ করা যায়নি।", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const series = await prisma.series.findUnique({
    where: { id: params.id },
    select: { slug: true, _count: { select: { pieces: true } } },
  });
  if (!series) return fail("ধারাবাহিকটি পাওয়া যায়নি।", 404);

  // `onDelete: SetNull` in the schema means the pieces survive — but they lose
  // their ordering and the prev/next links between them, which is a bigger loss
  // than it looks. Ask first.
  if (series._count.pieces > 0) {
    return fail(
      `এই ধারাবাহিকে ${series._count.pieces}টি লেখা আছে — আগে সেগুলো সরান।`,
      409,
    );
  }

  await prisma.series.delete({ where: { id: params.id } });
  revalidateTaxonomy();
  revalidatePath(`/series/${series.slug}`);

  return ok();
}
