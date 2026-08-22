import "dotenv/config";
import { runSEOAndBrokenLinkAudit } from "../src/lib/seo-scanner";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await runSEOAndBrokenLinkAudit();
  console.log(`Scanned ${result.scannedPieces.length} pieces:\n`);
  for (const p of result.scannedPieces) {
    if (p.score < 100) {
      console.log(`[Score: ${p.score}] ${p.titleBn} (/${p.slug})`);
      for (const issue of p.issues) {
        console.log(`   -> [${issue.severity}] ${issue.type}: ${issue.message}`);
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
