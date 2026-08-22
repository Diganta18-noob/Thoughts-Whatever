import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🧹 Cleaning up duplicate Nildarpan pieces and duplicate series...");

  // 1. Find the duplicate series 'নীলদর্পণ-দীনবন্ধু-মিত্র'
  const dupSeries = await prisma.series.findUnique({
    where: { slug: "নীলদর্পণ-দীনবন্ধু-মিত্র" },
    include: { pieces: true },
  });

  if (dupSeries) {
    console.log(`Found duplicate series "${dupSeries.titleBn}" with ${dupSeries.pieces.length} pieces.`);
    
    // Delete pieces belonging to the duplicate series
    const deletedPieces = await prisma.piece.deleteMany({
      where: { seriesId: dupSeries.id },
    });
    console.log(`Deleted ${deletedPieces.count} duplicate pieces from series ${dupSeries.slug}.`);

    // Delete the duplicate series itself
    await prisma.series.delete({
      where: { id: dupSeries.id },
    });
    console.log(`Deleted duplicate series: ${dupSeries.slug}`);
  } else {
    console.log("No duplicate series 'নীলদর্পণ-দীনবন্ধু-মিত্র' found.");
  }

  // 2. Verify remaining Nildarpan pieces
  const remaining = await prisma.piece.findMany({
    where: {
      OR: [
        { titleBn: { contains: "নীলদর্পণ" } },
        { slug: { contains: "নীলদর্পণ" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      titleBn: true,
      seriesOrder: true,
      publishedAt: true,
      reelUrl: true,
    },
    orderBy: { seriesOrder: "asc" },
  });

  console.log("\n✅ Remaining Clean Nildarpan Pieces in DB:");
  console.table(remaining);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
