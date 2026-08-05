import cron from "node-cron";
import { runMaintenance } from "./maintenance/orchestrator";
import { createBackup } from "./backup/orchestrator";
import { notifyMaintenanceComplete, notifyBackupComplete } from "./notifications";

let isRunning = false;

export function initScheduler() {
  const timezone = process.env.MAINTENANCE_TIMEZONE || "Asia/Kolkata";

  console.log(`[Scheduler] Initializing unified maintenance & backup scheduler (${timezone})...`);

  // 1. 3:00 AM Maintenance Phase
  cron.schedule(
    "0 3 * * *",
    async () => {
      if (isRunning) return;
      isRunning = true;
      console.log("[Scheduler] 3:00 AM Maintenance Phase Triggered.");

      try {
        const report = await runMaintenance();
        await notifyMaintenanceComplete(report);

        if (report.status === "HALTED" || report.status === "FAILED") {
          console.error(`[Scheduler] Maintenance failed or halted (${report.status}). Skipping 3:30 AM Backup.`);
        }
      } catch (err) {
        console.error("[Scheduler] Maintenance execution error:", err);
      } finally {
        isRunning = false;
      }
    },
    { timezone }
  );

  // 2. 3:30 AM Backup Phase
  cron.schedule(
    "30 3 * * *",
    async () => {
      if (isRunning) return;
      isRunning = true;
      console.log("[Scheduler] 3:30 AM Backup Phase Triggered.");

      try {
        const result = await createBackup("full");
        await notifyBackupComplete(result);
      } catch (err) {
        console.error("[Scheduler] Backup execution error:", err);
      } finally {
        isRunning = false;
      }
    },
    { timezone }
  );

  console.log("[Scheduler] Unified schedule active: 3:00 AM Maintenance -> 3:30 AM Backup.");
}
