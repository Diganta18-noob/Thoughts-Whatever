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

    // Seed realistic initial goals if none exist or if existing goals were empty templates
    if (activeGoals.length === 0) {
      const now = new Date();
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

      await prisma.goal.createMany({
        data: [
          {
            title: "Total Published Catalog Goal",
            metricKey: "articles_published",
            targetValue: 30,
            currentValue: 0,
            unit: "count",
            period: "cumulative",
            startDate: new Date(2026, 0, 1),
            endDate: endOfYear,
            owner: "Lead Editor",
            status: "ON_TRACK",
          },
          {
            title: "Audience Readership Milestone",
            metricKey: "pageviews",
            targetValue: 1000,
            currentValue: 0,
            unit: "count",
            period: "cumulative",
            startDate: new Date(2026, 0, 1),
            endDate: endOfYear,
            owner: "Editorial Team",
            status: "ON_TRACK",
          },
          {
            title: "Newsletter Subscriber Growth",
            metricKey: "subscribers",
            targetValue: 100,
            currentValue: 0,
            unit: "count",
            period: "cumulative",
            startDate: new Date(2026, 0, 1),
            endDate: endOfYear,
            owner: "Growth Team",
            status: "BEHIND",
          },
        ],
      });

      activeGoals = await prisma.goal.findMany({ orderBy: { createdAt: "desc" } });
    }

    // Calculate actual real numbers from PostgreSQL
    const calculatedGoals = await Promise.all(
      activeGoals.map(async (g) => {
        let current = 0;
        const isCumulative = g.period === "cumulative" || g.period === "all" || !g.startDate;

        if (g.metricKey === "pageviews") {
          current = await prisma.analyticsEvent.count({
            where: {
              eventType: "view",
              ...(!isCumulative && g.startDate ? { createdAt: { gte: g.startDate, lte: g.endDate } } : {}),
            },
          });
        } else if (g.metricKey === "articles_published") {
          current = await prisma.piece.count({
            where: {
              status: "PUBLISHED",
              ...(!isCumulative && g.startDate ? { publishedAt: { gte: g.startDate, lte: g.endDate } } : {}),
            },
          });
        } else if (g.metricKey === "subscribers") {
          current = await prisma.subscriber.count({
            where: {
              unsubscribedAt: null,
              ...(!isCumulative && g.startDate ? { createdAt: { gte: g.startDate, lte: g.endDate } } : {}),
            },
          });
        } else {
          current = g.currentValue;
        }

        const progressPct = Math.min(100, Math.round((current / (g.targetValue || 1)) * 100));
        let status = "ON_TRACK";
        if (progressPct < 30) status = "BEHIND";
        else if (progressPct < 75) status = "AT_RISK";

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
        period: period || "cumulative",
        startDate: startDate ? new Date(startDate) : new Date(2026, 0, 1),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
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
