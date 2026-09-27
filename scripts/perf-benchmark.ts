import { performance } from "perf_hooks";
import { prisma } from "../src/lib/prisma";

interface LatencyStats {
  min: number;
  max: number;
  median: number;
  p75: number;
  p95: number;
  avg: number;
}

function computeStats(samples: number[]): LatencyStats {
  const sorted = [...samples].sort((a, b) => a - b);
  const n = sorted.length;
  const p = (pct: number) => sorted[Math.min(n - 1, Math.floor((pct / 100) * n))];
  const avg = sorted.reduce((sum, v) => sum + v, 0) / n;
  return {
    min: Number(sorted[0].toFixed(2)),
    max: Number(sorted[n - 1].toFixed(2)),
    median: Number(p(50).toFixed(2)),
    p75: Number(p(75).toFixed(2)),
    p95: Number(p(95).toFixed(2)),
    avg: Number(avg.toFixed(2)),
  };
}

async function runBenchmark() {
  console.log("=================================================");
  console.log("THOUGHTS.WHATEVER — HIGH-RESOLUTION DB BENCHMARK");
  console.log("=================================================");

  // 1. Connection acquisition
  console.log("\n[1] Testing Database Connection Establishment...");
  const t0 = performance.now();
  await prisma.$connect();
  const connTime = performance.now() - t0;
  console.log(`Initial prisma.$connect() duration: ${connTime.toFixed(2)} ms`);

  // 2. Simple warm query repeated 20 times (SELECT 1)
  console.log("\n[2] Testing Ping (SELECT 1) - 20 runs...");
  const pingSamples: number[] = [];
  for (let i = 0; i < 20; i++) {
    const s = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    pingSamples.push(performance.now() - s);
  }
  console.log("Ping Stats:", computeStats(pingSamples));

  // 3. Reference Page Queries
  console.log("\n[3] Benchmarking Reference Page Queries (20 runs)...");

  // A. Reference query individual components
  const where = { published: true };
  const refCountSamples: number[] = [];
  const refFindManySamples: number[] = [];
  const refStats5QueriesSamples: number[] = [];
  const refCombinedParallelSamples: number[] = [];

  for (let i = 0; i < 20; i++) {
    // Single count
    const tCountStart = performance.now();
    await prisma.referenceWork.count({ where });
    refCountSamples.push(performance.now() - tCountStart);

    // findMany with relations
    const tFindStart = performance.now();
    await prisma.referenceWork.findMany({
      where,
      skip: 0,
      take: 12,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: { id: true, slug: true, nameBn: true, nameEn: true },
        },
        editions: {
          take: 1,
          orderBy: { publicationYear: "asc" },
          include: {
            rights: true,
            sources: { take: 1 },
            assets: true,
          },
        },
      },
    });
    refFindManySamples.push(performance.now() - tFindStart);

    // 5 catalogue stats
    const tStatsStart = performance.now();
    await Promise.all([
      prisma.referenceWork.count({ where: { published: true } }),
      prisma.referenceWork.count({
        where: { published: true, type: { in: ["BOOK", "ARTICLE"] } },
      }),
      prisma.referenceWork.count({
        where: {
          published: true,
          type: { in: ["DOCUMENT", "MANUSCRIPT", "ARCHIVE"] },
        },
      }),
      prisma.referenceSource.count(),
      prisma.referenceWork.count({
        where: { published: true, type: "AUDIO" },
      }),
    ]);
    refStats5QueriesSamples.push(performance.now() - tStatsStart);

    // Full current reference page load (All 7 queries in Promise.all)
    const tFullStart = performance.now();
    await Promise.all([
      prisma.referenceWork.count({ where }),
      prisma.referenceWork.findMany({
        where,
        skip: 0,
        take: 12,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: {
          author: {
            select: { id: true, slug: true, nameBn: true, nameEn: true },
          },
          editions: {
            take: 1,
            orderBy: { publicationYear: "asc" },
            include: {
              rights: true,
              sources: { take: 1 },
              assets: true,
            },
          },
        },
      }),
      Promise.all([
        prisma.referenceWork.count({ where: { published: true } }),
        prisma.referenceWork.count({
          where: { published: true, type: { in: ["BOOK", "ARTICLE"] } },
        }),
        prisma.referenceWork.count({
          where: {
            published: true,
            type: { in: ["DOCUMENT", "MANUSCRIPT", "ARCHIVE"] },
          },
        }),
        prisma.referenceSource.count(),
        prisma.referenceWork.count({
          where: { published: true, type: "AUDIO" },
        }),
      ]),
    ]);
    refCombinedParallelSamples.push(performance.now() - tFullStart);
  }

  console.log("Reference Work Count (1 query):", computeStats(refCountSamples));
  console.log("Reference Work findMany with editions/relations (1 query):", computeStats(refFindManySamples));
  console.log("Reference 5 Catalogue Stats in Promise.all (5 queries):", computeStats(refStats5QueriesSamples));
  console.log("Reference FULL PAGE CURRENT Promise.all (7 concurrent queries):", computeStats(refCombinedParallelSamples));

  // 4. Test Single Consolidated Raw SQL for Stats vs 5 Prisma count queries
  console.log("\n[4] Testing Consolidated Stats (1 query via raw SQL or aggregate) vs 5 count queries...");
  const consolidatedStatsSamples: number[] = [];
  for (let i = 0; i < 20; i++) {
    const tRawStart = performance.now();
    const result = await prisma.$queryRaw<Array<{
      total_works: bigint;
      books_articles: bigint;
      docs_manuscripts: bigint;
      audio_works: bigint;
    }>>`
      SELECT
        COUNT(*) FILTER (WHERE "published" = true) as total_works,
        COUNT(*) FILTER (WHERE "published" = true AND "type" IN ('BOOK', 'ARTICLE')) as books_articles,
        COUNT(*) FILTER (WHERE "published" = true AND "type" IN ('DOCUMENT', 'MANUSCRIPT', 'ARCHIVE')) as docs_manuscripts,
        COUNT(*) FILTER (WHERE "published" = true AND "type" = 'AUDIO') as audio_works
      FROM "ReferenceWork"
    `;
    const sourceCount = await prisma.referenceSource.count();
    consolidatedStatsSamples.push(performance.now() - tRawStart);
  }
  console.log("Consolidated Stats (1 SQL + 1 count = 2 queries):", computeStats(consolidatedStatsSamples));

  // 5. Test Homepage Queries
  console.log("\n[5] Testing Homepage Queries (20 runs)...");
  const homeSamples: number[] = [];
  for (let i = 0; i < 20; i++) {
    const tHomeStart = performance.now();
    await Promise.all([
      prisma.piece.findMany({
        where: { status: "PUBLISHED" },
        take: 20,
        orderBy: { createdAt: "desc" },
        select: {
          slug: true,
          kind: true,
          titleBn: true,
          dekBn: true,
          excerptBn: true,
          coverImageWidth: true,
          coverImageHeight: true,
          thumbnailImage: true,
          readingMinutes: true,
          featured: true,
          publishedAt: true,
          audioUrl: true,
          seriesId: true,
          seriesOrder: true,
          series: { select: { titleBn: true, slug: true } },
          authors: { select: { slug: true, nameBn: true } },
        },
      }),
      prisma.series.findMany({
        where: { pieces: { some: { status: "PUBLISHED" } } },
        take: 3,
        include: { pieces: { where: { status: "PUBLISHED" } } },
      }),
      prisma.tag.findMany({ select: { slug: true, labelBn: true, kind: true } }),
      prisma.author.findMany({ select: { slug: true, nameBn: true, era: true } }),
      prisma.piece.count({ where: { status: "PUBLISHED", kind: "RACHANA" } }),
      prisma.piece.count({ where: { status: "PUBLISHED", kind: "DOCUMENTARY" } }),
      prisma.piece.count({ where: { status: "PUBLISHED", kind: "BLOG" } }),
    ]);
    homeSamples.push(performance.now() - tHomeStart);
  }
  console.log("Homepage Promise.all Queries (7 concurrent queries):", computeStats(homeSamples));

  // 6. Test Admin Queries
  console.log("\n[6] Testing Admin Dashboard Queries (10 runs)...");
  const adminSamples: number[] = [];
  for (let i = 0; i < 10; i++) {
    const tAdminStart = performance.now();
    await Promise.allSettled([
      prisma.piece.findMany({
        select: { id: true, slug: true, kind: true, status: true, titleBn: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.analyticsEvent.count({ where: { eventType: "view" } }),
      prisma.$queryRaw`SELECT COUNT(DISTINCT "sessionId") as count FROM "AnalyticsEvent"`,
      prisma.piece.count({ where: { status: "PUBLISHED" } }),
      prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    ]);
    adminSamples.push(performance.now() - tAdminStart);
  }
  console.log("Admin Dashboard Queries:", computeStats(adminSamples));

  await prisma.$disconnect();
}

runBenchmark().catch(console.error);
