/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

jest.mock("@/lib/auth", () => ({
  requireAdmin: jest.fn(),
}));

jest.mock("@/lib/audit", () => ({
  auditSystemAction: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: "audit-1" }),
    },
    refreshToken: {
      count: jest.fn().mockResolvedValue(1),
    },
    piece: {
      findFirst: jest.fn().mockResolvedValue({ id: "piece-1" }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(10),
    },
    subscriber: {
      count: jest.fn().mockResolvedValue(5),
    },
    analyticsEvent: {
      count: jest.fn().mockResolvedValue(100),
      groupBy: jest.fn().mockResolvedValue([{ sessionId: "s1" }]),
    },
  },
}));

jest.mock("@/lib/automation/notifications/logger", () => ({
  readLatestLogs: jest.fn().mockReturnValue(["[INFO] Automation running normally"]),
  writeLog: jest.fn(),
}));

const { requireAdmin } = require("@/lib/auth");
const { GET, POST } = require("@/app/api/admin/automation/route");

describe("GET /api/admin/automation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 Unauthorized if admin session is missing", async () => {
    requireAdmin.mockResolvedValue(null);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.ok).toBe(false);
  });

  it("returns 200 with full health, security, and log metrics for authenticated admin", async () => {
    requireAdmin.mockResolvedValue({ id: "admin-1", email: "admin@thoughts.whatever.com" });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.status).toHaveProperty("isRunning");
    expect(json.status).toHaveProperty("health");
    expect(json.status.health.dbConnected).toBe(true);
    expect(json.status.security.activeSessions).toBe(1);
    expect(Array.isArray(json.status.logs)).toBe(true);
  });
});
