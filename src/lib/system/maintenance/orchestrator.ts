import { optimizeDatabase } from "./database";
import { manageLogs } from "./logs";
import { clearTempFiles } from "./temp";
import { checkDisk } from "./disk";
import { runSecurityChecks } from "./security";
import { analyzePerformance } from "./performance";
import { manageCache } from "./cache";
import { cleanupSessions } from "./session";
import { MaintenanceReport, MaintenanceTaskResult } from "./types";

export async function runMaintenance(): Promise<MaintenanceReport> {
  const startTime = Date.now();
  const tasks: MaintenanceTaskResult[] = [];
  let halted = false;
  let haltReason: string | undefined;

  // Task Priority Order with Halt-on-Failure checking
  const taskPipeline = [
    { name: "Database Optimization", fn: () => optimizeDatabase() },
    { name: "Session Cleanup", fn: () => cleanupSessions() },
    { name: "Log Management", fn: () => manageLogs() },
    { name: "Temp Files Cleanup", fn: () => clearTempFiles() },
    { name: "Disk Space Monitor", fn: () => checkDisk() },
    { name: "Security Checks", fn: () => runSecurityChecks() },
    { name: "Performance Analysis", fn: () => analyzePerformance() },
    { name: "Cache Management", fn: () => manageCache() },
  ];

  for (const step of taskPipeline) {
    if (halted) {
      tasks.push({
        taskName: step.name,
        status: "SKIPPED",
        severity: "INFO",
        durationMs: 0,
        message: `Skipped due to critical halt: ${haltReason}`,
      });
      continue;
    }

    const res = await step.fn();
    tasks.push(res);

    if (res.status === "HALTED" || (res.status === "FAILED" && res.severity === "CRITICAL")) {
      halted = true;
      haltReason = `${res.taskName}: ${res.message}`;
    }
  }

  const passed = tasks.filter((t) => t.status === "SUCCESS").length;
  const warnings = tasks.filter((t) => t.status === "WARNING").length;
  const failed = tasks.filter((t) => t.status === "FAILED" || t.status === "HALTED").length;

  const overallStatus = halted
    ? "HALTED"
    : failed > 0
    ? "FAILED"
    : warnings > 0
    ? "WARNING"
    : "SUCCESS";

  return {
    timestamp: new Date().toISOString(),
    status: overallStatus,
    totalDurationMs: Date.now() - startTime,
    halted,
    haltReason,
    tasks,
    summary: {
      total: tasks.length,
      passed,
      warnings,
      failed,
    },
  };
}
