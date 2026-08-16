import { describe, it, expect, jest, beforeEach } from "@jest/globals";

type Args = { where?: any; data?: any; create?: any; update?: any; select?: any };

const findUniqueMock = jest.fn<(args: Args) => Promise<any>>();
const upsertMock = jest.fn<(args: Args) => Promise<any>>();
const createMock = jest.fn<(args: Args) => Promise<any>>();
const updateMock = jest.fn<(args: Args) => Promise<any>>();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: {
      findUnique: (args: Args) => findUniqueMock(args),
      upsert: (args: Args) => upsertMock(args),
      create: (args: Args) => createMock(args),
      update: (args: Args) => updateMock(args),
    },
  },
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ success: true, reset: Date.now() + 60000 }),
  getClientIp: () => "127.0.0.1",
}));

jest.mock("@/lib/audit", () => ({
  auditAuthAction: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

jest.mock("@/lib/posthog", () => ({
  getPostHogServerClient: () => null,
}));

jest.mock("@/lib/auth", () => {
  const actual = jest.requireActual("@/lib/auth") as any;
  return {
    ...actual,
    issueAuthCookies: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
  };
});

const { POST } = require("@/app/api/admin/login/route") as typeof import("@/app/api/admin/login/route");

describe("POST /api/admin/login security", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    upsertMock.mockReset();
    createMock.mockReset();
    updateMock.mockReset();
  });

  it("returns 401 and writes no AdminUser row when attempting login with unknown email and backdoor password", async () => {
    findUniqueMock.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "attacker@evil.com",
        password: "old-backdoor-password-1234",
      }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.error).toBe("Invalid email or password.");
    expect(upsertMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 401 and writes no AdminUser row when admin exists but password is wrong", async () => {
    findUniqueMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@thoughts.whatever.com",
      passwordHash: "$2a$12$somevalidhashthatdoesnotmatchwrongpassword",
      nameBn: "অ্যাডমিন",
    });

    const req = new Request("http://localhost:3000/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@thoughts.whatever.com",
        password: "wrongpassword",
      }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(upsertMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });
});
