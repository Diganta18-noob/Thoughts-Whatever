import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Admin auth is deliberately small: one publisher, one password, a signed
 * httpOnly cookie. There are no reader accounts anywhere on this site —
 * bookmarks and reading preferences live in localStorage, so there is nothing
 * to log into and nothing to breach.
 */

const COOKIE_NAME = "tw_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // two weeks

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set it in .env — see .env.example.",
    );
  }
  return value;
}

export type SessionPayload = {
  sub: string; // AdminUser id
  email: string;
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: MAX_AGE_SECONDS });
}

export async function createSessionCookie(payload: SessionPayload) {
  cookies().set(COOKIE_NAME, signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySessionCookie() {
  cookies().delete(COOKIE_NAME);
}

/** Returns the session payload, or null. Never throws on a bad token. */
export function readSession(): SessionPayload | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, secret()) as SessionPayload;
  } catch {
    return null;
  }
}

/** For server components and route handlers that must have an admin. */
export async function requireAdmin() {
  const session = readSession();
  if (!session) return null;
  const admin = await prisma.adminUser.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, nameBn: true },
  });
  return admin;
}

export { COOKIE_NAME };
