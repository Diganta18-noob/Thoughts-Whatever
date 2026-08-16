import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

export type TokenVerificationResult =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
        nameBn: string | null;
      };
      tokenRecord: {
        id: string;
        tokenHash: string;
        adminUserId: string;
        expiresAt: Date;
        usedAt: Date | null;
      };
    }
  | {
      ok: false;
      reason: "not-found" | "expired" | "already-used";
    };

export function hashResetToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createResetToken(
  adminUserId: string,
  meta: { requestedIp?: string; requestedUserAgent?: string } = {},
): Promise<string> {
  // Invalidate previous unused tokens for this user so only the newest link works
  await prisma.passwordResetToken.deleteMany({
    where: {
      adminUserId,
      usedAt: null,
    },
  });

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      adminUserId,
      expiresAt,
      requestedIp: meta.requestedIp,
      requestedUserAgent: meta.requestedUserAgent,
    },
  });

  return rawToken;
}

export async function consumeResetToken(raw: string): Promise<TokenVerificationResult> {
  if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
    return { ok: false, reason: "not-found" };
  }

  const tokenHash = hashResetToken(raw.trim());

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      adminUser: {
        select: {
          id: true,
          email: true,
          nameBn: true,
        },
      },
    },
  });

  if (!record || !record.adminUser) {
    return { ok: false, reason: "not-found" };
  }

  if (record.usedAt !== null) {
    return { ok: false, reason: "already-used" };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    user: record.adminUser,
    tokenRecord: {
      id: record.id,
      tokenHash: record.tokenHash,
      adminUserId: record.adminUserId,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
    },
  };
}
