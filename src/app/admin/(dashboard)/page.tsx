import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import {
  getOverviewStats,
  getDailyTrend,
  getTopArticles,
  getSeriesAnalytics,
} from "@/lib/analytics";
import { AnalyticsSkeleton } from "@/components/admin/analytics-skeleton";
import { CustomDashboard } from "@/components/admin/custom-dashboard";
import type { AnalyticsData } from "@/components/admin/analytics-dashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Overview & Intelligence" };

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export default async function AdminHomePage() {
  const [recentSettled, analyticsSettled] = await Promise.allSettled([
    withTimeout(
      prisma.piece.findMany({
        select: {
          id: true,
          slug: true,
          kind: true,
          status: true,
          titleBn: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      8000,
      []
    ),
    withTimeout(
      Promise.all([
        getOverviewStats("30d"),
        getDailyTrend(30),
        getTopArticles(10, "30d"),
        getSeriesAnalytics(),
      ]),
      8000,
      null
    ),
  ]);

  const recent = recentSettled.status === "fulfilled" ? recentSettled.value : [];
  let initialAnalyticsData: AnalyticsData | undefined = undefined;

  if (analyticsSettled.status === "fulfilled" && analyticsSettled.value) {
    const [overview, dailyTrend, topArticles, seriesAnalytics] = analyticsSettled.value;
    initialAnalyticsData = {
      overview,
      dailyTrend,
      topArticles: topArticles.map((t) => ({
        ...t,
        publishedAt: t.publishedAt ? t.publishedAt.toISOString() : null,
      })),
      seriesAnalytics,
    };
  }

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <CustomDashboard
        initialAnalyticsData={initialAnalyticsData}
        recentPieces={recent}
      />
    </Suspense>
  );
}

