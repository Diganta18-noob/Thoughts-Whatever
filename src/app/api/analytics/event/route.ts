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
  "reference_catalogue",
  "reference_search",
  "reference_open",
  "reference_read",
  "reference_listen",
]);

const WORK_EVENTS = new Set(["reference_open", "reference_read", "reference_listen"]);

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
    const referenceWorkId = metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>).referenceWorkId
      : undefined;
    if (WORK_EVENTS.has(eventType) && (typeof referenceWorkId !== "string" || referenceWorkId.length > 100 || !referenceWorkId.trim())) {
      return NextResponse.json({ error: "Reference work id is required" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || undefined;

    // Capture edge geo headers from Vercel / Cloudflare
    const country =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      null;

    const region =
      req.headers.get("x-vercel-ip-country-region") ||
      req.headers.get("x-region") ||
      null;

    const city =
      req.headers.get("x-vercel-ip-city") ||
      req.headers.get("x-city") ||
      null;

    const eventMetadata = {
      ...(metadata && typeof metadata === "object" ? metadata : {}),
      ...(country ? { country } : {}),
      ...(region ? { region } : {}),
      ...(city ? { city } : {}),
    };

    await prisma.analyticsEvent.create({
      data: {
        pieceId: typeof pieceId === "string" && pieceId ? pieceId : null,
        eventType,
        sessionId,
        referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
        userAgent: userAgent ? userAgent.slice(0, 500) : null,
        metadata: Object.keys(eventMetadata).length > 0 ? eventMetadata : undefined,
      },
    });

    // Increment overall view count on piece if view event and pieceId is valid
    if (eventType === "view" && typeof pieceId === "string" && pieceId) {
      await prisma.piece.update({
        where: { id: pieceId },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
    }
    if (eventType === "reference_open" && typeof referenceWorkId === "string") {
      await prisma.referenceWork.update({ where: { id: referenceWorkId }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to store analytics event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
