import { prisma } from "../src/lib/prisma";

async function checkDatabase() {
  console.log("🔍 Checking database connection...\n");

  try {
    await prisma.$connect();
    console.log("✅ Database connected\n");

    const [authorCount, tagCount, seriesCount, pieceCount] = await Promise.all([
      prisma.author.count(),
      prisma.tag.count(),
      prisma.series.count(),
      prisma.piece.count(),
    ]);

    console.log("📊 Database Contents:");
    console.log(`   Authors: ${authorCount}`);
    console.log(`   Tags: ${tagCount}`);
    console.log(`   Series: ${seriesCount}`);
    console.log(`   Pieces: ${pieceCount}\n`);

    if (authorCount === 0 && tagCount === 0) {
      console.log("⚠️ Database is empty. Run: npm run db:seed");
    } else {
      console.log("✅ Database has content");
    }
  } catch (error) {
    console.error("❌ Database error:", error);
    console.log("\n💡 Check your DATABASE_URL in .env");
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
