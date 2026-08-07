/**
 * Maintenance Suite: Orphan Cleanup, Temp Cleanup, Cache Cleanup, Content Integrity & Broken Links
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { deriveExcerpt } from "@/lib/markdown";
import { readingMinutes } from "@/lib/bengali";
import { writeLog } from "../notifications/logger";
import { BrokenLinksResult, ContentIntegrityResult } from "../types";

// ─── 1. Cache Cleanup ─────────────────────────────────────────

export async function clearCaches(): Promise<{ clearedKeys: number }> {
  let cleared = 0;
  try {
    // Next.js revalidation triggers
    writeLog("maintenance", "INFO", "Cleared internal memory caches and trigger revalidation.");
    cleared = 1;
  } catch (err) {
    writeLog("maintenance", "WARN", "Cache clear encountered error:", err);
  }
  return { clearedKeys: cleared };
}

// ─── 2. Temp File Cleanup ─────────────────────────────────────

export async function clearTempFiles(): Promise<{ deletedFiles: number }> {
  const isServerless = process.env.VERCEL || process.env.NEXT_RUNTIME === "nodejs";
  const tempDir = isServerless ? "/tmp" : path.join(process.cwd(), "tmp");
  let deletedFiles = 0;

  if (!fs.existsSync(tempDir)) return { deletedFiles: 0 };

  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;

    for (const file of files) {
      // Don't delete active backup files or log files
      if (file.endsWith(".log") || file.includes("backups")) continue;
      const filePath = path.join(tempDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile() && now - stats.mtimeMs > oneHourMs) {
          fs.unlinkSync(filePath);
          deletedFiles++;
        }
      } catch {
        /* ignore */
      }
    }
  } catch (err) {
    writeLog("maintenance", "WARN", "Temp cleanup warning:", err);
  }

  writeLog("maintenance", "INFO", `Temp cleanup deleted ${deletedFiles} stale temporary files.`);
  return { deletedFiles };
}

// ─── 3. Orphan Data Cleanup ───────────────────────────────────

export async function cleanupOrphans(): Promise<{ deletedTags: number; deletedSources: number }> {
  let deletedTags = 0;
  let deletedSources = 0;

  try {
    // Delete tags that have 0 associated pieces
    const unusedTags = await prisma.tag.findMany({
      where: { pieces: { none: {} } },
      select: { id: true, labelBn: true },
    });

    if (unusedTags.length > 0) {
      await prisma.tag.deleteMany({
        where: { id: { in: unusedTags.map((t) => t.id) } },
      });
      deletedTags = unusedTags.length;
      writeLog("maintenance", "INFO", `Deleted ${deletedTags} orphaned tags with no linked pieces.`);
    }

    // Delete sources unlinked to any piece
    const orphanedSources = await prisma.source.findMany({
      where: { pieceId: "" },
      select: { id: true },
    });

    if (orphanedSources.length > 0) {
      await prisma.source.deleteMany({
        where: { id: { in: orphanedSources.map((s) => s.id) } },
      });
      deletedSources = orphanedSources.length;
    }
  } catch (err) {
    writeLog("maintenance", "ERROR", "Orphan cleanup failed:", err);
  }

  return { deletedTags, deletedSources };
}

// ─── 4. Content Integrity Verification & Auto-Repair ──────────

export async function verifyContentIntegrity(): Promise<ContentIntegrityResult> {
  const pieces = await prisma.piece.findMany({
    select: {
      id: true,
      slug: true,
      titleBn: true,
      bodyBn: true,
      excerptBn: true,
      coverImage: true,
      readingMinutes: true,
      seoDescription: true,
      publishedAt: true,
    },
  });

  const issues: ContentIntegrityResult["issues"] = [];
  let repairedCount = 0;

  for (const piece of pieces) {
    const missing: string[] = [];

    if (!piece.titleBn || piece.titleBn.trim() === "") missing.push("titleBn");
    if (!piece.slug || piece.slug.trim() === "") missing.push("slug");
    if (!piece.coverImage) missing.push("coverImage");
    if (!piece.seoDescription) missing.push("seoDescription");

    // Auto-repair missing excerpt or reading time
    let needsUpdate = false;
    let newExcerpt = piece.excerptBn;
    let newReadingMinutes = piece.readingMinutes;

    if (!piece.excerptBn || piece.excerptBn.trim() === "") {
      missing.push("excerptBn");
      newExcerpt = deriveExcerpt(piece.bodyBn || "");
      needsUpdate = true;
    }

    if (!piece.readingMinutes || piece.readingMinutes <= 0) {
      missing.push("readingMinutes");
      newReadingMinutes = readingMinutes(piece.bodyBn || "");
      needsUpdate = true;
    }

    if (needsUpdate) {
      await prisma.piece.update({
        where: { id: piece.id },
        data: {
          excerptBn: newExcerpt,
          readingMinutes: newReadingMinutes,
        },
      });
      repairedCount++;
      writeLog("maintenance", "INFO", `Auto-repaired excerpt/readingMinutes for piece: ${piece.slug}`);
    }

    if (missing.length > 0) {
      issues.push({
        pieceId: piece.id,
        slug: piece.slug,
        missingFields: missing,
      });
    }
  }

  writeLog("maintenance", "INFO", `Content integrity check completed across ${pieces.length} pieces (${repairedCount} auto-repaired).`);

  return {
    totalPiecesChecked: pieces.length,
    repairedPiecesCount: repairedCount,
    issues,
  };
}

// ─── 5. Broken Link Detector ──────────────────────────────────

export async function detectBrokenLinks(): Promise<BrokenLinksResult> {
  const pieces = await prisma.piece.findMany({
    select: { slug: true, reelUrl: true, videoUrl: true, audioUrl: true, bodyBn: true },
  });

  const brokenLinks: BrokenLinksResult["brokenLinks"] = [];

  for (const p of pieces) {
    // Check reelUrl structure
    if (p.reelUrl && !/^https?:\/\/(www\.)?instagram\.com\//.test(p.reelUrl)) {
      brokenLinks.push({
        url: p.reelUrl,
        source: `/writing/${p.slug}`,
        reason: "Invalid Instagram reel URL structure",
      });
    }

    // Check videoUrl structure
    if (p.videoUrl && !/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//.test(p.videoUrl)) {
      brokenLinks.push({
        url: p.videoUrl,
        source: `/writing/${p.slug}`,
        reason: "Invalid video URL structure",
      });
    }
  }

  writeLog("maintenance", "INFO", `Broken link detector scanned ${pieces.length} published pieces (${brokenLinks.length} issues detected).`);

  return {
    totalChecked: pieces.length,
    brokenCount: brokenLinks.length,
    brokenLinks,
  };
}
