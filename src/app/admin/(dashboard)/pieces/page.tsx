import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PiecesListClient } from "./pieces-list-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Pieces" };

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const KINDS = ["RACHANA", "BLOG", "DOCUMENTARY"] as const;

type Search = { status?: string; kind?: string; q?: string };

export default async function AdminPiecesPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const status = STATUSES.find((s) => s === searchParams.status);
  const kind = KINDS.find((k) => k === searchParams.kind);
  const q = searchParams.q?.trim() || undefined;

  const where: Prisma.PieceWhereInput = {
    ...(status ? { status } : {}),
    ...(kind ? { kind } : {}),
    ...(q
      ? {
          OR: [
            { titleBn: { contains: q } },
            { titleEn: { contains: q, mode: "insensitive" } },
            { slug: { contains: q } },
          ],
        }
      : {}),
  };

  const [pieces, total] = await Promise.all([
    prisma.piece.findMany({
      where,
      select: {
        id: true,
        slug: true,
        kind: true,
        status: true,
        titleBn: true,
        publishedAt: true,
        updatedAt: true,
        readingMinutes: true,
        series: { select: { titleBn: true } },
        seriesOrder: true,
        _count: { select: { sources: true } },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 50,
    }),
    prisma.piece.count({ where }),
  ]);

  return (
    <PiecesListClient
      pieces={pieces}
      total={total}
      searchParams={searchParams}
    />
  );
}
