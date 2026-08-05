import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { runMaintenance } from "@/lib/system/maintenance/orchestrator";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ message: "Maintenance API Ready. Use POST to trigger." });
}

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const report = await runMaintenance();
    return NextResponse.json({ ok: true, report });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Maintenance trigger failed" }, { status: 500 });
  }
}
