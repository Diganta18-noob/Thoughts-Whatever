import { prisma } from "@/lib/prisma";
import { guard, ok, fail } from "@/lib/admin-api";
import { TakedownStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function GET() {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  try {
    const claims = await prisma.referenceTakedownClaim.findMany({
      orderBy: { createdAt: "desc" },
    });

    return ok({ claims });
  } catch (error) {
    console.error("[ADMIN_CLAIMS_GET_ERROR]", error);
    return fail("আপত্তি তালিকা লোড করা যায়নি।", 500);
  }
}

export async function PATCH(request: Request) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  try {
    const json = await request.json();
    const { claimId, status, adminNotes } = json;

    if (!claimId || !status || !Object.values(TakedownStatus).includes(status)) {
      return fail("অবৈধ অনুরোধ।", 400);
    }

    const updated = await prisma.referenceTakedownClaim.update({
      where: { id: claimId },
      data: {
        status,
        adminNotes: adminNotes ?? undefined,
        resolvedAt: status === "RESOLVED" || status === "REJECTED" ? new Date() : null,
      },
    });

    return ok({ claim: updated });
  } catch (error) {
    console.error("[ADMIN_CLAIMS_PATCH_ERROR]", error);
    return fail("আপত্তি স্থিতি আপডেট করা যায়নি।", 500);
  }
}
