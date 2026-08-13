import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration to Supabase PostgreSQL...");

  const backupFiles = fs
    .readdirSync(path.join(process.cwd(), "backups"))
    .filter((f) => f.startsWith("mongodb-backup-") && f.endsWith(".json"))
    .sort()
    .reverse();

  if (backupFiles.length === 0) {
    console.error("No backup file found in backups/ directory.");
    process.exit(1);
  }

  const latestBackup = path.join(process.cwd(), "backups", backupFiles[0]);
  console.log(`Using backup file: ${latestBackup}`);

  const raw = fs.readFileSync(latestBackup, "utf-8");
  const backup = JSON.parse(raw);
  const data = backup.data;

  // 1. Admin Users
  console.log(`\nImporting ${data.adminUsers.length} Admin Users...`);
  for (const admin of data.adminUsers) {
    await prisma.adminUser.upsert({
      where: { id: admin.id },
      update: {},
      create: {
        id: admin.id,
        email: admin.email,
        passwordHash: admin.passwordHash,
        nameBn: admin.nameBn,
        lastLoginAt: admin.lastLoginAt ? new Date(admin.lastLoginAt) : null,
        createdAt: new Date(admin.createdAt),
      },
    });
  }

  // 2. Refresh Tokens
  console.log(`Importing ${data.refreshTokens.length} Refresh Tokens...`);
  for (const token of data.refreshTokens) {
    await prisma.refreshToken.upsert({
      where: { id: token.id },
      update: {},
      create: {
        id: token.id,
        token: token.token,
        adminUserId: token.adminUserId,
        expiresAt: new Date(token.expiresAt),
        createdAt: new Date(token.createdAt),
        lastUsedAt: new Date(token.lastUsedAt),
        userAgent: token.userAgent,
        ipAddress: token.ipAddress,
        revoked: token.revoked ?? false,
      },
    });
  }

  // 3. Authors
  console.log(`Importing ${data.authors.length} Authors...`);
  for (const author of data.authors) {
    await prisma.author.upsert({
      where: { id: author.id },
      update: {},
      create: {
        id: author.id,
        slug: author.slug,
        nameBn: author.nameBn,
        nameEn: author.nameEn,
        era: author.era,
        bioBn: author.bioBn,
        portrait: author.portrait,
        createdAt: new Date(author.createdAt),
        updatedAt: new Date(author.updatedAt),
      },
    });
  }

  // 4. Tags
  console.log(`Importing ${data.tags.length} Tags...`);
  for (const tag of data.tags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      update: {},
      create: {
        id: tag.id,
        slug: tag.slug,
        labelBn: tag.labelBn,
        labelEn: tag.labelEn,
        kind: tag.kind,
        createdAt: new Date(tag.createdAt),
      },
    });
  }

  // 5. Series
  console.log(`Importing ${data.series.length} Series...`);
  for (const s of data.series) {
    await prisma.series.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        slug: s.slug,
        titleBn: s.titleBn,
        titleEn: s.titleEn,
        descBn: s.descBn,
        coverImage: s.coverImage,
        coverImageWidth: s.coverImageWidth,
        coverImageHeight: s.coverImageHeight,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
      },
    });
  }

  // 6. Pieces
  console.log(`Importing ${data.pieces.length} Pieces with Author & Tag relations...`);
  const existingAuthorIds = new Set((await prisma.author.findMany({ select: { id: true } })).map((a) => a.id));
  const existingTagIds = new Set((await prisma.tag.findMany({ select: { id: true } })).map((t) => t.id));
  const existingSeriesIds = new Set((await prisma.series.findMany({ select: { id: true } })).map((s) => s.id));

  for (const piece of data.pieces) {
    const validAuthorIds = (piece.authorIds || []).filter((id: string) => existingAuthorIds.has(id));
    const validTagIds = (piece.tagIds || []).filter((id: string) => existingTagIds.has(id));
    const validSeriesId = piece.seriesId && existingSeriesIds.has(piece.seriesId) ? piece.seriesId : null;

    await prisma.piece.upsert({
      where: { id: piece.id },
      update: {
        authors: {
          set: validAuthorIds.map((id: string) => ({ id })),
        },
        tags: {
          set: validTagIds.map((id: string) => ({ id })),
        },
      },
      create: {
        id: piece.id,
        kind: piece.kind,
        status: piece.status,
        slug: piece.slug,
        titleBn: piece.titleBn,
        titleEn: piece.titleEn,
        subtitleBn: piece.subtitleBn,
        dekBn: piece.dekBn,
        bodyBn: piece.bodyBn,
        excerptBn: piece.excerptBn,
        coverImage: piece.coverImage,
        coverImageWidth: piece.coverImageWidth,
        coverImageHeight: piece.coverImageHeight,
        reelUrl: piece.reelUrl,
        videoUrl: piece.videoUrl,
        audioUrl: piece.audioUrl,
        audioSec: piece.audioSec,
        readingMinutes: piece.readingMinutes ?? 1,
        featured: piece.featured ?? false,
        viewCount: piece.viewCount ?? 0,
        seoDescription: piece.seoDescription,
        ogImage: piece.ogImage,
        publishedAt: piece.publishedAt ? new Date(piece.publishedAt) : null,
        createdAt: new Date(piece.createdAt),
        updatedAt: new Date(piece.updatedAt),
        seriesId: validSeriesId,
        seriesOrder: piece.seriesOrder,
        authors: {
          connect: validAuthorIds.map((id: string) => ({ id })),
        },
        tags: {
          connect: validTagIds.map((id: string) => ({ id })),
        },
      },
    });
  }

  // 7. Sources
  console.log(`Importing ${data.sources.length} Sources...`);
  const existingPieceIds = new Set((await prisma.piece.findMany({ select: { id: true } })).map((p) => p.id));
  for (const source of data.sources) {
    if (!existingPieceIds.has(source.pieceId)) continue;
    await prisma.source.upsert({
      where: { id: source.id },
      update: {},
      create: {
        id: source.id,
        pieceId: source.pieceId,
        label: source.label,
        url: source.url,
        note: source.note,
        order: source.order ?? 0,
      },
    });
  }

  // 8. Timeline Events
  console.log(`Importing ${data.timelineEvents.length} Timeline Events...`);
  for (const te of data.timelineEvents) {
    if (!existingPieceIds.has(te.pieceId)) continue;
    await prisma.timelineEvent.upsert({
      where: { id: te.id },
      update: {},
      create: {
        id: te.id,
        pieceId: te.pieceId,
        year: te.year,
        labelBn: te.labelBn,
        descBn: te.descBn,
        order: te.order ?? 0,
      },
    });
  }

  // 9. Subscribers
  console.log(`Importing ${data.subscribers.length} Subscribers...`);
  for (const sub of data.subscribers) {
    await prisma.subscriber.upsert({
      where: { id: sub.id },
      update: {},
      create: {
        id: sub.id,
        email: sub.email,
        nameBn: sub.nameBn,
        confirmed: sub.confirmed ?? false,
        unsubscribeToken: sub.unsubscribeToken,
        source: sub.source,
        createdAt: new Date(sub.createdAt),
        confirmedAt: sub.confirmedAt ? new Date(sub.confirmedAt) : null,
        unsubscribedAt: sub.unsubscribedAt ? new Date(sub.unsubscribedAt) : null,
      },
    });
  }

  // 10. Analytics Events
  console.log(`Importing ${data.analyticsEvents.length} Analytics Events...`);
  for (const ae of data.analyticsEvents) {
    const validPieceId = ae.pieceId && existingPieceIds.has(ae.pieceId) ? ae.pieceId : null;
    await prisma.analyticsEvent.upsert({
      where: { id: ae.id },
      update: {},
      create: {
        id: ae.id,
        pieceId: validPieceId,
        eventType: ae.eventType,
        sessionId: ae.sessionId,
        referrer: ae.referrer,
        userAgent: ae.userAgent,
        metadata: ae.metadata,
        createdAt: new Date(ae.createdAt),
      },
    });
  }

  // 11. Audit Logs
  console.log(`Importing ${data.auditLogs.length} Audit Logs...`);
  for (const log of data.auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: log.id },
      update: {},
      create: {
        id: log.id,
        adminId: log.adminId,
        adminEmail: log.adminEmail,
        adminName: log.adminName,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        entitySlug: log.entitySlug,
        summary: log.summary,
        changes: log.changes,
        metadata: log.metadata,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        severity: log.severity || "info",
        createdAt: new Date(log.createdAt),
      },
    });
  }

  // 12. Prompt Logs
  console.log(`Importing ${data.promptLogs.length} Prompt Logs...`);
  for (const prompt of data.promptLogs) {
    await prisma.promptLog.upsert({
      where: { id: prompt.id },
      update: {},
      create: {
        id: prompt.id,
        text: prompt.text,
        summary: prompt.summary,
        source: prompt.source || "manual",
        category: prompt.category || "other",
        status: prompt.status || "idea",
        tags: prompt.tags || [],
        linkedTo: prompt.linkedTo,
        notes: prompt.notes,
        adminId: prompt.adminId,
        createdAt: new Date(prompt.createdAt),
        updatedAt: new Date(prompt.updatedAt),
      },
    });
  }

  console.log("\n=================================================");
  console.log("All data migrated to Supabase PostgreSQL successfully!");
  console.log("=================================================");
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
