import { cache } from "react";
import type { Prisma, PieceKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { coverSrc } from "@/lib/images";

export const PUBLISHED: Prisma.PieceWhereInput = {
  status: "PUBLISHED",
  publishedAt: { not: null },
};

function withCover<T extends { slug: string; coverImage: string | null }>(
  row: T,
  owner: "piece" | "series" = "piece",
): T {
  return { ...row, coverImage: coverSrc(owner, row.slug, row.coverImage) };
}

export const cardSelect = {
  slug: true,
  kind: true,
  titleBn: true,
  dekBn: true,
  excerptBn: true,
  coverImage: true,
  readingMinutes: true,
  publishedAt: true,
  audioUrl: true,
  seriesOrder: true,
  authors: { select: { slug: true, nameBn: true } },
} satisfies Prisma.PieceSelect;

export type CardPiece = Prisma.PieceGetPayload<{ select: typeof cardSelect }>;

const byNewest: Prisma.PieceOrderByWithRelationInput[] = [
  { publishedAt: "desc" },
  { createdAt: "desc" },
];

export const getRecentPieces = cache(
  async (opts: { kind?: PieceKind; take?: number; skip?: number } = {}) => {
    const rows = await prisma.piece.findMany({
      where: { ...PUBLISHED, ...(opts.kind ? { kind: opts.kind } : {}) },
      select: cardSelect,
      orderBy: byNewest,
      take: opts.take ?? 12,
      skip: opts.skip ?? 0,
    });
    return rows.map((row) => withCover(row));
  },
);

export const countPieces = cache(async (kind?: PieceKind) =>
  prisma.piece.count({ where: { ...PUBLISHED, ...(kind ? { kind } : {}) } }),
);

export const getFeaturedPieces = cache(async (take = 3) => {
  const rows = await prisma.piece.findMany({
    where: { ...PUBLISHED, featured: true },
    select: cardSelect,
    orderBy: byNewest,
    take,
  });
  return rows.map((row) => withCover(row));
});

export const getPieceBySlug = cache(async (slug: string, kind?: PieceKind) => {
  const piece = await prisma.piece.findFirst({
    where: { slug, ...PUBLISHED, ...(kind ? { kind } : {}) },
    include: {
      authors: { select: { slug: true, nameBn: true, era: true } },
      tags: { select: { slug: true, labelBn: true, kind: true } },
      series: {
        select: {
          slug: true,
          titleBn: true,
          _count: { select: { pieces: { where: PUBLISHED } } },
        },
      },
      sources: { orderBy: { order: "asc" } },
      timeline: { orderBy: { order: "asc" } },
    },
  });
  return piece && withCover(piece);
});

export type FullPiece = NonNullable<Awaited<ReturnType<typeof getPieceBySlug>>>;

export const getSeriesNeighbours = cache(
  async (seriesId: string, order: number | null) => {
    if (order === null) return { prev: null, next: null };
    const [prev, next] = await Promise.all([
      prisma.piece.findFirst({
        where: { ...PUBLISHED, seriesId, seriesOrder: { lt: order } },
        select: { slug: true, kind: true, titleBn: true, seriesOrder: true },
        orderBy: { seriesOrder: "desc" },
      }),
      prisma.piece.findFirst({
        where: { ...PUBLISHED, seriesId, seriesOrder: { gt: order } },
        select: { slug: true, kind: true, titleBn: true, seriesOrder: true },
        orderBy: { seriesOrder: "asc" },
      }),
    ]);
    return { prev, next };
  },
);

export const getRelatedPieces = cache(
  async (piece: {
    slug: string;
    authorSlugs: string[];
    tagSlugs: string[];
    take?: number;
  }) => {
    const take = piece.take ?? 4;
    const or: Prisma.PieceWhereInput[] = [];
    if (piece.authorSlugs.length) {
      or.push({ authors: { some: { slug: { in: piece.authorSlugs } } } });
    }
    if (piece.tagSlugs.length) {
      or.push({ tags: { some: { slug: { in: piece.tagSlugs } } } });
    }
    if (!or.length) return getRecentPieces({ take });

    const rows = await prisma.piece.findMany({
      where: { ...PUBLISHED, slug: { not: piece.slug }, OR: or },
      select: cardSelect,
      orderBy: byNewest,
      take,
    });
    return rows.map((row) => withCover(row));
  },
);

export const getArchivePieces = cache(
  async (filters: {
    kind?: PieceKind;
    tag?: string;
    author?: string;
    series?: string;
    year?: string;
  }) => {
    const where: Prisma.PieceWhereInput = { ...PUBLISHED };

    if (filters.kind) where.kind = filters.kind;
    if (filters.tag) where.tags = { some: { slug: filters.tag } };
    if (filters.author) where.authors = { some: { slug: filters.author } };
    if (filters.series) where.series = { slug: filters.series };

    if (filters.year && /^\d{4}$/.test(filters.year)) {
      const y = Number(filters.year);
      where.publishedAt = {
        gte: new Date(Date.UTC(y, 0, 1)),
        lt: new Date(Date.UTC(y + 1, 0, 1)),
      };
    }

    const rows = await prisma.piece.findMany({
      where,
      select: cardSelect,
      orderBy: byNewest,
      take: 200,
    });
    return rows.map((row) => withCover(row));
  },
);

export const getFilterFacets = cache(async () => {
  const [tags, authors, seriesList, years] = await Promise.all([
    prisma.tag.findMany({
      where: { pieces: { some: PUBLISHED } },
      select: {
        slug: true,
        labelBn: true,
        kind: true,
        _count: { select: { pieces: { where: PUBLISHED } } },
      },
      orderBy: { labelBn: "asc" },
    }),
    prisma.author.findMany({
      where: { pieces: { some: PUBLISHED } },
      select: {
        slug: true,
        nameBn: true,
        era: true,
        _count: { select: { pieces: { where: PUBLISHED } } },
      },
      orderBy: { nameBn: "asc" },
    }),
    prisma.series.findMany({
      where: { pieces: { some: PUBLISHED } },
      select: { slug: true, titleBn: true },
      orderBy: { titleBn: "asc" },
    }),
    prisma.piece.findMany({
      where: PUBLISHED,
      select: { publishedAt: true },
      orderBy: { publishedAt: "desc" },
    }),
  ]);

  const yearSet = new Set<number>();
  for (const row of years) {
    if (row.publishedAt) yearSet.add(row.publishedAt.getUTCFullYear());
  }

  return {
    tags,
    authors,
    series: seriesList,
    years: [...yearSet].sort((a, b) => b - a),
  };
});

export const getAuthorBySlug = cache(async (slug: string) => {
  const author = await prisma.author.findUnique({
    where: { slug },
    include: {
      pieces: { where: PUBLISHED, select: cardSelect, orderBy: byNewest },
    },
  });
  return (
    author && { ...author, pieces: author.pieces.map((row) => withCover(row)) }
  );
});

function withSeriesCovers<
  T extends {
    slug: string;
    coverImage: string | null;
    pieces: { slug: string; coverImage: string | null }[];
  },
>(series: T): T {
  return {
    ...withCover(series, "series"),
    pieces: series.pieces.map((row) => withCover(row)),
  };
}

export const getSeriesList = cache(async () => {
  const rows = await prisma.series.findMany({
    where: { pieces: { some: PUBLISHED } },
    include: {
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(withSeriesCovers);
});

export const getFeaturedSeries = cache(async (take = 3) => {
  const rows = await prisma.series.findMany({
    where: { pieces: { some: PUBLISHED } },
    include: {
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
      },
    },
    take: take * 3,
  });

  const sorted = rows
    .map(withSeriesCovers)
    .sort((a, b) => {
      const aLatest = a.pieces[a.pieces.length - 1]?.publishedAt;
      const bLatest = b.pieces[b.pieces.length - 1]?.publishedAt;
      if (!aLatest) return 1;
      if (!bLatest) return -1;
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    })
    .slice(0, take);

  return sorted;
});

export const getSeriesBySlug = cache(async (slug: string) => {
  const series = await prisma.series.findUnique({
    where: { slug },
    include: {
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
      },
    },
  });
  return series && withSeriesCovers(series);
});

export const getAllPublishedSlugs = cache(async () =>
  prisma.piece.findMany({
    where: PUBLISHED,
    select: { slug: true, kind: true, publishedAt: true, updatedAt: true },
    orderBy: byNewest,
  }),
);

export const getKindCounts = cache(async () => {
  const rows = await prisma.piece.groupBy({
    by: ["kind"],
    where: PUBLISHED,
    _count: { _all: true },
  });

  const counts = {} as Record<PieceKind, number>;
  for (const row of rows) counts[row.kind] = row._count._all;
  return counts;
});

export const getPullQuoteCandidates = cache(async (take = 8) =>
  prisma.piece.findMany({
    where: PUBLISHED,
    select: { slug: true, titleBn: true, kind: true, bodyBn: true },
    orderBy: byNewest,
    take,
  }),
);

export const getPublishingTimeline = cache(async () => {
  const pieces = await prisma.piece.findMany({
    where: PUBLISHED,
    select: { publishedAt: true },
    orderBy: { publishedAt: "desc" },
  });

  const groups = new Map<string, { year: number; month: number; count: number }>();

  for (const piece of pieces) {
    if (!piece.publishedAt) continue;
    const d = new Date(piece.publishedAt);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const key = `${year}-${month}`;

    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { year, month, count: 1 });
    }
  }

  return Array.from(groups.values());
});
