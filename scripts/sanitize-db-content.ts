import { prisma } from "../src/lib/prisma";

async function checkAndSanitize() {
  console.log("🔍 Scanning pieces in PostgreSQL database for title & Unicode anomalies...");
  const pieces = await prisma.piece.findMany({
    select: { id: true, slug: true, titleBn: true, excerptBn: true, bodyBn: true },
  });

  console.log(`Found ${pieces.length} pieces to audit.`);
  let fixedCount = 0;

  for (const p of pieces) {
    let needsUpdate = false;
    let newTitle = p.titleBn;
    let newExcerpt = p.excerptBn || "";

    // 1. Standardize 'ভয় শুন্য' -> 'ভয়শূন্য'
    if (newTitle && (newTitle.includes("ভয় শুন্য") || newTitle.includes("ভয় শুন্য") || newTitle.includes("ভয় শূন্য"))) {
      newTitle = "চিত্ত যেথা ভয়শূন্য";
      needsUpdate = true;
    }

    // 2. Fix Armenian 'ա' (U+0561) or homoglyph OCR bugs
    if (newExcerpt && (/[\u0530-\u058F]/.test(newExcerpt) || newExcerpt.includes("mortաl"))) {
      newExcerpt = newExcerpt.replace(/\u0561/g, "a");
      needsUpdate = true;
    }

    // 3. Fix truncated ellipses or weird chars in excerpts
    if (newExcerpt && newExcerpt.includes("Sophoc…")) {
      newExcerpt = newExcerpt.replace("Sophoc…", "Sophocles.");
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log(`✨ Fixing piece [${p.slug}]:`);
      console.log(`   Title:   "${p.titleBn}" -> "${newTitle}"`);
      console.log(`   Excerpt: "${p.excerptBn?.slice(0, 60)}..." -> "${newExcerpt?.slice(0, 60)}..."`);

      await prisma.piece.update({
        where: { id: p.id },
        data: {
          titleBn: newTitle,
          excerptBn: newExcerpt,
        },
      });
      fixedCount++;
    }
  }

  console.log(`\n✅ Database content audit complete. Total pieces sanitized: ${fixedCount}`);
}

checkAndSanitize()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
