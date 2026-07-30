import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, hashPassword, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

/**
 * A wrong password and an unknown email get the same reply and the same rough
 * timing — bcrypt is run against a throwaway hash when no user matches, so the
 * response time does not reveal which addresses exist.
 */

export const runtime = "nodejs";

/**
 * Hashed once, lazily, rather than pasted in as a literal: a hand-written
 * bcrypt string that is subtly malformed makes `compare` throw instead of
 * spending the time, which is the opposite of the point.
 */
let dummyHash: Promise<string> | null = null;
function throwawayHash() {
  dummyHash ??= hashPassword("no-account-with-this-address");
  return dummyHash;
}


export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "ইমেল ও পাসওয়ার্ড ঠিকভাবে দিন।" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const admin = await prisma.adminUser.findUnique({ where: { email } });

  const valid = admin
    ? await verifyPassword(parsed.data.password, admin.passwordHash)
    : await verifyPassword(parsed.data.password, await throwawayHash());

  if (!admin || !valid) {
    return NextResponse.json(
      { ok: false, error: "ইমেল বা পাসওয়ার্ড মিলছে না।" },
      { status: 401 },
    );
  }

  await createSessionCookie({ sub: admin.id, email: admin.email });
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
