import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const LEGACY_COOKIE_NAME = "tw_session";
const ACCESS_COOKIE_NAME = "tw_access";
const REFRESH_COOKIE_NAME = "tw_refresh";

const ACCESS_TOKEN_EXPIRY = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set it in .env — see .env.example.",
    );
  }
  return value;
}

export type AccessTokenPayload = {
  sub: string; // AdminUser id
  email: string;
  type: "access";
  exp?: number;
};

export type RefreshTokenPayload = {
  sub: string;
  type: "refresh";
  jti: string; // Refresh token DB record ID
  exp?: number;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function createAccessToken(userId: string, email: string): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    type: "access",
  };
  return jwt.sign(payload, secret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export async function createRefreshToken(
  userId: string,
  metadata: { userAgent?: string; ipAddress?: string } = {},
) {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000);
  const randomToken = crypto.randomUUID();

  const dbToken = await prisma.refreshToken.create({
    data: {
      token: randomToken,
      adminUserId: userId,
      expiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    },
  });

  const payload: RefreshTokenPayload = {
    sub: userId,
    type: "refresh",
    jti: dbToken.id,
  };

  const token = jwt.sign(payload, secret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { token, dbToken };
}

export async function issueAuthCookies(
  userId: string,
  email: string,
  metadata: { userAgent?: string; ipAddress?: string } = {},
) {
  const accessToken = createAccessToken(userId, email);
  const { token: refreshToken } = await createRefreshToken(userId, metadata);

  const cookieStore = cookies();
  const isProd = process.env.NODE_ENV === "production";

  cookieStore.set(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  cookieStore.set(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: REFRESH_TOKEN_EXPIRY,
  });

  // Clear legacy cookie if present
  cookieStore.delete(LEGACY_COOKIE_NAME);
}

export async function clearAuthCookies() {
  const cookieStore = cookies();
  const refreshTokenJwt = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  if (refreshTokenJwt) {
    try {
      const payload = jwt.verify(refreshTokenJwt, secret()) as RefreshTokenPayload;
      if (payload?.jti) {
        await prisma.refreshToken.update({
          where: { id: payload.jti },
          data: { revoked: true },
        }).catch(() => {});
      }
    } catch {
      /* ignore invalid token cleanup errors */
    }
  }

  cookieStore.delete(ACCESS_COOKIE_NAME);
  cookieStore.delete(REFRESH_COOKIE_NAME);
  cookieStore.delete(LEGACY_COOKIE_NAME);
}

export async function verifyAndRefreshAccessToken(refreshTokenJwt: string) {
  try {
    const payload = jwt.verify(refreshTokenJwt, secret()) as RefreshTokenPayload;
    if (payload.type !== "refresh" || !payload.jti) return null;

    const dbToken = await prisma.refreshToken.findUnique({
      where: { id: payload.jti },
      include: { adminUser: true },
    });

    if (!dbToken || dbToken.expiresAt < new Date()) {
      return null;
    }

    // Security: If an already-revoked token is presented, detect token theft and revoke all user tokens
    if (dbToken.revoked) {
      console.warn(`[SECURITY ALERT] Revoked refresh token reuse attempt for user ${dbToken.adminUserId}`);
      await prisma.refreshToken.updateMany({
        where: { adminUserId: dbToken.adminUserId },
        data: { revoked: true },
      });
      return null;
    }


    // Revoke current token (rotation) and create fresh token pair
    await prisma.refreshToken.update({
      where: { id: dbToken.id },
      data: { revoked: true, lastUsedAt: new Date() },
    });

    const newAccessToken = createAccessToken(
      dbToken.adminUserId,
      dbToken.adminUser.email,
    );
    const { token: newRefreshToken } = await createRefreshToken(
      dbToken.adminUserId,
      {
        userAgent: dbToken.userAgent ?? undefined,
        ipAddress: dbToken.ipAddress ?? undefined,
      },
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: dbToken.adminUser,
    };
  } catch {
    return null;
  }
}

export function readSession(): { sub: string; email: string } | null {
  const cookieStore = cookies();

  // 1. Try access token
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (accessToken) {
    try {
      const payload = jwt.verify(accessToken, secret()) as AccessTokenPayload;
      if (payload.type === "access" || !payload.type) {
        return { sub: payload.sub, email: payload.email };
      }
    } catch {
      /* token expired or invalid */
    }
  }

  // 2. Fallback to refresh token if access token is expired
  const refreshTokenJwt = cookieStore.get(REFRESH_COOKIE_NAME)?.value;
  if (refreshTokenJwt) {
    try {
      const payload = jwt.verify(refreshTokenJwt, secret()) as RefreshTokenPayload;
      if (payload.type === "refresh" && payload.sub) {
        return { sub: payload.sub, email: "" };
      }
    } catch {
      /* refresh token expired or invalid */
    }
  }

  // 3. Fallback to legacy tw_session for smooth transition
  const legacyToken = cookieStore.get(LEGACY_COOKIE_NAME)?.value;
  if (legacyToken) {
    try {
      const payload = jwt.verify(legacyToken, secret()) as { sub: string; email: string };
      return { sub: payload.sub, email: payload.email };
    } catch {
      return null;
    }
  }

  return null;
}

export async function requireAdmin() {
  const session = readSession();
  if (!session) return null;
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: session.sub },
      select: { id: true, email: true, nameBn: true },
    });
    return admin;
  } catch (err) {
    console.error("requireAdmin error:", err);
    return null;
  }
}

export {
  LEGACY_COOKIE_NAME as COOKIE_NAME,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
