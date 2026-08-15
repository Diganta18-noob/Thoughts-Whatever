import { prisma } from "../src/lib/prisma";
import sharp from "sharp";

/**
 * One-time script to backfill coverImageWidth and coverImageHeight for existing database pieces.
 */

/** Handles both a remote URL and a legacy base64 data URI. */
async function probeImageSize(src: string): Promise<{ width: number; height: number } | null> {
  try {
    let buffer: Buffer;

    if (src.startsWith("data:")) {
      const base64 = src.slice(src.indexOf(",") + 1);
      buffer = Buffer.from(base64, "base64");
    } else if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      return null;
    }

    const { width, height } = await sharp(buffer).metadata();
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
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

    // Truncated: a legacy data-URI cover is up to 3 MB of base64 on one line.
    console.log(`Probing image for piece "${piece.slug}": ${piece.coverImage.slice(0, 60)}…`);
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
