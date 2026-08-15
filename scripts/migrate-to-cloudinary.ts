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

const DRY_RUN = process.argv.includes("--dry-run");
if (DRY_RUN) console.log("🧪 DRY RUN — no database writes\n");

type Uploaded = { url: string; width: number; height: number };

async function uploadToCloudinary(input: string, publicId: string): Promise<Uploaded | null> {
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
    return { url: result.secure_url, width: result.width, height: result.height };
  } catch (err: any) {
    console.error(`  ❌ Failed uploading ${publicId}:`, err?.message || err);
    return null;
  }
}

/** Never overwrite the only copy of an image with a URL that does not resolve. */
async function verify(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    const type = res.headers.get("content-type") ?? "";
    const ok = res.ok && type.startsWith("image/");
    if (!ok) console.error(`  ❌ Verification failed: ${res.status} ${type}`);
    return ok;
  } catch (err: any) {
    console.error(`  ❌ Verification threw:`, err?.message || err);
    return false;
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

    const uploaded = await uploadToCloudinary(sourceInput, publicId);
    if (!uploaded) continue;
    if (!(await verify(uploaded.url))) continue;

    if (DRY_RUN) {
      console.log(`  🧪 would set ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
      continue;
    }

    await prisma.piece.update({
      where: { id: piece.id },
      data: {
        coverImage: uploaded.url,
        coverImageWidth: uploaded.width,
        coverImageHeight: uploaded.height,
      },
    });
    console.log(`  ✨ ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
  }

  // Also check Series cover images
  const seriesList = await prisma.series.findMany({ select: { id: true, slug: true, coverImage: true } });
  for (const s of seriesList) {
    if (s.coverImage && s.coverImage.startsWith("data:")) {
      console.log(`\n📌 Processing Series: ${s.slug}`);
      const publicId = `series_${s.slug.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
      const uploaded = await uploadToCloudinary(s.coverImage, publicId);
      if (!uploaded) continue;
      if (!(await verify(uploaded.url))) continue;

      if (DRY_RUN) {
        console.log(`  🧪 would set ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
        continue;
      }

      await prisma.series.update({
        where: { id: s.id },
        data: {
          coverImage: uploaded.url,
          coverImageWidth: uploaded.width,
          coverImageHeight: uploaded.height,
        },
      });
      console.log(`  ✨ ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
    }
  }

  console.log("\n🎉 Cloudinary Image Migration Complete!");
}

run()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
