import { prisma } from "../src/lib/prisma";

const reelsMapping: Record<string, string> = {
  "মেঘনাদবধ-কাব্য-1": "https://www.instagram.com/reel/Da-qp65A20J/",
  "মেঘনাদবধ-কাব্য-2": "https://www.instagram.com/reel/Da-toM1g89q/",
  "মেঘনাদবধ-কাব্য-3": "https://www.instagram.com/reel/Da-v3_YgMq_/",
  "মেঘনাদবধ-কাব্য-4": "https://www.instagram.com/reel/DbBGmEiBUal/",
  "মেঘনাদবধ-কাব্য-5": "https://www.instagram.com/reel/DbBRRZ_AIOJ/",
  "মেঘনাদবধ-কাব্য-6": "https://www.instagram.com/reel/DbBnByKTx3J/",
};

async function updateReels() {
  console.log("Updating Instagram Reel URLs for Meghnadbadh Kavya parts 1 to 6...");

  for (const [slug, reelUrl] of Object.entries(reelsMapping)) {
    const updated = await prisma.piece.updateMany({
      where: { slug },
      data: { reelUrl },
    });
    console.log(`Updated ${slug}: ${updated.count} record(s) -> ${reelUrl}`);
  }
  
  console.log("Finished updating database!");
}

updateReels()
  .catch(console.error)
  .finally(() => process.exit(0));
