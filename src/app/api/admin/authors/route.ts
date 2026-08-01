import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody, revalidateTaxonomy } from "@/lib/admin-api";
import { isSlugTaken } from "@/lib/admin-pieces";
import { authorInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, authorInputSchema);
  if ("response" in body) return body.response;

  try {
    const author = await prisma.author.create({
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
    return ok({ id: author.id, slug: author.slug });
  } catch (error) {
    if (isSlugTaken(error)) return fail("This slug is already taken.", 409);
    console.error("create author failed", error);
    return fail("Could not save.", 500);
  }
}
