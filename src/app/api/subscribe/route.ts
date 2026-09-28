import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscribeSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendMail } from "@/lib/mailer";
import { letterConfirmationUrl } from "@/lib/letter-confirmation";

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
      code: "checkInbox",
      messageBn: "নতুন হলে নিশ্চিত করার লিংকটি ইমেলে দেখুন।",
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

  let subscriberId: string;
  let needsConfirmation: boolean;
  try {
    const existing = await prisma.subscriber.findUnique({
      where: { email },
      select: { id: true, confirmed: true, unsubscribedAt: true },
    });
    const subscriber = await prisma.subscriber.upsert({
      where: { email },
      create: {
        email,
        nameBn: parsed.data.nameBn ?? null,
        source: parsed.data.source ?? null,
      },
      update: {
        unsubscribedAt: null,
        ...(existing?.unsubscribedAt ? { confirmed: false, confirmedAt: null } : {}),
        ...(parsed.data.nameBn ? { nameBn: parsed.data.nameBn } : {}),
      },
    });
    subscriberId = subscriber.id;
    needsConfirmation = !existing?.confirmed || !!existing.unsubscribedAt;
  } catch (error) {
    console.error("[Subscribe API] Subscriber storage failure:", error);
    return NextResponse.json({ ok: false, code: "saveFailed", messageBn: "এখন সংরক্ষণ করা যাচ্ছে না। একটু পরে চেষ্টা করুন।" }, { status: 500 });
  }

  if (needsConfirmation) {
    try {
      const confirmationUrl = letterConfirmationUrl(subscriberId);
      await sendMail({
        to: email,
        subject: "Confirm your Thoughts Whatever letter subscription",
        text: `Please confirm your email to receive The Letter:\n\n${confirmationUrl}\n\nThis link expires in 48 hours. If you did not sign up, ignore this message.`,
        html: `<p>Please confirm your email to receive The Letter.</p><p><a href="${confirmationUrl}">Confirm subscription</a></p><p>This link expires in 48 hours. If you did not sign up, ignore this message.</p>`,
      });
    } catch (error) {
      console.error("[Subscribe API] Confirmation delivery failure:", error);
      return NextResponse.json({ ok: false, code: "sendFailed", messageBn: "এখন নিশ্চিতকরণ ইমেল পাঠানো যাচ্ছে না। একটু পরে চেষ্টা করুন।" }, { status: 503 });
    }
  }

  // Uniform enumeration-safe success response
  return NextResponse.json({
    ok: true,
    code: "checkInbox",
    messageBn: "নতুন হলে নিশ্চিত করার লিংকটি ইমেলে দেখুন।",
  });
}

