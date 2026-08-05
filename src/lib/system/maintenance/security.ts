import { exec } from "child_process";
import util from "util";
import { prisma } from "@/lib/prisma";
import { MaintenanceTaskResult } from "./types";

const execPromise = util.promisify(exec);

export async function runSecurityChecks(): Promise<MaintenanceTaskResult> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const errors: string[] = [];
  let vulnSummary = null;

  try {
    // 1. Audit npm dependencies
    try {
      const { stdout } = await execPromise("npm audit --json");
      const auditResult = JSON.parse(stdout);
      if (auditResult.metadata?.vulnerabilities) {
        const v = auditResult.metadata.vulnerabilities;
        vulnSummary = v;
        if (v.high > 0 || v.critical > 0) {
          warnings.push(`Vulnerabilities detected: ${v.critical} critical, ${v.high} high.`);
        }
      }
    } catch (e: any) {
      // npm audit exits non-zero if vulnerabilities are found
      if (e.stdout) {
        try {
          const auditResult = JSON.parse(e.stdout);
          const v = auditResult.metadata?.vulnerabilities;
          if (v) {
            vulnSummary = v;
            if (v.high > 0 || v.critical > 0) {
              warnings.push(`Vulnerabilities detected: ${v.critical} critical, ${v.high} high.`);
            }
          }
        } catch {
          /* ignore parse fail */
        }
      }
    }

    // 2. Check admin user count & integrity
    const adminCount = await prisma.adminUser.count();
    if (adminCount === 0) {
      warnings.push("No admin users found in database!");
    }

    return {
      taskName: "Security Checks",
      status: warnings.length > 0 ? "WARNING" : "SUCCESS",
      severity: "INFO",
      durationMs: Date.now() - startTime,
      message: `Security audit completed. ${adminCount} admin user(s) registered.`,
      details: { adminCount, vulnerabilities: vulnSummary },
      warnings,
    };
  } catch (err: any) {
    errors.push(err.message || String(err));
    return {
      taskName: "Security Checks",
      status: "FAILED",
      severity: "WARNING",
      durationMs: Date.now() - startTime,
      message: "Security checks failed.",
      errors,
    };
  }
}
