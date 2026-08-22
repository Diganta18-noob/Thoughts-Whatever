import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type Period = "today" | "yesterday" | "7d" | "30d" | "90d" | "all";

export function getStartDate(period: Period = "30d"): Date | undefined {
  const now = new Date();
  if (period === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return new Date(y.getFullYear(), y.getMonth(), y.getDate());
  }
  if (period === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  if (period === "90d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    return d;
  }
  return undefined;
}

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India",
  BD: "Bangladesh",
  US: "United States",
  GB: "United Kingdom",
  CA: "Canada",
  DE: "Germany",
  AU: "Australia",
  SG: "Singapore",
  AE: "United Arab Emirates",
  MY: "Malaysia",
  FR: "France",
  JP: "Japan",
};

export async function getOverviewStats(period: Period = "30d") {
  const startDate = getStartDate(period);
  const dateFilter = startDate ? { gte: startDate } : undefined;

  const [totalViews, uniqueVisitorsResult, totalArticles, totalSubscribers, totalReelClicks, scrollEvents, piecesWithReadingTime] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { eventType: "view", ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    startDate
      ? prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT "sessionId") as count
          FROM "AnalyticsEvent"
          WHERE "createdAt" >= ${startDate}
        `
      : prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT "sessionId") as count
          FROM "AnalyticsEvent"
        `,
    prisma.piece.count({ where: { status: "PUBLISHED" } }),
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.analyticsEvent.count({
      where: {
        eventType: { in: ["instagram_click", "reel_click"] },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
    }),
    prisma.analyticsEvent.groupBy({
      by: ["eventType"],
      where: {
        eventType: { in: ["scroll_25", "scroll_50", "scroll_75", "scroll_100"] },
        ...(dateFilter ? { createdAt: dateFilter } : {}),
      },
      _count: { _all: true },
    }),
    prisma.piece.findMany({
      where: { status: "PUBLISHED" },
      select: { readingMinutes: true },
    }),
  ]);

  const uniqueVisitors = Number(uniqueVisitorsResult[0]?.count ?? 0);
  const scrollMap = new Map(scrollEvents.map((s) => [s.eventType, s._count._all]));

  const completedReads = scrollMap.get("scroll_100") || 0;
  const startedReads = scrollMap.get("scroll_25") || 0;
  const viewsCount = Math.max(0, totalViews);

  const completionRate = viewsCount > 0 ? Math.min(100, Math.round((completedReads / viewsCount) * 100)) : 0;
  const bounceRate = viewsCount > 0 ? Math.max(0, Math.min(100, Math.round(((viewsCount - startedReads) / viewsCount) * 100))) : 0;

  // Average reading minutes across published catalog
  const avgReadingMinutes = piecesWithReadingTime.length > 0
    ? Math.round((piecesWithReadingTime.reduce((sum, p) => sum + (p.readingMinutes || 3), 0) / piecesWithReadingTime.length) * 10) / 10
    : 4.0;

  return {
    totalViews,
    uniqueVisitors,
    returningVisitors: Math.max(0, totalViews - uniqueVisitors),
    totalArticles,
    totalSubscribers,
    totalReelClicks,
    completionRate,
    avgReadingMinutes,
    bounceRate,
  };
}

export async function getDailyTrend(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const rows = await prisma.$queryRaw<Array<{
    day: Date;
    views: bigint;
    visitors: bigint;
  }>>`
    SELECT
      DATE_TRUNC('day', "createdAt") as day,
      COUNT(*)::bigint as views,
      COUNT(DISTINCT "sessionId")::bigint as visitors
    FROM "AnalyticsEvent"
    WHERE "eventType" = 'view'
      AND "createdAt" >= ${startDate}
    GROUP BY DATE_TRUNC('day', "createdAt")
    ORDER BY day ASC
  `;

  const dailyMap: Record<string, { date: string; views: number; visitors: number }> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyMap[key] = { date: key, views: 0, visitors: 0 };
  }

  for (const row of rows) {
    const key = new Date(row.day).toISOString().split("T")[0];
    if (dailyMap[key]) {
      dailyMap[key].views = Number(row.views);
      dailyMap[key].visitors = Number(row.visitors);
    } else {
      dailyMap[key] = {
        date: key,
        views: Number(row.views),
        visitors: Number(row.visitors),
      };
    }
  }

  return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));
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

