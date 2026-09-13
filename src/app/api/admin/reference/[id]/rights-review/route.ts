import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody } from "@/lib/admin-api";
import { referenceRightsReviewInputSchema } from "@/lib/validation/reference";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, referenceRightsReviewInputSchema);
  if ("response" in body) return body.response;

  const { newStatus, reason, notes, evidenceUrl, license, rightsHolder } =
    body.data;

  try {
    const work = await prisma.referenceWork.findUnique({
      where: { id: params.id },
      include: {
        editions: {
          include: { rights: true },
        },
      },
    });

    if (!work) return fail("রেফারেন্স উপাদান পাওয়া যায়নি।", 404);

    const edition = work.editions[0];
    if (!edition) return fail("উপাদানের কোনো সংস্করণ যুক্ত নেই।", 400);

    const previousStatus = edition.rights?.status || "RIGHTS_UNVERIFIED";

    // If downgrading to non-verified status, automatically switch hosting mode to EXTERNAL
    const shouldDowngradeHosting =
      newStatus === "RIGHTS_UNVERIFIED" ||
      newStatus === "RESTRICTED" ||
      newStatus === "EXTERNAL_SOURCE";

    const [updatedRights, auditLog] = await prisma.$transaction([
      prisma.referenceRights.upsert({
        where: { editionId: edition.id },
        create: {
          editionId: edition.id,
          status: newStatus,
          license: license || null,
          rightsHolder: rightsHolder || null,
          verificationNotes: notes || null,
          evidenceUrl: evidenceUrl || null,
          verifiedBy: gate.admin.email,
          verifiedAt: new Date(),
        },
        update: {
          status: newStatus,
          license: license ?? edition.rights?.license,
          rightsHolder: rightsHolder ?? edition.rights?.rightsHolder,
          verificationNotes: notes ?? edition.rights?.verificationNotes,
          evidenceUrl: evidenceUrl ?? edition.rights?.evidenceUrl,
          verifiedBy: gate.admin.email,
          verifiedAt: new Date(),
        },
      }),
      prisma.referenceRightsLog.create({
        data: {
          editionId: edition.id,
          previousStatus,
          newStatus,
          changedBy: gate.admin.email,
          reason,
          notes: notes || null,
          evidenceUrl: evidenceUrl || null,
        },
      }),
      ...(shouldDowngradeHosting
        ? [
            prisma.referenceEdition.update({
              where: { id: edition.id },
              data: { hostingMode: "EXTERNAL" },
            }),
          ]
        : []),
    ]);

    return ok({
      success: true,
      rights: updatedRights,
      auditLog,
      message: `স্বত্ব স্থিতি সফলভাবে '${previousStatus}' থেকে '${newStatus}' এ পরিবর্তন করা হয়েছে।`,
    });
  } catch (error) {
    console.error("[ADMIN_RIGHTS_REVIEW_ERROR]", error);
    return fail("স্বত্ব পর্যালোচনা সংরক্ষণ করা সম্ভব হয়নি।", 500);
  }
}
