import { prisma } from "@/lib/prisma";

export type Period = "7d" | "30d" | "all";

function getStartDate(period: Period): Date | undefined {
  const now = new Date();
  if (period === "7d") return new Date(now.setDate(now.getDate() - 7));
  if (period === "30d") return new Date(now.setDate(now.getDate() - 30));
  return undefined;
}

export async function getOverviewStats(period: Period = "30d") {
  const startDate = getStartDate(period);
  const dateFilter = startDate ? { gte: startDate } : undefined;

  const [totalViews, uniqueVisitorsResult, totalArticles, totalSubscribers, totalReelClicks] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { eventType: "view", ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["sessionId"],
      where: { ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.piece.count({ where: { status: "PUBLISHED" } }),
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.analyticsEvent.count({
      where: {
        eventType: { in: ["instagram_click", "reel_click"] },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
    }),
  ]);

  return {
    totalViews,
    uniqueVisitors: uniqueVisitorsResult.length,
    totalArticles,
    totalSubscribers,
    totalReelClicks,
  };
}

export async function getDailyTrend(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const events = await prisma.analyticsEvent.findMany({
    where: {
      eventType: "view",
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      sessionId: true,
    },
  });

  const dailyMap: Record<string, { date: string; views: number; visitors: Set<string> }> = {};

  // Pre-fill days
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = { date: key, views: 0, visitors: new Set() };
  }

  events.forEach((ev) => {
    const key = ev.createdAt.toISOString().split("T")[0];
    if (dailyMap[key]) {
      dailyMap[key].views += 1;
      dailyMap[key].visitors.add(ev.sessionId);
    }
  });

  return Object.values(dailyMap).map((d) => ({
    date: d.date,
    views: d.views,
    visitors: d.visitors.size,
  }));
}

export async function getTopArticles(limit: number = 10, period: Period = "30d") {
  const startDate = getStartDate(period);
  const dateFilter = startDate ? { gte: startDate } : undefined;

  const viewsByPiece = await prisma.analyticsEvent.groupBy({
    by: ["pieceId"],
    where: {
      eventType: "view",
      pieceId: { not: null },
      ...(dateFilter ? { createdAt: dateFilter } : {}),
    },
    _count: { _all: true },
    orderBy: { _count: { pieceId: "desc" } },
    take: limit,
  });

  const pieceIds = viewsByPiece.map((v) => v.pieceId!).filter(Boolean);

  const [pieces, reelClicks] = await Promise.all([
    prisma.piece.findMany({
      where: { id: { in: pieceIds } },
      select: {
        id: true,
        slug: true,
        titleBn: true,
        kind: true,
        publishedAt: true,
        readingMinutes: true,
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["pieceId"],
      where: {
        pieceId: { in: pieceIds },
        eventType: { in: ["instagram_click", "reel_click"] },
      },
      _count: { _all: true },
    }),
  ]);

  const clicksMap = new Map(reelClicks.map((c) => [c.pieceId, c._count._all]));
  const viewsMap = new Map(viewsByPiece.map((v) => [v.pieceId, v._count._all]));

  return pieces
    .map((p) => ({
      ...p,
      views: viewsMap.get(p.id) || 0,
      clicks: clicksMap.get(p.id) || 0,
    }))
    .sort((a, b) => b.views - a.views);
}

export async function getSeriesAnalytics() {
  const seriesList = await prisma.series.findMany({
    include: {
      pieces: {
        where: { status: "PUBLISHED" },
        select: { id: true, titleBn: true, seriesOrder: true },
        orderBy: { seriesOrder: "asc" },
      },
    },
  });

  const pieceIds = seriesList.flatMap((s) => s.pieces.map((p) => p.id));

  const views = await prisma.analyticsEvent.groupBy({
    by: ["pieceId"],
    where: {
      pieceId: { in: pieceIds },
      eventType: "view",
    },
    _count: { _all: true },
  });

  const viewsMap = new Map(views.map((v) => [v.pieceId, v._count._all]));

  return seriesList.map((s) => {
    const episodeStats = s.pieces.map((p) => ({
      id: p.id,
      titleBn: p.titleBn,
      order: p.seriesOrder,
      views: viewsMap.get(p.id) || 0,
    }));
    const totalViews = episodeStats.reduce((sum, e) => sum + e.views, 0);
    const avgViews = episodeStats.length ? Math.round(totalViews / episodeStats.length) : 0;
    const firstEpViews = episodeStats[0]?.views || 0;
    const lastEpViews = episodeStats[episodeStats.length - 1]?.views || 0;
    const completionRate = firstEpViews > 0 ? Math.round((lastEpViews / firstEpViews) * 100) : 0;

    return {
      id: s.id,
      slug: s.slug,
      titleBn: s.titleBn,
      totalEpisodes: s.pieces.length,
      totalViews,
      avgViews,
      completionRate,
      episodes: episodeStats,
    };
  });
}
