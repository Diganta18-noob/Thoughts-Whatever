import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

type Args = { where?: any; select?: any };

const mockFindUnique = jest.fn<(args: Args) => Promise<any>>();
const mockCreateResetToken = jest.fn<(id: string, meta?: any) => Promise<string>>();
const mockSendPasswordResetEmail = jest.fn<(to: string, url: string) => Promise<any>>();
const mockAuditAuthAction = jest.fn<(...args: any[]) => Promise<void>>();
const mockRateLimit = jest.fn<(...args: any[]) => { success: boolean; reset: number }>();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    adminUser: {
      findUnique: (args: Args) => mockFindUnique(args),
    },
  },
}));

jest.mock("@/lib/password-reset", () => ({
  createResetToken: (id: string, meta?: any) => mockCreateResetToken(id, meta),
}));

jest.mock("@/lib/mailer", () => ({
  sendPasswordResetEmail: (to: string, url: string) => mockSendPasswordResetEmail(to, url),
}));

jest.mock("@/lib/audit", () => ({
  auditAuthAction: (...args: any[]) => mockAuditAuthAction(...args),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: any[]) => mockRateLimit(...args),
  getClientIp: () => "127.0.0.1",
}));

const { POST } = require("@/app/api/admin/forgot-password/route") as typeof import("@/app/api/admin/forgot-password/route");

describe("POST /api/admin/forgot-password route handler", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SITE_URL: "https://thoughts-whatever.vercel.app",
    };
    mockFindUnique.mockReset();
    mockCreateResetToken.mockReset();
    mockSendPasswordResetEmail.mockReset();
    mockAuditAuthAction.mockReset();
    mockRateLimit.mockReset();
    mockRateLimit.mockReturnValue({ success: true, reset: Date.now() + 60000 });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 400 for invalid email address format", async () => {
    const req = new Request("http://localhost:3000/api/admin/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("returns 200 generic success without creating token or sending email when account does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = new Request("http://localhost:3000/api/admin/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "unknown@example.com" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockCreateResetToken).not.toHaveBeenCalled();
    expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    expect(mockAuditAuthAction).toHaveBeenCalledWith(
      "forgot_password",
      expect.objectContaining({ adminEmail: "unknown@example.com", reason: "user_not_found" })
    );
  });

  it("creates reset token and dispatches email when admin account exists", async () => {
    mockFindUnique.mockResolvedValue({
      id: "admin-user-1",
      email: "admin@thoughts.whatever.com",
    });
    mockCreateResetToken.mockResolvedValue("generated-random-token-12345");
    mockSendPasswordResetEmail.mockResolvedValue({ messageId: "email-sent-id" });

    const req = new Request("http://localhost:3000/api/admin/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-agent": "Mozilla/5.0",
        "x-forwarded-for": "203.0.113.195",
      },
      body: JSON.stringify({ email: "admin@thoughts.whatever.com" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockCreateResetToken).toHaveBeenCalledWith("admin-user-1", {
      requestedIp: "203.0.113.195",
      requestedUserAgent: "Mozilla/5.0",
    });
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      "admin@thoughts.whatever.com",
      "https://thoughts-whatever.vercel.app/admin/reset-password?token=generated-random-token-12345"
    );
    expect(mockAuditAuthAction).toHaveBeenCalledWith("forgot_password", {
      adminId: "admin-user-1",
      adminEmail: "admin@thoughts.whatever.com",
    });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    mockRateLimit.mockReturnValue({ success: false, reset: Date.now() + 30000 });

    const req = new Request("http://localhost:3000/api/admin/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@thoughts.whatever.com" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(429);
    expect(json.ok).toBe(false);
    expect(json.error).toContain("Too many reset requests");
  });

  it("returns 500 when mailer fails to deliver email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "admin-user-1",
      email: "admin@thoughts.whatever.com",
    });
    mockCreateResetToken.mockResolvedValue("token-abc");
    mockSendPasswordResetEmail.mockRejectedValue(new Error("SMTP delivery failure"));

    const req = new Request("http://localhost:3000/api/admin/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@thoughts.whatever.com" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(500);
    expect(json.ok).toBe(false);
  });
});
