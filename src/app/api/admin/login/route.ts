import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { issueAuthCookies, hashPassword, verifyPassword } from "@/lib/auth";
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

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1200): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return withRetry(fn, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
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
      { ok: false, error: "Please enter a valid email and password." },
      { status: 400 },
    );
  }

  try {
    const email = parsed.data.email.trim().toLowerCase();
    const admin = await withRetry(() => prisma.adminUser.findUnique({ where: { email } }));

    const valid = admin
      ? await verifyPassword(parsed.data.password, admin.passwordHash)
      : await verifyPassword(parsed.data.password, await throwawayHash());

    if (!admin || !valid) {
      return NextResponse.json(
        { ok: false, error: "Invalid email or password." },
        { status: 401 },
      );
    }

    const userAgent = request.headers.get("user-agent") || undefined;
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

    await issueAuthCookies(admin.id, admin.email, { userAgent, ipAddress });

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Login API route error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Server error. Please try again later.",
      },
      { status: 500 },
    );
  }
}
