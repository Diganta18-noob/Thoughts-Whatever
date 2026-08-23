import { prisma } from "@/lib/prisma";

export interface GraphNode {
  id: string;
  name: string;
  type: "piece" | "series" | "author" | "tag";
  group: string;
  val: number; // size / importance
  slug: string;
  details?: {
    kind?: string;
    views?: number;
    era?: string | null;
  };
}

export interface GraphLink {
  source: string;
  target: string;
  type: "series" | "author" | "tag" | "recommendation";
  weight: number;
}

export interface ContentGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    pieceCount: number;
    seriesCount: number;
    authorCount: number;
    tagCount: number;
    totalConnections: number;
  };
}

export async function getContentGraphData(options?: {
  limit?: number;
  includeTags?: boolean;
  filterKind?: string;
}): Promise<ContentGraphData> {
  const limit = options?.limit || 120;
  const includeTags = options?.includeTags !== false;

  const [pieces, seriesList, authors, tags, recommendations] = await Promise.all([
    prisma.piece.findMany({
      where: {
        status: "PUBLISHED",
        ...(options?.filterKind ? { kind: options.filterKind as any } : {}),
      },
      take: limit,
      include: {
        authors: { select: { id: true } },
        tags: { select: { id: true } },
        series: { select: { id: true } },
      },
    }),
    prisma.series.findMany({
      select: { id: true, titleBn: true, slug: true },
    }),
    prisma.author.findMany({
      select: { id: true, nameBn: true, slug: true, era: true },
    }),
    prisma.tag.findMany({
      select: { id: true, labelBn: true, slug: true, kind: true },
    }),
    prisma.contentRecommendation.findMany({
      where: { excluded: false },
      take: 80,
    }),
  ]);

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const activeNodeIds = new Set<string>();

  // 1. Add Piece Nodes
  for (const p of pieces) {
    nodes.push({
      id: p.id,
      name: p.titleBn,
      type: "piece",
      group: p.kind,
      val: Math.max(6, Math.min(24, 6 + Math.log2((p.viewCount || 1) + 1) * 3)),
      slug: p.slug,
      details: {
        kind: p.kind,
        views: p.viewCount,
      },
    });
    activeNodeIds.add(p.id);

    // Link piece -> series
    if (p.seriesId) {
      links.push({
        source: p.id,
        target: p.seriesId,
        type: "series",
        weight: 3,
      });
      activeNodeIds.add(p.seriesId);
    }

    // Link piece -> authors
    for (const a of p.authors) {
      links.push({
        source: p.id,
        target: a.id,
        type: "author",
        weight: 2,
      });
      activeNodeIds.add(a.id);
    }

    // Link piece -> tags
    if (includeTags) {
      for (const t of p.tags) {
        links.push({
          source: p.id,
          target: t.id,
          type: "tag",
          weight: 1,
        });
        activeNodeIds.add(t.id);
      }
    }
  }

  // 2. Add Recommendation links between pieces
  for (const rec of recommendations) {
    if (activeNodeIds.has(rec.pieceId) && activeNodeIds.has(rec.recommendedId)) {
      links.push({
        source: rec.pieceId,
        target: rec.recommendedId,
        type: "recommendation",
        weight: Math.max(1, Math.round(rec.score / 25)),
      });
    }
  }

  // 3. Add active Series nodes
  for (const s of seriesList) {
    if (activeNodeIds.has(s.id)) {
      nodes.push({
        id: s.id,
        name: s.titleBn,
        type: "series",
        group: "SERIES",
        val: 18,
        slug: s.slug,
      });
    }
  }

  // 4. Add active Author nodes
  for (const a of authors) {
    if (activeNodeIds.has(a.id)) {
      nodes.push({
        id: a.id,
        name: a.nameBn,
        type: "author",
        group: "AUTHOR",
        val: 14,
        slug: a.slug,
        details: {
          era: a.era,
        },
      });
    }
  }

  // 5. Add active Tag nodes
  if (includeTags) {
    for (const t of tags) {
      if (activeNodeIds.has(t.id)) {
        nodes.push({
          id: t.id,
          name: t.labelBn,
          type: "tag",
          group: t.kind,
          val: 10,
          slug: t.slug,
        });
      }
    }
  }

  return {
    nodes,
    links,
    stats: {
      pieceCount: pieces.length,
      seriesCount: seriesList.filter((s) => activeNodeIds.has(s.id)).length,
      authorCount: authors.filter((a) => activeNodeIds.has(a.id)).length,
      tagCount: tags.filter((t) => activeNodeIds.has(t.id)).length,
      totalConnections: links.length,
    },
  };
}
