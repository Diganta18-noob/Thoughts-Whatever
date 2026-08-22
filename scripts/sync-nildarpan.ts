import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { PieceKind, TagKind } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { bengaliSlug, readingMinutes } from "../src/lib/bengali";
import { deriveExcerpt } from "../src/lib/markdown";
import { cleanMarkdownBody } from "./content-ai";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(imagePath: string, folderName: string): Promise<string | null> {
  if (!fs.existsSync(imagePath)) return null;
  const rawBuffer = fs.readFileSync(imagePath);
  const optimizedBuffer = await sharp(rawBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const dataUri = `data:image/webp;base64,${optimizedBuffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: folderName,
    transformation: [{ width: 1600, crop: "limit" }, { quality: "auto:good" }, { fetch_format: "auto" }],
  });
  return result.secure_url;
}

async function main() {
  console.log("⚡ Fast-Syncing Nildarpan Series & Episodes...");

  let author = await prisma.author.findFirst({ where: { slug: "দীনবন্ধু-মিত্র" } });
  if (!author) {
    author = await prisma.author.create({
      data: {
        nameBn: "দীনবন্ধু মিত্র",
        nameEn: "Dinabandhu Mitra",
        slug: "দীনবন্ধু-মিত্র",
        bioBn: "বাংলা নাট্যসাহিত্যের অন্যতম শ্রেষ্ঠ নাট্যকার ও নীলদর্পণ নাটকের স্রষ্টা।",
      },
    });
  }

  const seriesSlug = "নীলদর্পণ";
  const thumbBase = path.join(process.cwd(), "Content", "Thumnail", "নীলদর্পণ");
  const cover1 = path.join(thumbBase, "নীলদর্পণ .png");
  const cover2 = path.join(thumbBase, "নীলদর্পণ পর্ব - ২  .png");
  const cover3 = path.join(thumbBase, "নীলদর্পণ  অন্তিম পর্ব .png");

  console.log("Uploading Nildarpan thumbnails to Cloudinary...");
  const img1 = await uploadImage(cover1, "episodes/নীলদর্পণ");
  const img2 = await uploadImage(cover2, "episodes/নীলদর্পণ");
  const img3 = await uploadImage(cover3, "episodes/নীলদর্পণ");

  let series = await prisma.series.upsert({
    where: { slug: seriesSlug },
    update: {
      titleBn: "নীলদর্পণ",
      titleEn: "Nildarpan - Dinabandhu Mitra",
      descBn: "নীলকর সাহেবদের অমানুষিক অত্যাচার ও কৃষক বিদ্রোহের কালজয়ী ঐতিহাসিক আলেখ্য।",
      coverImage: img1,
    },
    create: {
      slug: seriesSlug,
      titleBn: "নীলদর্পণ",
      titleEn: "Nildarpan - Dinabandhu Mitra",
      descBn: "নীলকর সাহেবদের অমানুষিক অত্যাচার ও কৃষক বিদ্রোহের কালজয়ী ঐতিহাসিক আলেখ্য।",
      coverImage: img1,
    },
  });

  console.log(`✅ Series created/updated: ${series.titleBn} (ID: ${series.id})`);

  const episodes = [
    {
      file: "নীলদর্পণ .txt",
      order: 1,
      slug: "নীলদর্পণ-1",
      titleBn: "নীলদর্পণ",
      coverImage: img1,
    },
    {
      file: "নীলদর্পণ পর্ব - ২  .txt",
      order: 2,
      slug: "নীলদর্পণ-2",
      titleBn: "নীলদর্পণ | পর্ব-২",
      coverImage: img2,
    },
    {
      file: "নীলদর্পণ   অন্তিম পর্ব .txt",
      order: 3,
      slug: "নীলদর্পণ-3",
      titleBn: "নীলদর্পণ | অন্তিম পর্ব",
      coverImage: img3,
    },
  ];

  const contextDir = path.join(process.cwd(), "Content", "context", "নীলদর্পণ - দীনবন্ধু মিত্র");

  for (const ep of episodes) {
    const raw = fs.readFileSync(path.join(contextDir, ep.file), "utf-8");
    const body = cleanMarkdownBody(raw, ep.titleBn);
    const excerpt = deriveExcerpt(body);
    const mins = readingMinutes(body);

    const piece = await prisma.piece.upsert({
      where: { slug: ep.slug },
      update: {
        titleBn: ep.titleBn,
        bodyBn: body,
        excerptBn: excerpt,
        readingMinutes: mins,
        coverImage: ep.coverImage,
        ogImage: ep.coverImage,
        seriesId: series.id,
        seriesOrder: ep.order,
        status: "PUBLISHED",
        authors: { set: [{ id: author.id }] },
      },
      create: {
        slug: ep.slug,
        titleBn: ep.titleBn,
        bodyBn: body,
        excerptBn: excerpt,
        readingMinutes: mins,
        coverImage: ep.coverImage,
        ogImage: ep.coverImage,
        seriesId: series.id,
        seriesOrder: ep.order,
        status: "PUBLISHED",
        kind: PieceKind.DOCUMENTARY,
        authors: { connect: [{ id: author.id }] },
      },
    });

    console.log(`✅ Episode #${ep.order} synced: ${piece.titleBn} (slug: ${piece.slug})`);
  }

  console.log("🎉 Nildarpan series and episodes synced successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
