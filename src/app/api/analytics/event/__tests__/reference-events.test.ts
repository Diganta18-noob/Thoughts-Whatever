/** @jest-environment node */
jest.mock("@/lib/prisma", () => ({
  prisma: {
    analyticsEvent: { create: jest.fn().mockResolvedValue({ id: "event-1" }) },
    piece: { update: jest.fn() },
    referenceWork: { update: jest.fn().mockResolvedValue({ id: "work-1" }) },
  },
}));
jest.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => ({ success: true }),
}));

import { prisma } from "@/lib/prisma";
import { POST } from "../route";

const create = prisma.analyticsEvent.create as jest.Mock;
const request = (eventType: string, metadata?: unknown) => new Request("http://localhost/api/analytics/event", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ eventType, sessionId: "session-1", metadata }),
});

beforeEach(() => jest.clearAllMocks());

it("records a reference work open with its work id", async () => {
  const response = await POST(request("reference_open", { referenceWorkId: "work-1" }));
  expect(response.status).toBe(200);
  expect(create).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ eventType: "reference_open", metadata: expect.objectContaining({ referenceWorkId: "work-1" }) }),
  }));
});

it("rejects reference work activity without a work id", async () => {
  const response = await POST(request("reference_read"));
  expect(response.status).toBe(400);
  expect(create).not.toHaveBeenCalled();
});
