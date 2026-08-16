import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockConsumeResetToken = jest.fn<(...args: any[]) => Promise<any>>();
const mockAuditAuthAction = jest.fn<(...args: any[]) => Promise<void>>();
const mockRateLimit = jest.fn<(...args: any[]) => { success: boolean; reset: number }>();
const mockTransaction = jest.fn<(actions: any[]) => Promise<any>>();

const mockAdminUserUpdate = jest.fn<(...args: any[]) => any>();
const mockPasswordResetTokenUpdate = jest.fn<(...args: any[]) => any>();
const mockRefreshTokenUpdateMany = jest.fn<(...args: any[]) => any>();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (actions: any[]) => mockTransaction(actions),
    adminUser: {
      update: (...args: any[]) => mockAdminUserUpdate(...args),
    },
    passwordResetToken: {
      update: (...args: any[]) => mockPasswordResetTokenUpdate(...args),
    },
    refreshToken: {
      updateMany: (...args: any[]) => mockRefreshTokenUpdateMany(...args),
    },
  },
}));

jest.mock("@/lib/password-reset", () => ({
  consumeResetToken: (...args: any[]) => mockConsumeResetToken(...args),
}));

jest.mock("@/lib/audit", () => ({
  auditAuthAction: (...args: any[]) => mockAuditAuthAction(...args),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: (...args: any[]) => mockRateLimit(...args),
  getClientIp: () => "127.0.0.1",
}));

const { POST } = require("@/app/api/admin/reset-password/route") as typeof import("@/app/api/admin/reset-password/route");

describe("POST /api/admin/reset-password route handler", () => {
  beforeEach(() => {
    mockConsumeResetToken.mockReset();
    mockAuditAuthAction.mockReset();
    mockRateLimit.mockReset();
    mockTransaction.mockReset();
    mockAdminUserUpdate.mockReset();
    mockPasswordResetTokenUpdate.mockReset();
    mockRefreshTokenUpdateMany.mockReset();

    mockRateLimit.mockReturnValue({ success: true, reset: Date.now() + 60000 });
    mockTransaction.mockImplementation((actions) => Promise.all(actions));
  });

  it("returns 400 if password is less than 8 characters", async () => {
    const req = new Request("http://localhost:3000/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "some-token", password: "short" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.error).toContain("৮");
    expect(mockConsumeResetToken).not.toHaveBeenCalled();
  });

  it("returns 400 with TOKEN_ALREADY_USED if token was already used", async () => {
    mockConsumeResetToken.mockResolvedValue({ ok: false, reason: "already-used" });

    const req = new Request("http://localhost:3000/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "already-used-token", password: "NewStrongPassword123!" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("TOKEN_ALREADY_USED");
    expect(json.error).toContain("already been used");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 with TOKEN_EXPIRED if token has expired", async () => {
    mockConsumeResetToken.mockResolvedValue({ ok: false, reason: "expired" });

    const req = new Request("http://localhost:3000/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "expired-token", password: "NewStrongPassword123!" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("TOKEN_EXPIRED");
    expect(json.error).toContain("expired");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("returns 400 with TOKEN_INVALID if token does not exist", async () => {
    mockConsumeResetToken.mockResolvedValue({ ok: false, reason: "not-found" });

    const req = new Request("http://localhost:3000/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "unknown-token", password: "NewStrongPassword123!" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(400);
    expect(json.ok).toBe(false);
    expect(json.code).toBe("TOKEN_INVALID");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("successfully updates password, stamps usedAt, revokes refresh tokens, and audits event", async () => {
    mockConsumeResetToken.mockResolvedValue({
      ok: true,
      user: {
        id: "admin-1",
        email: "admin@thoughts.whatever.com",
        nameBn: "অ্যাডমিন",
      },
      tokenRecord: {
        id: "token-record-1",
        tokenHash: "hashed-token-xyz",
        adminUserId: "admin-1",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        usedAt: null,
      },
    });

    const req = new Request("http://localhost:3000/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "valid-token-123", password: "MyNewSecurePassword!2026" }),
    });

    const res = await POST(req);
    const json = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockAdminUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "admin-1" },
        data: { passwordHash: expect.any(String) },
      })
    );
    expect(mockPasswordResetTokenUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "token-record-1" },
        data: { usedAt: expect.any(Date) },
      })
    );
    expect(mockRefreshTokenUpdateMany).toHaveBeenCalledWith({
      where: { adminUserId: "admin-1" },
      data: { revoked: true },
    });
    expect(mockAuditAuthAction).toHaveBeenCalledWith("reset_password", {
      adminId: "admin-1",
      adminEmail: "admin@thoughts.whatever.com",
    });
  });
});
