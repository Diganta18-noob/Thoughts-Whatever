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
    // Parallelized server-side execution of all 4 aggregated analytics sections
    const [overview, dailyTrend, topArticles, seriesAnalytics] = await Promise.all([
      getOverviewStats(period),
      getDailyTrend(period === "7d" ? 7 : 30),
      getTopArticles(10, period),
      getSeriesAnalytics(),
    ]);

    return NextResponse.json(
      {
        success: true,
        overview,
        dailyTrend,
        topArticles,
        seriesAnalytics,
      },
      {
        headers: {
          // Micro-cache dashboard response for 10 seconds to eliminate redundant serverless calls
          "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Failed to fetch consolidated admin dashboard analytics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
