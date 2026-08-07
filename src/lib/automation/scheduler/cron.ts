/**
 * Production Scheduler — 1:00 AM Cron Engine & Cross-Platform Support
 */

import cron from "node-cron";
import { runMasterPipeline, isPipelineRunning } from "../pipeline";
import { writeLog } from "../notifications/logger";

let isSchedulerInitialized = false;

export function initProductionScheduler() {
  if (isSchedulerInitialized) return;

  const timezone = process.env.AUTOMATION_TIMEZONE || "Asia/Kolkata";

  writeLog("automation", "INFO", `Initializing Production Scheduler (1:00 AM ${timezone} schedule)...`);

  // Cron schedule: 01:00 AM every day
  cron.schedule(
    "0 1 * * *",
    async () => {
      if (isPipelineRunning()) {
        writeLog("automation", "WARN", "1:00 AM trigger skipped — pipeline is already running.");
        return;
      }

      writeLog("automation", "INFO", "⏰ 1:00 AM Production Pipeline Triggered");
      try {
        await runMasterPipeline();
      } catch (err) {
        writeLog("automation", "ERROR", "1:00 AM Pipeline execution fatal error:", err);
      }
    },
    { timezone },
  );

  isSchedulerInitialized = true;
  writeLog("automation", "INFO", "Production Scheduler active: Nightly 1:00 AM Master Maintenance Pipeline.");
}
