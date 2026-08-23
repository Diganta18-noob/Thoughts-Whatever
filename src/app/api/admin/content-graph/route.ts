import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getContentGraphData } from "@/lib/content-graph";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const includeTags = searchParams.get("includeTags") !== "false";
  const filterKind = searchParams.get("kind") || undefined;

  try {
    const data = await getContentGraphData({ limit, includeTags, filterKind });
    return NextResponse.json({ ok: true, ...data });
  } catch (error: any) {
    console.error("Content Graph Error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load content relationship graph" },
      { status: 500 }
    );
  }
}
