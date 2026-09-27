import * as React from 'react';
const reactCache: <T extends (...args: any[]) => any>(fn: T) => T =
  typeof (React as any).cache === 'function'
    ? (React as any).cache
    : (<T extends (...args: any[]) => any>(fn: T): T => fn);
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// Cards do not use reader manifests, rights verification notes or media metadata.
// Keep transcriptText: the rights engine uses it for transcript-only reading.
export const referenceCardSelect = {
  id: true,
  slug: true,
  titleBn: true,
  titleEn: true,
  subtitleBn: true,
  type: true,
  language: true,
  era: true,
  author: { select: { id: true, slug: true, nameBn: true, nameEn: true } },
  editions: {
    take: 1,
    orderBy: { publicationYear: 'asc' },
    select: {
      id: true,
      editor: true,
      publisher: true,
      publicationYear: true,
      coverImage: true,
      hostingMode: true,
      rights: { select: { status: true } },
      sources: { take: 1, select: { sourceName: true, sourceUrl: true } },
      assets: {
        select: {
          kind: true,
          fileUrl: true,
          isDownloadable: true,
          isOnlineReadable: true,
          transcriptText: true,
        },
      },
    },
  },
} satisfies Prisma.ReferenceWorkSelect;

/** Live catalogue totals: no cross-request cache for changing rights/content. */
export async function getReferenceCatalogueStats() {
  const [groups, sources] = await Promise.all([
    prisma.referenceWork.groupBy({
      by: ['type'],
      where: { published: true },
      _count: { _all: true },
    }),
    prisma.referenceSource.count(),
  ]);
  const count = (types: string[]) => groups
    .filter(group => types.includes(group.type))
    .reduce((total, group) => total + group._count._all, 0);
  return [
    groups.reduce((total, group) => total + group._count._all, 0),
    count(['BOOK', 'ARTICLE']),
    count(['DOCUMENT', 'MANUSCRIPT', 'ARCHIVE']),
    sources,
    count(['AUDIO']),
  ] as const;
}

let statsCache: { data: readonly [number, number, number, number, number]; expiresAt: number } | null = null;

/** Catalogue statistics with memory caching in production, bypassing in tests for verification */
export async function getCachedReferenceCatalogueStats() {
  if (process.env.NODE_ENV === 'test') {
    return getReferenceCatalogueStats();
  }
  const now = Date.now();
  if (statsCache && statsCache.expiresAt > now) {
    return statsCache.data;
  }
  const data = await getReferenceCatalogueStats();
  statsCache = { data, expiresAt: now + 300_000 };
  return data;
}

/** Request-memoized reference work fetcher to eliminate duplicate queries between generateMetadata and Page */
export const getReferenceWorkBySlug = reactCache(async (slug: string) => {
  return prisma.referenceWork.findUnique({
    where: { slug },
    include: {
      author: true,
      editions: {
        orderBy: { publicationYear: 'asc' },
        include: {
          rights: true,
          sources: true,
          assets: true,
        },
      },
    },
  });
});
