import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { logAuditEvent } from "@/lib/audit";
import { logActivity } from "@/lib/activity";
import { Prisma } from "@prisma/client";

export async function uploadMediaBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder = "thoughts-whatever/media"
): Promise<{ url: string; width?: number; height?: number }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloudinary is not configured");

  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

    try {
      const sanitizedCloudName = cloudName.replace(/\./g, "-");
      cloudinary.config({
        cloud_name: sanitizedCloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });

      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: mimeType.startsWith("image/") ? "image" : mimeType.startsWith("video/") ? "video" : "raw",
      });

      return {
        url: result.secure_url,
        width: result.width,
        height: result.height,
      };
    } catch (e) {
      console.error("[MediaUpload] Cloudinary upload failed:", e);
      throw new Error("Cloud storage upload failed");
    }
}

export interface GetMediaParams {
  type?: string;
  search?: string;
  unusedOnly?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "sizeBytes" | "filename";
  sortOrder?: "asc" | "desc";
}

export async function getMediaList(params: GetMediaParams = {}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, params.limit || 24);
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.type && params.type !== "all") {
    if (params.type === "image") {
      where.mimeType = { startsWith: "image/" };
    } else if (params.type === "video") {
      where.mimeType = { startsWith: "video/" };
    } else if (params.type === "audio") {
      where.mimeType = { startsWith: "audio/" };
    } else if (params.type === "document") {
      where.mimeType = { in: ["application/pdf", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/epub+zip"] };
    }
  }

  if (params.search?.trim()) {
    const q = params.search.trim();
    where.OR = [
      { filename: { contains: q, mode: "insensitive" } },
      { originalName: { contains: q, mode: "insensitive" } },
      { altText: { contains: q, mode: "insensitive" } },
      { caption: { contains: q, mode: "insensitive" } },
    ];
  }

  if (params.unusedOnly) {
    where.usages = { none: {} };
  }

  const orderBy = {
    [params.sortBy || "createdAt"]: params.sortOrder || "desc",
  };

  const [items, total] = await Promise.all([
    prisma.media.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: { select: { usages: true } },
        usages: { select: { id: true, entityType: true, entityId: true, entityTitle: true, field: true } },
      },
    }),
    prisma.media.count({ where }),
  ]);

  return {
    items: items.map((m) => ({
      ...m,
      usageCount: m._count.usages,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createMediaRecord(data: {
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  url: string;
  altText?: string;
  caption?: string;
  uploadedBy?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.media.create({
    data: {
      filename: data.filename,
      originalName: data.originalName,
      mimeType: data.mimeType,
      sizeBytes: data.sizeBytes,
      width: data.width,
      height: data.height,
      url: data.url,
      altText: data.altText,
      caption: data.caption,
      uploadedBy: data.uploadedBy,
      metadata: data.metadata,
    },
  });
}

export async function getMediaDetails(id: string) {
  return prisma.media.findUnique({
    where: { id },
    include: {
      usages: true,
    },
  });
}

export async function updateMediaMetadata(
  id: string,
  data: { altText?: string; caption?: string; filename?: string; metadata?: Record<string, unknown> },
  admin?: { id: string; email: string },
) {
  const previous = await prisma.media.findUniqueOrThrow({ where: { id }, select: { metadata: true } });
  const existingMetadata = previous.metadata && typeof previous.metadata === "object" && !Array.isArray(previous.metadata)
    ? previous.metadata as Record<string, unknown> : {};
  const supplied = data.metadata || {};
  const text = (key: string, max = 500) => typeof supplied[key] === "string" ? (supplied[key] as string).trim().slice(0, max) : existingMetadata[key];
  const tags = Array.isArray(supplied.tags)
    ? supplied.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 20).map((tag) => tag.trim().slice(0, 50)).filter(Boolean)
    : existingMetadata.tags;
  const updated = await prisma.media.update({
    where: { id },
    data: {
      altText: typeof data.altText === "string" ? data.altText.slice(0, 1000) : undefined,
      caption: typeof data.caption === "string" ? data.caption.slice(0, 2000) : undefined,
      ...(data.filename ? { filename: data.filename } : {}),
      metadata: { ...existingMetadata, credit: text("credit"), license: text("license", 100),
        source: text("source", 1000), tags,
        focalX: typeof supplied.focalX === "number" && supplied.focalX >= 0 && supplied.focalX <= 100 ? supplied.focalX : existingMetadata.focalX,
        focalY: typeof supplied.focalY === "number" && supplied.focalY >= 0 && supplied.focalY <= 100 ? supplied.focalY : existingMetadata.focalY } as Prisma.InputJsonValue,
    },
  });

  if (admin) {
    await logAuditEvent({
      action: "media.updated",
      entityType: "Media",
      entityId: id,
      summary: `Updated media metadata for "${updated.filename}"`,
      adminId: admin.id,
      adminEmail: admin.email,
    });
  }

  return updated;
}

export async function deleteMediaRecord(
  id: string,
  admin?: { id: string; email: string },
) {
  const media = await prisma.media.findUnique({
    where: { id },
    include: { usages: true },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  const [pieces, series, authors, editions, referenceAssets] = await Promise.all([
    prisma.piece.count({ where: { OR: [{ coverImage: media.url }, { ogImage: media.url }, { bodyBn: { contains: media.url } }, { audioUrl: media.url }, { videoUrl: media.url }] } }),
    prisma.series.count({ where: { coverImage: media.url } }),
    prisma.author.count({ where: { portrait: media.url } }),
    prisma.referenceEdition.count({ where: { coverImage: media.url } }),
    prisma.referenceAsset.count({ where: { fileUrl: media.url } }),
  ]);
  if (media.usages.length > 0 || pieces + series + authors + editions + referenceAssets > 0) {
    throw new Error(
      "Cannot delete media used by content. Remove its references first, then sync usage."
    );
  }

  const meta = media.metadata && typeof media.metadata === "object" && !Array.isArray(media.metadata)
    ? media.metadata as Record<string, unknown> : {};
  if (typeof meta.publicId === "string" && meta.publicId.startsWith("thoughts-whatever/media/") &&
      (meta.resourceType === "image" || meta.resourceType === "video" || meta.resourceType === "raw")) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.replace(/\./g, "-");
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) throw new Error("Cloud storage is unavailable; asset was not deleted");
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    const result = await cloudinary.uploader.destroy(meta.publicId, { resource_type: meta.resourceType });
    if (result.result !== "ok" && result.result !== "not found") throw new Error("Cloud asset deletion failed; library record was kept");
  }

  await prisma.media.delete({ where: { id } });

  if (admin) {
    await logAuditEvent({
      action: "media.deleted",
      entityType: "Media",
      entityId: id,
      summary: `Deleted media "${media.filename}" (${media.mimeType})`,
      severity: "warning",
      adminId: admin.id,
      adminEmail: admin.email,
    });

    await logActivity({
      type: "media.deleted",
      summary: `Deleted media "${media.filename}"`,
      entityType: "Media",
      entityId: id,
      actorId: admin.id,
      actorEmail: admin.email,
    });
  }

  return { ok: true, deletedFilename: media.filename };
}

/**
 * Automatically scan all Pieces, Series, and Authors to auto-discover media assets and build/refresh MediaUsage links
 */
export async function syncAllMediaUsage() {
  const [pieces, seriesList, authors, editions, referenceAssets] = await Promise.all([
    prisma.piece.findMany({ select: { id: true, slug: true, titleBn: true, coverImage: true, ogImage: true, bodyBn: true, audioUrl: true, videoUrl: true } }),
    prisma.series.findMany({ select: { id: true, slug: true, titleBn: true, coverImage: true } }),
    prisma.author.findMany({ select: { id: true, slug: true, nameBn: true, portrait: true } }),
    prisma.referenceEdition.findMany({ select: { id: true, editionTitleBn: true, coverImage: true } }),
    prisma.referenceAsset.findMany({ select: { id: true, title: true, fileUrl: true } }),
  ]);

  const MD_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let createdCount = 0;
  let linkedCount = 0;
  const seenUsages = new Set<string>();

  async function registerMedia(
    url: string,
    entityType: "Piece" | "Series" | "Author" | "ReferenceEdition" | "ReferenceAsset",
    entityId: string,
    entityTitle: string,
    field: string,
    altText?: string
  ) {
    if (!url || typeof url !== "string" || !url.trim()) return;
    const cleanUrl = url.trim();

    let filename = cleanUrl.split("/").pop()?.split("?")[0] || "asset.jpg";
    if (!filename.includes(".")) filename += ".jpg";

    let mimeType = "image/jpeg";
    if (filename.endsWith(".png")) mimeType = "image/png";
    else if (filename.endsWith(".webp")) mimeType = "image/webp";
    else if (filename.endsWith(".svg")) mimeType = "image/svg+xml";
    else if (filename.endsWith(".mp4")) mimeType = "video/mp4";
    else if (filename.endsWith(".mp3")) mimeType = "audio/mpeg";
    else if (filename.endsWith(".m4a")) mimeType = "audio/mp4";
    else if (filename.endsWith(".wav")) mimeType = "audio/wav";
    else if (filename.endsWith(".epub")) mimeType = "application/epub+zip";
    else if (filename.endsWith(".docx")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (filename.endsWith(".txt")) mimeType = "text/plain";
    else if (filename.endsWith(".pdf")) mimeType = "application/pdf";

    let media = await prisma.media.findFirst({ where: { url: cleanUrl } });

    if (!media) {
      media = await prisma.media.create({
        data: {
          url: cleanUrl,
          filename,
          originalName: filename,
          mimeType,
          sizeBytes: 0,
          altText: altText || entityTitle,
          caption: `${entityTitle} (${field})`,
        },
      });
      createdCount++;
    }

    await prisma.mediaUsage.upsert({
      where: {
        mediaId_entityType_entityId_field: {
          mediaId: media.id,
          entityType,
          entityId,
          field,
        },
      },
      update: { entityTitle },
      create: {
        mediaId: media.id,
        entityType,
        entityId,
        field,
        entityTitle,
      },
    });
    seenUsages.add(`${media.id}:${entityType}:${entityId}:${field}`);
    linkedCount++;
  }

  // 1. Index Pieces
  for (const piece of pieces) {
    if (piece.coverImage) {
      await registerMedia(piece.coverImage, "Piece", piece.id, piece.titleBn, "coverImage");
    }
    if (piece.ogImage && piece.ogImage !== piece.coverImage) {
      await registerMedia(piece.ogImage, "Piece", piece.id, piece.titleBn, "ogImage");
    }
    if (piece.audioUrl) await registerMedia(piece.audioUrl, "Piece", piece.id, piece.titleBn, "audioUrl");
    if (piece.videoUrl) await registerMedia(piece.videoUrl, "Piece", piece.id, piece.titleBn, "videoUrl");
    const bodyImages = [...(piece.bodyBn || "").matchAll(MD_IMAGE_REGEX)];
    for (const match of bodyImages) {
      const alt = match[1];
      const imgUrl = match[2];
      await registerMedia(imgUrl, "Piece", piece.id, piece.titleBn, "bodyBn", alt);
    }
  }

  // 2. Index Series
  for (const s of seriesList) {
    if (s.coverImage) {
      await registerMedia(s.coverImage, "Series", s.id, s.titleBn, "coverImage");
    }
  }

  // 3. Index Authors
  for (const a of authors) {
    if (a.portrait) {
      await registerMedia(a.portrait, "Author", a.id, a.nameBn, "portrait");
    }
  }

  for (const edition of editions) {
    if (edition.coverImage) await registerMedia(edition.coverImage, "ReferenceEdition", edition.id, edition.editionTitleBn || "Reference edition", "coverImage");
  }
  for (const asset of referenceAssets) {
    if (asset.fileUrl) await registerMedia(asset.fileUrl, "ReferenceAsset", asset.id, asset.title, "fileUrl");
  }

  const recordedUsages = await prisma.mediaUsage.findMany({ select: { id: true, mediaId: true, entityType: true, entityId: true, field: true } });
  const staleIds = recordedUsages.filter((usage) => !seenUsages.has(`${usage.mediaId}:${usage.entityType}:${usage.entityId}:${usage.field}`)).map((usage) => usage.id);
  if (staleIds.length) await prisma.mediaUsage.deleteMany({ where: { id: { in: staleIds } } });

  return { ok: true, createdCount, linkedCount };
}
