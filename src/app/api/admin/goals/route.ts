import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    let activeGoals = await prisma.goal.findMany({ orderBy: { createdAt: "desc" } });

    // Seed initial editorial KPI goals if none exist yet
    if (activeGoals.length === 0) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      await prisma.goal.createMany({
        data: [
          {
            title: "Monthly Page Views Target",
            metricKey: "pageviews",
            targetValue: 10000,
            currentValue: 0,
            unit: "count",
            period: "monthly",
            startDate: startOfMonth,
            endDate: endOfMonth,
            owner: "Editorial Team",
            status: "ON_TRACK",
          },
          {
            title: "Published Pieces Goal",
            metricKey: "articles_published",
            targetValue: 20,
            currentValue: 0,
            unit: "count",
            period: "monthly",
            startDate: startOfMonth,
            endDate: endOfMonth,
            owner: "Lead Editor",
            status: "ON_TRACK",
          },
          {
            title: "Subscriber Growth Milestone",
            metricKey: "subscribers",
            targetValue: 500,
            currentValue: 0,
            unit: "count",
            period: "quarterly",
            startDate: startOfMonth,
            endDate: new Date(now.getFullYear(), now.getMonth() + 3, 0, 23, 59, 59),
            owner: "Growth Team",
            status: "ON_TRACK",
          },
        ],
      });

      activeGoals = await prisma.goal.findMany({ orderBy: { createdAt: "desc" } });
    }

    // Calculate actual 100% real numbers from PostgreSQL for each goal's time window
    const calculatedGoals = await Promise.all(
      activeGoals.map(async (g) => {
        let current = 0;
        if (g.metricKey === "pageviews") {
          current = await prisma.analyticsEvent.count({
            where: {
              eventType: "view",
              createdAt: { gte: g.startDate, lte: g.endDate },
            },
          });
        } else if (g.metricKey === "articles_published") {
          current = await prisma.piece.count({
            where: {
              status: "PUBLISHED",
              publishedAt: { gte: g.startDate, lte: g.endDate },
            },
          });
        } else if (g.metricKey === "subscribers") {
          current = await prisma.subscriber.count({
            where: {
              unsubscribedAt: null,
              createdAt: { gte: g.startDate, lte: g.endDate },
            },
          });
        } else {
          current = g.currentValue;
        }

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
      })
    );

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
    const { title, metricKey, targetValue, unit, period, startDate, endDate, owner } = body;

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
        startDate: startDate ? new Date(startDate) : new Date(),
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
