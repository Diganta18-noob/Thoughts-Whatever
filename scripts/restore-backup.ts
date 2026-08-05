import { restoreBackup } from "../src/lib/system/restore/orchestrator";

async function main() {
  const args = process.argv.slice(2);
  const backupId = args[0];

  if (!backupId) {
    console.log("Usage: npx tsx scripts/restore-backup.ts <backupId> [scope]");
    console.log("Example: npx tsx scripts/restore-backup.ts backup_2026-08-06-03-00-00 full");
    process.exit(1);
  }

  const scope = (args[1] || "full") as "full" | "database" | "media" | "content";

  console.log(`Starting restoration for ${backupId} (scope: ${scope})...`);
  try {
    const result = await restoreBackup(backupId, { scope });
    console.log("Restoration Successful! Result:", result);
  } catch (err: any) {
    console.error("Restoration Failed:", err.message);
    process.exit(1);
  }
}

main();
