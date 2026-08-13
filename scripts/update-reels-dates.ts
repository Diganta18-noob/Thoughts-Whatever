import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 Fetching existing pieces and series from database...\n");

  const pieces = await prisma.piece.findMany({
    select: {
      id: true,
      slug: true,
      titleBn: true,
      titleEn: true,
      publishedAt: true,
      reelUrl: true,
      seriesOrder: true,
      series: {
        select: {
          id: true,
          slug: true,
          titleBn: true,
        },
      },
    },
  });

  console.log("Current Pieces in DB:");
  pieces.forEach((p) => {
    console.log(
      ` - ID: ${p.id} | Slug: "${p.slug}" | TitleBn: "${p.titleBn}" | Series: "${p.series?.titleBn || "None"}" (#${p.seriesOrder || 0})`
    );
  });

  // Definition of updates requested by user
  const updates = [
    // 1. রক্তকরবী
    {
      match: (p: any) =>
        p.slug.includes("rokto") ||
        p.slug.includes("roktokorobi") ||
        p.titleBn.includes("রক্তকরবী") ||
        (p.series?.slug && p.series.slug.includes("rokto")),
      titleBn: "রক্তকরবী",
      publishedAt: new Date("2026-07-21T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbDwCbkgfYw/",
      authorName: "রবীন্দ্রনাথ ঠাকুর",
    },

    // 2. Crime and punishment (Part 1)
    {
      match: (p: any) =>
        (p.slug.includes("crime") || p.titleBn.toLowerCase().includes("crime")) &&
        (p.seriesOrder === 1 || p.slug.endsWith("1") || p.slug.includes("part-1")),
      titleBn: "Crime and punishment",
      publishedAt: new Date("2026-07-21T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbEI_jtTXwB/",
      authorName: "Fyodor Dostoevsky",
    },

    // 3. Crime and punishment | Part -2
    {
      match: (p: any) =>
        (p.slug.includes("crime") || p.titleBn.toLowerCase().includes("crime")) &&
        (p.seriesOrder === 2 || p.slug.endsWith("2") || p.slug.includes("part-2")),
      titleBn: "Crime and punishment | Part -2",
      publishedAt: new Date("2026-07-22T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbEsky0TM4x/",
      authorName: "Fyodor Dostoevsky",
    },

    // 4. Crime and Punishment | Part-3
    {
      match: (p: any) =>
        (p.slug.includes("crime") || p.titleBn.toLowerCase().includes("crime")) &&
        (p.seriesOrder === 3 || p.slug.endsWith("3") || p.slug.includes("part-3")),
      titleBn: "Crime and Punishment | Part-3",
      publishedAt: new Date("2026-07-22T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbFdwblgEXF/",
      authorName: "Fyodor Dostoevsky",
    },

    // 5. আনন্দমঠ (Part 1)
    {
      match: (p: any) =>
        (p.slug.includes("anandamath") || p.slug.includes("ananda") || p.titleBn.includes("আনন্দমঠ")) &&
        (p.seriesOrder === 1 || p.slug.endsWith("1") || !p.seriesOrder),
      titleBn: "আনন্দমঠ",
      publishedAt: new Date("2026-07-24T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbLdluTAjdQ/",
      authorName: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
    },

    // 6. আনন্দমঠ | পর্ব-২
    {
      match: (p: any) =>
        (p.slug.includes("anandamath") || p.slug.includes("ananda") || p.titleBn.includes("আনন্দমঠ")) &&
        (p.seriesOrder === 2 || p.slug.endsWith("2")),
      titleBn: "আনন্দমঠ | পর্ব-২",
      publishedAt: new Date("2026-07-25T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbN0VN-A5CQ/",
      authorName: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
    },

    // 7. আনন্দমঠ | অন্তিম পর্ব
    {
      match: (p: any) =>
        (p.slug.includes("anandamath") || p.slug.includes("ananda") || p.titleBn.includes("আনন্দমঠ")) &&
        (p.seriesOrder === 3 || p.slug.endsWith("3") || p.slug.includes("final") || p.slug.includes("last")),
      titleBn: "আনন্দমঠ | অন্তিম পর্ব",
      publishedAt: new Date("2026-07-26T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbQbrhnAzSq/",
      authorName: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
    },
  ];

  console.log("\n=======================================================");
  console.log("🚀 Executing Database Updates...");
  console.log("=======================================================\n");

  for (const item of updates) {
    const matchedPiece = pieces.find(item.match);

    if (matchedPiece) {
      console.log(`✅ Matched piece "${matchedPiece.titleBn}" (ID: ${matchedPiece.id}, Slug: ${matchedPiece.slug})`);

      let authorConnect = undefined;
      if (item.authorName) {
        const authorSlug = item.authorName.toLowerCase().replace(/\s+/g, "-");
        let author = await prisma.author.findFirst({
          where: {
            OR: [
              { nameBn: item.authorName },
              { nameEn: item.authorName },
              { slug: authorSlug },
            ],
          },
        });

        if (!author) {
          author = await prisma.author.create({
            data: {
              slug: authorSlug,
              nameBn: item.authorName,
              nameEn: item.authorName,
            },
          });
          console.log(`   ➕ Created new author: ${author.nameBn}`);
        }
        authorConnect = { connect: [{ id: author.id }] };
      }

      const updated = await prisma.piece.update({
        where: { id: matchedPiece.id },
        data: {
          titleBn: item.titleBn,
          publishedAt: item.publishedAt,
          reelUrl: item.reelUrl,
          authors: authorConnect,
        },
      });

      console.log(`   📌 Updated Title: "${updated.titleBn}"`);
      console.log(`   📅 Updated Date: ${updated.publishedAt?.toISOString().split("T")[0]}`);
      console.log(`   🔗 Updated Reel URL: ${updated.reelUrl}\n`);
    } else {
      console.warn(`⚠️ Could not find matching piece for update: "${item.titleBn}"`);
    }
  }

  // Update Series titles if specified
  const crimeSeries = await prisma.series.findFirst({
    where: { slug: { contains: "crime" } },
  });
  if (crimeSeries) {
    await prisma.series.update({
      where: { id: crimeSeries.id },
      data: {
        titleBn: "Crime and punishment",
        titleEn: "Crime and punishment - Fyodor Dostoevsky",
      },
    });
    console.log(`✅ Updated Series Title for Crime and Punishment (ID: ${crimeSeries.id})`);
  }

  const anandamathSeries = await prisma.series.findFirst({
    where: { OR: [{ slug: { contains: "anandamath" } }, { slug: { contains: "ananda" } }] },
  });
  if (anandamathSeries) {
    await prisma.series.update({
      where: { id: anandamathSeries.id },
      data: {
        titleBn: "আনন্দমঠ",
        titleEn: "Anandamath - Bankim Chandra Chattopadhyay",
      },
    });
    console.log(`✅ Updated Series Title for আনন্দমঠ (ID: ${anandamathSeries.id})`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL REEL LINKS, DATES AND TITLES UPDATED SUCCESSFULLY!");
  console.log("=======================================================");
}

main()
  .catch((err) => {
    console.error("❌ Error updating database:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
