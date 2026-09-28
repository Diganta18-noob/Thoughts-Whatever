import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { getReferenceActivity, type ReferencePeriod } from "@/lib/reference-analytics";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await requirePermission("analytics", "read"))) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const periodValue = new URL(request.url).searchParams.get("period") || "30d";
  if (!["7d", "30d", "90d", "all"].includes(periodValue)) {
    return NextResponse.json({ ok: false, error: "invalid_period" }, { status: 400 });
  }
  try {
    const data = await getReferenceActivity(periodValue as ReferencePeriod);
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[Reference analytics] Query failed:", error);
    return NextResponse.json({ ok: false, error: "analytics_unavailable" }, { status: 503 });
  }
}
