import "dotenv/config";
import { runSEOAndBrokenLinkAudit } from "../src/lib/seo-scanner";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await runSEOAndBrokenLinkAudit();
  console.log(`\n================================`);
  console.log(`Overall SEO Score: ${result.overallScore} / 100`);
  console.log(`Total Pieces Scanned: ${result.totalPiecesScanned}`);
  console.log(`Critical Issues: ${result.criticalIssuesCount}`);
  console.log(`Warning Issues: ${result.warningIssuesCount}`);
  console.log(`Broken Links: ${result.brokenLinksCount}`);
  console.log(`\nCategory Breakdown:`);
  console.log(`  Meta Tags: ${result.categoryScores.metaTags} / 100`);
  console.log(`  Content Structure: ${result.categoryScores.contentStructure} / 100`);
  console.log(`  Link Health: ${result.categoryScores.linkHealth} / 100`);
  console.log(`  Image Optimization: ${result.categoryScores.imageOptimization} / 100`);
  console.log(`================================\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
