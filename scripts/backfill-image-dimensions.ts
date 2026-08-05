import { prisma } from "../src/lib/prisma";
import https from "https";
import http from "http";

/**
 * One-time script to backfill coverImageWidth and coverImageHeight for existing database pieces.
 */
async function probeImageSize(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        resolve(null);
        return;
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        try {
          const buffer = Buffer.concat(chunks);
          // Try probing image size from buffer header
          const sizeOf = require("image-size");
          const dimensions = sizeOf(buffer);
          if (dimensions.width && dimensions.height) {
            resolve({ width: dimensions.width, height: dimensions.height });
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });
    req.on("error", () => resolve(null));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function main() {
  console.log("Starting cover image dimensions backfill...");

  const pieces = await prisma.piece.findMany({
    where: {
      coverImage: { not: null },
      OR: [
        { coverImageWidth: null },
        { coverImageHeight: null },
      ],
    },
    select: { id: true, slug: true, coverImage: true },
  });

  console.log(`Found ${pieces.length} pieces missing image dimensions.`);

  let updatedCount = 0;
  for (const piece of pieces) {
    if (!piece.coverImage) continue;

    console.log(`Probing image for piece "${piece.slug}": ${piece.coverImage}`);
    const dims = await probeImageSize(piece.coverImage);

    if (dims) {
      await prisma.piece.update({
        where: { id: piece.id },
        data: {
          coverImageWidth: dims.width,
          coverImageHeight: dims.height,
        },
      });
      console.log(`✓ Updated "${piece.slug}": ${dims.width}x${dims.height}`);
      updatedCount++;
    } else {
      console.log(`⚠ Could not determine dimensions for "${piece.slug}"`);
    }
  }

  console.log(`Backfill complete. Updated ${updatedCount}/${pieces.length} pieces.`);
}

main()
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
