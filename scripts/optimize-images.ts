import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { prisma } from "../src/lib/prisma";

async function optimizeImage(inputBuffer: Buffer, targetWidth = 1200, quality = 80): Promise<{ dataUri: string; sizeKb: number }> {
  const optimized = await sharp(inputBuffer)
    .resize({ width: targetWidth, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  const base64 = optimized.toString("base64");
  const dataUri = `data:image/webp;base64,${base64}`;
  const sizeKb = Math.round((base64.length * 0.75) / 1024);

  return { dataUri, sizeKb };
}

async function run() {
  console.log("⚡ Starting High-Efficiency Image Optimization (PNG -> WebP 1200px)...");

  const thumbnailBaseDir = path.join(process.cwd(), "Content", "Thumnail");
  const pieces = await prisma.piece.findMany({
    select: { id: true, slug: true, titleBn: true, coverImage: true, series: { select: { slug: true } } },
  });

  for (const piece of pieces) {
    let sourceBuffer: Buffer | null = null;
    let origin = "";

    // 1. Check local source files first
    if (piece.series?.slug === "crime-and-punishment") {
      const match = piece.slug.match(/\d+$/);
      if (match) {
        const localPath = path.join(thumbnailBaseDir, "Crime and punishment", `Crime and punishment ${match[0]}.PNG`);
        if (fs.existsSync(localPath)) {
          sourceBuffer = fs.readFileSync(localPath);
          origin = `File: ${path.basename(localPath)}`;
        }
      }
    } else if (piece.slug === "রক্তকরবী") {
      const files = fs.readdirSync(path.join(thumbnailBaseDir, "Solo"));
      const pngFile = files.find((f) => f.endsWith(".PNG") || f.endsWith(".png"));
      if (pngFile) {
        const localPath = path.join(thumbnailBaseDir, "Solo", pngFile);
        sourceBuffer = fs.readFileSync(localPath);
        origin = `File: ${pngFile}`;
      }
    } else if (piece.slug.includes("মেঘনাদবধ")) {
      const match = piece.slug.match(/\d+$/);
      if (match) {
        const dir = fs.readdirSync(thumbnailBaseDir).find((d) => d.includes("Series") || d.includes("মেঘনাদবধ"));
        if (dir) {
          const files = fs.readdirSync(path.join(thumbnailBaseDir, dir));
          const file = files.find((f) => f.includes(match[0]) && (f.endsWith(".jpg") || f.endsWith(".png")));
          if (file) {
            const localPath = path.join(thumbnailBaseDir, dir, file);
            sourceBuffer = fs.readFileSync(localPath);
            origin = `File: ${file}`;
          }
        }
      }
    }

    // 2. Fallback to base64 Data URI in DB
    if (!sourceBuffer && piece.coverImage && piece.coverImage.startsWith("data:")) {
      const parts = piece.coverImage.split(",");
      if (parts[1]) {
        sourceBuffer = Buffer.from(parts[1], "base64");
        origin = "DB Base64";
      }
    }

    if (!sourceBuffer) {
      console.log(`⚠️ ${piece.slug}: No source image found.`);
      continue;
    }

    const beforeKb = Math.round(sourceBuffer.length / 1024);
    const { dataUri, sizeKb: afterKb } = await optimizeImage(sourceBuffer, 1200, 82);

    await prisma.piece.update({
      where: { id: piece.id },
      data: { coverImage: dataUri },
    });

    console.log(
      `✅ ${piece.slug.padEnd(25)} | Source: ${origin.padEnd(20)} | ${beforeKb} KB -> ${afterKb} KB (Reduced by ${Math.round(
        ((beforeKb - afterKb) / beforeKb) * 100
      )}%)`
    );
  }

  console.log("\n✨ Image Optimization Complete!");
  process.exit(0);
}

run();
