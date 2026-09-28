import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ReferencePeriod = "7d" | "30d" | "90d" | "all";
export type ReferenceActivity = {
  period: ReferencePeriod;
  catalogueViews: number;
  searches: number;
  workOpens: number;
  readStarts: number;
  listenStarts: number;
  uniqueSessions: number;
  trend: Array<{ date: string; opens: number; reads: number; listens: number }>;
  topWorks: Array<{ id: string; slug: string; titleBn: string; opens: number; reads: number; listens: number }>;
};

export async function getReferenceActivity(period: ReferencePeriod = "30d"): Promise<ReferenceActivity> {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : period === "30d" ? 30 : null;
  const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
  const dateWhere = since ? Prisma.sql`AND e."createdAt" >= ${since}` : Prisma.empty;

  const [summaryRows, topRows, trendRows] = await Promise.all([
    prisma.$queryRaw<Array<{
      catalogueViews: number; searches: number; workOpens: number;
      readStarts: number; listenStarts: number; uniqueSessions: number;
    }>>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_catalogue')::int AS "catalogueViews",
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_search')::int AS searches,
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_open')::int AS "workOpens",
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_read')::int AS "readStarts",
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_listen')::int AS "listenStarts",
        COUNT(DISTINCT e."sessionId")::int AS "uniqueSessions"
      FROM "AnalyticsEvent" e
      WHERE e."eventType" IN ('reference_catalogue', 'reference_search', 'reference_open', 'reference_read', 'reference_listen')
      ${dateWhere}
    `),
    prisma.$queryRaw<Array<{ id: string; slug: string; titleBn: string; opens: number; reads: number; listens: number }>>(Prisma.sql`
      SELECT w.id, w.slug, w."titleBn",
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_open')::int AS opens,
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_read')::int AS reads,
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_listen')::int AS listens
      FROM "AnalyticsEvent" e
      JOIN "ReferenceWork" w ON w.id = e.metadata->>'referenceWorkId'
      WHERE e."eventType" IN ('reference_open', 'reference_read', 'reference_listen')
      ${dateWhere}
      GROUP BY w.id, w.slug, w."titleBn"
      ORDER BY COUNT(*) DESC
      LIMIT 8
    `),
    prisma.$queryRaw<Array<{ date: string; opens: number; reads: number; listens: number }>>(Prisma.sql`
      SELECT to_char(e."createdAt", 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_open')::int AS opens,
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_read')::int AS reads,
        COUNT(*) FILTER (WHERE e."eventType" = 'reference_listen')::int AS listens
      FROM "AnalyticsEvent" e
      WHERE e."eventType" IN ('reference_open', 'reference_read', 'reference_listen')
      ${dateWhere}
      GROUP BY date
      ORDER BY date ASC
    `),
  ]);

  return {
    period,
    catalogueViews: summaryRows[0]?.catalogueViews ?? 0,
    searches: summaryRows[0]?.searches ?? 0,
    workOpens: summaryRows[0]?.workOpens ?? 0,
    readStarts: summaryRows[0]?.readStarts ?? 0,
    listenStarts: summaryRows[0]?.listenStarts ?? 0,
    uniqueSessions: summaryRows[0]?.uniqueSessions ?? 0,
    trend: trendRows,
    topWorks: topRows,
  };
}
