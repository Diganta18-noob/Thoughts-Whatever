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

  // 1. Primary Schedule: 01:00 AM IST
  cron.schedule(
    "0 1 * * *",
    async () => {
      if (isPipelineRunning()) {
        writeLog("automation", "WARN", "1:00 AM trigger skipped — pipeline is already running.");
        return;
      }

      writeLog("automation", "INFO", "⏰ 1:00 AM Production Pipeline Primary Triggered");
      try {
        await runMasterPipeline();
      } catch (err) {
        writeLog("automation", "ERROR", "1:00 AM Pipeline failed. Fallback retry scheduled for 1:30 AM:", err);
      }
    },
    { timezone },
  );

  // 2. Fallback Retry Schedule: 02:00 AM IST
  cron.schedule(
    "0 2 * * *",
    async () => {
      if (isPipelineRunning()) return;

      writeLog("automation", "INFO", "⏰ 2:00 AM Fallback Retry Triggered");
      try {
        await runMasterPipeline();
      } catch (err) {
        writeLog("automation", "ERROR", "2:00 AM Fallback Pipeline execution failed:", err);
      }
    },
    { timezone },
  );

  isSchedulerInitialized = true;
  writeLog("automation", "INFO", "Production Scheduler active: Nightly 1:00 AM Master Maintenance Pipeline.");
}
