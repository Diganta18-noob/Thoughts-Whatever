import fs from "fs";
import path from "path";
import { MaintenanceTaskResult } from "./types";

export async function manageCache(): Promise<MaintenanceTaskResult> {
  const startTime = Date.now();
  const nextCacheDir = path.join(process.cwd(), ".next", "cache", "fetch-cache");
  let clearedCount = 0;

  try {
    if (fs.existsSync(nextCacheDir)) {
      const files = fs.readdirSync(nextCacheDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const file of files) {
        const filePath = path.join(nextCacheDir, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile() && now - stat.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          clearedCount++;
        }
      }
    }

    return {
      taskName: "Cache Management",
      status: "SUCCESS",
      severity: "INFO",
      durationMs: Date.now() - startTime,
      message: `Cleared ${clearedCount} stale fetch-cache entries.`,
      details: { clearedCount },
    };
  } catch (err: any) {
    return {
      taskName: "Cache Management",
      status: "FAILED",
      severity: "INFO",
      durationMs: Date.now() - startTime,
      message: "Cache management failed.",
      errors: [err.message || String(err)],
    };
  }
}
