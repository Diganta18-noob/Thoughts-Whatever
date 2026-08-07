import { NextResponse } from "next/server";
import { runMasterPipeline } from "@/lib/automation/pipeline";
import { writeLog } from "@/lib/automation/notifications/logger";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron trigger" }, { status: 401 });
  }

  writeLog("automation", "INFO", "Vercel / Serverless Cron Trigger received for 1:00 AM Pipeline.");

  try {
    const report = await runMasterPipeline();
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
