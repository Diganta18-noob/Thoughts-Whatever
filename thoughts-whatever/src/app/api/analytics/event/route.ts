import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pieceId, eventType, sessionId, referrer, metadata } = body;

    if (!eventType || !sessionId) {
      return NextResponse.json({ error: "Missing required event fields" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || undefined;

    await prisma.analyticsEvent.create({
      data: {
        pieceId: pieceId || null,
        eventType,
        sessionId,
        referrer: referrer || null,
        userAgent: userAgent || null,
        metadata: metadata || undefined,
      },
    });

    // Also update overall view count on piece if view event
    if (eventType === "view" && pieceId) {
      await prisma.piece.update({
        where: { id: pieceId },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to store analytics event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
