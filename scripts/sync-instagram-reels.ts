import { prisma } from "../src/lib/prisma";

export interface ReelFeedItem {
  reelUrl: string;
  caption?: string;
  episodeOrder?: number;
  seriesSlug?: string;
}

/**
 * Known Real Live Instagram Reels for @thoughts.whatever_
 */
const LIVE_REELS: ReelFeedItem[] = [
  {
    reelUrl: "https://www.instagram.com/reels/Da-qp65A20J/",
    caption: "মেঘনাদবধ কাব্য পর্ব-১ | ঘরের শত্রু বিভীষণ",
    episodeOrder: 1,
    seriesSlug: "মেঘনাদবধ-কাব্য",
  },



];

export async function autoMatchAndSyncReels(feed: ReelFeedItem[]) {
  console.log(`Starting automated Instagram Reel sync for ${feed.length} items...`);

  let updatedCount = 0;

  for (const item of feed) {
    const reelUrl = item.reelUrl.trim();
    if (!reelUrl) continue;

    // 1. Match by explicit episodeOrder + seriesSlug if provided
    if (item.episodeOrder && item.seriesSlug) {
      const piece = await prisma.piece.findFirst({
        where: {
          seriesOrder: item.episodeOrder,
          slug: { startsWith: item.seriesSlug },
        },
      });

      if (piece) {
        await prisma.piece.update({
          where: { id: piece.id },
          data: { reelUrl },
        });
        console.log(`✓ Auto-matched Reel to piece: ${piece.slug} (${piece.titleBn}) -> ${reelUrl}`);
        updatedCount++;
        continue;
      }
    }

    // 2. Auto-parse caption for episode number (e.g. "পর্ব-১" or "পর্ব 1")
    if (item.caption) {
      const match = item.caption.match(/পর্ব[-:\s]*([১-৯1-9]+)/);
      if (match) {
        const epNum = match[1];
        // Convert Bengali digits to English
        const enNum = parseInt(
          epNum.replace(/[১]/g, "1").replace(/[২]/g, "2").replace(/[৩]/g, "3").replace(/[৪]/g, "4").replace(/[৫]/g, "5").replace(/[৬]/g, "6")
        );

        if (!isNaN(enNum)) {
          const piece = await prisma.piece.findFirst({
            where: {
              seriesOrder: enNum,
              slug: { contains: "মেঘনাদবধ" },
            },
          });

          if (piece) {
            await prisma.piece.update({
              where: { id: piece.id },
              data: { reelUrl },
            });
            console.log(`✓ Caption-matched Reel to piece: ${piece.slug} -> ${reelUrl}`);
            updatedCount++;
          }
        }
      }
    }
  }

  console.log(`Successfully auto-synced ${updatedCount} Instagram Reel links to database!`);
  return updatedCount;
}

async function main() {
  await autoMatchAndSyncReels(LIVE_REELS);
}

if (require.main === module) {
  main()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
    });
}
