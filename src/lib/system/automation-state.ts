import { prisma } from "@/lib/prisma";

export interface AutomationReportData {
  isRunning: boolean;
  health: {
    status: string;
    dbConnected: boolean;
    memoryUsageMb: number;
  };
  security: {
    activeSessions: number;
    revokedTokenReuseAttempts: number;
  };
  logs: string[];
  lastReport?: {
    timestamp: string;
    overallStatus: string;
    totalDurationMs: number;
    summary: { total: number; passed: number; warnings: number; failed: number };
    steps: { stepNumber: number; name: string; status: string; message: string; durationMs: number }[];
  } | null;
}

export async function getLiveAutomationState(): Promise<AutomationReportData> {
  const now = new Date();

  // 1. Check DB connectivity & heap
  let dbConnected = false;
  try {
    await prisma.piece.findFirst({ select: { id: true } });
    dbConnected = true;
  } catch {
    dbConnected = false;
  }
  const memoryUsageMb = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

  // 2. Query active sessions & revoked tokens
  let activeSessions = 1;
  let revokedTokenReuseAttempts = 0;
  try {
    const [sessions, revoked] = await Promise.all([
      prisma.refreshToken.count({ where: { revoked: false, expiresAt: { gt: now } } }),
      prisma.refreshToken.count({ where: { revoked: true } }),
    ]);
    activeSessions = sessions > 0 ? sessions : 1;
    revokedTokenReuseAttempts = revoked;
  } catch {
    /* fallback defaults */
  }

  // 3. Query audit logs
  let logs: string[] = [];
  try {
    const dbLogs = await prisma.auditLog.findMany({
      where: {
        action: { in: ["automation_pipeline", "maintenance", "backup", "system_health", "auth_action"] },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { action: true, summary: true, createdAt: true, severity: true },
    });
    logs = dbLogs.map(
      (l) => `[${l.createdAt.toISOString()}] [${l.severity.toUpperCase()}] [${l.action}] ${l.summary}`
    );
  } catch {
    /* fallback empty */
  }

  // 4. Query latest pipeline report
  let lastReport = null;
  try {
    const latestAudit = await prisma.auditLog.findFirst({
      where: { action: "automation_pipeline" },
      orderBy: { createdAt: "desc" },
    });
    if (latestAudit?.metadata && typeof latestAudit.metadata === "object") {
      lastReport = latestAudit.metadata as any;
    }
  } catch {
    /* fallback null */
  }

  return {
    isRunning: false,
    health: {
      status: dbConnected ? "HEALTHY" : "CRITICAL",
      dbConnected,
      memoryUsageMb,
    },
    security: {
      activeSessions,
      revokedTokenReuseAttempts,
    },
    logs,
    lastReport,
  };
}
