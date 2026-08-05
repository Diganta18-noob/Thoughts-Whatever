import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { createBackup } from "@/lib/system/backup/orchestrator";

const BACKUPS_DIR = path.join(process.cwd(), "backups");

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const backups: any[] = [];
  if (fs.existsSync(BACKUPS_DIR)) {
    const dirs = fs.readdirSync(BACKUPS_DIR).filter((d) => fs.statSync(path.join(BACKUPS_DIR, d)).isDirectory());
    for (const dir of dirs) {
      const manifestPath = path.join(BACKUPS_DIR, dir, "manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
          backups.push(manifest);
        } catch {
          /* ignore corrupted */
        }
      }
    }
  }

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
