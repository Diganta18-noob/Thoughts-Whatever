import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { runTechnicalSiteAudit, getLatestSiteAudit } from "@/lib/seo-engine/audit-scanner";
import { getOrCreateDefaultWebsite } from "@/lib/seo-engine/websites";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let websiteId = searchParams.get("websiteId");

  try {
    if (!websiteId) {
      const def = await getOrCreateDefaultWebsite();
      websiteId = def.id;
    }

    const audit = await getLatestSiteAudit(websiteId);
    return NextResponse.json(audit);
  } catch (error: any) {
    console.error("Site audit fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch site audit" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requirePermission("audits", "scan");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden: Missing audit scan permission" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const websiteId = body.websiteId;

    if (!websiteId) {
      return NextResponse.json({ error: "websiteId is required" }, { status: 400 });
    }

    const audit = await runTechnicalSiteAudit(websiteId);
    return NextResponse.json({ audit, success: true });
  } catch (error: any) {
    console.error("Audit scan error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute site audit" },
      { status: 500 }
    );
  }
}
