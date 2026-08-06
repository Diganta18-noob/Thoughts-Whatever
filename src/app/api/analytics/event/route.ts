import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_EVENT_TYPES = new Set([
  "view",
  "scroll_25",
  "scroll_50",
  "scroll_75",
  "scroll_100",
  "instagram_click",
  "reel_click",
  "ping",
]);

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const limiter = rateLimit(`analytics:${ip}`, { windowMs: 60 * 1000, max: 60 });
  if (!limiter.success) {
    return NextResponse.json({ error: "Too many analytics events" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { pieceId, eventType, sessionId, referrer, metadata } = body;

    if (!eventType || !sessionId || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: "Invalid or missing required event fields" }, { status: 400 });
    }

    if (typeof sessionId !== "string" || sessionId.length > 100) {
      return NextResponse.json({ error: "Invalid sessionId format" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || undefined;

    await prisma.analyticsEvent.create({
      data: {
        pieceId: typeof pieceId === "string" && pieceId ? pieceId : null,
        eventType,
        sessionId,
        referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
        userAgent: userAgent ? userAgent.slice(0, 500) : null,
        metadata: metadata && typeof metadata === "object" ? metadata : undefined,
      },
    });

    // Increment overall view count on piece if view event and pieceId is valid
    if (eventType === "view" && typeof pieceId === "string" && pieceId) {
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

