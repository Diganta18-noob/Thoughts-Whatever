import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getOverviewStats,
  getDailyTrend,
  getTopArticles,
  getSeriesAnalytics,
  getTrafficSources,
  Period,
} from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") as Period) || "30d";
  const format = searchParams.get("format");

  try {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "today" || period === "yesterday" ? 2 : 30;

    const [overview, dailyTrend, topArticles, seriesStats, sources] = await Promise.all([
      getOverviewStats(period),
      getDailyTrend(days),
      getTopArticles(10, period),
      getSeriesAnalytics(),
      getTrafficSources(period),
    ]);

    if (format === "csv") {
      let csv = "Date,Page Views,Unique Visitors\n";
      for (const row of dailyTrend) {
        csv += `${row.date},${row.views},${row.visitors}\n`;
      }
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="analytics-${period}.csv"`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      period,
      overview,
      dailyTrend,
      topArticles,
      seriesStats,
      sources,
    });
  } catch (err: any) {
    console.error("[AnalyticsAPI] Error querying analytics:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
