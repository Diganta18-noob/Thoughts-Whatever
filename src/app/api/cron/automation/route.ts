import { NextResponse } from "next/server";
import { runMasterPipeline, getLastPipelineReport } from "@/lib/automation/pipeline";
import { writeLog } from "@/lib/automation/notifications/logger";

export const maxDuration = 300;
export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron trigger" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isRetryTrigger = searchParams.get("retry") === "true";

  // Check if today's 1:00 AM pipeline already ran successfully
  const lastReport = getLastPipelineReport();
  if (lastReport) {
    const reportDate = new Date(lastReport.timestamp).toISOString().slice(0, 10);
    const todayDate = new Date().toISOString().slice(0, 10);
    if (reportDate === todayDate && lastReport.overallStatus === "SUCCESS") {
      writeLog("automation", "INFO", `Cron trigger received (${isRetryTrigger ? "2:00 AM Retry" : "1:00 AM"}), but pipeline already succeeded today (${todayDate}). Skipping duplicate run.`);
      return NextResponse.json({ ok: true, message: "Pipeline already succeeded today. Duplicate run skipped.", skipped: true });
    }
  }

  writeLog("automation", "INFO", `Vercel / Serverless Cron Trigger received (${isRetryTrigger ? "2:00 AM Fallback Retry" : "1:00 AM Primary"}).`);

  try {
    const report = await runMasterPipeline();
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    writeLog("automation", "ERROR", `Cron pipeline failed: ${errorMsg}.`);
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}

