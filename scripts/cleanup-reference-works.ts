import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🧹 Purging old reference works, keeping Debabrata Biswas 1974 audio only...");
  
  const deleted = await prisma.referenceWork.deleteMany({
    where: {
      slug: {
        not: "debabrata-biswas-rabindrasangeet-1974",
      },
    },
  });

  console.log(`✅ Successfully deleted ${deleted.count} old reference works.`);

  const remaining = await prisma.referenceWork.findMany({
    select: {
      id: true,
      slug: true,
      titleBn: true,
      type: true,
    },
  });

  console.log("📚 Active Reference Works in Library:", remaining);
}

main()
  .catch((err) => {
    console.error("❌ Cleanup error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
