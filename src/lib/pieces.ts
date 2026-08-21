import { cache } from "react";
import type { Prisma, PieceKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { coverSrc } from "@/lib/images";
import { publishedBlobPrefixes, usablePrefix } from "@/lib/blob-prefix";

export const PUBLISHED: Prisma.PieceWhereInput = {
  status: "PUBLISHED",
};

function withCover<T extends { slug: string; coverImage?: string | null }>(
  row: T,
  owner: "piece" | "series" = "piece",
): T & { coverImage: string } {
  return { ...row, coverImage: coverSrc(owner, row.slug, row.coverImage) };
}

/**
 * `ogImage` is the *second* blob column on Piece, and on every legacy row it
 * holds a byte-for-byte copy of the base64 `coverImage` — 133 KB to 320 KB of
 * it. Dropping `coverImage` from the list selects was not enough: the article
 * page's `getPieceBySlug` used `include:`, which pulls every scalar, so one
 * full blob still reached the RSC stream (283,695 chars on
 * crime-and-punishment-3, which alone was 90% of that page's payload).
 *
 * Nulling it here is behaviour-preserving, not a feature change. The only read
 * path is `shareImage` in `lib/seo.tsx`, which pipes the value through
 * `absoluteImageUrl` — that already discards any data URI and falls back to the
 * `/api/cover` URL. So a data-URI `ogImage` renders exactly nothing today; it
 * was pure payload weight. A real URL is a usable share image and passes
 * through untouched.
 */
export function sanitizeShareImage<T extends { ogImage?: string | null }>(
  row: T,
): T & { ogImage: string | null } {
  const value = row.ogImage?.trim();
  return { ...row, ogImage: !value || value.startsWith("data:") ? null : value };
}

/**
 * `coverImage` is deliberately NOT selected.
 *
 * Legacy rows hold the entire image as a base64 data URI (up to 3.1 MB), so
 * selecting it turned a 4 KB list query into a 2.8 MB transfer and blew the
 * home page's query timeouts. `withCover` reconstructs a URL from the slug
 * instead. The two dimension columns are plain ints and stay, so cards can
 * reserve space and avoid layout shift.
 */
export const cardSelect = {
  slug: true,
  kind: true,
  titleBn: true,
  dekBn: true,
  excerptBn: true,
  coverImageWidth: true,
  coverImageHeight: true,
  readingMinutes: true,
  featured: true,
  publishedAt: true,
  audioUrl: true,
  seriesOrder: true,
  authors: { select: { slug: true, nameBn: true } },
} satisfies Prisma.PieceSelect;

export type CardPiece = Prisma.PieceGetPayload<{ select: typeof cardSelect }> & {
  coverImage: string;
};

/**
 * Same reasoning as `cardSelect`: never select `Series.coverImage`.
 *
 * The two dimension columns are read by the series detail page's hero, which
 * passes them to `EditorialImage` — without them the component falls back to
 * `probeImageDimensions`, a second client-side fetch of the same cover just to
 * read its header. The Cloudinary migration filled them from the upload
 * response, so 3 of the 4 rows now carry real dimensions and skip that probe;
 * the fourth has no cover at all.
 */
const seriesSelect = {
  id: true,
  slug: true,
  titleBn: true,
  titleEn: true,
  descBn: true,
  coverImageWidth: true,
  coverImageHeight: true,
} satisfies Prisma.SeriesSelect;

const byNewest: Prisma.PieceOrderByWithRelationInput = { createdAt: "desc" };

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

/**
 * Everything an article page renders, named one field at a time.
 *
 * This was an `include:`, which pulls every scalar on the row. That is how
 * `ogImage` kept crossing the database boundary after `coverImage` had been
 * dealt with everywhere else, and it is why the fix had to be applied per
 * column — `withCover` for one, `sanitizeShareImage` for the other. An explicit
 * select makes the class of bug structurally impossible instead: the next
 * blob-shaped column added to `Piece` is simply not read here, and nobody has to
 * remember to patch it.
 *
 * Neither blob column is listed. `withCover` rewrites `coverImage` to the
 * `/api/cover` URL for every other surface on the site, so the article hero is
 * now consistent with the cards rather than the exception; `ogImage` is read as
 * a bounded prefix in `getPieceBySlug` below, because a *real* URL there is a
 * usable share image and must survive.
 */
const pieceSelect = {
  id: true,
  kind: true,
  status: true,
  slug: true,
  titleBn: true,
  titleEn: true,
  subtitleBn: true,
  dekBn: true,
  bodyBn: true,
  excerptBn: true,
  coverImageWidth: true,
  coverImageHeight: true,
  reelUrl: true,
  videoUrl: true,
  audioUrl: true,
  audioSec: true,
  readingMinutes: true,
  featured: true,
  viewCount: true,
  seoDescription: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  seriesId: true,
  seriesOrder: true,
  authors: { select: { slug: true, nameBn: true, era: true } },
  tags: { select: { slug: true, labelBn: true, kind: true } },
  series: {
    select: {
      slug: true,
      titleBn: true,
      _count: { select: { pieces: { where: PUBLISHED } } },
    },
  },
  // Source and TimelineEvent are short text rows with no image columns, so
  // taking them whole costs nothing and stays correct as they grow.
  sources: { orderBy: { order: "asc" } },
  timeline: { orderBy: { order: "asc" } },
} satisfies Prisma.PieceSelect;

export const getPieceBySlug = cache(async (slug: string, kind?: PieceKind) => {
  // Concurrent, not sequential: the prefix read is a lookup on `slug`'s unique
  // index returning at most 512 bytes, so it costs a connection and no
  // measurable latency — against up to 320 KB of base64 it replaces.
  const [piece, shareImages, coverImages] = await Promise.all([
    prisma.piece.findFirst({
      where: { slug, ...PUBLISHED, ...(kind ? { kind } : {}) },
      select: pieceSelect,
    }),
    publishedBlobPrefixes("ogImage", [slug]),
    publishedBlobPrefixes("coverImage", [slug]),
  ]);

  if (!piece) return null;

  const ogImage = usablePrefix(shareImages.get(slug));
  const coverImage = usablePrefix(coverImages.get(slug));
  return sanitizeShareImage(withCover({ ...piece, coverImage, ogImage }));
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
    take?: number;
    skip?: number;
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
      take: filters.take ?? 50,
      skip: filters.skip ?? 0,
    });
    return rows.map((row) => withCover(row));
  },
);

