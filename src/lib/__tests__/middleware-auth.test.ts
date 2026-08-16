import { describe, it, expect } from "@jest/globals";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

function createRequest(path: string, cookies: Record<string, string> = {}) {
  const url = `http://localhost:3000${path}`;
  const req = new NextRequest(new Request(url));
  for (const [name, val] of Object.entries(cookies)) {
    req.cookies.set(name, val);
  }
  return req;
}

describe("middleware allowlist and auth gating", () => {
  const publicPaths = [
    "/admin/login",
    "/api/admin/login",
    "/admin/forgot-password",
    "/admin/reset-password",
    "/api/admin/forgot-password",
    "/api/admin/reset-password",
  ];

  for (const path of publicPaths) {
    it(`allows unauthenticated access to public path: ${path}`, async () => {
      const req = createRequest(path);
      const res = await middleware(req);
      // NextResponse.next() produces headers without x-middleware-rewrite or redirect Location
      expect(res.status).toBe(200);
      expect(res.headers.get("location")).toBeNull();
    });
  }

  it("redirects unauthenticated access to /admin to /admin/login", async () => {
    const req = createRequest("/admin");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/admin/login");
  });

  it("redirects unauthenticated access to /admin/pieces with from param", async () => {
    const req = createRequest("/admin/pieces");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toContain("/admin/login?from=%2Fadmin%2Fpieces");
  });

  it("returns 401 json for unauthenticated access to /api/admin/pieces", async () => {
    const req = createRequest("/api/admin/pieces");
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toEqual({ ok: false, error: "unauthorized", code: 401 });
  });

  it("passes through non-admin public routes like /writing/test", async () => {
    const req = createRequest("/writing/test");
    const res = await middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
