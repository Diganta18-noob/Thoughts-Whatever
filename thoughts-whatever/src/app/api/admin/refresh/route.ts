import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  REFRESH_COOKIE_NAME,
  verifyAndRefreshAccessToken,
  ACCESS_COOKIE_NAME,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const refreshToken = cookies().get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ ok: false, error: "No refresh token" }, { status: 401 });
  }

  const result = await verifyAndRefreshAccessToken(refreshToken);

  if (!result) {
    const response = NextResponse.json(
      { ok: false, error: "Invalid or revoked refresh token" },
      { status: 401 },
    );
    response.cookies.delete(ACCESS_COOKIE_NAME);
    response.cookies.delete(REFRESH_COOKIE_NAME);
    return response;
  }

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true });

  response.cookies.set(ACCESS_COOKIE_NAME, result.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, result.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: REFRESH_TOKEN_EXPIRY,
  });

  return response;
}
