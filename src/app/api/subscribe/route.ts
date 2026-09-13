import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscribeSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const ipLimiter = rateLimit(`subscribe:ip:${ip}`, { windowMs: 60 * 1000, max: 8 });
  if (!ipLimiter.success) {
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

  // Honeypot trap: if a bot filled the hidden website field, return synthetic success without writing to DB
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return NextResponse.json({
      ok: true,
      code: "subscribed",
      messageBn: "লেখা হয়ে গেল। মাসের চিঠি আপনার কাছে পৌঁছবে।",
    });
  }

  const email = parsed.data.email.trim().toLowerCase();

  // Secondary rate limit per email address to prevent targeted spamming
  const emailKey = Buffer.from(email).toString("hex").slice(0, 24);
  const emailLimiter = rateLimit(`subscribe:mail:${emailKey}`, { windowMs: 60 * 1000, max: 3 });
  if (!emailLimiter.success) {
    return NextResponse.json(
      { ok: false, code: "rateLimited", messageBn: "অনেকবার চেষ্টা করা হয়েছে। একটু পরে আবার চেষ্টা করুন।" },
      { status: 429 }
    );
  }

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
    console.error("[Subscribe API] Subscription processing failure:", error);
    return NextResponse.json(
      {
        ok: false,
        code: "saveFailed",
        messageBn: "এখন সংরক্ষণ করা যাচ্ছে না। একটু পরে চেষ্টা করুন।",
      },
      { status: 500 },
    );
  }

  // Uniform enumeration-safe success response
  return NextResponse.json({
    ok: true,
    code: "subscribed",
    messageBn: "লেখা হয়ে গেল। মাসের চিঠি আপনার কাছে পৌঁছবে।",
  });
}

