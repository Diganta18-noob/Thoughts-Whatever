import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getBackupsDir, uploadFileToR2 } from "./storage";

let isBackingUp = false;
let pendingBackup = false;

/**
 * Automatically captures a full JSON snapshot of all database tables
 * whenever content is created, modified, imported, or deleted.
 */
export async function triggerAutoBackup(reason: string = "data-update"): Promise<void> {
  // If already running, queue a trailing run so we don't drop updates
  if (isBackingUp) {
    pendingBackup = true;
    return;
  }

  isBackingUp = true;
  pendingBackup = false;

  try {
    const backupsDir = getBackupsDir();
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeReason = reason.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30);
    const fileName = `auto-backup-${timestamp}-${safeReason}.json`;
    const filePath = path.join(backupsDir, fileName);
    const latestFilePath = path.join(backupsDir, "database-latest.json");

    const [
      pieces,
      series,
      authors,
      tags,
      sources,
      timelineEvents,
      subscribers,
      adminUsers,
      refreshTokens,
      analyticsEvents,
      auditLogs,
      promptLogs,
    ] = await Promise.all([
      prisma.piece.findMany({ include: { authors: { select: { id: true } }, tags: { select: { id: true } } } }).catch(() => []),
      prisma.series.findMany().catch(() => []),
      prisma.author.findMany().catch(() => []),
      prisma.tag.findMany().catch(() => []),
      prisma.source.findMany().catch(() => []),
      prisma.timelineEvent.findMany().catch(() => []),
      prisma.subscriber.findMany().catch(() => []),
      prisma.adminUser.findMany().catch(() => []),
      prisma.refreshToken.findMany().catch(() => []),
      prisma.analyticsEvent.findMany().catch(() => []),
      prisma.auditLog.findMany().catch(() => []),
      prisma.promptLog.findMany().catch(() => []),
    ]);

    const formattedPieces = pieces.map((p: any) => ({
      ...p,
      authorIds: p.authors?.map((a: any) => a.id) ?? [],
      tagIds: p.tags?.map((t: any) => t.id) ?? [],
    }));

    const backupPayload = {
      exportedAt: new Date().toISOString(),
      triggerReason: reason,
      counts: {
        pieces: pieces.length,
        series: series.length,
        authors: authors.length,
        tags: tags.length,
        sources: sources.length,
        timelineEvents: timelineEvents.length,
        subscribers: subscribers.length,
        adminUsers: adminUsers.length,
        refreshTokens: refreshTokens.length,
        analyticsEvents: analyticsEvents.length,
        auditLogs: auditLogs.length,
        promptLogs: promptLogs.length,
      },
      data: {
        pieces: formattedPieces,
        series,
        authors,
        tags,
        sources,
        timelineEvents,
        subscribers,
        adminUsers,
        refreshTokens,
        analyticsEvents,
        auditLogs,
        promptLogs,
      },
    };

    const jsonContent = JSON.stringify(backupPayload, null, 2);

    // Save timestamped snapshot and 'database-latest.json'
    fs.writeFileSync(filePath, jsonContent, "utf-8");
    fs.writeFileSync(latestFilePath, jsonContent, "utf-8");

    // Optional R2 sync
    uploadFileToR2(filePath, `auto-backups/${fileName}`).catch(() => {});
    uploadFileToR2(latestFilePath, `auto-backups/database-latest.json`).catch(() => {});

    // Retention policy: Keep the latest 30 auto-backup files locally
    try {
      const files = fs
        .readdirSync(backupsDir)
        .filter((f) => f.startsWith("auto-backup-") && f.endsWith(".json"))
        .sort()
        .reverse();

      if (files.length > 30) {
        for (let i = 30; i < files.length; i++) {
          fs.unlinkSync(path.join(backupsDir, files[i]));
        }
      }
    } catch {
      // safe ignore retention error
    }

    console.log(`[AutoBackup] Successfully created JSON backup snapshot: ${fileName} (${pieces.length} pieces, ${series.length} series)`);
  } catch (err) {
    console.error("[AutoBackup] Failed to auto-backup database:", err);
  } finally {
    isBackingUp = false;
    if (pendingBackup) {
      setTimeout(() => triggerAutoBackup("pending-batch-update"), 1000);
    }
  }
}
