import { prisma } from "../src/lib/prisma";

async function main() {
  const pieces = await prisma.piece.findMany({
    where: {
      OR: [
        { titleBn: { contains: "নীলদর্পণ" } },
        { slug: { contains: "nildarpan" } },
        { slug: { contains: "নীলদর্পণ" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      titleBn: true,
      seriesId: true,
      seriesOrder: true,
      publishedAt: true,
      series: {
        select: {
          id: true,
          slug: true,
          titleBn: true,
        },
      },
    },
    orderBy: { publishedAt: "desc" },
  });

  console.log("Found pieces count:", pieces.length);
  console.log(JSON.stringify(pieces, null, 2));

  const allSeries = await prisma.series.findMany();
  console.log("All series:", allSeries);
}

main().finally(() => prisma.$disconnect());
