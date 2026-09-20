import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody } from "@/lib/admin-api";
import { referenceAssetInputSchema } from "@/lib/validation/reference";
import { validateHostingRights } from "@/lib/reference/rights-engine";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, referenceAssetInputSchema);
  if ("response" in body) return body.response;

  try {
    const work = await prisma.referenceWork.findUnique({
      where: { id: params.id },
      include: {
        editions: {
          include: { rights: true },
        },
      },
    });

    if (!work || !work.editions[0]) {
      return fail("রেফারেন্স সংস্করণ পাওয়া যায়নি।", 404);
    }

    const edition = work.editions[0];
    const rightsStatus = edition.rights?.status || "RIGHTS_UNVERIFIED";

    // Enforce Rights Invariant on asset upload/registration:
    try {
      validateHostingRights("THOUGHTS_WHATEVER", rightsStatus);
    } catch (err: any) {
      return fail(
        err.message ||
          "ডিজিটাল ফাইল যুক্ত করার পূর্বে স্বত্ব পাবলিক ডোমেইন বা অনুমোদিত (Licensed) হতে হবে।",
        422,
      );
    }

    const asset = await prisma.referenceAsset.create({
      data: {
        editionId: edition.id,
        kind: body.data.kind,
        title: body.data.title,
        fileUrl: body.data.fileUrl,
        mimeType: body.data.mimeType || null,
        sizeBytes: body.data.sizeBytes ? BigInt(body.data.sizeBytes) : null,
        durationSec: body.data.durationSec || null,
        transcriptText: body.data.transcriptText || null,
        narrator: body.data.narrator || null,
        isDownloadable: body.data.isDownloadable,
        isOnlineReadable: body.data.isOnlineReadable,
      },
    });

    // Ensure edition hostingMode is THOUGHTS_WHATEVER now that verified assets exist
    if (edition.hostingMode !== "THOUGHTS_WHATEVER") {
      await prisma.referenceEdition.update({
        where: { id: edition.id },
        data: { hostingMode: "THOUGHTS_WHATEVER" },
      });
    }

    return ok({
      asset: {
        ...asset,
        sizeBytes: asset.sizeBytes ? Number(asset.sizeBytes) : null,
      },
    });
  } catch (error) {
    console.error("[ADMIN_REFERENCE_ASSET_ADD_ERROR]", error);
    return fail("ডিজিটাল ফাইল সংরক্ষণ করা সম্ভব হয়নি।", 500);
  }
}
