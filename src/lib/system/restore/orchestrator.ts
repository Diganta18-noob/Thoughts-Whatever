import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { getBackupsDir, downloadBackupFromR2 } from "../backup/storage";
import { computeFileHash } from "../backup/verify";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BACKUPS_ROOT = getBackupsDir();

export async function restoreBackup(backupId: string, options: { scope?: "full" | "database" | "media" | "content" } = {}) {
  const scope = options.scope || "full";
  const backupDir = path.join(BACKUPS_ROOT, backupId);

  if (!fs.existsSync(backupDir)) {
    const downloaded = await downloadBackupFromR2(backupId, backupDir);
    if (!downloaded) {
      throw new Error(`Backup folder ${backupId} not found locally and failed to download from R2.`);
    }
  }

  const manifestPath = path.join(backupDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest missing for backup ${backupId}.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const restoredComponents: string[] = [];
  let databaseRowsRestored: number | undefined;

  // 1. Restore Database
  if (scope === "database" && !manifest.checksums?.["database.json.gz"]) {
    throw new Error("Backup manifest does not contain a database archive.");
  }
  if ((scope === "full" || scope === "database") && manifest.checksums["database.json.gz"]) {
    const dbBackupFile = path.join(backupDir, "database.json.gz");
    if (computeFileHash(dbBackupFile) !== manifest.checksums["database.json.gz"]) {
      throw new Error("Database archive checksum does not match the manifest.");
    }
    const zlib = await import("zlib");
    const compressed = fs.readFileSync(dbBackupFile);
    const decompressed = zlib.gunzipSync(compressed).toString("utf-8");
    const dbData = JSON.parse(decompressed);

    const tables = ["AnalyticsEvent", "TimelineEvent", "Source", "Piece", "Author", "Series", "Tag", "Subscriber"] as const;
    const present = tables.filter((table) => Array.isArray(dbData.tables?.[table]));
    if (present.length === 0) throw new Error("Database archive contains no supported tables.");
    if (present.length > 0) {
      databaseRowsRestored = await prisma.$transaction(
        async (tx) => {
          const counts = [];
          // Clear & restore core tables safely in order
          if (dbData.tables.AnalyticsEvent) {
            await tx.analyticsEvent.deleteMany();
          }
          if (dbData.tables.TimelineEvent) {
            await tx.timelineEvent.deleteMany();
          }
          if (dbData.tables.Source) {
            await tx.source.deleteMany();
          }
          if (dbData.tables.Piece) {
            await tx.piece.deleteMany();
          }
          if (dbData.tables.Author) {
            await tx.author.deleteMany();
            counts.push(await tx.author.createMany({ data: dbData.tables.Author }));
          }
          if (dbData.tables.Series) {
            await tx.series.deleteMany();
            counts.push(await tx.series.createMany({ data: dbData.tables.Series }));
          }
          if (dbData.tables.Tag) {
            await tx.tag.deleteMany();
            counts.push(await tx.tag.createMany({ data: dbData.tables.Tag }));
          }
          if (dbData.tables.Subscriber) {
            await tx.subscriber.deleteMany();
            counts.push(await tx.subscriber.createMany({ data: dbData.tables.Subscriber }));
          }
          if (dbData.tables.Piece) counts.push(await tx.piece.createMany({ data: dbData.tables.Piece }));
          if (dbData.tables.Source) counts.push(await tx.source.createMany({ data: dbData.tables.Source }));
          if (dbData.tables.TimelineEvent) counts.push(await tx.timelineEvent.createMany({ data: dbData.tables.TimelineEvent }));
          if (dbData.tables.AnalyticsEvent) counts.push(await tx.analyticsEvent.createMany({ data: dbData.tables.AnalyticsEvent }));
          const restored = counts.reduce((total, result) => total + result.count, 0);
          const expected = present.reduce((total, table) => total + dbData.tables[table].length, 0);
          if (restored !== expected) throw new Error(`Expected to restore ${expected} rows, wrote ${restored}.`);
          return restored;
        },
        {
          maxWait: 10000,
          timeout: 30000,
        }
      );
      restoredComponents.push("Database");
    }
  }

  // 2. Restore Content Files
  if ((scope === "full" || scope === "content") && manifest.checksums["content.tar.gz"]) {
    const contentTar = path.join(backupDir, "content.tar.gz");
    if (fs.existsSync(contentTar)) {
      const tar = await import("tar");
      await tar.x({
        file: contentTar,
        cwd: process.cwd(),
      });
      restoredComponents.push("Content Files");
    }
  }

  return {
    backupId,
    timestamp: new Date().toISOString(),
    restoredComponents,
    databaseRowsRestored,
    status: "SUCCESS",
  };
}
