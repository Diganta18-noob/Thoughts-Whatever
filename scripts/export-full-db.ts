import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting full database export from MongoDB...");
  const exportDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const exportPath = path.join(exportDir, `mongodb-backup-${timestamp}.json`);

  try {
    const [
      pieces,
      series,
      authors,
      tags,
      sources,
      timelineEvents,
      subscribers,
      adminUsers,
      refreshTokens,
      analyticsEvents,
      auditLogs,
      promptLogs,
    ] = await Promise.all([
      prisma.piece.findMany().catch((e) => { console.warn("Piece fetch error:", e.message); return []; }),
      prisma.series.findMany().catch((e) => { console.warn("Series fetch error:", e.message); return []; }),
      prisma.author.findMany().catch((e) => { console.warn("Author fetch error:", e.message); return []; }),
      prisma.tag.findMany().catch((e) => { console.warn("Tag fetch error:", e.message); return []; }),
      prisma.source.findMany().catch((e) => { console.warn("Source fetch error:", e.message); return []; }),
      prisma.timelineEvent.findMany().catch((e) => { console.warn("TimelineEvent fetch error:", e.message); return []; }),
      prisma.subscriber.findMany().catch((e) => { console.warn("Subscriber fetch error:", e.message); return []; }),
      prisma.adminUser.findMany().catch((e) => { console.warn("AdminUser fetch error:", e.message); return []; }),
      prisma.refreshToken.findMany().catch((e) => { console.warn("RefreshToken fetch error:", e.message); return []; }),
      prisma.analyticsEvent.findMany().catch((e) => { console.warn("AnalyticsEvent fetch error:", e.message); return []; }),
      prisma.auditLog.findMany().catch((e) => { console.warn("AuditLog fetch error:", e.message); return []; }),
      prisma.promptLog.findMany().catch((e) => { console.warn("PromptLog fetch error:", e.message); return []; }),
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      counts: {
        pieces: pieces.length,
        series: series.length,
        authors: authors.length,
        tags: tags.length,
        sources: sources.length,
        timelineEvents: timelineEvents.length,
        subscribers: subscribers.length,
        adminUsers: adminUsers.length,
        refreshTokens: refreshTokens.length,
        analyticsEvents: analyticsEvents.length,
        auditLogs: auditLogs.length,
        promptLogs: promptLogs.length,
      },
      data: {
        pieces,
        series,
        authors,
        tags,
        sources,
        timelineEvents,
        subscribers,
        adminUsers,
        refreshTokens,
        analyticsEvents,
        auditLogs,
        promptLogs,
      },
    };

    fs.writeFileSync(exportPath, JSON.stringify(backupData, null, 2), "utf-8");
    console.log(`\n Database backup saved successfully!`);
    console.log(` File path: ${exportPath}`);
    console.log(` Summary:`, JSON.stringify(backupData.counts, null, 2));
  } catch (error) {
    console.error("Backup failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
