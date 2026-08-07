/**
 * Automation Logger & Log Rotation Module
 */

import fs from "fs";
import path from "path";
import { getBackupsDir } from "@/lib/system/backup/storage";

export type LogCategory = "automation" | "backup" | "maintenance" | "security" | "performance";

function getLogsDir(): string {
  const isServerless = process.env.VERCEL || process.env.NEXT_RUNTIME === "nodejs";
  const baseDir = isServerless ? "/tmp" : path.join(process.cwd(), "automation");
  const logsDir = path.join(baseDir, "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  return logsDir;
}

export function writeLog(category: LogCategory, level: "INFO" | "WARN" | "ERROR", message: string, details?: unknown) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message} ${details ? JSON.stringify(details) : ""}\n`;

  console.log(`[Automation:${category.toUpperCase()}] [${level}] ${message}`);

  try {
    const logFile = path.join(getLogsDir(), `${category}.log`);
    fs.appendFileSync(logFile, logLine, "utf-8");
  } catch (err) {
    console.error(`Failed to write to ${category}.log:`, err);
  }
}

export async function rotateLogs(maxDays = 30): Promise<{ rotated: number; deleted: number }> {
  const logsDir = getLogsDir();
  if (!fs.existsSync(logsDir)) return { rotated: 0, deleted: 0 };

  const files = fs.readdirSync(logsDir);
  const now = Date.now();
  const cutoffMs = maxDays * 24 * 60 * 60 * 1000;
  let deleted = 0;

  for (const file of files) {
    const filePath = path.join(logsDir, file);
    try {
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > cutoffMs) {
        fs.unlinkSync(filePath);
        deleted++;
      }
    } catch {
      /* ignore file stat/unlink errors */
    }
  }

  writeLog("maintenance", "INFO", `Log rotation completed. Deleted ${deleted} old log files (> ${maxDays} days).`);
  return { rotated: files.length - deleted, deleted };
}

export function readLatestLogs(category: LogCategory, linesCount = 100): string[] {
  try {
    const logFile = path.join(getLogsDir(), `${category}.log`);
    if (!fs.existsSync(logFile)) return [];

    const content = fs.readFileSync(logFile, "utf-8");
    const lines = content.trim().split("\n");
    return lines.slice(-linesCount);
  } catch {
    return [];
  }
}
