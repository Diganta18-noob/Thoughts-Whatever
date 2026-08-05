import fs from "fs";
import path from "path";
import zlib from "zlib";
import { MaintenanceTaskResult } from "./types";

const LOGS_DIR = path.join(process.cwd(), "logs");
const ARCHIVE_DIR = path.join(LOGS_DIR, "archive");

export async function manageLogs(retentionDays = 90): Promise<MaintenanceTaskResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];
  let rotatedCount = 0;
  let archivedCount = 0;
  let deletedCount = 0;

  try {
    if (!fs.existsSync(LOGS_DIR)) {
      fs.mkdirSync(LOGS_DIR, { recursive: true });
    }
    if (!fs.existsSync(ARCHIVE_DIR)) {
      fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
    }

    const files = fs.readdirSync(LOGS_DIR);
    const now = Date.now();
    const cutoffTime = now - retentionDays * 24 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(LOGS_DIR, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) continue;

      // Rotate .log files older than 1 day
      if (file.endsWith(".log") && !file.includes(".rotated.")) {
        const rotatedName = `${file}.${new Date().toISOString().slice(0, 10)}.rotated`;
        const rotatedPath = path.join(LOGS_DIR, rotatedName);
        fs.renameSync(filePath, rotatedPath);
        rotatedCount++;

        // Compress to archive
        const gzipPath = path.join(ARCHIVE_DIR, `${rotatedName}.gz`);
        const fileContents = fs.readFileSync(rotatedPath);
        const compressed = zlib.gzipSync(fileContents);
        fs.writeFileSync(gzipPath, compressed);
        fs.unlinkSync(rotatedPath);
        archivedCount++;
      }
    }

    // Cleanup old archives
    const archiveFiles = fs.readdirSync(ARCHIVE_DIR);
    for (const file of archiveFiles) {
      const filePath = path.join(ARCHIVE_DIR, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    return {
      taskName: "Log Management",
      status: "SUCCESS",
      severity: "INFO",
      durationMs: Date.now() - startTime,
      message: `Logs rotated: ${rotatedCount}, archived: ${archivedCount}, cleaned up >${retentionDays}d: ${deletedCount}`,
      details: { rotatedCount, archivedCount, deletedCount },
    };
  } catch (err: any) {
    errors.push(err.message || String(err));
    return {
      taskName: "Log Management",
      status: "FAILED",
      severity: "WARNING",
      durationMs: Date.now() - startTime,
      message: "Log management operation failed.",
      errors,
    };
  }
}
