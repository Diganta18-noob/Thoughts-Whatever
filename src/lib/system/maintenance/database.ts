import { prisma } from "@/lib/prisma";
import { MaintenanceTaskResult } from "./types";

export async function optimizeDatabase(): Promise<MaintenanceTaskResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // 1. Analyze database for planner statistics
    await prisma.$executeRawUnsafe(`ANALYZE;`);
    
    // 2. Safe Vacuum to clean dead tuples without locking tables exclusively
    await prisma.$executeRawUnsafe(`VACUUM;`);

    // 3. Collect table statistics and size
    const tableStats = await prisma.$queryRaw<
      Array<{ relname: string; n_dead_tup: bigint; n_live_tup: bigint; total_bytes: bigint }>
    >`
      SELECT 
        relname, 
        n_dead_tup, 
        n_live_tup, 
        pg_total_relation_size(relid) as total_bytes
      FROM pg_stat_user_tables;
    `;

    const formattedStats = tableStats.map(stat => ({
      table: stat.relname,
      liveTuples: Number(stat.n_live_tup),
      deadTuples: Number(stat.n_dead_tup),
      sizeBytes: Number(stat.total_bytes),
      bloatRatio: Number(stat.n_live_tup) > 0 ? (Number(stat.n_dead_tup) / Number(stat.n_live_tup)).toFixed(2) : "0",
    }));

    // Check high bloat warnings
    for (const stat of formattedStats) {
      if (parseFloat(stat.bloatRatio) > 0.3 && stat.deadTuples > 100) {
        warnings.push(`Table '${stat.table}' has high bloat ratio (${stat.bloatRatio}).`);
      }
    }

    return {
      taskName: "Database Optimization",
      status: warnings.length > 0 ? "WARNING" : "SUCCESS",
      severity: "INFO",
      durationMs: Date.now() - startTime,
      message: "Database VACUUM and ANALYZE completed successfully.",
      details: { tables: formattedStats },
      warnings,
    };
  } catch (err: any) {
    errors.push(err.message || String(err));
    return {
      taskName: "Database Optimization",
      status: "FAILED",
      severity: "CRITICAL",
      durationMs: Date.now() - startTime,
      message: "Failed to optimize database.",
      errors,
    };
  }
}
