import fs from "fs";
import path from "path";
import checkDiskSpace from "check-disk-space";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const BACKUPS_DIR = path.join(process.cwd(), "backups");

export interface SystemHealthStatus {
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
  timestamp: string;
  checks: {
    diskSpace: { passed: boolean; details: string };
    lastBackup: { passed: boolean; details: string };
    backupCount: { passed: boolean; details: string };
    r2Connectivity: { passed: boolean; details: string };
  };
  lastMaintenanceReport?: any;
}

export async function checkHealth(): Promise<SystemHealthStatus> {
  const rootPath = process.platform === "win32" ? "C:" : "/";
  let diskPassed = false;
  let diskDetails = "";

  try {
    const diskInfo = await checkDiskSpace(rootPath);
    const freePercent = (diskInfo.free / diskInfo.size) * 100;
    diskPassed = freePercent >= 20;
    diskDetails = `${freePercent.toFixed(1)}% free (${(diskInfo.free / (1024 * 1024 * 1024)).toFixed(2)} GB)`;
  } catch (err: any) {
    diskDetails = `Failed: ${err.message}`;
  }

  // Backup checks
  let backupPassed = false;
  let backupDetails = "No local backups found.";
  let countPassed = false;
  let countDetails = "0 backups found.";

  if (fs.existsSync(BACKUPS_DIR)) {
    const dirs = fs.readdirSync(BACKUPS_DIR).filter((d) => fs.statSync(path.join(BACKUPS_DIR, d)).isDirectory());
    countDetails = `${dirs.length} backup(s) available locally.`;
    countPassed = dirs.length >= 1;

    if (dirs.length > 0) {
      dirs.sort().reverse();
      const latestDir = path.join(BACKUPS_DIR, dirs[0]);
      const stat = fs.statSync(latestDir);
      const hoursAgo = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
      backupPassed = hoursAgo <= 25;
      backupDetails = `Latest backup was ${hoursAgo.toFixed(1)} hours ago (${dirs[0]}).`;
    }
  }

  // R2 Connectivity
  let r2Passed = false;
  let r2Details = "R2 credentials missing.";
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BACKUP_BUCKET_NAME;

  if (accountId && accessKeyId && secretAccessKey && bucketName) {
    try {
      const client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      await client.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1 }));
      r2Passed = true;
      r2Details = `Connected to Cloudflare R2 bucket '${bucketName}'.`;
    } catch (err: any) {
      r2Details = `R2 Connection failed: ${err.message}`;
    }
  }

  // Last maintenance report check
  let lastMaintenanceReport = null;
  if (fs.existsSync(BACKUPS_DIR)) {
    const dirs = fs.readdirSync(BACKUPS_DIR).filter((d) => fs.statSync(path.join(BACKUPS_DIR, d)).isDirectory()).sort().reverse();
    for (const d of dirs) {
      const manifestPath = path.join(BACKUPS_DIR, d, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          const m = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
          if (m.maintenanceReport) {
            lastMaintenanceReport = m.maintenanceReport;
            break;
          }
        } catch {}
      }
    }
  }

  const allPassed = diskPassed && backupPassed && countPassed && r2Passed;
  const critical = !diskPassed || (!backupPassed && countPassed);

  return {
    status: allPassed ? "HEALTHY" : critical ? "CRITICAL" : "DEGRADED",
    timestamp: new Date().toISOString(),
    checks: {
      diskSpace: { passed: diskPassed, details: diskDetails },
      lastBackup: { passed: backupPassed, details: backupDetails },
      backupCount: { passed: countPassed, details: countDetails },
      r2Connectivity: { passed: r2Passed, details: r2Details },
    },
    lastMaintenanceReport,
  };
}
