import { PieceKind } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🧹 Fixing Kapalkundala piece...");

  // 1. Delete duplicate rogue piece 'কপালকুন্ডলা' if it exists
  const rogue = await prisma.piece.findUnique({
    where: { slug: "কপালকুন্ডলা" },
  });

  if (rogue) {
    await prisma.piece.delete({
      where: { id: rogue.id },
    });
    console.log(`Deleted rogue duplicate piece "${rogue.titleBn}" (ID: ${rogue.id}, slug: ${rogue.slug})`);
  }

  // 2. Ensure Bankim Chandra Chattopadhyay author exists
  let bankim = await prisma.author.findFirst({
    where: { slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়" },
  });

  if (!bankim) {
    bankim = await prisma.author.create({
      data: {
        nameBn: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
        nameEn: "Bankim Chandra Chattopadhyay",
        slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়",
        bioBn: "বাংলা সাহিত্যের অন্যতম শ্রেষ্ঠ ঔপন্যাসিক ও আধুনিক বাংলা সাহিত্যের পথিকৃৎ।",
      },
    });
  }

  // 3. Update the canonical piece 'কপালকুণ্ডলা'
  const canonical = await prisma.piece.upsert({
    where: { slug: "কপালকুণ্ডলা" },
    update: {
      titleBn: "কপালকুণ্ডলা",
      publishedAt: new Date("2026-07-29T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DbYKScqAyXg/",
      authors: {
        set: [{ id: bankim.id }],
      },
    },
    create: {
      kind: PieceKind.DOCUMENTARY,
      slug: "কপালকুণ্ডলা",
      titleBn: "কপালকুণ্ডলা",
      publishedAt: new Date("2026-07-29T00:00:00.000Z"),
      reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DbYKScqAyXg/",
      bodyBn: "কপালকুণ্ডলা...",
      status: "PUBLISHED",
      authors: {
        connect: [{ id: bankim.id }],
      },
    },
    include: {
      authors: true,
    },
  });

  console.log("✅ Canonical piece updated successfully:");
  console.log({
    id: canonical.id,
    slug: canonical.slug,
    titleBn: canonical.titleBn,
    publishedAt: canonical.publishedAt,
    reelUrl: canonical.reelUrl,
    authors: canonical.authors.map((a) => a.nameBn),
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
