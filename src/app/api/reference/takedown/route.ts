import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { referenceTakedownInputSchema } from "@/lib/validation/reference";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = referenceTakedownInputSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "প্রদত্ত তথ্যে ত্রুটি রয়েছে।", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const {
      workSlug,
      resourceTitle,
      claimantName,
      claimantEmail,
      reason,
      supportingUrl,
      message,
    } = result.data;

    const claim = await prisma.referenceTakedownClaim.create({
      data: {
        workSlug: workSlug || null,
        resourceTitle,
        claimantName,
        claimantEmail,
        reason,
        supportingUrl: supportingUrl || null,
        message,
        status: "OPEN",
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "আপনার কপিরাইট বা স্বত্ব সংক্রান্ত আপত্তি সফলভাবে নথিভুক্ত হয়েছে। আমাদের সম্পাদকীয় ও আইনি দল বিষয়টি পর্যবেক্ষণ করবে।",
      claimId: claim.id,
    });
  } catch (error) {
    console.error("[REFERENCE_TAKEDOWN_ERROR]", error);
    return NextResponse.json(
      { error: "আপত্তি জমা দেওয়া সম্ভব হয়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।" },
      { status: 500 },
    );
  }
}
