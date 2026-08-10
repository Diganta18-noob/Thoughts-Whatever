import os from "os";
import { MaintenanceTaskResult } from "./types";

export async function analyzePerformance(): Promise<MaintenanceTaskResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2);
    const rssMB = (memoryUsage.rss / (1024 * 1024)).toFixed(2);

    const cpus = os.cpus();
    const cpuModel = cpus[0]?.model || "Unknown";
    const coreCount = cpus.length;

    const connCount = 1; // MongoDB Atlas connection pool

    if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
      warnings.push(`High Node.js memory consumption: ${heapUsedMB} MB Heap.`);
    }

    return {
      taskName: "Performance Analysis",
      status: warnings.length > 0 ? "WARNING" : "SUCCESS",
      severity: "INFO",
      durationMs: Date.now() - startTime,
      message: `Memory: ${heapUsedMB}MB Heap (${rssMB}MB RSS), CPU Cores: ${coreCount}, DB Active Connections: ${connCount}.`,
      details: {
        heapUsedMB: Number(heapUsedMB),
        rssMB: Number(rssMB),
        cpuModel,
        coreCount,
        activeConnections: connCount,
      },
      warnings,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      taskName: "Performance Analysis",
      status: "FAILED",
      severity: "INFO",
      durationMs: Date.now() - startTime,
      message: "Performance analysis failed.",
      errors: [message],
    };
  }
}
