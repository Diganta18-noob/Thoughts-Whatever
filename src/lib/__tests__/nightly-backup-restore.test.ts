import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const mockTables = Object.fromEntries(
  ["piece", "series", "author", "tag", "source", "timelineEvent", "subscriber", "analyticsEvent"].map((table) => [
    table,
    { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn(), createMany: jest.fn() },
  ]),
);
jest.mock("@/lib/prisma", () => ({
  prisma: { ...mockTables, $transaction: (work: (tx: typeof mockTables) => unknown) => work(mockTables) },
}));
jest.mock("@/lib/system/backup/storage", () => ({
  getBackupsDir: () => mockRoot,
  uploadFileToR2: jest.fn(),
  cleanupLocalAndR2Backups: jest.fn(),
}));

const mockRoot = fs.mkdtempSync(path.join(os.tmpdir(), "nightly-restore-test-"));
const { createBackup } = require("@/lib/system/backup/orchestrator");
const { restoreBackup } = require("@/lib/system/restore/orchestrator");

test("restores rows from the generated database archive and rejects corruption", async () => {
  const fixture = { id: "fixture-piece", slug: "test-restore" };
  mockTables.piece.findMany.mockResolvedValue([fixture]);
  for (const table of Object.values(mockTables)) {
    table.createMany.mockImplementation(({ data }) => ({ count: data.length }));
  }

  const backup = await createBackup("database", undefined, { includeAuth: false });
  expect(backup.status).toBe("SUCCESS");
  expect(await restoreBackup(backup.backupId, { scope: "database" })).toMatchObject({ databaseRowsRestored: 1 });
  expect(mockTables.piece.createMany).toHaveBeenCalledWith({ data: [fixture] });

  fs.appendFileSync(path.join(backup.localPath, "database.json.gz"), "corrupt");
  await expect(restoreBackup(backup.backupId, { scope: "database" })).rejects.toThrow("checksum");
});

afterAll(() => fs.rmSync(mockRoot, { recursive: true, force: true }));
