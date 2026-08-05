import { prisma } from "@/lib/prisma";
import { MaintenanceTaskResult } from "./types";

export async function cleanupSessions(analyticsRetentionDays = 90): Promise<MaintenanceTaskResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    const now = new Date();

    // 1. Delete expired or revoked refresh tokens older than 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deletedTokens = await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { revoked: true, createdAt: { lt: sevenDaysAgo } },
        ],
      },
    });

    // 2. Clean up old analytics events > retention days
    const analyticsCutoff = new Date(now.getTime() - analyticsRetentionDays * 24 * 60 * 60 * 1000);
    const deletedAnalytics = await prisma.analyticsEvent.deleteMany({
      where: { createdAt: { lt: analyticsCutoff } },
    });

    return {
      taskName: "Session Cleanup",
      status: "SUCCESS",
      severity: "INFO",
      durationMs: Date.now() - startTime,
      message: `Cleaned up ${deletedTokens.count} refresh tokens and ${deletedAnalytics.count} old analytics events (> ${analyticsRetentionDays}d).`,
      details: {
        deletedTokensCount: deletedTokens.count,
        deletedAnalyticsCount: deletedAnalytics.count,
      },
    };
  } catch (err: any) {
    return {
      taskName: "Session Cleanup",
      status: "FAILED",
      severity: "WARNING",
      durationMs: Date.now() - startTime,
      message: "Session cleanup operation failed.",
      errors: [err.message || String(err)],
    };
  }
}
