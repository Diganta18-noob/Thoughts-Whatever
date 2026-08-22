import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { readingMinutes } from "../src/lib/bengali";
import { deriveExcerpt } from "../src/lib/markdown";
import { cleanMarkdownBody } from "./content-ai";

async function main() {
  console.log("Updating solo pieces in database...");

  const tagore = await prisma.author.findFirst({ where: { slug: "রবীন্দ্রনাথ-ঠাকুর" } });
  let sarat = await prisma.author.findFirst({ where: { slug: "শরৎচন্দ্র-চট্টোপাধ্যায়" } });
  if (!sarat) {
    sarat = await prisma.author.create({
      data: {
        nameBn: "শরৎচন্দ্র চট্টোপাধ্যায়",
        nameEn: "Sarat Chandra Chattopadhyay",
        slug: "শরৎচন্দ্র-চট্টোপাধ্যায়",
        bioBn: "বাংলা কথাসাহিত্যের অপরাজেয় কথাশিল্পী ও কালজয়ী ঔপন্যাসিক।",
      },
    });
  }

  let bankim = await prisma.author.findFirst({ where: { slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়" } });
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

  const solos = [
    { file: "ঘরে-বাইরে.txt", slug: "ঘরে-বাইরে", title: "বিমলা (ঘরে-বাইরে)", author: tagore },
    { file: "দেবী .txt", slug: "দেবী", title: "দেবী", author: sarat },
    { file: "রক্তকরবী.txt", slug: "রক্তকরবী", title: "রক্তকরবী", author: tagore },
    { file: "কপালকুন্ডলা.txt", slug: "কপালকুণ্ডলা", title: "কপালকুণ্ডলা", author: bankim },
  ];

  for (const s of solos) {
    const raw = fs.readFileSync(path.join(process.cwd(), "Content", "solo", s.file), "utf-8");
    const body = cleanMarkdownBody(raw, s.title);
    const excerpt = deriveExcerpt(body);
    const mins = readingMinutes(body);

    const updated = await prisma.piece.upsert({
      where: { slug: s.slug },
      update: {
        titleBn: s.title,
        bodyBn: body,
        excerptBn: excerpt,
        readingMinutes: mins,
        status: "PUBLISHED",
        authors: s.author ? { set: [{ id: s.author.id }] } : undefined,
      },
      create: {
        slug: s.slug,
        titleBn: s.title,
        titleEn: s.slug,
        bodyBn: body,
        excerptBn: excerpt,
        readingMinutes: mins,
        status: "PUBLISHED",
        kind: "RACHANA",
        authors: s.author ? { connect: [{ id: s.author.id }] } : undefined,
      },
    });

    console.log(`✅ Updated ${updated.slug} — Body length: ${body.length} chars, reading time: ${mins} min`);
  }

  console.log("All solo pieces updated successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
