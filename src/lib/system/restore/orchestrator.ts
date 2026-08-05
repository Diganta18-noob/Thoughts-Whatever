import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const BACKUPS_ROOT = path.join(process.cwd(), "backups");

export async function restoreBackup(backupId: string, options: { scope?: "full" | "database" | "media" | "content" } = {}) {
  const scope = options.scope || "full";
  const backupDir = path.join(BACKUPS_ROOT, backupId);

  if (!fs.existsSync(backupDir)) {
    throw new Error(`Backup folder ${backupId} not found locally.`);
  }

  const manifestPath = path.join(backupDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest missing for backup ${backupId}.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const restoredComponents: string[] = [];

  // 1. Restore Database
  if ((scope === "full" || scope === "database") && manifest.checksums["database.json.gz"]) {
    const dbBackupFile = path.join(backupDir, "database.json.gz");
    const zlib = await import("zlib");
    const compressed = fs.readFileSync(dbBackupFile);
    const decompressed = zlib.gunzipSync(compressed).toString("utf-8");
    const dbData = JSON.parse(decompressed);

    if (dbData.tables) {
      await prisma.$transaction(
        async (tx) => {
          // Clear & restore core tables safely in order
          if (dbData.tables.AnalyticsEvent) {
            await tx.analyticsEvent.deleteMany();
            await tx.analyticsEvent.createMany({ data: dbData.tables.AnalyticsEvent });
          }
          if (dbData.tables.TimelineEvent) {
            await tx.timelineEvent.deleteMany();
            await tx.timelineEvent.createMany({ data: dbData.tables.TimelineEvent });
          }
          if (dbData.tables.Source) {
            await tx.source.deleteMany();
            await tx.source.createMany({ data: dbData.tables.Source });
          }
          if (dbData.tables.Piece) {
            await tx.piece.deleteMany();
            await tx.piece.createMany({ data: dbData.tables.Piece });
          }
          if (dbData.tables.Author) {
            await tx.author.deleteMany();
            await tx.author.createMany({ data: dbData.tables.Author });
          }
          if (dbData.tables.Series) {
            await tx.series.deleteMany();
            await tx.series.createMany({ data: dbData.tables.Series });
          }
          if (dbData.tables.Tag) {
            await tx.tag.deleteMany();
            await tx.tag.createMany({ data: dbData.tables.Tag });
          }
          if (dbData.tables.Subscriber) {
            await tx.subscriber.deleteMany();
            await tx.subscriber.createMany({ data: dbData.tables.Subscriber });
          }
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
    status: "SUCCESS",
  };
}
