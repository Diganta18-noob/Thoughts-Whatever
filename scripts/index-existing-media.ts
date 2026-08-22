import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting Auto-Indexing of Existing Media Assets into Media Library...");

  const [pieces, seriesList, authors] = await Promise.all([
    prisma.piece.findMany({
      select: { id: true, titleBn: true, coverImage: true, ogImage: true, bodyBn: true },
    }),
    prisma.series.findMany({
      select: { id: true, titleBn: true, coverImage: true },
    }),
    prisma.author.findMany({
      select: { id: true, nameBn: true, portrait: true },
    }),
  ]);

  const MD_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let createdCount = 0;
  let linkedCount = 0;

  async function registerMedia(
    url: string,
    entityType: "Piece" | "Series" | "Author",
    entityId: string,
    entityTitle: string,
    field: string,
    altText?: string
  ) {
    if (!url || typeof url !== "string" || !url.trim()) return;
    const cleanUrl = url.trim();

    let filename = cleanUrl.split("/").pop()?.split("?")[0] || "asset.jpg";
    if (!filename.includes(".")) filename += ".jpg";

    let mimeType = "image/jpeg";
    if (filename.endsWith(".png")) mimeType = "image/png";
    else if (filename.endsWith(".webp")) mimeType = "image/webp";
    else if (filename.endsWith(".svg")) mimeType = "image/svg+xml";
    else if (filename.endsWith(".mp4")) mimeType = "video/mp4";
    else if (filename.endsWith(".pdf")) mimeType = "application/pdf";

    // 1. Find or create Media record
    let media = await prisma.media.findFirst({ where: { url: cleanUrl } });

    if (!media) {
      media = await prisma.media.create({
        data: {
          url: cleanUrl,
          filename,
          originalName: filename,
          mimeType,
          sizeBytes: 150000,
          width: 1200,
          height: 630,
          altText: altText || entityTitle,
          caption: `${entityTitle} (${field})`,
        },
      });
      createdCount++;
      console.log(`  📸 Created Media asset: [${filename}] for "${entityTitle}"`);
    }

    // 2. Link MediaUsage
    await prisma.mediaUsage.upsert({
      where: {
        mediaId_entityType_entityId_field: {
          mediaId: media.id,
          entityType,
          entityId,
          field,
        },
      },
      update: { entityTitle },
      create: {
        mediaId: media.id,
        entityType,
        entityId,
        field,
        entityTitle,
      },
    });
    linkedCount++;
  }

  // 1. Index Pieces
  for (const piece of pieces) {
    if (piece.coverImage) {
      await registerMedia(piece.coverImage, "Piece", piece.id, piece.titleBn, "coverImage");
    }
    if (piece.ogImage && piece.ogImage !== piece.coverImage) {
      await registerMedia(piece.ogImage, "Piece", piece.id, piece.titleBn, "ogImage");
    }
    const bodyImages = [...(piece.bodyBn || "").matchAll(MD_IMAGE_REGEX)];
    for (const match of bodyImages) {
      const alt = match[1];
      const imgUrl = match[2];
      await registerMedia(imgUrl, "Piece", piece.id, piece.titleBn, "bodyBn", alt);
    }
  }

  // 2. Index Series
  for (const s of seriesList) {
    if (s.coverImage) {
      await registerMedia(s.coverImage, "Series", s.id, s.titleBn, "coverImage");
    }
  }

  // 3. Index Authors
  for (const a of authors) {
    if (a.portrait) {
      await registerMedia(a.portrait, "Author", a.id, a.nameBn, "portrait");
    }
  }

  console.log(`\n🎉 Media Indexing Complete!`);
  console.log(`  Total Media assets created: ${createdCount}`);
  console.log(`  Total Media usages linked: ${linkedCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
