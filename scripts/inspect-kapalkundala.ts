import { prisma } from "../src/lib/prisma";

async function main() {
  const pieces = await prisma.piece.findMany({
    where: {
      OR: [
        { titleBn: { contains: "কপালকু" } },
        { slug: { contains: "কপালকু" } },
      ],
    },
    include: {
      authors: true,
    },
  });

  console.log("Found Kapalkundala pieces:", pieces.length);
  console.log(
    pieces.map((p) => ({
      id: p.id,
      slug: p.slug,
      titleBn: p.titleBn,
      publishedAt: p.publishedAt,
      reelUrl: p.reelUrl,
      authors: p.authors.map((a) => a.nameBn),
    }))
  );
}

main().finally(() => prisma.$disconnect());
