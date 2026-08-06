import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscribeSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limiter = rateLimit(`subscribe:${ip}`, { windowMs: 60 * 1000, max: 10 });
  if (!limiter.success) {
    return NextResponse.json(
      { ok: false, code: "rateLimited", messageBn: "অনেকবার চেষ্টা করা হয়েছে। একটু পরে আবার চেষ্টা করুন।" },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "unreadable", messageBn: "অনুরোধটি পড়া যাচ্ছে না।" },
      { status: 400 },
    );
  }

  const parsed = subscribeSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "invalidEmail", messageBn: "সঠিক ইমেল ঠিকানা দিন।" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    await prisma.subscriber.upsert({
      where: { email },
      create: {
        email,
        nameBn: parsed.data.nameBn ?? null,
        source: parsed.data.source ?? null,
      },
      update: {
        unsubscribedAt: null,
        ...(parsed.data.nameBn ? { nameBn: parsed.data.nameBn } : {}),
      },
    });
  } catch (error) {
    console.error("subscribe failed", error);
    return NextResponse.json(
      {
        ok: false,
        code: "saveFailed",
        messageBn: "এখন সংরক্ষণ করা যাচ্ছে না। একটু পরে চেষ্টা করুন।",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    code: "subscribed",
    messageBn: "লেখা হয়ে গেল। মাসের চিঠি আপনার কাছে পৌঁছবে।",
  });
}

