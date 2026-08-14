import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  getOverviewStats,
  getDailyTrend,
  getTopArticles,
  getSeriesAnalytics,
  type Period,
} from "@/lib/analytics";

export const maxDuration = 60;
export const runtime = "nodejs";

const getCachedAnalytics = unstable_cache(
  async (period: Period) => {
    const [overview, dailyTrend, topArticles, seriesAnalytics] = await Promise.all([
      getOverviewStats(period),
      getDailyTrend(period === "7d" ? 7 : 30),
      getTopArticles(10, period),
      getSeriesAnalytics(),
    ]);
    return {
      overview,
      dailyTrend,
      topArticles: topArticles.map((t) => ({
        ...t,
        publishedAt: t.publishedAt ? t.publishedAt.toISOString() : null,
      })),
      seriesAnalytics,
    };
  },
  ["admin-analytics-data"],
  { revalidate: 60, tags: ["analytics"] }
);

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") as Period) || "30d";

  try {
    const data = await getCachedAnalytics(period);

    return NextResponse.json(
      {
        success: true,
        ...data,
      },
      {
        headers: {
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
