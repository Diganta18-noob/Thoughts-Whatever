import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { calculateContentHealth } from "@/lib/content-health";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const data = await calculateContentHealth();
    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    console.error("[ContentHealthAPI] Error calculating health:", err);
    return NextResponse.json({ ok: false, error: err.message || "Calculation failed" }, { status: 500 });
  }
}
