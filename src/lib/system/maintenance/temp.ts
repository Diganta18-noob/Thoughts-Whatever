import fs from "fs";
import path from "path";
import { MaintenanceTaskResult } from "./types";

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function clearTempFiles(): Promise<MaintenanceTaskResult> {
  const startTime = Date.now();
  let freedBytes = 0;
  let deletedCount = 0;
  const errors: string[] = [];

  const targets = [
    path.join(process.cwd(), "tmp"),
    path.join(process.cwd(), "public", "uploads", "tmp"),
    path.join(process.cwd(), ".next", "cache", "images"),
  ];

  const now = Date.now();

  for (const dir of targets) {
    if (!fs.existsSync(dir)) continue;

    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isFile() && now - stat.mtimeMs > MAX_AGE_MS) {
          freedBytes += stat.size;
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
    } catch (err: any) {
      errors.push(`Error cleaning ${dir}: ${err.message}`);
    }
  }

  const freedMB = (freedBytes / (1024 * 1024)).toFixed(2);

  return {
    taskName: "Temp Files Cleanup",
    status: errors.length > 0 ? "WARNING" : "SUCCESS",
    severity: "INFO",
    durationMs: Date.now() - startTime,
    message: `Cleaned ${deletedCount} temporary file(s), reclaiming ${freedMB} MB.`,
    details: { deletedCount, freedBytes, freedMB },
    errors,
  };
}
