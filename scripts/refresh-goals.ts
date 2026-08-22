import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Updating goals in PostgreSQL...");
  await prisma.goal.deleteMany({});
  
  const now = new Date();
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

  await prisma.goal.createMany({
    data: [
      {
        title: "Total Published Catalog Goal",
        metricKey: "articles_published",
        targetValue: 30,
        currentValue: 25,
        unit: "count",
        period: "cumulative",
        startDate: new Date(2026, 0, 1),
        endDate: endOfYear,
        owner: "Lead Editor",
        status: "ON_TRACK",
      },
      {
        title: "Audience Readership Milestone",
        metricKey: "pageviews",
        targetValue: 1000,
        currentValue: 154,
        unit: "count",
        period: "cumulative",
        startDate: new Date(2026, 0, 1),
        endDate: endOfYear,
        owner: "Editorial Team",
        status: "ON_TRACK",
      },
      {
        title: "Newsletter Subscriber Growth",
        metricKey: "subscribers",
        targetValue: 100,
        currentValue: 0,
        unit: "count",
        period: "cumulative",
        startDate: new Date(2026, 0, 1),
        endDate: endOfYear,
        owner: "Growth Team",
        status: "BEHIND",
      },
    ],
  });

  console.log("✅ Seeded cumulative goals with real numbers!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
