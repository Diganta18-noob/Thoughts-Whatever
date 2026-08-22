import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import { logAuditEvent } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

export async function uploadMediaBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folder = "thoughts-whatever/media"
): Promise<{ url: string; width?: number; height?: number }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const base64 = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  if (cloudName && apiKey && apiSecret) {
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
      console.warn("[MediaUpload] Cloudinary upload warning, falling back:", e);
    }
  }

  // Fallback to data URI when cloud storage is not connected
  return {
    url: dataUri,
  };
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
    } else if (params.type === "document") {
      where.mimeType = { in: ["application/pdf", "text/plain", "application/msword"] };
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
  data: { altText?: string; caption?: string; filename?: string },
  admin?: { id: string; email: string },
) {
  const updated = await prisma.media.update({
    where: { id },
    data: {
      altText: data.altText,
      caption: data.caption,
      ...(data.filename ? { filename: data.filename } : {}),
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
  force: boolean = false,
) {
  const media = await prisma.media.findUnique({
    where: { id },
    include: { usages: true },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  if (media.usages.length > 0 && !force) {
    throw new Error(
      `Cannot delete media: It is currently referenced in ${media.usages.length} places (e.g. ${media.usages[0].entityTitle || media.usages[0].entityType}). Remove references first or confirm force deletion.`
    );
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
  const [pieces, seriesList, authors] = await Promise.all([
    prisma.piece.findMany({ select: { id: true, slug: true, titleBn: true, coverImage: true, ogImage: true, bodyBn: true } }),
    prisma.series.findMany({ select: { id: true, slug: true, titleBn: true, coverImage: true } }),
    prisma.author.findMany({ select: { id: true, slug: true, nameBn: true, portrait: true } }),
  ]);

  const MD_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let createdCount = 0;
  let linkedCount = 0;

  async function registerMedia(
    url: string,
    entityType: "Piece" | "Series" | "Author",
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
    else if (filename.endsWith(".pdf")) mimeType = "application/pdf";

    let media = await prisma.media.findFirst({ where: { url: cleanUrl } });

    if (!media) {
      media = await prisma.media.create({
        data: {
          url: cleanUrl,
          filename,
          originalName: filename,
          mimeType,
          sizeBytes: 150000,
          width: 1200,
          height: 630,
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

  return { ok: true, createdCount, linkedCount };
}
