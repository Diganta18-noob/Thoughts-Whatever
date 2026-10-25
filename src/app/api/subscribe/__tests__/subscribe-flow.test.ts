/** @jest-environment node */

jest.mock("@/lib/prisma", () => ({
  prisma: { subscriber: { findUnique: jest.fn(), upsert: jest.fn() } },
}));
jest.mock("@/lib/rate-limit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => ({ success: true }),
}));
jest.mock("@/lib/mailer", () => ({
  sendMail: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { POST } from "../route";

const subscriber = prisma.subscriber as jest.Mocked<typeof prisma.subscriber>;
const sendConfirmation = sendMail as jest.Mock;
const request = () => new Request("http://localhost/api/subscribe", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: "Reader@Example.com", source: "blog" }),
});

beforeEach(() => {
  jest.clearAllMocks();
  subscriber.findUnique.mockResolvedValue(null);
  subscriber.upsert.mockResolvedValue({ id: "sub-1", email: "reader@example.com", confirmed: false, unsubscribedAt: null } as never);
  sendConfirmation.mockResolvedValue(undefined);
});

it("sends a confirmation email and asks the reader to check their inbox", async () => {
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ code: "checkInbox" });
  expect(sendConfirmation).toHaveBeenCalledWith(expect.objectContaining({ to: "reader@example.com" }));
});

it("never claims a letter was sent when email delivery fails", async () => {
  sendConfirmation.mockRejectedValue(new Error("SMTP unavailable"));
  const response = await POST(request());
  expect(response.status).toBe(503);
  expect(await response.json()).toMatchObject({ ok: false, code: "sendFailed" });
});

it("reports a storage failure separately and does not send mail", async () => {
  subscriber.upsert.mockRejectedValue(new Error("Database unavailable"));
  const response = await POST(request());
  expect(response.status).toBe(500);
  expect(await response.json()).toMatchObject({ ok: false, code: "saveFailed" });
  expect(sendConfirmation).not.toHaveBeenCalled();
});


it("rejects invalid email without writing or mailing", async () => {
  const response = await POST(new Request("http://localhost/api/subscribe", { method: "POST", body: JSON.stringify({ email: "invalid" }) }));
  expect(response.status).toBe(400);
  expect(subscriber.upsert).not.toHaveBeenCalled();
  expect(sendConfirmation).not.toHaveBeenCalled();
});

it("silently discards honeypot spam without writing or mailing", async () => {
  const response = await POST(new Request("http://localhost/api/subscribe", { method: "POST", body: JSON.stringify({ email: "bot@example.com", website: "spam" }) }));
  expect(response.status).toBe(200);
  expect(subscriber.upsert).not.toHaveBeenCalled();
  expect(sendConfirmation).not.toHaveBeenCalled();
});
