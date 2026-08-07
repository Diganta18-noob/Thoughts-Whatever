import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { createBackup } from "@/lib/system/backup/orchestrator";
import { getBackupsDir, listR2Backups } from "@/lib/system/backup/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BACKUPS_DIR = getBackupsDir();

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const backupsMap = new Map<string, any>();

  // 1. Get local backups
  if (fs.existsSync(BACKUPS_DIR)) {
    const dirs = fs.readdirSync(BACKUPS_DIR).filter((d) => fs.statSync(path.join(BACKUPS_DIR, d)).isDirectory());
    for (const dir of dirs) {
      const manifestPath = path.join(BACKUPS_DIR, dir, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
          if (manifest.backupId) {
            backupsMap.set(manifest.backupId, manifest);
          }
        } catch {
          /* ignore corrupted */
        }
      }
    }
  }

  // 2. Get remote backups from R2
  try {
    const r2Backups = await listR2Backups();
    for (const manifest of r2Backups) {
      if (manifest.backupId && !backupsMap.has(manifest.backupId)) {
        backupsMap.set(manifest.backupId, manifest);
      }
    }
  } catch (err) {
    console.error("Failed to list R2 backups:", err);
  }

  const backups = Array.from(backupsMap.values());
  backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return NextResponse.json({ backups });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type || "full";
    const result = await createBackup(type);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Backup trigger failed" }, { status: 500 });
  }
}
