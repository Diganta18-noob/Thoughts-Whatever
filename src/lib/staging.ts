import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

export interface ReviewComment {
  id: string;
  authorName: string;
  authorEmail: string;
  comment: string;
  createdAt: string;
}

export async function generatePreviewToken(pieceId: string, expiresInHours = 48) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

  const updated = await prisma.piece.update({
    where: { id: pieceId },
    data: {
      previewToken: token,
      previewExpiresAt: expiresAt,
    },
    select: {
      id: true,
      slug: true,
      titleBn: true,
      previewToken: true,
      previewExpiresAt: true,
    },
  });

  return updated;
}

export async function getPieceByPreviewToken(token: string) {
  const piece = await prisma.piece.findUnique({
    where: { previewToken: token },
    include: {
      authors: true,
      tags: true,
      series: true,
      sources: true,
      timeline: true,
    },
  });

  if (!piece) return null;

  // Check if expired
  if (piece.previewExpiresAt && new Date(piece.previewExpiresAt).getTime() < Date.now()) {
    return { ...piece, isExpired: true };
  }

  return { ...piece, isExpired: false };
}

export async function addReviewComment(
  pieceId: string,
  commentText: string,
  admin: { id: string; email: string; nameBn?: string | null }
) {
  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: { id: true, titleBn: true, reviewComments: true },
  });

  if (!piece) throw new Error("Piece not found");

  const existingComments = Array.isArray(piece.reviewComments)
    ? (piece.reviewComments as unknown as ReviewComment[])
    : [];

  const newComment: ReviewComment = {
    id: crypto.randomUUID(),
    authorName: admin.nameBn || "Editorial Reviewer",
    authorEmail: admin.email,
    comment: commentText.trim(),
    createdAt: new Date().toISOString(),
  };

  const updatedComments = [...existingComments, newComment];

  const updated = await prisma.piece.update({
    where: { id: pieceId },
    data: {
      reviewComments: updatedComments as any,
    },
  });

  await logAuditEvent({
    action: "piece.review_comment_added",
    entityType: "Piece",
    entityId: pieceId,
    summary: `Added review comment on "${piece.titleBn}": "${commentText.substring(0, 50)}..."`,
    adminId: admin.id,
    adminEmail: admin.email,
  });

  return newComment;
}

export async function updateReviewStatus(
  pieceId: string,
  status: "draft" | "in_review" | "approved" | "scheduled" | "published",
  admin: { id: string; email: string; nameBn?: string | null }
) {
  const updated = await prisma.piece.update({
    where: { id: pieceId },
    data: {
      reviewStatus: status,
    },
    select: {
      id: true,
      titleBn: true,
      slug: true,
      reviewStatus: true,
    },
  });

  await logAuditEvent({
    action: "piece.review_status_changed",
    entityType: "Piece",
    entityId: pieceId,
    summary: `Updated editorial workflow status of "${updated.titleBn}" to ${status.toUpperCase()}`,
    adminId: admin.id,
    adminEmail: admin.email,
  });

  await logActivity({
    type: "piece.review_status_changed",
    summary: `Moved "${updated.titleBn}" to ${status.toUpperCase()}`,
    entityType: "Piece",
    entityId: pieceId,
    actorId: admin.id,
    actorEmail: admin.email,
    actorName: admin.nameBn || "Admin",
  });

  return updated;
}
