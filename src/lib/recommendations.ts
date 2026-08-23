import { prisma } from "@/lib/prisma";

export interface RecommendationItem {
  id: string;
  pieceId: string;
  pieceTitleBn: string;
  pieceSlug: string;
  recommendedId: string;
  recommendedTitleBn: string;
  recommendedSlug: string;
  recommendedKind: string;
  score: number;
  reason: string;
  pinned: boolean;
  excluded: boolean;
  createdAt: Date;
}

export async function computeRecommendationsForPiece(pieceId: string) {
  const target = await prisma.piece.findUnique({
    where: { id: pieceId },
    include: {
      tags: { select: { id: true, labelBn: true } },
      authors: { select: { id: true, nameBn: true } },
      series: { select: { id: true } },
    },
  });

  if (!target) return [];

  const targetTagIds = new Set(target.tags.map((t) => t.id));
  const targetAuthorIds = new Set(target.authors.map((a) => a.id));

  // Find co-viewed pieces in the same session
  const targetSessions = await prisma.analyticsEvent.findMany({
    where: { pieceId, eventType: "view" },
    select: { sessionId: true },
    distinct: ["sessionId"],
    take: 50,
  });

  const sessionIds = targetSessions.map((s) => s.sessionId);
  const coViewedCounts = new Map<string, number>();

  if (sessionIds.length > 0) {
    const coViews = await prisma.analyticsEvent.findMany({
      where: {
        sessionId: { in: sessionIds },
        pieceId: { not: pieceId },
        eventType: "view",
      },
      select: { pieceId: true },
    });

    for (const cv of coViews) {
      if (cv.pieceId) {
        coViewedCounts.set(cv.pieceId, (coViewedCounts.get(cv.pieceId) || 0) + 1);
      }
    }
  }

  // Get all candidate published pieces
  const candidates = await prisma.piece.findMany({
    where: {
      id: { not: pieceId },
      status: "PUBLISHED",
    },
    include: {
      tags: { select: { id: true, labelBn: true } },
      authors: { select: { id: true, nameBn: true } },
    },
  });

  const results: Array<{
    recommendedId: string;
    score: number;
    reason: string;
  }> = [];

  for (const cand of candidates) {
    let score = 0;
    const reasons: string[] = [];

    // 1. Same series check
    if (target.seriesId && cand.seriesId && target.seriesId === cand.seriesId) {
      score += 40;
      reasons.push("same_series");
    }

    // 2. Shared taxonomy tags
    const sharedTags = cand.tags.filter((t) => targetTagIds.has(t.id));
    if (sharedTags.length > 0) {
      score += Math.min(35, sharedTags.length * 15);
      reasons.push("same_taxonomy");
    }

    // 3. Shared literary figures / authors
    const sharedAuthors = cand.authors.filter((a) => targetAuthorIds.has(a.id));
    if (sharedAuthors.length > 0) {
      score += Math.min(25, sharedAuthors.length * 20);
      reasons.push("similar_keywords");
    }

    // 4. Reader behavior co-views
    const coCount = coViewedCounts.get(cand.id) || 0;
    if (coCount > 0) {
      score += Math.min(20, coCount * 5);
      reasons.push("reader_behavior");
    }

    // Baseline minimum threshold
    if (score >= 15) {
      results.push({
        recommendedId: cand.id,
        score: Math.min(100, score),
        reason: reasons[0] || "same_taxonomy",
      });
    }
  }

  // Sort and pick top 5
  results.sort((a, b) => b.score - a.score);
  const topRecommendations = results.slice(0, 5);

  // Upsert into ContentRecommendation
  for (const rec of topRecommendations) {
    const existing = await prisma.contentRecommendation.findUnique({
      where: {
        pieceId_recommendedId: {
          pieceId,
          recommendedId: rec.recommendedId,
        },
      },
    });

    if (!existing) {
      await prisma.contentRecommendation.create({
        data: {
          pieceId,
          recommendedId: rec.recommendedId,
          score: rec.score,
          reason: rec.reason,
        },
      });
    } else if (!existing.pinned && !existing.excluded) {
      await prisma.contentRecommendation.update({
        where: { id: existing.id },
        data: {
          score: rec.score,
          reason: rec.reason,
        },
      });
    }
  }

  return topRecommendations;
}

export async function recomputeAllRecommendations() {
  const allPieces = await prisma.piece.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true },
  });

  let count = 0;
  for (const piece of allPieces) {
    await computeRecommendationsForPiece(piece.id);
    count++;
  }
  return count;
}

export async function getRecommendationsList(params: {
  pieceId?: string;
  search?: string;
  limit?: number;
  page?: number;
}) {
  const limit = Math.min(params.limit || 30, 100);
  const page = Math.max(params.page || 1, 1);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params.pieceId) {
    where.pieceId = params.pieceId;
  }

  const [recommendations, total] = await Promise.all([
    prisma.contentRecommendation.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { score: "desc" }],
      skip,
      take: limit,
    }),
    prisma.contentRecommendation.count({ where }),
  ]);

  // Fetch piece metadata in batch
  const pieceIds = new Set<string>();
  recommendations.forEach((r) => {
    pieceIds.add(r.pieceId);
    pieceIds.add(r.recommendedId);
  });

  const pieces = await prisma.piece.findMany({
    where: { id: { in: Array.from(pieceIds) } },
    select: { id: true, titleBn: true, slug: true, kind: true },
  });

  const pieceMap = new Map(pieces.map((p) => [p.id, p]));

  const enriched: RecommendationItem[] = recommendations.map((r) => {
    const p = pieceMap.get(r.pieceId);
    const rec = pieceMap.get(r.recommendedId);
    return {
      id: r.id,
      pieceId: r.pieceId,
      pieceTitleBn: p?.titleBn || "Unknown Piece",
      pieceSlug: p?.slug || "",
      recommendedId: r.recommendedId,
      recommendedTitleBn: rec?.titleBn || "Unknown Recommendation",
      recommendedSlug: rec?.slug || "",
      recommendedKind: rec?.kind || "RACHANA",
      score: r.score,
      reason: r.reason,
      pinned: r.pinned,
      excluded: r.excluded,
      createdAt: r.createdAt,
    };
  });

  return {
    recommendations: enriched,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
