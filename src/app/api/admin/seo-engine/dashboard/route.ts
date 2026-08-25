import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getWebsiteDashboardMetrics, getOrCreateDefaultWebsite } from "@/lib/seo-engine/websites";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let websiteId = searchParams.get("websiteId");

  try {
    if (!websiteId) {
      const defaultWebsite = await getOrCreateDefaultWebsite();
      websiteId = defaultWebsite.id;
    }

    const data = await getWebsiteDashboardMetrics(websiteId);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load dashboard metrics" },
      { status: 500 }
    );
  }
}
