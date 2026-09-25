import { prisma } from "@/lib/prisma";
import { guard, ok, fail } from "@/lib/admin-api";
import { validateHostingRights } from "@/lib/reference/rights-engine";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  try {
    const work = await prisma.referenceWork.findUnique({
      where: { id: params.id },
      include: {
        author: true,
        editions: {
          include: {
            rights: true,
            sources: true,
            assets: true,
            rightsLogs: {
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!work) return fail("রেফারেন্স উপাদান খুঁজে পাওয়া যায়নি।", 404);

    const serializedWork = {
      ...work,
      editions: work.editions.map((ed) => ({
        ...ed,
        assets: ed.assets.map((a) => ({
          ...a,
          sizeBytes: a.sizeBytes ? Number(a.sizeBytes) : null,
        })),
      })),
    };

    return ok({ work: serializedWork });
  } catch (error) {
    console.error("[ADMIN_REFERENCE_ID_GET_ERROR]", error);
    return fail("তথ্য লোড করা সম্ভব হয়নি।", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  try {
    const json = await request.json();

    const existingWork = await prisma.referenceWork.findUnique({
      where: { id: params.id },
      include: {
        editions: {
          include: { rights: true },
        },
      },
    });

    if (!existingWork) return fail("রেফারেন্স উপাদান পাওয়া যায়নি।", 404);

    if (json.editionId) {
      const edition = existingWork.editions.find((e) => e.id === json.editionId);
      const editionData: any = {};
      if (json.hostingMode !== undefined) {
        if (edition && edition.rights) {
          validateHostingRights(json.hostingMode, edition.rights.status);
        }
        editionData.hostingMode = json.hostingMode;
      }
      if (json.readerManifest !== undefined) editionData.readerManifest = json.readerManifest;
      if (json.coverImage !== undefined) editionData.coverImage = json.coverImage;
      if (json.pages !== undefined) editionData.pages = json.pages;
      if (json.editor !== undefined) editionData.editor = json.editor;
      if (json.translator !== undefined) editionData.translator = json.translator;
      if (json.publisher !== undefined) editionData.publisher = json.publisher;
      if (json.publicationYear !== undefined) editionData.publicationYear = json.publicationYear;

      if (Object.keys(editionData).length > 0) {
        await prisma.referenceEdition.update({
          where: { id: json.editionId },
          data: editionData,
        });
      }
    }

    const updated = await prisma.referenceWork.update({
      where: { id: params.id },
      data: {
        titleBn: json.titleBn,
        titleEn: json.titleEn ?? null,
        subtitleBn: json.subtitleBn ?? null,
        descriptionBn: json.descriptionBn ?? null,
        type: json.type,
        language: json.language,
        era: json.era ?? null,
        subject: json.subject ?? null,
        tags: json.tags ?? [],
        featured: json.featured ?? false,
        published: json.published ?? true,
        authorId: json.authorId ?? null,
      },
      include: {
        editions: {
          include: { rights: true, sources: true },
        },
      },
    });

    return ok({ work: updated });
  } catch (error: any) {
    console.error("[ADMIN_REFERENCE_PATCH_ERROR]", error);
    return fail(error.message || "আপডেট করা সম্ভব হয়নি।", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  try {
    await prisma.referenceWork.delete({
      where: { id: params.id },
    });

    return ok({ success: true, message: "রেফারেন্স উপাদান সফলভাবে মোছা হয়েছে।" });
  } catch (error) {
    console.error("[ADMIN_REFERENCE_DELETE_ERROR]", error);
    return fail("মুছে ফেলা সম্ভব হয়নি।", 500);
  }
}
