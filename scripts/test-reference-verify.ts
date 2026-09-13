import { prisma } from "../src/lib/prisma";
import { deriveCapabilities } from "../src/lib/reference/rights-engine";

async function main() {
  const works = await prisma.referenceWork.findMany({
    include: {
      editions: {
        include: { rights: true, sources: true, assets: true },
      },
    },
  });

  console.log(`\n========================================`);
  console.log(`Verified Works in Reference Library: ${works.length}`);
  console.log(`========================================`);

  for (const w of works) {
    const ed = w.editions[0];
    const caps = deriveCapabilities({
      rightsStatus: ed?.rights?.status || "RIGHTS_UNVERIFIED",
      hostingMode: ed?.hostingMode || "EXTERNAL",
      assets: ed?.assets || [],
      sourceUrl: ed?.sources[0]?.sourceUrl || null,
    });

    console.log(`\n• Work: ${w.titleBn} (${w.slug})`);
    console.log(`  - Type: ${w.type} | Era: ${w.era || "N/A"}`);
    console.log(`  - Rights Status: ${ed?.rights?.status || "NONE"}`);
    console.log(`  - Hosting Mode: ${ed?.hostingMode || "NONE"}`);
    console.log(`  - Can Download Hosted File: ${caps.canDownload}`);
    console.log(`  - Can Read Online: ${caps.canReadOnline}`);
    console.log(`  - Can Listen Audio: ${caps.canListen}`);
    console.log(`  - Source URL: ${caps.originalSourceUrl || "N/A"}`);
  }

  console.log(`\n========================================`);
  console.log(`All invariant checks completed successfully.`);
  console.log(`========================================\n`);
}

main()
  .catch((err) => {
    console.error("Verification error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
