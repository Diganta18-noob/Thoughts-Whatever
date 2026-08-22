import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Starting SEO Content Fixer...");
  const pieces = await prisma.piece.findMany({
    select: {
      id: true,
      slug: true,
      titleBn: true,
      dekBn: true,
      excerptBn: true,
      bodyBn: true,
      seoDescription: true,
    },
  });

  console.log(`Total pieces found: ${pieces.length}`);

  let updatedCount = 0;

  for (const piece of pieces) {
    const currentSeo = piece.seoDescription?.trim() || "";
    if (!currentSeo || currentSeo.length < 50 || currentSeo.length > 160) {
      console.log(`\n--- Optimizing SEO: [${piece.titleBn}] (Current length: ${currentSeo.length}) ---`);
      
      // Clean body text from markdown symbols
      let cleanBody = (piece.dekBn || piece.excerptBn || piece.bodyBn || "")
        .replace(/[#*`_\[\]()!>\-\n\r]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Formulate engaging editorial meta description
      let generated = "";
      if (cleanBody.length >= 60) {
        generated = cleanBody.slice(0, 140);
      } else {
        generated = `${piece.titleBn} — Thoughts Whatever সাহিত্য বিভাগে প্রকাশিত অনন্য রচনা ও গভীর বিশ্লেষণ। ${cleanBody}`;
      }
      
      // Ensure between 60 and 150 characters
      if (generated.length > 150) {
        const lastSpace = generated.lastIndexOf(" ", 145);
        if (lastSpace > 60) {
          generated = generated.slice(0, lastSpace) + "...";
        } else {
          generated = generated.slice(0, 145) + "...";
        }
      }
      
      if (generated.length < 60) {
        generated = `${generated} | Thoughts Whatever সাহিত্য পোর্টাল।`;
      }

      console.log(`  New SEO Description (${generated.length} chars): "${generated}"`);

      await prisma.piece.update({
        where: { id: piece.id },
        data: { seoDescription: generated },
      });
      console.log(`  ✅ Successfully updated in PostgreSQL!`);
      updatedCount++;
    } else {
      console.log(`  [OK] ${piece.titleBn} (${currentSeo.length} chars)`);
    }
  }

  console.log(`\n🎉 SEO Fix Complete! Total updated pieces: ${updatedCount}`);
}

main()
  .catch((e) => {
    console.error("Error updating SEO content:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
