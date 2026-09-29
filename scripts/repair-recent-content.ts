import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { syncAllMediaUsage } from "../src/lib/media";
import { ENGLISH_TITLES } from "./process-content";

async function main() {
  const pieces = await prisma.piece.findMany({
    where: { slug: { in: Object.keys(ENGLISH_TITLES) }, status: "PUBLISHED" },
    select: { id: true, slug: true, publishedAt: true, coverImage: true, thumbnailImage: true },
  });

  for (const piece of pieces) {
    await prisma.piece.update({
      where: { id: piece.id },
      data: {
        titleEn: ENGLISH_TITLES[piece.slug],
        reviewStatus: piece.publishedAt && piece.publishedAt.getTime() > Date.now() ? "scheduled" : "published",
      },
    });
  }

  const sync = await syncAllMediaUsage();
  const urls = [...new Set(pieces.flatMap((piece) => [piece.coverImage, piece.thumbnailImage]).filter((url): url is string => Boolean(url)))];
  for (const url of urls) {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Image check failed (${response.status}): ${url}`);
    const timing = response.headers.get("server-timing") || "";
    const dimensions = timing.match(/width=(\d+),height=(\d+),bytes=(\d+)/);
    if (!dimensions) throw new Error(`Cloudinary did not return image dimensions: ${url}`);
    const width = Number(dimensions[1]);
    const height = Number(dimensions[2]);
    const media = await prisma.media.findFirst({ where: { url }, select: { id: true, metadata: true } });
    if (!media) throw new Error(`Media sync missed: ${url}`);
    const metadata = media.metadata && typeof media.metadata === "object" && !Array.isArray(media.metadata)
      ? media.metadata as Record<string, unknown> : {};
    await prisma.media.update({
      where: { id: media.id },
      data: {
        width,
        height,
        sizeBytes: Number(dimensions[3]),
        metadata: { ...metadata, orientation: width >= height * 1.08 ? "landscape" : height >= width * 1.08 ? "portrait" : "square" },
      },
    });
  }

  console.log(JSON.stringify({ pieces: pieces.length, images: urls.length, mediaCreated: sync.createdCount }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
