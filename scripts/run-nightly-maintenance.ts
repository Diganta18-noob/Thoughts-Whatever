import { loadEnvConfig } from "@next/env";
import { prisma } from "../src/lib/prisma";
import { runMasterPipeline } from "../src/lib/automation/pipeline";

loadEnvConfig(process.cwd());

async function main() {
  if (process.env.VERCEL || process.env.NIGHTLY_MAINTENANCE_ENABLED !== "true") {
    throw new Error("Run on the maintenance worker with NIGHTLY_MAINTENANCE_ENABLED=true.");
  }

  const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata" }).format(new Date());
  const id = `nightly-maintenance:${date}`;
  const action = "nightly_maintenance_claim";
  const claim = await prisma.auditLog.createMany({
    data: {
      id,
      action,
      adminEmail: "system@thoughts.whatever.com",
      summary: "RUNNING",
    },
    skipDuplicates: true,
  });
  const retry = claim.count === 0 && await prisma.auditLog.updateMany({
    where: { id, action, summary: "FAILED" },
    data: { summary: "RUNNING", severity: "info" },
  });
  if (claim.count === 0 && (!retry || retry.count === 0)) {
    console.info(`Skipped ${id}: already claimed or complete.`);
    return;
  }

  let result: Awaited<ReturnType<typeof runMasterPipeline>>["overallStatus"];
  try {
    const { createBackup } = await import("../src/lib/system/backup/orchestrator");
    result = (await runMasterPipeline({
      databaseBackup: async () => {
        const backup = await createBackup("database", undefined, { includeAuth: false });
        if (backup.status !== "SUCCESS" || !backup.manifest.verified) {
          throw new Error(`Database backup failed: ${backup.errors?.join(", ") || "checksum verification failed"}`);
        }
        if (process.env.R2_BACKUP_BUCKET_NAME && !backup.r2Path) {
          throw new Error("Database backup was not uploaded to the configured storage.");
        }
        return { backupId: backup.backupId, r2Path: backup.r2Path };
      },
    })).overallStatus;
  } catch (error) {
    await prisma.auditLog.update({ where: { id }, data: { summary: "FAILED", severity: "error" } });
    throw error;
  }
  await prisma.auditLog.update({
    where: { id },
    data: { summary: result, severity: result === "FAILED" ? "error" : "info" },
  });
  if (result === "FAILED") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
