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

    // 8. দেবী - প্রভাতকুমার মুখোপাধ্যায় (July 27)
    {
      match: (p: any) => p.slug === "দেবী" || p.titleBn.includes("দেবী"),
      titleBn: "দেবী",
      publishedAt: new Date("2026-07-27T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DbTEHQPA5u3/",
      authorName: "প্রভাতকুমার মুখোপাধ্যায়",
    },

    // 9. বিমলা (ঘরে-বাইরে) - রবীন্দ্রনাথ ঠাকুর (July 28)
    {
      match: (p: any) => p.slug === "ঘরে-বাইরে" || p.titleBn.includes("ঘরে-বাইরে") || p.titleBn.includes("বিমলা"),
      titleBn: "বিমলা (ঘরে-বাইরে)",
      publishedAt: new Date("2026-07-28T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbVdKYygFzu/",
      authorName: "রবীন্দ্রনাথ ঠাকুর",
    },

    // 9.5. কপালকুণ্ডলা - বঙ্কিমচন্দ্র চট্টোপাধ্যায় (July 29)
    {
      match: (p: any) => p.slug === "কপালকুণ্ডলা" || p.titleBn.includes("কপালকুণ্ডলা") || p.titleBn.includes("কপালকুন্ডলা"),
      titleBn: "কপালকুণ্ডলা",
      publishedAt: new Date("2026-07-29T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbYKScqAyXg/",
      authorName: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
    },

    // 10. চোখের বালি (পর্ব-১) - রবীন্দ্রনাথ ঠাকুর (July 31)
    {
      match: (p: any) =>
        (p.slug === "চোখের-বালি-1" || p.slug.includes("chokher-bali-1") || p.titleBn.includes("চোখের বালি")) &&
        (p.seriesOrder === 1 || p.slug.endsWith("1")),
      titleBn: "চোখের বালি",
      publishedAt: new Date("2026-07-31T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbdTwFZg-lO/",
      authorName: "রবীন্দ্রনাথ ঠাকুর",
    },

    // 11. চোখের বালি | পর্ব-২ - রবীন্দ্রনাথ ঠাকুর (August 1)
    {
      match: (p: any) =>
        (p.slug === "চোখের-বালি-2" || p.slug.includes("chokher-bali-2") || p.titleBn.includes("চোখের বালি")) &&
        (p.seriesOrder === 2 || p.slug.endsWith("2")),
      titleBn: "চোখের বালি | পর্ব-২",
      publishedAt: new Date("2026-08-01T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbfnmrGgT9r/",
      authorName: "রবীন্দ্রনাথ ঠাকুর",
    },

    // 12. চোখের বালি | অন্তিম পর্ব - রবীন্দ্রনাথ ঠাকুর (August 2)
    {
      match: (p: any) =>
        (p.slug === "চোখের-বালি-3" || p.slug.includes("chokher-bali-3") || p.titleBn.includes("চোখের বালি")) &&
        (p.seriesOrder === 3 || p.slug.endsWith("3")),
      titleBn: "চোখের বালি | অন্তিম পর্ব",
      publishedAt: new Date("2026-08-02T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/reel/DbisO90A4Ue/",
      authorName: "রবীন্দ্রনাথ ঠাকুর",
    },

    // 13. পদ্মা নদীর মাঝি - মানিক বন্দ্যোপাধ্যায় (August 4)
    {
      match: (p: any) =>
        p.slug === "পদ্মা-নদীর-মাঝি" ||
        p.slug.includes("padma") ||
        p.titleBn.includes("পদ্মা নদীর মাঝি"),
      titleBn: "পদ্মা নদীর মাঝি",
      publishedAt: new Date("2026-08-04T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DbnWzEngeuK/",
      authorName: "মানিক বন্দ্যোপাধ্যায়",
    },

    // 14. Frankenstein - Mary Shelley (August 5)
    {
      match: (p: any) =>
        p.slug === "frankenstein" ||
        p.slug.includes("frankenstein") ||
        p.titleBn.toLowerCase().includes("frankenstein") ||
        (p.titleEn && p.titleEn.toLowerCase().includes("frankenstein")),
      titleBn: "Frankenstein",
      publishedAt: new Date("2026-08-05T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Dbqe-LmACcl/",
      authorName: "Mary Shelley",
    },

    // 15. নীলদর্পণ (পর্ব-১) - দীনবন্ধু মিত্র (August 7)
    {
      match: (p: any) =>
        (p.slug.includes("nildarpan") || p.slug.includes("নীলদর্পণ") || p.titleBn.includes("নীলদর্পণ")) &&
        (p.seriesOrder === 1 || p.slug.endsWith("1") || (!p.seriesOrder && !p.slug.includes("2") && !p.slug.includes("3") && !p.slug.includes("পর্ব"))),
      titleBn: "নীলদর্পণ",
      publishedAt: new Date("2026-08-07T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Dbvu34ShwC4/",
      authorName: "দীনবন্ধু মিত্র",
    },

    // 16. নীলদর্পণ (পর্ব-২) - দীনবন্ধু মিত্র (August 8)
    {
      match: (p: any) =>
        (p.slug.includes("nildarpan") || p.slug.includes("নীলদর্পণ") || p.titleBn.includes("নীলদর্পণ")) &&
        (p.seriesOrder === 2 || p.slug.endsWith("2") || p.titleBn.includes("পর্ব - ২") || p.titleBn.includes("পর্ব-২")),
      titleBn: "নীলদর্পণ | পর্ব-২",
      publishedAt: new Date("2026-08-08T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Dbx9lAngmrd/",
      authorName: "দীনবন্ধু মিত্র",
    },

    // 17. নীলদর্পণ (অন্তিম পর্ব) - দীনবন্ধু মিত্র (August 9)
    {
      match: (p: any) =>
        (p.slug.includes("nildarpan") || p.slug.includes("নীলদর্পণ") || p.titleBn.includes("নীলদর্পণ")) &&
        (p.seriesOrder === 3 || p.slug.endsWith("3") || p.titleBn.includes("অন্তিম") || p.slug.includes("final") || p.slug.includes("last")),
      titleBn: "নীলদর্পণ | অন্তিম পর্ব",
      publishedAt: new Date("2026-08-09T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db0OSW4AlG5/",
      authorName: "দীনবন্ধু মিত্র",
    },

    // 18. ক্ষুদিরাম বসু (August 11)
    {
      match: (p: any) =>
        p.slug === "ক্ষুদিরাম-বসু" ||
        p.slug.includes("khudiram") ||
        p.titleBn.includes("ক্ষুদিরাম"),
      titleBn: "ক্ষুদিরাম বসু",
      publishedAt: new Date("2026-08-11T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db5q8YKAjQc/",
      authorName: "পীতাম্বর দাস",
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
