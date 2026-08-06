import { cache } from "react";
import type { Prisma, PieceKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Every read the public site does goes through this file.
 *
 * Two rules hold everywhere below:
 *   1. `status: "PUBLISHED"` and a non-null `publishedAt` are always both
 *      required. A piece scheduled for next week has status PUBLISHED the
 *      moment the editor sets it, so status alone would leak drafts-in-waiting.
 *   2. `bodyBn` is never selected on list queries. It is the largest column in
 *      the table and an index page that pulls twenty full essays to render
 *      twenty two-line excerpts is the single easiest way to make this site
 *      slow.
 */

export const PUBLISHED: Prisma.PieceWhereInput = {
  status: "PUBLISHED",
  publishedAt: { not: null },
};

/** The exact shape `PieceCard` and `PieceRow` need — no more. */
export const cardSelect = {
  slug: true,
  kind: true,
  titleBn: true,
  dekBn: true,
  excerptBn: true,
  coverImage: true,
  coverImageWidth: true,
  coverImageHeight: true,
  readingMinutes: true,
  publishedAt: true,
  audioUrl: true,
  reelUrl: true,
  seriesOrder: true,
  authors: { select: { slug: true, nameBn: true } },
} satisfies Prisma.PieceSelect;


export type CardPiece = Prisma.PieceGetPayload<{ select: typeof cardSelect }>;

const byNewest: Prisma.PieceOrderByWithRelationInput[] = [
  { publishedAt: "desc" },
  { createdAt: "desc" },
];

// ─── Lists ──────────────────────────────────────────────────

export const getRecentPieces = cache(
  async (opts: { kind?: PieceKind; take?: number; skip?: number } = {}) =>
    prisma.piece.findMany({
      where: { ...PUBLISHED, ...(opts.kind ? { kind: opts.kind } : {}) },
      select: cardSelect,
      orderBy: byNewest,
      take: opts.take ?? 12,
      skip: opts.skip ?? 0,
    }),
);

export const countPieces = cache(async (kind?: PieceKind) =>
  prisma.piece.count({ where: { ...PUBLISHED, ...(kind ? { kind } : {}) } }),
);

export const getFeaturedPieces = cache(async (take = 3) =>
  prisma.piece.findMany({
    where: { ...PUBLISHED, featured: true },
    select: cardSelect,
    orderBy: byNewest,
    take,
  }),
);

// ─── One piece ──────────────────────────────────────────────

export const getPieceBySlug = cache(async (slug: string, kind?: PieceKind) => {
  const piece = await prisma.piece.findFirst({
    where: { slug, ...PUBLISHED, ...(kind ? { kind } : {}) },
    include: {
      authors: { select: { slug: true, nameBn: true, era: true } },
      tags: { select: { slug: true, labelBn: true, kind: true } },
      series: { select: { slug: true, titleBn: true } },
      sources: { orderBy: { order: "asc" } },
      timeline: { orderBy: { order: "asc" } },
    },
  });
  return piece;
});

export type FullPiece = NonNullable<Awaited<ReturnType<typeof getPieceBySlug>>>;

export const getSeriesNeighbours = cache(
  async (seriesId: string | null, order: number | null, slugPrefix?: string) => {
    if (order === null && !slugPrefix) return { prev: null, next: null };

    const seriesWhere: Prisma.PieceWhereInput = seriesId
      ? { seriesId }
      : slugPrefix
      ? { slug: { startsWith: slugPrefix } }
      : {};

    if (Object.keys(seriesWhere).length === 0) return { prev: null, next: null };

    const currentOrder = order ?? 1;

    const [prev, next] = await Promise.all([
      prisma.piece.findFirst({
        where: { ...PUBLISHED, ...seriesWhere, seriesOrder: { lt: currentOrder } },
        select: { slug: true, kind: true, titleBn: true, seriesOrder: true },
        orderBy: { seriesOrder: "desc" },
      }),
      prisma.piece.findFirst({
        where: { ...PUBLISHED, ...seriesWhere, seriesOrder: { gt: currentOrder } },
        select: { slug: true, kind: true, titleBn: true, seriesOrder: true },
        orderBy: { seriesOrder: "asc" },
      }),
    ]);
    return { prev, next };
  },
);


/**
 * Related reading.
 *
 * Shared author first, shared tag second. Both are cheap relational filters —
 * there is no embedding model here, and for a corpus this size a hand-built
 * rule beats a similarity score a reader cannot predict.
 */
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

    return prisma.piece.findMany({
      where: { ...PUBLISHED, slug: { not: piece.slug }, OR: or },
      select: cardSelect,
      orderBy: byNewest,
      take,
    });
  },
);

// ─── Archive filtering ──────────────────────────────────────

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

    return prisma.piece.findMany({
      where,
      select: cardSelect,
      orderBy: byNewest,
      take: 200,
    });
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
        // Filtered relation count — without the `where` this would include
        // drafts, and a tag reading "৯" that lists five pieces looks broken.
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

// ─── Hubs ───────────────────────────────────────────────────

export const getAuthorBySlug = cache(async (slug: string) =>
  prisma.author.findUnique({
    where: { slug },
    include: {
      pieces: { where: PUBLISHED, select: cardSelect, orderBy: byNewest },
    },
  }),
);

export const getSeriesList = cache(async () =>
  prisma.series.findMany({
    where: { pieces: { some: PUBLISHED } },
    include: {
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
      },
    },
    orderBy: { updatedAt: "desc" },
  }),
);

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

  if (!series) return null;

  // Fallback: If pieces array is empty, fetch pieces matching the series slug prefix
  if (series.pieces.length === 0) {
    const fallbackPieces = await prisma.piece.findMany({
      where: {
        ...PUBLISHED,
        slug: { startsWith: slug },
      },
      select: cardSelect,
      orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
    });
    return { ...series, pieces: fallbackPieces };
  }

  return series;
});


/** Slugs for generateStaticParams and the sitemap. */
export const getAllPublishedSlugs = cache(async () =>
  prisma.piece.findMany({
    where: PUBLISHED,
    select: { slug: true, kind: true, publishedAt: true, updatedAt: true },
    orderBy: byNewest,
  }),
);
