/** @jest-environment node */
jest.mock("@/lib/prisma", () => ({
  prisma: {
    media: { findUnique: jest.fn(), delete: jest.fn() },
    piece: { count: jest.fn() }, series: { count: jest.fn() }, author: { count: jest.fn() },
    referenceEdition: { count: jest.fn() }, referenceAsset: { count: jest.fn() },
  },
}));
jest.mock("@/lib/audit", () => ({ logAuditEvent: jest.fn() }));
jest.mock("@/lib/activity", () => ({ logActivity: jest.fn() }));

import { prisma } from "@/lib/prisma";
import { deleteMediaRecord } from "@/lib/media";

beforeEach(() => {
  jest.clearAllMocks();
  (prisma.media.findUnique as jest.Mock).mockResolvedValue({ id: "asset-1", filename: "cover.jpg", mimeType: "image/jpeg", url: "https://example.com/cover.jpg", usages: [] });
  for (const model of [prisma.piece, prisma.series, prisma.author, prisma.referenceEdition, prisma.referenceAsset]) {
    (model.count as jest.Mock).mockResolvedValue(0);
  }
});

it("refuses deletion when a Reference asset still uses the file, even if usage tracking is stale", async () => {
  (prisma.referenceAsset.count as jest.Mock).mockResolvedValue(1);
  await expect(deleteMediaRecord("asset-1")).rejects.toThrow(/Remove its references/);
  expect(prisma.media.delete).not.toHaveBeenCalled();
});

it("deletes an unreferenced file", async () => {
  await expect(deleteMediaRecord("asset-1")).resolves.toMatchObject({ ok: true });
  expect(prisma.media.delete).toHaveBeenCalledWith({ where: { id: "asset-1" } });
});
