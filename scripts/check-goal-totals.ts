import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const [totalPieces, totalSubscribers, totalViews, samplePieces] = await Promise.all([
    prisma.piece.count({ where: { status: "PUBLISHED" } }),
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.analyticsEvent.count({ where: { eventType: "view" } }),
    prisma.piece.findMany({
      take: 5,
      select: { titleBn: true, status: true, publishedAt: true, createdAt: true },
    }),
  ]);

  console.log("Database totals:");
  console.log("  Total Published Pieces:", totalPieces);
  console.log("  Total Active Subscribers:", totalSubscribers);
  console.log("  Total Page Views:", totalViews);
  console.log("\nSample Pieces publishedAt dates:", samplePieces);
}

main().catch(console.error).finally(() => prisma.$disconnect());
