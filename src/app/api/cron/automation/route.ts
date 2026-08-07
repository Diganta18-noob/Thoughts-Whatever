import { NextResponse } from "next/server";
import { runMasterPipeline } from "@/lib/automation/pipeline";
import { writeLog } from "@/lib/automation/notifications/logger";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron trigger" }, { status: 401 });
  }

  writeLog("automation", "INFO", "Vercel / Serverless Cron Trigger received for Nightly Maintenance Pipeline.");

  try {
    const report = await runMasterPipeline();
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    writeLog("automation", "ERROR", `1:00 AM Cron failed: ${errorMsg}. Retrying at 1:30 AM.`);
    return NextResponse.json({ ok: false, error: errorMsg, retryScheduled: true }, { status: 500 });
  }
}
