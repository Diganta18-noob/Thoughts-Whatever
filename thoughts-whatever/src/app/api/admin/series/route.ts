import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody, revalidateTaxonomy } from "@/lib/admin-api";
import { isSlugTaken } from "@/lib/admin-pieces";
import { seriesInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, seriesInputSchema);
  if ("response" in body) return body.response;

  try {
    const series = await prisma.series.create({
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
    return ok({ id: series.id, slug: series.slug });
  } catch (error) {
    if (isSlugTaken(error)) return fail("এই স্লাগটি আগেই ব্যবহার হয়েছে।", 409);
    console.error("create series failed", error);
    return fail("সংরক্ষণ করা যায়নি।", 500);
  }
}
