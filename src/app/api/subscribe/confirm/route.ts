import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLetterConfirmationToken } from "@/lib/letter-confirmation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let token: unknown;
  try {
    token = (await request.json()).token;
  } catch {
    return NextResponse.json({ ok: false, code: "invalidConfirmation" }, { status: 400 });
  }
  const subscriberId = typeof token === "string" ? verifyLetterConfirmationToken(token) : null;
  if (!subscriberId) {
    return NextResponse.json({ ok: false, code: "invalidConfirmation" }, { status: 400 });
  }
  try {
    const updated = await prisma.subscriber.updateMany({
      where: { id: subscriberId, unsubscribedAt: null },
      data: { confirmed: true, confirmedAt: new Date() },
    });
    if (!updated.count) {
      return NextResponse.json({ ok: false, code: "invalidConfirmation" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, code: "confirmed" });
  } catch (error) {
    console.error("[Letter confirmation] Database failure:", error);
    return NextResponse.json({ ok: false, code: "saveFailed" }, { status: 503 });
  }
}
