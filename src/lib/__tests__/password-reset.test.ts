import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import crypto from "crypto";

type Args = { where?: any; data?: any; include?: any };

const mockDeleteMany = jest.fn<(args: Args) => Promise<any>>();
const mockCreate = jest.fn<(args: Args) => Promise<any>>();
const mockFindUnique = jest.fn<(args: Args) => Promise<any>>();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: {
      deleteMany: (args: Args) => mockDeleteMany(args),
      create: (args: Args) => mockCreate(args),
      findUnique: (args: Args) => mockFindUnique(args),
    },
  },
}));

const {
  createResetToken,
  hashResetToken,
  consumeResetToken,
  RESET_TOKEN_EXPIRY_MS,
} = require("@/lib/password-reset") as typeof import("@/lib/password-reset");

describe("Password Reset Token Service", () => {
  beforeEach(() => {
    mockDeleteMany.mockReset();
    mockCreate.mockReset();
    mockFindUnique.mockReset();
  });

  it("hashes tokens consistently using SHA-256 hex", () => {
    const raw = "sample-raw-token-12345";
    const expected = crypto.createHash("sha256").update(raw).digest("hex");
    expect(hashResetToken(raw)).toBe(expected);
  });

  it("createResetToken invalidates previous unused tokens and creates a new hashed record", async () => {
    mockDeleteMany.mockResolvedValue({ count: 2 });
    mockCreate.mockResolvedValue({ id: "token-1" });

    const raw = await createResetToken("user-123", {
      requestedIp: "1.2.3.4",
      requestedUserAgent: "Mozilla/5.0",
    });

    expect(typeof raw).toBe("string");
    expect(raw.length).toBeGreaterThan(20);

    // Verify invalidation of prior unused tokens
    expect(mockDeleteMany).toHaveBeenCalledWith({
      where: {
        adminUserId: "user-123",
        usedAt: null,
      },
    });

    // Verify creation with correct hash and metadata
    const expectedHash = hashResetToken(raw);
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenHash: expectedHash,
        adminUserId: "user-123",
        requestedIp: "1.2.3.4",
        requestedUserAgent: "Mozilla/5.0",
        expiresAt: expect.any(Date),
      }),
    });
  });

  it("consumeResetToken returns user for a valid, unexpired, unused token", async () => {
    const raw = "valid-token-xyz";
    const tokenHash = hashResetToken(raw);

    mockFindUnique.mockResolvedValue({
      id: "token-record-1",
      tokenHash,
      adminUserId: "user-123",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins left
      usedAt: null,
      adminUser: {
        id: "user-123",
        email: "admin@thoughts.whatever.com",
        nameBn: "অ্যাডমিন",
      },
    });

    const result = await consumeResetToken(raw);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.user.id).toBe("user-123");
      expect(result.user.email).toBe("admin@thoughts.whatever.com");
      expect(result.tokenRecord.id).toBe("token-record-1");
    }
  });

  it("consumeResetToken returns not-found for unknown or empty tokens", async () => {
    mockFindUnique.mockResolvedValue(null);

    const resultEmpty = await consumeResetToken("");
    expect(resultEmpty).toEqual({ ok: false, reason: "not-found" });

    const resultUnknown = await consumeResetToken("unknown-token");
    expect(resultUnknown).toEqual({ ok: false, reason: "not-found" });
  });

  it("consumeResetToken returns already-used when token has a usedAt timestamp", async () => {
    const raw = "used-token-xyz";
    const tokenHash = hashResetToken(raw);

    mockFindUnique.mockResolvedValue({
      id: "token-record-1",
      tokenHash,
      adminUserId: "user-123",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      usedAt: new Date(Date.now() - 5000),
      adminUser: {
        id: "user-123",
        email: "admin@thoughts.whatever.com",
        nameBn: "অ্যাডমিন",
      },
    });

    const result = await consumeResetToken(raw);
    expect(result).toEqual({ ok: false, reason: "already-used" });
  });

  it("consumeResetToken returns expired when expiresAt is in the past", async () => {
    const raw = "expired-token-xyz";
    const tokenHash = hashResetToken(raw);

    mockFindUnique.mockResolvedValue({
      id: "token-record-1",
      tokenHash,
      adminUserId: "user-123",
      expiresAt: new Date(Date.now() - 1000), // expired 1s ago
      usedAt: null,
      adminUser: {
        id: "user-123",
        email: "admin@thoughts.whatever.com",
        nameBn: "অ্যাডমিন",
      },
    });

    const result = await consumeResetToken(raw);
    expect(result).toEqual({ ok: false, reason: "expired" });
  });
});
