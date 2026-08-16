import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE_NAME = "tw_access";
const REFRESH_COOKIE_NAME = "tw_refresh";
const LEGACY_COOKIE_NAME = "tw_session";

/**
 * Validate that redirect paths are strictly relative internal paths to prevent
 * Open Redirect vulnerabilities.
 */
export function isSafeInternalPath(path: string | null | undefined): boolean {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  // Disallow protocol-relative URLs like "//evil.com"
  if (path.startsWith("//")) return false;
  // Disallow control characters
  if (/[\r\n\t]/.test(path)) return false;
  return true;
}

async function verifyJwtHs256(token: string, secretStr: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretStr),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const base64 = signatureB64.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const signatureBytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));

    const dataToVerify = encoder.encode(`${headerB64}.${payloadB64}`);
    const isValid = await crypto.subtle.verify(
      "HMAC",
      secretKey,
      signatureBytes,
      dataToVerify
    );

    if (!isValid) return false;

    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/api/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/api/admin/forgot-password",
  "/api/admin/reset-password",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Exclude public admin routes (e.g. login API, forgot-password, reset-password)
  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  // 2. Protect all /admin (dashboard) and /api/admin routes
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminApiRoute = pathname.startsWith("/api/admin");

  if (!isAdminRoute && !isAdminApiRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  const legacyToken = request.cookies.get(LEGACY_COOKIE_NAME)?.value;

  const tokenToVerify = accessToken || refreshToken || legacyToken;

  if (!tokenToVerify) {
    if (isAdminApiRoute) {
      return NextResponse.json(
        { ok: false, error: "unauthorized", code: 401 },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/admin/login", request.url);
    if (isSafeInternalPath(pathname)) {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  const secret = process.env.AUTH_SECRET || "";
  const isValid = await verifyJwtHs256(tokenToVerify, secret);

  if (!isValid) {
    if (isAdminApiRoute) {
      return NextResponse.json(
        { ok: false, error: "unauthorized", code: 401 },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/admin/login", request.url);
    if (isSafeInternalPath(pathname)) {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
