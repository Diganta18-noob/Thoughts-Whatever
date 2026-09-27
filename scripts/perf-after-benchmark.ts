import { performance } from "perf_hooks";
import { prisma } from "../src/lib/prisma";
import { referenceCardSelect, getCachedReferenceCatalogueStats } from "../src/lib/reference/catalogue";

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

async function runAfterBenchmark() {
  console.log("=================================================");
  console.log("THOUGHTS.WHATEVER — POST-OPTIMIZATION BENCHMARK");
  console.log("=================================================");

  await prisma.$connect();
  const where = { published: true };

  // 1. Reference Library (Optimized: Targeted Select + Memory Cached Stats)
  console.log("\n[1] Benchmarking Optimized Reference Page Data Flow (20 runs)...");
  const refOptSamples: number[] = [];
  for (let i = 0; i < 20; i++) {
    const t0 = performance.now();
    await Promise.all([
      prisma.referenceWork.count({ where }),
      prisma.referenceWork.findMany({
        where,
        skip: 0,
        take: 12,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        select: referenceCardSelect,
      }),
      getCachedReferenceCatalogueStats(),
    ]);
    refOptSamples.push(performance.now() - t0);
  }
  const refStats = computeStats(refOptSamples);
  console.log("Optimized Reference Data Flow (20 runs):", refStats);

  // 2. Admin Reference (Optimized: GroupBy instead of 5 separate counts)
  console.log("\n[2] Benchmarking Optimized Admin Reference Data Flow (10 runs)...");
  const adminRefSamples: number[] = [];
  for (let i = 0; i < 10; i++) {
    const t0 = performance.now();
    await Promise.all([
      prisma.referenceWork.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, nameBn: true, slug: true } },
          editions: {
            include: {
              rights: true,
              sources: true,
              assets: true,
              rightsLogs: {
                orderBy: { createdAt: "desc" },
                take: 3,
              },
            },
          },
        },
      }),
      Promise.all([
        prisma.referenceWork.count(),
        prisma.referenceRights.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
      ]),
    ]);
    adminRefSamples.push(performance.now() - t0);
  }
  const adminRefStats = computeStats(adminRefSamples);
  console.log("Optimized Admin Reference Flow (10 runs):", adminRefStats);

  await prisma.$disconnect();
}

runAfterBenchmark().catch(console.error);
