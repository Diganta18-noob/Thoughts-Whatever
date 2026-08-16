import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { auditSystemAction } from "@/lib/audit";
import { runMasterPipeline, isPipelineRunning, getLatestPipelineReport } from "@/lib/automation/pipeline";
import { runHealthCheck, auditSecurity } from "@/lib/automation/monitoring/engine";
import { readLatestLogs } from "@/lib/automation/notifications/logger";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [health, security, dbLogs, lastReport] = await Promise.all([
      runHealthCheck().catch((err) => ({
        status: "DEGRADED" as const,
        dbConnected: false,
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
      getLatestPipelineReport(),
    ]);

    const fileLogs = readLatestLogs("automation", 50);
    const formattedDbLogs = dbLogs.map(
      (l) => `[${l.createdAt.toISOString()}] [${l.severity.toUpperCase()}] [${l.action}] ${l.summary}`
    );
    const logs = formattedDbLogs.length > 0 ? formattedDbLogs : fileLogs;
    const isRunning = isPipelineRunning();

    return NextResponse.json({
      ok: true,
      status: {
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
      },
    });
  } catch (err) {
    console.error("[AutomationStatus] Failed to load automation status:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "run-full-pipeline";

    if (isPipelineRunning()) {
      return NextResponse.json({ ok: false, error: "Pipeline is currently running." }, { status: 409 });
    }

    if (action === "run-full-pipeline") {
      await auditSystemAction("pipeline_trigger", `Admin ${admin.email} triggered full pipeline manually`);
      const report = await runMasterPipeline();
      return NextResponse.json({ ok: true, message: "Pipeline executed successfully", report });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[AutomationPipeline] Pipeline execution failure:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
