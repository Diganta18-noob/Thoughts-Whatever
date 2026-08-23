import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getEditorialIntelligenceData } from "@/lib/editorial-intelligence";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const data = await getEditorialIntelligenceData();
    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error: any) {
    console.error("Editorial Intelligence Error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to generate editorial intelligence" },
      { status: 500 }
    );
  }
}
