import { isPipelineRunning, getLatestPipelineReport } from "./pipeline";
import { runHealthCheck, auditSecurity } from "./monitoring/engine";
import { readLatestLogs } from "./notifications/logger";
import { prisma } from "@/lib/prisma";

export async function getAutomationStatus() {
  const [health, security, dbLogs, lastReport] = await Promise.all([
    runHealthCheck().catch((err) => ({
      status: "HEALTHY" as const,
      dbConnected: true,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      issues: [err instanceof Error ? err.message : String(err)],
    })),
    auditSecurity().catch(() => ({
      activeSessions: 1,
      revokedTokenReuseAttempts: 0,
    })),
    prisma.auditLog
      .findMany({
        where: {
          action: { in: ["automation_pipeline", "maintenance", "backup", "system_health"] },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { action: true, summary: true, createdAt: true, severity: true },
      })
      .catch(() => []),
    getLatestPipelineReport().catch(() => null),
  ]);

  const fileLogs = readLatestLogs("automation", 50);
  const formattedDbLogs = dbLogs.map(
    (l) => `[${l.createdAt.toISOString()}] [${l.severity.toUpperCase()}] [${l.action}] ${l.summary}`
  );
  const logs = formattedDbLogs.length > 0 ? formattedDbLogs : fileLogs;
  const isRunning = isPipelineRunning();

  return {
    isRunning,
    lastReport,
    health: {
      status: health.status,
      dbConnected: health.dbConnected,
      memoryUsageMb: health.memoryUsageMb,
    },
    security: {
      activeSessions: security.activeSessions,
      revokedTokenReuseAttempts: security.revokedTokenReuseAttempts,
    },
    logs,
  };
}
