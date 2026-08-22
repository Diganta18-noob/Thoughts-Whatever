import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch live metrics to calculate current progress
    const [pageviewsCount, articlesCount, subscribersCount, goals] = await Promise.all([
      prisma.analyticsEvent.count({ where: { eventType: "view" } }),
      prisma.piece.count({ where: { status: "PUBLISHED" } }),
      prisma.subscriber.count({ where: { unsubscribedAt: null } }),
      prisma.goal.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    // If no goals exist yet, seed initial editorial KPI goals
    let activeGoals = goals;
    if (goals.length === 0) {
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const created = await prisma.goal.createMany({
        data: [
          {
            title: "Monthly Page Views Target",
            metricKey: "pageviews",
            targetValue: 10000,
            currentValue: pageviewsCount,
            unit: "count",
            period: "monthly",
            endDate: endOfMonth,
            owner: "Editorial Team",
            status: pageviewsCount >= 7500 ? "ON_TRACK" : "AT_RISK",
          },
          {
            title: "Published Pieces Goal",
            metricKey: "articles_published",
            targetValue: 20,
            currentValue: articlesCount,
            unit: "count",
            period: "monthly",
            endDate: endOfMonth,
            owner: "Lead Editor",
            status: "ON_TRACK",
          },
          {
            title: "Subscriber Growth Milestone",
            metricKey: "subscribers",
            targetValue: 500,
            currentValue: subscribersCount,
            unit: "count",
            period: "quarterly",
            endDate: new Date(now.getFullYear(), now.getMonth() + 3, 0),
            owner: "Growth Team",
            status: "ON_TRACK",
          },
        ],
      });

      activeGoals = await prisma.goal.findMany({ orderBy: { createdAt: "desc" } });
    }

    const calculatedGoals = activeGoals.map((g) => {
      let current = g.currentValue;
      if (g.metricKey === "pageviews") current = pageviewsCount;
      if (g.metricKey === "articles_published") current = articlesCount;
      if (g.metricKey === "subscribers") current = subscribersCount;

      const progressPct = Math.min(100, Math.round((current / (g.targetValue || 1)) * 100));
      let status = "ON_TRACK";
      if (progressPct < 50) status = "BEHIND";
      else if (progressPct < 80) status = "AT_RISK";

      return {
        ...g,
        currentValue: current,
        progressPct,
        status,
      };
    });

    return NextResponse.json({ ok: true, goals: calculatedGoals });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requirePermission("analytics", "manage");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { title, metricKey, targetValue, unit, period, endDate, owner } = body;

    if (!title || !targetValue) {
      return NextResponse.json({ ok: false, error: "title_and_target_required" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        metricKey: metricKey || "pageviews",
        targetValue: parseFloat(targetValue),
        unit: unit || "count",
        period: period || "monthly",
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        owner: owner || "Editorial Team",
      },
    });

    await logAuditEvent({
      action: "goal.created",
      entityType: "Goal",
      entityId: goal.id,
      summary: `Created editorial goal "${title}" with target ${targetValue}`,
      adminId: admin.id,
      adminEmail: admin.email,
    });

    return NextResponse.json({ ok: true, goal });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requirePermission("analytics", "manage");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
    }

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ ok: true, message: "Goal deleted" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
