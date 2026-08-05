import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { restoreBackup } from "@/lib/system/restore/orchestrator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { backupId, scope } = body;

    if (!backupId) {
      return NextResponse.json({ error: "backupId is required" }, { status: 400 });
    }

    const result = await restoreBackup(backupId, { scope });
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Restoration failed" }, { status: 500 });
  }
}
