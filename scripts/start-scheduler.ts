import { initScheduler } from "../src/lib/system/scheduler";

console.log("Starting Thoughts Whatever Standalone System Scheduler Process...");
initScheduler();

process.on("SIGINT", () => {
  console.log("Shutting down scheduler...");
  process.exit(0);
});
