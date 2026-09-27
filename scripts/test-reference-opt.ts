import { performance } from "perf_hooks";
import { prisma } from "../src/lib/prisma";

function computeStats(samples: number[]) {
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

async function run() {
  await prisma.$connect();
  const where = { published: true };

  console.log("--- 1. Testing Original findMany (with heavy include: { editions: { include: ... } }) ---");
  const origSamples: number[] = [];
  for (let i = 0; i < 15; i++) {
    const t0 = performance.now();
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
    origSamples.push(performance.now() - t0);
  }
  console.log("Original findMany:", computeStats(origSamples));

  console.log("\n--- 2. Testing Targeted select (avoiding readerManifest & heavy scalar bloat) ---");
  const optSamples: number[] = [];
  for (let i = 0; i < 15; i++) {
    const t0 = performance.now();
    await prisma.referenceWork.findMany({
      where,
      skip: 0,
      take: 12,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        titleBn: true,
        titleEn: true,
        subtitleBn: true,
        type: true,
        language: true,
        era: true,
        author: {
          select: { id: true, slug: true, nameBn: true, nameEn: true },
        },
        editions: {
          take: 1,
          orderBy: { publicationYear: "asc" },
          select: {
            id: true,
            editor: true,
            publisher: true,
            publicationYear: true,
            coverImage: true,
            hostingMode: true,
            rights: {
              select: {
                status: true,
              },
            },
            sources: {
              take: 1,
              select: {
                sourceName: true,
                sourceUrl: true,
              },
            },
            assets: {
              select: {
                kind: true,
                fileUrl: true,
                isDownloadable: true,
                isOnlineReadable: true,
              },
            },
          },
        },
      },
    });
    optSamples.push(performance.now() - t0);
  }
  console.log("Targeted select findMany:", computeStats(optSamples));

  console.log("\n--- 3. Testing Reference Page Total Request Time: With Stats vs Without Stats (Cached) ---");
  // A: Current Reference Page (all 7 queries)
  const currentTotalSamples: number[] = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
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
    currentTotalSamples.push(performance.now() - t0);
  }
  console.log("Current Full Reference Request (7 queries):", computeStats(currentTotalSamples));

  // B: Optimized Reference Request (Only 2 queries: count + targeted select findMany, stats cached)
  const optTotalSamples: number[] = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await Promise.all([
      prisma.referenceWork.count({ where }),
      prisma.referenceWork.findMany({
        where,
        skip: 0,
        take: 12,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          slug: true,
          titleBn: true,
          titleEn: true,
          subtitleBn: true,
          type: true,
          language: true,
          era: true,
          author: {
            select: { id: true, slug: true, nameBn: true, nameEn: true },
          },
          editions: {
            take: 1,
            orderBy: { publicationYear: "asc" },
            select: {
              id: true,
              editor: true,
              publisher: true,
              publicationYear: true,
              coverImage: true,
              hostingMode: true,
              rights: {
                select: {
                  status: true,
                },
              },
              sources: {
                take: 1,
                select: {
                  sourceName: true,
                  sourceUrl: true,
                },
              },
              assets: {
                select: {
                  kind: true,
                  fileUrl: true,
                  isDownloadable: true,
                  isOnlineReadable: true,
                },
              },
            },
          },
        },
      }),
    ]);
    optTotalSamples.push(performance.now() - t0);
  }
  console.log("Optimized Reference Request (2 queries, targeted select):", computeStats(optTotalSamples));

  await prisma.$disconnect();
}

run().catch(console.error);
