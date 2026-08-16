import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { auditAuthAction } from "@/lib/audit";
import { hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

let dummyWorkHash: Promise<string> | null = null;
function performDummyWork() {
  dummyWorkHash ??= hashPassword("dummy-account-for-timing-balance");
  return dummyWorkHash;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Rate limit by IP: max 5 requests per hour
  const ipLimiter = rateLimit(`forgot:ip:${ip}`, { windowMs: 60 * 60 * 1000, max: 5 });
  if (!ipLimiter.success) {
    return NextResponse.json(
      { ok: false, error: "Too many reset requests from this IP. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((ipLimiter.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  // Rate limit by Email: max 3 requests per hour
  const emailLimiter = rateLimit(`forgot:email:${email}`, { windowMs: 60 * 60 * 1000, max: 3 });
  if (!emailLimiter.success) {
    return NextResponse.json(
      { ok: false, error: "Too many reset requests for this email. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((emailLimiter.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const userAgent = request.headers.get("user-agent") || undefined;
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

  try {
    let admin = await prisma.adminUser.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!admin && (
      (process.env.NOTIFICATION_EMAIL_TO && email === process.env.NOTIFICATION_EMAIL_TO.trim().toLowerCase()) ||
      (process.env.SMTP_USER && email === process.env.SMTP_USER.trim().toLowerCase())
    )) {
      admin = await prisma.adminUser.findFirst({
        select: { id: true, email: true },
      });
    }

    if (!admin) {
      // Burn comparable time to prevent user enumeration
      await performDummyWork();
      await auditAuthAction("forgot_password", { adminEmail: email, reason: "user_not_found" });
      return NextResponse.json({ ok: true });
    }

    const rawToken = await createResetToken(admin.id, {
      requestedIp: ipAddress,
      requestedUserAgent: userAgent,
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thoughts-whatever.vercel.app";
    const resetUrl = `${siteUrl.replace(/\/+$/, "")}/admin/reset-password?token=${rawToken}`;

    await sendPasswordResetEmail(admin.email, resetUrl);
    await auditAuthAction("forgot_password", { adminId: admin.id, adminEmail: admin.email });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[ForgotPassword] Error handling reset request:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to send reset link. Please verify SMTP configuration or try again later.",
      },
      { status: 500 }
    );
  }
}
