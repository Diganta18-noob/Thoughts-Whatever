import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { consumeResetToken } from "@/lib/password-reset";
import { hashPassword } from "@/lib/auth";
import { auditAuthAction } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Rate limit by IP: max 10 requests per 15 minutes
  const limiter = rateLimit(`reset:ip:${ip}`, { windowMs: 15 * 60 * 1000, max: 10 });
  if (!limiter.success) {
    return NextResponse.json(
      { ok: false, error: "Too many password reset attempts. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((limiter.reset - Date.now()) / 1000).toString(),
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

  const parsed = resetPasswordSchema.safeParse(payload);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid token or password.";
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 400 });
  }

  try {
    const tokenResult = await consumeResetToken(parsed.data.token);

    if (!tokenResult.ok) {
      if (tokenResult.reason === "already-used") {
        await auditAuthAction("reset_password_failed", { reason: "token_already_used" });
        return NextResponse.json(
          {
            ok: false,
            error: "This password reset link has already been used. Please request a new one.",
            code: "TOKEN_ALREADY_USED",
          },
          { status: 400 }
        );
      }

      if (tokenResult.reason === "expired") {
        await auditAuthAction("reset_password_failed", { reason: "token_expired" });
        return NextResponse.json(
          {
            ok: false,
            error: "This password reset link has expired. Please request a new one.",
            code: "TOKEN_EXPIRED",
          },
          { status: 400 }
        );
      }

      await auditAuthAction("reset_password_failed", { reason: "token_invalid" });
      return NextResponse.json(
        {
          ok: false,
          error: "This password reset link is invalid. Please request a new one.",
          code: "TOKEN_INVALID",
        },
        { status: 400 }
      );
    }

    const { user, tokenRecord } = tokenResult;
    const newHash = await hashPassword(parsed.data.password);

    // Atomic 3-statement transaction: update password, mark token used, revoke all refresh tokens
    await prisma.$transaction([
      prisma.adminUser.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: new Date() },
      }),
      prisma.refreshToken.updateMany({
        where: { adminUserId: user.id },
        data: { revoked: true },
      }),
    ]);

    await auditAuthAction("reset_password", {
      adminId: user.id,
      adminEmail: user.email,
    });

    return NextResponse.json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (err: any) {
    console.error("[ResetPassword] Error processing password update:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to reset password. Please try again later.",
      },
      { status: 500 }
    );
  }
}
