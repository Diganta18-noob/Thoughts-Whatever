import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma";
import { readingMinutes } from "../src/lib/bengali";
import { deriveExcerpt } from "../src/lib/markdown";
import { cleanMarkdownBody } from "./content-ai";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(imagePath: string, folderName: string): Promise<{ url: string; width: number; height: number } | null> {
  if (!fs.existsSync(imagePath)) {
    console.warn(`⚠️ Thumbnail not found at: ${imagePath}`);
    return null;
  }
  const rawBuffer = fs.readFileSync(imagePath);
  const metadata = await sharp(rawBuffer).metadata();
  const optimizedBuffer = await sharp(rawBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const dataUri = `data:image/webp;base64,${optimizedBuffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: folderName,
    transformation: [{ width: 1600, crop: "limit" }, { quality: "auto:good" }, { fetch_format: "auto" }],
  });
  return {
    url: result.secure_url,
    width: result.width || metadata.width || 1200,
    height: result.height || metadata.height || 630,
  };
}

async function main() {
  console.log("Updating solo pieces and thumbnails in database...");

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

  let manik = await prisma.author.findFirst({ where: { slug: "মানিক-বন্দ্যোপাধ্যায়" } });
  if (!manik) {
    manik = await prisma.author.create({
      data: {
        nameBn: "মানিক বন্দ্যোপাধ্যায়",
        nameEn: "Manik Bandyopadhyay",
        slug: "মানিক-বন্দ্যোপাধ্যায়",
        bioBn: "আধুনিক বাংলা কথাসাহিত্যের অন্যতম প্রধান ঔপন্যাসিক ও বাস্তববাদী কথাসাহিত্যিক।",
      },
    });
  }

  let shelley = await prisma.author.findFirst({ where: { slug: "mary-shelley" } });
  if (!shelley) {
    shelley = await prisma.author.create({
      data: {
        nameBn: "মেরি শেলি",
        nameEn: "Mary Shelley",
        slug: "mary-shelley",
        bioBn: "English novelist best known for her iconic Gothic masterpiece Frankenstein.",
      },
    });
  }

  const solos = [
    { file: "ঘরে-বাইরে.txt", thumb: "ঘরে-বাইরে.PNG", slug: "ঘরে-বাইরে", title: "বিমলা (ঘরে-বাইরে)", author: tagore },
    { file: "দেবী .txt", thumb: "দেবী.PNG", slug: "দেবী", title: "দেবী", author: sarat },
    { file: "রক্তকরবী.txt", thumb: "রক্তকরবী.PNG", slug: "রক্তকরবী", title: "রক্তকরবী", author: tagore },
    { file: "কপালকুন্ডলা.txt", thumb: "কপালকুন্ডলা.PNG", slug: "কপালকুণ্ডলা", title: "কপালকুণ্ডলা", author: bankim },
    { file: "পদ্মা নদীর মাঝি.txt", thumb: "পদ্মা নদীর মাঝি.PNG", slug: "পদ্মা-নদীর-মাঝি", title: "পদ্মা নদীর মাঝি", author: manik },
    { file: "Frankenstein.txt", thumb: "Frankenstein.PNG", slug: "frankenstein", title: "Frankenstein", author: shelley },
  ];

  for (const s of solos) {
    const raw = fs.readFileSync(path.join(process.cwd(), "Content", "solo", s.file), "utf-8");
    const body = cleanMarkdownBody(raw, s.title);
    const excerpt = deriveExcerpt(body);
    const mins = readingMinutes(body);

    const thumbPath = path.join(process.cwd(), "Content", "Thumnail", "Solo", s.thumb);
    let coverImage = null;
    let coverImageWidth = null;
    let coverImageHeight = null;

    if (fs.existsSync(thumbPath)) {
      console.log(`🖼️ Uploading thumbnail for ${s.title}...`);
      const imgRes = await uploadImage(thumbPath, "solo-pieces");
      if (imgRes) {
        coverImage = imgRes.url;
        coverImageWidth = imgRes.width;
        coverImageHeight = imgRes.height;
      }
    }

    const updated = await prisma.piece.upsert({
      where: { slug: s.slug },
      update: {
        titleBn: s.title,
        bodyBn: body,
        excerptBn: excerpt,
        readingMinutes: mins,
        status: "PUBLISHED",
        coverImage: coverImage || undefined,
        coverImageWidth: coverImageWidth || undefined,
        coverImageHeight: coverImageHeight || undefined,
        ogImage: coverImage || undefined,
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
        coverImage,
        coverImageWidth,
        coverImageHeight,
        ogImage: coverImage,
        authors: s.author ? { connect: [{ id: s.author.id }] } : undefined,
      },
    });

    console.log(`✅ Updated ${updated.slug} — Cover: ${updated.coverImage ? "OK" : "None"}`);
  }

  console.log("All solo pieces and thumbnails updated successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
