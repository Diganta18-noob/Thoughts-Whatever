import { NextResponse } from "next/server";
import { runMasterPipeline, isPipelineRunning, getLastPipelineReport } from "@/lib/automation/pipeline";
import { runHealthCheck, auditSecurity } from "@/lib/automation/monitoring/engine";
import { readLatestLogs } from "@/lib/automation/notifications/logger";

export async function GET() {
  try {
    const health = await runHealthCheck();
    const security = await auditSecurity();
    const logs = readLatestLogs("automation", 50);
    const lastReport = getLastPipelineReport();
    const isRunning = isPipelineRunning();

    return NextResponse.json({
      ok: true,
      status: {
        isRunning,
        lastReport,
        health,
        security,
        logs,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "run-full-pipeline";

    if (isPipelineRunning()) {
      return NextResponse.json({ ok: false, error: "Pipeline is currently running." }, { status: 409 });
    }

    if (action === "run-full-pipeline") {
      // Run asynchronously or synchronously based on caller request
      const report = await runMasterPipeline();
      return NextResponse.json({ ok: true, message: "Pipeline executed successfully", report });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