export const getFilterFacets = cache(async () => {
  const [tags, authors, seriesList, years] = await Promise.all([
    prisma.tag.findMany({
      select: {
        slug: true,
        labelBn: true,
        kind: true,
      },
      orderBy: { labelBn: "asc" },
    }),
    prisma.author.findMany({
      select: {
        slug: true,
        nameBn: true,
        era: true,
      },
      orderBy: { nameBn: "asc" },
    }),
    prisma.series.findMany({
      select: { slug: true, titleBn: true },
      orderBy: { titleBn: "asc" },
    }),
    prisma.piece.findMany({
      where: PUBLISHED,
      select: { publishedAt: true },
      orderBy: { publishedAt: "desc" },
      take: 100,
    }),
  ]);

  const yearSet = new Set<number>();
  for (const row of years) {
    if (row.publishedAt) yearSet.add(row.publishedAt.getUTCFullYear());
  }

  return {
    tags: tags.map((t) => ({ ...t, _count: { pieces: 1 } })),
    authors: authors.map((a) => ({ ...a, _count: { pieces: 1 } })),
    series: seriesList,
    years: [...yearSet].sort((a, b) => b - a),
  };
});

/**
 * Same reasoning as `pieceSelect`: an explicit list, not `include:`.
 *
 * `portrait` stays. It is not a blob column by design — `validation.ts` accepts
 * only a URL there, all 7 rows are null today, and the author page renders it
 * directly. `/api/cover` has no `author` owner to proxy it through, so dropping
 * it would silently remove the portrait rather than reroute it.
 */
const authorSelect = {
  slug: true,
  nameBn: true,
  nameEn: true,
  era: true,
  bioBn: true,
  portrait: true,
} satisfies Prisma.AuthorSelect;

export const getAuthorBySlug = cache(async (slug: string) => {
  const author = await prisma.author.findUnique({
    where: { slug },
    select: {
      ...authorSelect,
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
    coverImage?: string | null;
    pieces: { slug: string; coverImage?: string | null }[];
  },
>(series: T) {
  return {
    ...withCover(series, "series"),
    pieces: series.pieces.map((row) => withCover(row)),
  };
}

export const getSeriesList = cache(async () => {
  const rows = await prisma.series.findMany({
    select: {
      ...seriesSelect,
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: { seriesOrder: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.filter((s) => s.pieces.length > 0).map(withSeriesCovers);
});

export const getFeaturedSeries = cache(async (take = 3) => {
  const rows = await prisma.series.findMany({
    select: {
      ...seriesSelect,
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: { seriesOrder: "asc" },
      },
    },
    take: take * 3,
  });

  const sorted = rows
    .filter((s) => s.pieces.length > 0)
    .map(withSeriesCovers)
    .sort((a, b) => {
      const aLatest = a.pieces[a.pieces.length - 1]?.publishedAt;
      const bLatest = b.pieces[b.pieces.length - 1]?.publishedAt;
      if (!aLatest) return 1;
      if (!bLatest) return -1;
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });

  return sorted.slice(0, take);
});

export const getSeriesBySlug = cache(async (slug: string) => {
  const series = await prisma.series.findUnique({
    where: { slug },
    select: {
      ...seriesSelect,
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
      },
    },
  });
  return series && withSeriesCovers(series);
});

export const getAllPublishedSlugs = cache(async (take = 50) =>
  prisma.piece.findMany({
    where: PUBLISHED,
    select: { slug: true, kind: true },
    orderBy: byNewest,
    take,
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
  const rows = await prisma.$queryRaw<Array<{
    year: number;
    month: number;
    count: bigint;
  }>>`
    SELECT
      EXTRACT(YEAR FROM "publishedAt")::integer as year,
      EXTRACT(MONTH FROM "publishedAt")::integer as month,
      COUNT(*)::bigint as count
    FROM "Piece"
    WHERE status = 'PUBLISHED' AND "publishedAt" IS NOT NULL
    GROUP BY EXTRACT(YEAR FROM "publishedAt"), EXTRACT(MONTH FROM "publishedAt")
    ORDER BY year DESC, month DESC
  `;

  return rows.map((r) => ({
    year: Number(r.year),
    month: Number(r.month),
    count: Number(r.count),
  }));
});