export async function getReadingEngagementMetrics(period: Period = "30d") {
  const startDate = getStartDate(period);
  const dateFilter = startDate ? { gte: startDate } : undefined;

  const [totalViews, scroll25, scroll50, scroll75, scroll100, topPieces] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { eventType: "view", ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.analyticsEvent.count({
      where: { eventType: "scroll_25", ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.analyticsEvent.count({
      where: { eventType: "scroll_50", ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.analyticsEvent.count({
      where: { eventType: "scroll_75", ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.analyticsEvent.count({
      where: { eventType: "scroll_100", ...(dateFilter ? { createdAt: dateFilter } : {}) },
    }),
    prisma.piece.findMany({
      where: { status: "PUBLISHED" },
      take: 8,
      orderBy: { viewCount: "desc" },
      select: {
        id: true,
        slug: true,
        titleBn: true,
        readingMinutes: true,
        viewCount: true,
      },
    }),
  ]);

  const baseViews = Math.max(1, totalViews);
  const depth25Pct = totalViews > 0 ? Math.min(100, Math.round((scroll25 / baseViews) * 100)) : 0;
  const depth50Pct = totalViews > 0 ? Math.min(100, Math.round((scroll50 / baseViews) * 100)) : 0;
  const depth75Pct = totalViews > 0 ? Math.min(100, Math.round((scroll75 / baseViews) * 100)) : 0;
  const depth100Pct = totalViews > 0 ? Math.min(100, Math.round((scroll100 / baseViews) * 100)) : 0;

  // Average reading time calculated from catalog duration
  const avgReadingMinutes = topPieces.length > 0
    ? topPieces.reduce((sum, p) => sum + (p.readingMinutes || 3), 0) / topPieces.length
    : 4;
  const averageReadingTimeSec = Math.round(avgReadingMinutes * 60);

  return {
    totalViews,
    averageReadingTimeSec,
    depthFunnel: [
      { label: "Started Reading (0%)", count: totalViews, pct: totalViews > 0 ? 100 : 0 },
      { label: "Reached Quarter (25%)", count: scroll25, pct: depth25Pct },
      { label: "Reached Midpoint (50%)", count: scroll50, pct: depth50Pct },
      { label: "Deep Engagement (75%)", count: scroll75, pct: depth75Pct },
      { label: "Completed Article (100%)", count: scroll100, pct: depth100Pct },
    ],
    topEngagedPieces: topPieces.map((p) => ({
      id: p.id,
      titleBn: p.titleBn,
      slug: p.slug,
      views: p.viewCount,
      avgMinutes: p.readingMinutes || 3,
      estimatedCompletionRate: depth100Pct,
    })),
  };
}

export async function getGeographicMetrics(period: Period = "30d") {
  const startDate = getStartDate(period);

  try {
    // 1. Query raw database counts grouped by actual metadata country
    const countryRows = startDate
      ? await prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
          SELECT
            COALESCE("metadata"->>'country', 'IN') as country,
            COUNT(*)::bigint as count
          FROM "AnalyticsEvent"
          WHERE "createdAt" >= ${startDate}
          GROUP BY COALESCE("metadata"->>'country', 'IN')
          ORDER BY count DESC
          LIMIT 10
        `
      : await prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
          SELECT
            COALESCE("metadata"->>'country', 'IN') as country,
            COUNT(*)::bigint as count
          FROM "AnalyticsEvent"
          GROUP BY COALESCE("metadata"->>'country', 'IN')
          ORDER BY count DESC
          LIMIT 10
        `;

    // 2. Query regional hubs from actual metadata
    const regionRows = startDate
      ? await prisma.$queryRaw<Array<{ region: string; city: string; count: bigint }>>`
          SELECT
            COALESCE("metadata"->>'region', 'WB') as region,
            COALESCE("metadata"->>'city', 'Kolkata') as city,
            COUNT(*)::bigint as count
          FROM "AnalyticsEvent"
          WHERE "createdAt" >= ${startDate}
          GROUP BY COALESCE("metadata"->>'region', 'WB'), COALESCE("metadata"->>'city', 'Kolkata')
          ORDER BY count DESC
          LIMIT 8
        `
      : await prisma.$queryRaw<Array<{ region: string; city: string; count: bigint }>>`
          SELECT
            COALESCE("metadata"->>'region', 'WB') as region,
            COALESCE("metadata"->>'city', 'Kolkata') as city,
            COUNT(*)::bigint as count
          FROM "AnalyticsEvent"
          GROUP BY COALESCE("metadata"->>'region', 'WB'), COALESCE("metadata"->>'city', 'Kolkata')
          ORDER BY count DESC
          LIMIT 8
        `;

    const totalGeoVisitors = countryRows.reduce((sum, r) => sum + Number(r.count), 0);
    const totalCount = Math.max(1, totalGeoVisitors);

    const countries = countryRows.map((r) => {
      const code = (r.country || "IN").toUpperCase();
      const name = COUNTRY_NAMES[code] || code;
      const count = Number(r.count);
      return {
        country: name,
        code,
        visitors: count,
        pct: Math.round((count / totalCount) * 100),
      };
    });

    const regions = regionRows.map((r) => {
      const count = Number(r.count);
      const label = r.city ? `${r.city}, ${r.region}` : r.region || "Primary Hub";
      return {
        name: label,
        visitors: count,
        pct: Math.round((count / totalCount) * 100),
      };
    });

    return {
      totalGeoVisitors,
      countries,
      regions,
    };
  } catch (err) {
    console.error("[GeographicMetrics] Query error:", err);
    return {
      totalGeoVisitors: 0,
      countries: [],
      regions: [],
    };
  }
}

export async function getTrafficSources(period: Period = "30d") {
  const startDate = getStartDate(period);

  try {
    const rows = startDate
      ? await prisma.$queryRaw<Array<{ referrer: string | null; count: bigint }>>`
          SELECT
            "referrer",
            COUNT(*)::bigint as count
          FROM "AnalyticsEvent"
          WHERE "eventType" = 'view'
            AND "createdAt" >= ${startDate}
          GROUP BY "referrer"
          ORDER BY count DESC
        `
      : await prisma.$queryRaw<Array<{ referrer: string | null; count: bigint }>>`
          SELECT
            "referrer",
            COUNT(*)::bigint as count
          FROM "AnalyticsEvent"
          WHERE "eventType" = 'view'
          GROUP BY "referrer"
          ORDER BY count DESC
        `;

    let directCount = 0;
    let searchCount = 0;
    let instagramCount = 0;
    let emailCount = 0;
    let otherCount = 0;

    for (const r of rows) {
      const count = Number(r.count);
      const ref = (r.referrer || "").toLowerCase();

      if (!ref || ref.includes("localhost") || ref.includes("thoughts-whatever") || ref.includes("thoughts.whatever")) {
        directCount += count;
      } else if (ref.includes("google") || ref.includes("bing") || ref.includes("duckduckgo") || ref.includes("search")) {
        searchCount += count;
      } else if (ref.includes("instagram") || ref.includes("facebook") || ref.includes("twitter") || ref.includes("t.co")) {
        instagramCount += count;
      } else if (ref.includes("mail") || ref.includes("email") || ref.includes("newsletter") || ref.includes("substack")) {
        emailCount += count;
      } else {
        otherCount += count;
      }
    }

    const total = Math.max(1, directCount + searchCount + instagramCount + emailCount + otherCount);

    return [
      { source: "Direct / Internal", count: directCount, pct: Math.round((directCount / total) * 100) },
      { source: "Organic Search (Google)", count: searchCount, pct: Math.round((searchCount / total) * 100) },
      { source: "Social (Instagram, Reels)", count: instagramCount, pct: Math.round((instagramCount / total) * 100) },
      { source: "Newsletter Email Link", count: emailCount, pct: Math.round((emailCount / total) * 100) },
      { source: "Other External Referrers", count: otherCount, pct: Math.round((otherCount / total) * 100) },
    ].filter((s) => s.count > 0 || s.source === "Direct / Internal");
  } catch (err) {
    console.error("[TrafficSources] Query error:", err);
    return [
      { source: "Direct / Internal", count: 0, pct: 100 },
    ];
  }
}
