import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

const BACKUPS_DIR = path.join(process.cwd(), "backups");

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function uploadFileToR2(localFilePath: string, remoteKey: string): Promise<boolean> {
  const r2 = getR2Client();
  const bucketName = process.env.R2_BACKUP_BUCKET_NAME;

  if (!r2 || !bucketName) {
    console.warn("Cloudflare R2 is not configured. Skipping remote upload.");
    return false;
  }

  try {
    const fileStream = fs.createReadStream(localFilePath);
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: remoteKey,
        Body: fileStream,
      })
    );
    return true;
  } catch (err) {
    console.error(`Failed to upload ${localFilePath} to R2:`, err);
    return false;
  }
}

export async function cleanupLocalAndR2Backups(retentionDays = 30): Promise<{ localCleaned: number; r2Cleaned: number }> {
  let localCleaned = 0;
  let r2Cleaned = 0;

  // 1. Local retention
  if (fs.existsSync(BACKUPS_DIR)) {
    const dirs = fs.readdirSync(BACKUPS_DIR);
    if (dirs.length > 7) { // Safeguard: keep at least 7
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
      for (const dir of dirs) {
        const dirPath = path.join(BACKUPS_DIR, dir);
        const stat = fs.statSync(dirPath);
        if (stat.isDirectory() && stat.mtimeMs < cutoff) {
          fs.rmSync(dirPath, { recursive: true, force: true });
          localCleaned++;
        }
      }
    }
  }

  // 2. R2 retention
  const r2 = getR2Client();
  const bucketName = process.env.R2_BACKUP_BUCKET_NAME;
  if (r2 && bucketName) {
    try {
      const listResp = await r2.send(new ListObjectsV2Command({ Bucket: bucketName }));
      const objects = listResp.Contents || [];
      const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

      for (const obj of objects) {
        if (obj.Key && obj.LastModified && obj.LastModified.getTime() < cutoff) {
          await r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key: obj.Key }));
          r2Cleaned++;
        }
      }
    } catch (err) {
      console.error("Failed to clean old R2 backups:", err);
    }
  }

  return { localCleaned, r2Cleaned };
}
