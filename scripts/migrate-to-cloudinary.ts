import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../src/lib/prisma";

// Configure Cloudinary with actual cloud_name from account
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌ Missing Cloudinary env variables!");
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

async function uploadToCloudinary(input: string, publicId: string): Promise<string | null> {
  try {
    console.log(`  📤 Uploading to Cloudinary (${publicId})...`);
    const result = await cloudinary.uploader.upload(input, {
      folder: "thoughts-whatever",
      public_id: publicId,
      overwrite: true,
      transformation: [
        { width: 1600, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });
    return result.secure_url;
  } catch (err: any) {
    console.error(`  ❌ Failed uploading ${publicId}:`, err?.message || err);
    return null;
  }
}

async function run() {
  console.log("🚀 Starting Cloudinary Image Migration...\n");

  // 1. Check Cloudinary Ping
  try {
    await cloudinary.api.ping();
    console.log("✅ Cloudinary Connection Verified!\n");
  } catch (err: any) {
    console.error("❌ Cloudinary connection test failed:", err?.message || err);
    process.exit(1);
  }

  // 2. Fetch all pieces from DB
  const pieces = await prisma.piece.findMany({
    select: { id: true, slug: true, titleBn: true, coverImage: true, series: { select: { slug: true } } },
  });

  const thumbnailBaseDir = path.join(process.cwd(), "Content", "Thumnail");

  for (const piece of pieces) {
    console.log(`\n📌 Processing Piece: ${piece.slug} (${piece.titleBn})`);

    let sourceInput: string | null = null;
    let publicId = piece.slug.replace(/[^a-zA-Z0-9_-]/g, "_");

    // Check if local image exists in Content/Thumnail
    if (piece.series?.slug === "crime-and-punishment") {
      const match = piece.slug.match(/\d+$/);
      if (match) {
        const localPath = path.join(thumbnailBaseDir, "Crime and punishment", `Crime and punishment ${match[0]}.PNG`);
        if (fs.existsSync(localPath)) sourceInput = localPath;
      }
    } else if (piece.slug === "রক্তকরবী") {
      const files = fs.readdirSync(path.join(thumbnailBaseDir, "Solo"));
      const pngFile = files.find((f) => f.endsWith(".PNG") || f.endsWith(".png"));
      if (pngFile) sourceInput = path.join(thumbnailBaseDir, "Solo", pngFile);
    } else if (piece.slug.includes("মেঘনাদবধ")) {
      const match = piece.slug.match(/\d+$/);
      if (match) {
        const dir = fs.readdirSync(thumbnailBaseDir).find((d) => d.includes("Series") || d.includes("মেঘনাদবধ"));
        if (dir) {
          const files = fs.readdirSync(path.join(thumbnailBaseDir, dir));
          const file = files.find((f) => f.includes(match[0]) && (f.endsWith(".jpg") || f.endsWith(".png")));
          if (file) sourceInput = path.join(thumbnailBaseDir, dir, file);
        }
      }
    }

    // Fallback to existing base64 Data URI if local file not found
    if (!sourceInput && piece.coverImage && piece.coverImage.startsWith("data:")) {
      sourceInput = piece.coverImage;
    }

    if (!sourceInput) {
      console.log("  ⚠️ No local file or Data URI found for this piece.");
      continue;
    }

    const cdnUrl = await uploadToCloudinary(sourceInput, publicId);
    if (cdnUrl) {
      await prisma.piece.update({
        where: { id: piece.id },
        data: { coverImage: cdnUrl },
      });
      console.log(`  ✨ Updated DB with Cloudinary CDN URL: ${cdnUrl}`);
    }
  }

  // Also check Series cover images
  const seriesList = await prisma.series.findMany({ select: { id: true, slug: true, coverImage: true } });
  for (const s of seriesList) {
    if (s.coverImage && s.coverImage.startsWith("data:")) {
      console.log(`\n📌 Processing Series: ${s.slug}`);
      const publicId = `series_${s.slug.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      const cdnUrl = await uploadToCloudinary(s.coverImage, publicId);
      if (cdnUrl) {
        await prisma.series.update({
          where: { id: s.id },
          data: { coverImage: cdnUrl },
        });
        console.log(`  ✨ Updated Series DB with Cloudinary CDN URL: ${cdnUrl}`);
      }
    }
  }

  console.log("\n🎉 Cloudinary Image Migration Complete!");
  process.exit(0);
}

run();
