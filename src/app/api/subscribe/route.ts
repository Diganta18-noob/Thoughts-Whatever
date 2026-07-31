import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subscribeSchema } from "@/lib/validation";

/**
 * চিঠি signup.
 *
 * Two deliberate choices:
 *
 * 1. An already-subscribed address gets the same cheerful reply as a new one.
 *    Telling a stranger "this email is already on the list" turns the form into
 *    a way to test whether someone reads this site.
 * 2. A previously unsubscribed address that signs up again is reinstated rather
 *    than rejected — coming back is a normal thing readers do.
 *
 * Every reply carries a `code`. The browser picks the sentence to show from it,
 * because only the browser knows which language the interface is in; there is
 * one success code whatever the address's history, so the code leaks no more
 * than the message did. `messageBn` stays on the wire for anything reading this
 * endpoint without a UI.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
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
        // Signing up again after leaving puts them back on the list.
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
