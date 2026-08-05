import fs from "fs";
import path from "path";
import zlib from "zlib";
import { prisma } from "@/lib/prisma";

export async function backupDatabase(targetDir: string): Promise<{
  filePath: string;
  tableCount: number;
  totalRows: number;
  sizeBytes: number;
}> {
  const jsonBackupPath = path.join(targetDir, "database.json.gz");

  // Export tables as JSON
  const [pieces, series, authors, tags, sources, timeline, subscribers, adminUsers, refreshTokens, analyticsEvents] =
    await Promise.all([
      prisma.piece.findMany(),
      prisma.series.findMany(),
      prisma.author.findMany(),
      prisma.tag.findMany(),
      prisma.source.findMany(),
      prisma.timelineEvent.findMany(),
      prisma.subscriber.findMany(),
      prisma.adminUser.findMany(),
      prisma.refreshToken.findMany(),
      prisma.analyticsEvent.findMany(),
    ]);

  const databaseData = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    tables: {
      Piece: pieces,
      Series: series,
      Author: authors,
      Tag: tags,
      Source: sources,
      TimelineEvent: timeline,
      Subscriber: subscribers,
      AdminUser: adminUsers,
      RefreshToken: refreshTokens,
      AnalyticsEvent: analyticsEvents,
    },
  };

  const totalRows =
    pieces.length +
    series.length +
    authors.length +
    tags.length +
    sources.length +
    timeline.length +
    subscribers.length +
    adminUsers.length +
    refreshTokens.length +
    analyticsEvents.length;

  const rawJson = JSON.stringify(databaseData, null, 2);
  const compressed = zlib.gzipSync(Buffer.from(rawJson, "utf-8"));

  fs.writeFileSync(jsonBackupPath, compressed);
  const stat = fs.statSync(jsonBackupPath);

  return {
    filePath: jsonBackupPath,
    tableCount: 10,
    totalRows,
    sizeBytes: stat.size,
  };
}
