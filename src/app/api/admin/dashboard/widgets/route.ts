import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_WIDGETS = [
  { id: "overview_metrics", type: "metrics", title: "Key Metrics", enabled: true, order: 0 },
  { id: "recent_pieces", type: "pieces", title: "Recently Edited", enabled: true, order: 1 },
  { id: "activity_stream", type: "activity", title: "Live Activity", enabled: true, order: 2 },
  { id: "content_health", type: "health", title: "Content Health", enabled: true, order: 3 },
  { id: "seo_summary", type: "seo", title: "SEO Status", enabled: true, order: 4 },
];

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const layout = await prisma.dashboardLayout.findUnique({
      where: { adminUserId: admin.id },
    });

    return NextResponse.json({
      ok: true,
      widgets: layout?.widgets || DEFAULT_WIDGETS,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { widgets } = body;

    if (!Array.isArray(widgets)) {
      return NextResponse.json({ ok: false, error: "widgets_array_required" }, { status: 400 });
    }

    const layout = await prisma.dashboardLayout.upsert({
      where: { adminUserId: admin.id },
      update: { widgets },
      create: { adminUserId: admin.id, widgets },
    });

    return NextResponse.json({ ok: true, layout });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
