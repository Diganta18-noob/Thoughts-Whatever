import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

export interface CreateRevisionOptions {
  editedBy?: string;
  editedByEmail?: string;
  editedByName?: string;
  changeSummary?: string;
  status?: string;
}

export async function createRevisionSnapshot(
  pieceId: string,
  options: CreateRevisionOptions = {},
) {
  try {
    const currentPiece = await prisma.piece.findUnique({
      where: { id: pieceId },
      include: {
        authors: { select: { id: true, nameBn: true } },
        tags: { select: { id: true, labelBn: true, kind: true } },
        sources: true,
        timeline: true,
      },
    });

    if (!currentPiece) return null;

    // Get current version count for this piece
    const lastRevision = await prisma.articleRevision.findFirst({
      where: { pieceId },
      orderBy: { version: "desc" },
      select: { version: true },
    });

    const nextVersion = (lastRevision?.version ?? 0) + 1;

    const revision = await prisma.articleRevision.create({
      data: {
        pieceId,
        version: nextVersion,
        titleBn: currentPiece.titleBn,
        titleEn: currentPiece.titleEn,
        subtitleBn: currentPiece.subtitleBn,
        dekBn: currentPiece.dekBn,
        bodyBn: currentPiece.bodyBn,
        excerptBn: currentPiece.excerptBn,
        coverImage: currentPiece.coverImage,
        metadata: {
          readingMinutes: currentPiece.readingMinutes,
          featured: currentPiece.featured,
          reelUrl: currentPiece.reelUrl,
          videoUrl: currentPiece.videoUrl,
          audioUrl: currentPiece.audioUrl,
          seoDescription: currentPiece.seoDescription,
          seriesId: currentPiece.seriesId,
          seriesOrder: currentPiece.seriesOrder,
          authors: currentPiece.authors,
          tags: currentPiece.tags,
          sources: currentPiece.sources,
          timeline: currentPiece.timeline,
        },
        editedBy: options.editedBy,
        editedByEmail: options.editedByEmail,
        editedByName: options.editedByName,
        changeSummary: options.changeSummary || `Version ${nextVersion} saved`,
        status: options.status || currentPiece.status,
      },
    });

    await logAuditEvent({
      action: "piece.revision_created",
      entityType: "ArticleRevision",
      entityId: revision.id,
      entitySlug: currentPiece.slug,
      summary: `Created revision v${nextVersion} for "${currentPiece.titleBn}"`,
      adminId: options.editedBy,
      adminEmail: options.editedByEmail,
    });

    return revision;
  } catch (err) {
    console.error("[RevisionEngine] Failed to create snapshot:", err);
    return null;
  }
}

export async function getPieceRevisions(pieceId: string) {
  return prisma.articleRevision.findMany({
    where: { pieceId },
    orderBy: { version: "desc" },
  });
}

export async function getRevisionById(revisionId: string) {
  return prisma.articleRevision.findUnique({
    where: { id: revisionId },
    include: {
      piece: {
        select: { id: true, slug: true, titleBn: true, kind: true },
      },
    },
  });
}

export async function restorePieceRevision(
  revisionId: string,
  admin: { id: string; email: string; nameBn?: string | null },
) {
  const revision = await prisma.articleRevision.findUnique({
    where: { id: revisionId },
    include: { piece: true },
  });

  if (!revision || !revision.piece) {
    throw new Error("Revision not found");
  }

  const pieceId = revision.pieceId;

  // Snapshot current state before restoring
  await createRevisionSnapshot(pieceId, {
    editedBy: admin.id,
    editedByEmail: admin.email,
    editedByName: admin.nameBn || "Admin",
    changeSummary: `Pre-restore snapshot before reverting to v${revision.version}`,
  });

  const meta = (revision.metadata as any) || {};

  // Transactionally update the piece
  const restoredPiece = await prisma.$transaction(async (tx) => {
    // 1. Update core piece fields
    const updated = await tx.piece.update({
      where: { id: pieceId },
      data: {
        titleBn: revision.titleBn,
        titleEn: revision.titleEn,
        subtitleBn: revision.subtitleBn,
        dekBn: revision.dekBn,
        bodyBn: revision.bodyBn,
        excerptBn: revision.excerptBn,
        coverImage: revision.coverImage,
        readingMinutes: meta.readingMinutes || 1,
        featured: meta.featured || false,
        reelUrl: meta.reelUrl,
        videoUrl: meta.videoUrl,
        audioUrl: meta.audioUrl,
        seoDescription: meta.seoDescription,
        seriesId: meta.seriesId,
        seriesOrder: meta.seriesOrder,
      },
    });

    return updated;
  });

  await logAuditEvent({
    action: "piece.revision_restored",
    entityType: "Piece",
    entityId: pieceId,
    entitySlug: revision.piece.slug,
    summary: `Restored "${revision.piece.titleBn}" to revision v${revision.version}`,
    severity: "warning",
    adminId: admin.id,
    adminEmail: admin.email,
    metadata: { restoredVersion: revision.version },
  });

  await logActivity({
    type: "piece.revision_restored",
    summary: `Restored article "${revision.piece.titleBn}" to revision v${revision.version}`,
    entityType: "Piece",
    entityId: pieceId,
    actorId: admin.id,
    actorEmail: admin.email,
    actorName: admin.nameBn || "Admin",
  });

  return restoredPiece;
}
