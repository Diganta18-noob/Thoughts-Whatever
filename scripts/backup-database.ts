import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📦 Starting Complete Database Backup with Instagram Reels & Publication Dates...\n");
  const exportDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupJsonPath = path.join(exportDir, `database-backup-${timestamp}.json`);
  const manifestMdPath = path.join(exportDir, `LATEST_CONTENT_CATALOG.md`);
  const latestBackupJsonPath = path.join(exportDir, `database-backup-latest.json`);

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
      promptLogs,
    ] = await Promise.all([
      prisma.piece.findMany({
        include: {
          authors: true,
          tags: true,
          series: true,
          sources: true,
          timeline: true,
        },
        orderBy: { publishedAt: "desc" },
      }),
      prisma.series.findMany({
        include: {
          pieces: {
            select: { id: true, slug: true, titleBn: true, seriesOrder: true, reelUrl: true, publishedAt: true },
            orderBy: { seriesOrder: "asc" },
          },
        },
      }),
      prisma.author.findMany({
        include: {
          pieces: { select: { id: true, slug: true, titleBn: true, publishedAt: true } },
        },
      }),
      prisma.tag.findMany(),
      prisma.source.findMany(),
      prisma.timelineEvent.findMany(),
      prisma.subscriber.findMany(),
      prisma.adminUser.findMany({ select: { id: true, email: true, nameBn: true, createdAt: true } }),
      prisma.promptLog.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const backupData = {
      backupTimestamp: new Date().toISOString(),
      counts: {
        pieces: pieces.length,
        series: series.length,
        authors: authors.length,
        tags: tags.length,
        sources: sources.length,
        timelineEvents: timelineEvents.length,
        subscribers: subscribers.length,
        adminUsers: adminUsers.length,
        promptLogs: promptLogs.length,
      },
      contentCatalog: pieces.map((p) => ({
        id: p.id,
        slug: p.slug,
        titleBn: p.titleBn,
        titleEn: p.titleEn,
        kind: p.kind,
        status: p.status,
        publishedAt: p.publishedAt ? p.publishedAt.toISOString().split("T")[0] : null,
        reelUrl: p.reelUrl,
        series: p.series ? { slug: p.series.slug, titleBn: p.series.titleBn, order: p.seriesOrder } : null,
        authors: p.authors.map((a) => a.nameBn),
        coverImage: p.coverImage,
      })),
      data: {
        pieces,
        series,
        authors,
        tags,
        sources,
        timelineEvents,
        subscribers,
        adminUsers,
        promptLogs,
      },
    };

    // Save timestamped JSON
    fs.writeFileSync(backupJsonPath, JSON.stringify(backupData, null, 2), "utf-8");
    // Save latest canonical pointer
    fs.writeFileSync(latestBackupJsonPath, JSON.stringify(backupData, null, 2), "utf-8");

    // Generate human-readable Markdown Catalog
    let md = `# 📚 Thoughts Whatever — Content Catalog & Media Registry\n\n`;
    md += `**Exported At**: \`${backupData.backupTimestamp}\`\n\n`;
    md += `**Total Pieces**: \`${pieces.length}\` | **Total Series**: \`${series.length}\` | **Authors**: \`${authors.length}\`\n\n`;
    md += `## 🎬 Catalog: Published Pieces, Dates & Instagram Reels\n\n`;
    md += `| Sl | Title (বাংলা) | Slug | Series / Category | Author(s) | Published Date | Instagram Reel Link |\n`;
    md += `| :---: | :--- | :--- | :--- | :--- | :---: | :--- |\n`;

    backupData.contentCatalog.forEach((p, idx) => {
      const authorStr = p.authors.join(", ") || "—";
      const seriesStr = p.series ? `${p.series.titleBn} (#${p.series.order})` : `Solo (${p.kind})`;
      const reelStr = p.reelUrl ? `[View Reel](${p.reelUrl})` : "—";
      const dateStr = p.publishedAt || "Draft";
      md += `| ${idx + 1} | **${p.titleBn}** | \`${p.slug}\` | ${seriesStr} | ${authorStr} | \`${dateStr}\` | ${reelStr} |\n`;
    });

    fs.writeFileSync(manifestMdPath, md, "utf-8");

    console.log(`✅ Database Backup saved to: ${backupJsonPath}`);
    console.log(`✅ Latest Pointer saved to: ${latestBackupJsonPath}`);
    console.log(`✅ Markdown Catalog saved to: ${manifestMdPath}\n`);
    console.log(`📊 Summary of Backup:`);
    console.table(backupData.counts);
  } catch (err) {
    console.error("❌ Database backup failed:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main();
