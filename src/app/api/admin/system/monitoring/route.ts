import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import os from "os";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const start = performance.now();
  let dbHealthy = false;
  let dbLatencyMs = 0;

  try {
    const dbStart = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Math.round(performance.now() - dbStart);
    dbHealthy = true;
  } catch (err) {
    console.error("DB Health check failure:", err);
  }

  // System memory & process stats
  const memUsage = process.memoryUsage();
  const heapUsedMb = Math.round((memUsage.heapUsed / 1024 / 1024) * 10) / 10;
  const heapTotalMb = Math.round((memUsage.heapTotal / 1024 / 1024) * 10) / 10;
  const rssMb = Math.round((memUsage.rss / 1024 / 1024) * 10) / 10;
  const uptimeSec = Math.round(process.uptime());

  // Recent system error audits
  const recentErrors = await prisma.auditLog.findMany({
    where: {
      severity: { in: ["warning", "critical", "error"] },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      action: true,
      summary: true,
      severity: true,
      createdAt: true,
      adminEmail: true,
    },
  });

  // Recent incidents count
  const activeIncidentsCount = await prisma.incident.count({
    where: { status: { in: ["DETECTED", "INVESTIGATING"] } },
  });

  // Scheduled jobs health
  const totalJobs = await prisma.scheduledJob.count();
  const failedJobs = await prisma.scheduledJob.count({
    where: { lastStatus: "FAILED" },
  });

  const durationMs = Math.round(performance.now() - start);

  return NextResponse.json({
    ok: true,
    data: {
      timestamp: new Date().toISOString(),
      api: {
        status: "HEALTHY",
        latencyMs: durationMs,
        uptimeSec,
        nodeVersion: process.version,
      },
      database: {
        status: dbHealthy ? "HEALTHY" : "CRITICAL",
        latencyMs: dbLatencyMs,
        provider: "PostgreSQL (Supabase)",
      },
      memory: {
        heapUsedMb,
        heapTotalMb,
        rssMb,
        usagePct: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      system: {
        platform: os.platform(),
        cpus: os.cpus().length,
        totalMemMb: Math.round(os.totalmem() / 1024 / 1024),
        freeMemMb: Math.round(os.freemem() / 1024 / 1024),
      },
      summary: {
        activeIncidentsCount,
        totalJobs,
        failedJobs,
      },
      recentErrors,
    },
  });
}
