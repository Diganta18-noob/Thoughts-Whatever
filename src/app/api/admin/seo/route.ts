import { NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { getLatestSEOAudit, runSEOAndBrokenLinkAudit } from "@/lib/seo-scanner";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    let result = await getLatestSEOAudit();
    if (!result) {
      result = await runSEOAndBrokenLinkAudit(admin);
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST() {
  const admin = await requirePermission("seo", "manage");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const result = await runSEOAndBrokenLinkAudit(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
