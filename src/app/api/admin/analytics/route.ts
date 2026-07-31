import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  getOverviewStats,
  getDailyTrend,
  getTopArticles,
  getSeriesAnalytics,
  type Period,
} from "@/lib/analytics";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") as Period) || "30d";

  try {
    const [overview, dailyTrend, topArticles, seriesAnalytics] = await Promise.all([
      getOverviewStats(period),
      getDailyTrend(period === "7d" ? 7 : 30),
      getTopArticles(10, period),
      getSeriesAnalytics(),
    ]);

    return NextResponse.json({
      overview,
      dailyTrend,
      topArticles,
      seriesAnalytics,
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
