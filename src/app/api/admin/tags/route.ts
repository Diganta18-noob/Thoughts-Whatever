import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody, revalidateTaxonomy } from "@/lib/admin-api";
import { isSlugTaken } from "@/lib/admin-pieces";
import { tagInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, tagInputSchema);
  if ("response" in body) return body.response;

  try {
    const tag = await prisma.tag.create({
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
    console.error("create tag failed", error);
    return fail("Could not save.", 500);
  }
}
