import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runMasterPipeline } from "@/lib/automation/pipeline";
import { runSEOAndBrokenLinkAudit } from "@/lib/seo-scanner";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requirePermission("jobs", "update");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const jobId = params.id;
  const job = await prisma.scheduledJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return NextResponse.json({ ok: false, error: "Job not found" }, { status: 404 });
  }
  const supported = job.name === "Nightly Backup & Sync" || job.name === "Automated SEO & Link Integrity Scan";
  if (!supported) {
    return NextResponse.json({ ok: false, error: "Job has no configured runner" }, { status: 422 });
  }

  // Record execution started
  const execution = await prisma.jobExecution.create({
    data: {
      jobId,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  await prisma.scheduledJob.update({
    where: { id: jobId },
    data: { status: "RUNNING" },
  });

  const startTime = performance.now();
  let executionLogs: string[] = [];
  let status = "SUCCESS";
  let errorMessage: string | null = null;

  try {
    if (job.name === "Nightly Backup & Sync") {
      executionLogs.push("Executing complete system automation pipeline...");
      const report = await runMasterPipeline();
      executionLogs.push(`Pipeline completed with status: ${report.overallStatus}`);
      executionLogs.push(`Total Steps executed: ${report.steps.length}`);
      if (report.overallStatus === "FAILED") {
        status = "FAILED";
      }
    } else if (job.name === "Automated SEO & Link Integrity Scan") {
      executionLogs.push("Scanning all published pieces for SEO health and link integrity...");
      const scanResult = await runSEOAndBrokenLinkAudit(admin);
      executionLogs.push(`Scan complete. Analyzed ${scanResult.totalPiecesScanned} articles.`);
      executionLogs.push(`Overall SEO Score: ${scanResult.overallScore}/100`);
      executionLogs.push(`Broken links discovered: ${scanResult.brokenLinksCount}`);
    }
  } catch (err: any) {
    status = "FAILED";
    errorMessage = err.message;
    executionLogs.push(`Error executing job: ${err.message}`);
  }

  const durationMs = Math.round(performance.now() - startTime);

  // Update Execution record
  await prisma.jobExecution.update({
    where: { id: execution.id },
    data: {
      status,
      durationMs,
      logs: executionLogs,
      error: errorMessage,
      completedAt: new Date(),
    },
  });

  // Update Job Status
  await prisma.scheduledJob.update({
    where: { id: jobId },
    data: {
      status: "IDLE",
      lastRunAt: new Date(),
      lastStatus: status,
      lastDurationMs: durationMs,
    },
  });

  // Record Audit Log
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      adminName: admin.nameBn ?? "Admin",
      action: "JOB_RUN_MANUAL",
      entityType: "ScheduledJob",
      entityId: job.id,
      summary: `Manually triggered job "${job.name}" (${status}, ${durationMs}ms)`,
      severity: status === "FAILED" ? "error" : "info",
    },
  });

  return NextResponse.json({
    ok: status === "SUCCESS",
    jobName: job.name,
    status,
    durationMs,
    logs: executionLogs,
    error: errorMessage,
  });
}
