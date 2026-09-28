/** @jest-environment node */

jest.mock("@/lib/prisma", () => ({
  prisma: { subscriber: { updateMany: jest.fn() } },
}));
jest.mock("@/lib/letter-confirmation", () => ({
  verifyLetterConfirmationToken: jest.fn(),
}));

import { prisma } from "@/lib/prisma";
import { verifyLetterConfirmationToken } from "@/lib/letter-confirmation";
import { POST } from "../route";

const verify = verifyLetterConfirmationToken as jest.Mock;
const updateMany = prisma.subscriber.updateMany as jest.Mock;
const request = (token: string) => new Request("http://localhost/api/subscribe/confirm", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ token }),
});

beforeEach(() => jest.clearAllMocks());

it("confirms an active subscriber only after a valid token is posted", async () => {
  verify.mockReturnValue("sub-1");
  updateMany.mockResolvedValue({ count: 1 });
  const response = await POST(request("signed-token"));
  expect(response.status).toBe(200);
  expect(updateMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: "sub-1", unsubscribedAt: null },
    data: expect.objectContaining({ confirmed: true }),
  }));
});

it("rejects an invalid token without changing the subscriber", async () => {
  verify.mockReturnValue(null);
  const response = await POST(request("invalid"));
  expect(response.status).toBe(400);
  expect(updateMany).not.toHaveBeenCalled();
});
