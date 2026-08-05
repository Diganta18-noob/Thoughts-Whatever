import checkDiskSpace from "check-disk-space";
import { MaintenanceTaskResult } from "./types";

export async function checkDisk(minFreePercent = 20): Promise<MaintenanceTaskResult> {
  const startTime = Date.now();
  const rootPath = process.platform === "win32" ? "C:" : "/";

  try {
    const diskInfo = await checkDiskSpace(rootPath);
    const freePercent = (diskInfo.free / diskInfo.size) * 100;
    const freeGB = (diskInfo.free / (1024 * 1024 * 1024)).toFixed(2);
    const totalGB = (diskInfo.size / (1024 * 1024 * 1024)).toFixed(2);

    const isCritical = freePercent < minFreePercent;

    return {
      taskName: "Disk Space Monitor",
      status: isCritical ? "HALTED" : freePercent < 30 ? "WARNING" : "SUCCESS",
      severity: isCritical ? "CRITICAL" : "INFO",
      durationMs: Date.now() - startTime,
      message: `Disk space: ${freeGB} GB free of ${totalGB} GB (${freePercent.toFixed(1)}%). Threshold: ${minFreePercent}%.`,
      details: {
        diskPath: diskInfo.diskPath,
        sizeBytes: diskInfo.size,
        freeBytes: diskInfo.free,
        freePercent: Number(freePercent.toFixed(1)),
        isCritical,
      },
      warnings: isCritical ? [`Disk space critically low (<${minFreePercent}% free)! Operations halted.`] : undefined,
    };
  } catch (err: any) {
    return {
      taskName: "Disk Space Monitor",
      status: "FAILED",
      severity: "CRITICAL",
      durationMs: Date.now() - startTime,
      message: "Failed to query disk space.",
      errors: [err.message || String(err)],
    };
  }
}
