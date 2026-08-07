import fs from "fs";
import path from "path";
import { backupDatabase } from "./database";
import { backupMedia } from "./media";
import { backupContent } from "./content";
import { uploadFileToR2, cleanupLocalAndR2Backups, getBackupsDir } from "./storage";
import { computeFileHash, verifyChecksums } from "./verify";
import { BackupManifest, BackupResult } from "./types";
import { MaintenanceReport } from "../maintenance/types";

const BACKUPS_ROOT = getBackupsDir();

export async function createBackup(
  type: "full" | "database" | "media" | "content" = "full",
  maintenanceReport?: MaintenanceReport
): Promise<BackupResult> {
  const startTime = Date.now();
  const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
  const backupId = `backup_${dateStr}`;
  const backupDir = path.join(BACKUPS_ROOT, backupId);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const checksums: Record<string, string> = {};
  const errors: string[] = [];

  let dbStats: any;
  let mediaStats: any;
  let contentStats: any;

  // 1. Database backup
  if (type === "full" || type === "database") {
    try {
      dbStats = await backupDatabase(backupDir);
      checksums["database.json.gz"] = computeFileHash(dbStats.filePath);
    } catch (e: any) {
      errors.push(`Database backup error: ${e.message}`);
    }
  }

  // 2. Media backup
  if (type === "full" || type === "media") {
    try {
      mediaStats = await backupMedia(backupDir);
      checksums["media-manifest.json"] = computeFileHash(mediaStats.mediaManifestPath);
    } catch (e: any) {
      errors.push(`Media backup error: ${e.message}`);
    }
  }

  // 3. Content backup
  if (type === "full" || type === "content") {
    try {
      contentStats = await backupContent(backupDir);
      checksums["content.tar.gz"] = computeFileHash(contentStats.filePath);
    } catch (e: any) {
      errors.push(`Content backup error: ${e.message}`);
    }
  }

  // 4. Generate Manifest
  const manifest: BackupManifest = {
    backupId,
    timestamp: new Date().toISOString(),
    type,
    checksums,
    databaseStats: dbStats ? { tableCount: dbStats.tableCount, totalRows: dbStats.totalRows, sizeBytes: dbStats.sizeBytes } : undefined,
    mediaStats: mediaStats ? { fileCount: mediaStats.fileCount, totalSizeBytes: mediaStats.totalSizeBytes } : undefined,
    contentStats: contentStats ? { fileCount: contentStats.fileCount, totalSizeBytes: contentStats.totalSizeBytes } : undefined,
    maintenanceReport,
    verified: false,
  };

  const manifestPath = path.join(backupDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // 5. Verify Checksums
  const fullChecksumPaths: Record<string, string> = {};
  for (const [file, hash] of Object.entries(checksums)) {
    fullChecksumPaths[path.join(backupDir, file)] = hash;
  }
  const verifyRes = await verifyChecksums(fullChecksumPaths);
  manifest.verified = verifyRes.valid;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  // 6. Upload to R2
  let r2Path: string | undefined;
  if (fs.existsSync(backupDir)) {
    const files = fs.readdirSync(backupDir);
    for (const file of files) {
      const localFile = path.join(backupDir, file);
      const remoteKey = `${backupId}/${file}`;
      const uploaded = await uploadFileToR2(localFile, remoteKey);
      if (uploaded && file === "manifest.json") {
        r2Path = remoteKey;
      }
    }
  }

  // 7. Cleanup retention (keep 30 days)
  await cleanupLocalAndR2Backups(30);

  return {
    backupId,
    timestamp: manifest.timestamp,
    status: errors.length > 0 ? "PARTIAL" : "SUCCESS",
    durationMs: Date.now() - startTime,
    localPath: backupDir,
    r2Path,
    manifest,
    errors: errors.length > 0 ? errors : undefined,
  };
}
