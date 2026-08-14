/**
 * Backup Engine — Database, Uploads, and Storage/Content Backups
 *
 * Implements 3-tier nightly backups with timestamped compression, Cloudflare R2
 * remote uploads, auto-retry up to 3 times, and 30-day lifecycle retention pruning.
 */

import fs from "fs";
import path from "path";
import zlib from "zlib";
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "@/lib/prisma";
import { getBackupsDir } from "@/lib/system/backup/storage";
import { writeLog } from "../notifications/logger";
import { BackupArtifactInfo } from "../types";

const RETRY_ATTEMPTS = 3;
const RETENTION_DAYS = 30;

function getS3Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) return null;

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/** Helper: Retry an async function up to 3 times */
async function withRetry<T>(fn: () => Promise<T>, taskName: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      writeLog("backup", "WARN", `${taskName} attempt ${attempt}/${RETRY_ATTEMPTS} failed: ${err instanceof Error ? err.message : String(err)}`);
      if (attempt < RETRY_ATTEMPTS) {
        await new Promise((res) => setTimeout(res, 2000 * attempt));
      }
    }
  }
  throw lastErr;
}

/** Upload buffer/file to Cloudflare R2 bucket */
async function uploadToR2(key: string, body: Buffer, contentType = "application/octet-stream"): Promise<string | undefined> {
  const s3 = getS3Client();
  const bucket = process.env.R2_BACKUP_BUCKET_NAME || "thoughts-whatever-backups";
  if (!s3) return undefined;

  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));

  return `https://${bucket}.r2.cloudflarestorage.com/${key}`;
}

/** Prune R2 backup files older than 30 days */
export async function pruneOldR2Backups(): Promise<number> {
  const s3 = getS3Client();
  const bucket = process.env.R2_BACKUP_BUCKET_NAME || "thoughts-whatever-backups";
  if (!s3) return 0;

  try {
    const listRes = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));
    if (!listRes.Contents) return 0;

    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    for (const obj of listRes.Contents) {
      if (obj.Key && obj.LastModified && obj.LastModified.getTime() < cutoff) {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }));
        deletedCount++;
        writeLog("backup", "INFO", `Pruned ancient R2 backup artifact: ${obj.Key}`);
      }
    }
    return deletedCount;
  } catch (err) {
    writeLog("backup", "WARN", `R2 lifecycle pruning failed: ${err instanceof Error ? err.message : String(err)}`);
    return 0;
  }
}

// ─── 1. Database Backup ───────────────────────────────────────

export async function backupDatabase(): Promise<BackupArtifactInfo> {
  return withRetry(async () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `backup-db-${dateStr}.json.gz`;
    const localDir = getBackupsDir();
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const filePath = path.join(localDir, filename);

    // Export pieces in paginated batches to prevent memory spikes / OOM
    const PAGE_SIZE = 50;
    let skip = 0;
    const pieces = [];
    while (true) {
      const batch = await prisma.piece.findMany({
        take: PAGE_SIZE,
        skip,
      });
      if (batch.length === 0) break;
      pieces.push(...batch);
      skip += PAGE_SIZE;
    }

    // Export remaining primary tables to structured JSON
    const [authors, tags, series, sources, timelineEvents, subscribers, adminUsers] = await Promise.all([
      prisma.author.findMany(),
      prisma.tag.findMany(),
      prisma.series.findMany(),
      prisma.source.findMany(),
      prisma.timelineEvent.findMany(),
      prisma.subscriber.findMany(),
      prisma.adminUser.findMany({ select: { id: true, email: true, nameBn: true, createdAt: true } }),
    ]);

    const dumpData = {
      exportedAt: new Date().toISOString(),
      schemaVersion: "1.0",
      counts: { pieces: pieces.length, authors: authors.length, tags: tags.length, series: series.length },
      tables: { pieces, authors, tags, series, sources, timelineEvents, subscribers, adminUsers },
    };

    const jsonBuffer = Buffer.from(JSON.stringify(dumpData, null, 2), "utf-8");
    const compressedBuffer = zlib.gzipSync(jsonBuffer);

    fs.writeFileSync(filePath, compressedBuffer);

    const r2Url = await uploadToR2(`database/${filename}`, compressedBuffer, "application/gzip");

    writeLog("backup", "INFO", `Database backup created successfully (${compressedBuffer.length} bytes)`, { filename, r2Url });

    return {
      id: `db-${dateStr}`,
      type: "database",
      filename,
      sizeBytes: compressedBuffer.length,
      createdAt: new Date().toISOString(),
      r2Url,
      localPath: filePath,
    };
  }, "Database Backup");
}

// ─── 2. Uploads Backup ────────────────────────────────────────

export async function backupUploads(): Promise<BackupArtifactInfo> {
  return withRetry(async () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `backup-uploads-${dateStr}.json.gz`;
    const localDir = getBackupsDir();
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const filePath = path.join(localDir, filename);

    // Collect public images and uploads metadata
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const filesMeta: { name: string; size: number }[] = [];

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        const stats = fs.statSync(path.join(uploadsDir, f));
        filesMeta.push({ name: f, size: stats.size });
      }
    }

    const payload = Buffer.from(JSON.stringify({ dateStr, filesCount: filesMeta.length, files: filesMeta }), "utf-8");
    const compressedBuffer = zlib.gzipSync(payload);

    fs.writeFileSync(filePath, compressedBuffer);
    const r2Url = await uploadToR2(`uploads/${filename}`, compressedBuffer, "application/gzip");

    writeLog("backup", "INFO", `Uploads backup metadata recorded (${filesMeta.length} files)`, { filename, r2Url });

    return {
      id: `uploads-${dateStr}`,
      type: "uploads",
      filename,
      sizeBytes: compressedBuffer.length,
      createdAt: new Date().toISOString(),
      r2Url,
      localPath: filePath,
    };
  }, "Uploads Backup");
}

// ─── 3. Storage & Content Backup ──────────────────────────────

export async function backupStorage(): Promise<BackupArtifactInfo> {
  return withRetry(async () => {
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `backup-storage-${dateStr}.json.gz`;
    const localDir = getBackupsDir();
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const filePath = path.join(localDir, filename);

    const contentDir = path.join(process.cwd(), "Content");
    const storageFiles: { relativePath: string; content: string }[] = [];

    function scanDir(dir: string, base: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(base, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath, relPath);
        } else if (entry.isFile() && (entry.name.endsWith(".txt") || entry.name.endsWith(".md") || entry.name.endsWith(".json"))) {
          const content = fs.readFileSync(fullPath, "utf-8");
          storageFiles.push({ relativePath: relPath, content });
        }
      }
    }

    scanDir(contentDir, "Content");

    const payload = Buffer.from(JSON.stringify({ dateStr, fileCount: storageFiles.length, files: storageFiles }), "utf-8");
    const compressedBuffer = zlib.gzipSync(payload);

    fs.writeFileSync(filePath, compressedBuffer);
    const r2Url = await uploadToR2(`storage/${filename}`, compressedBuffer, "application/gzip");

    writeLog("backup", "INFO", `Storage backup created successfully (${storageFiles.length} files archived)`, { filename, r2Url });

    return {
      id: `storage-${dateStr}`,
      type: "storage",
      filename,
      sizeBytes: compressedBuffer.length,
      createdAt: new Date().toISOString(),
      r2Url,
      localPath: filePath,
    };
  }, "Storage Backup");
}
