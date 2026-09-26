import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({
      ok: true,
      results: {
        pieces: [],
        series: [],
        authors: [],
        tags: [],
      },
    });
  }

  const [pieces, series, authors, tags] = await Promise.all([
    prisma.piece.findMany({
      where: {
        OR: [
          { titleBn: { contains: q } },
          { titleEn: { contains: q, mode: "insensitive" } },
          { slug: { contains: q } },
        ],
      },
      select: {
        id: true,
        titleBn: true,
        titleEn: true,
        slug: true,
        kind: true,
        status: true,
      },
      take: 6,
    }),
    prisma.series.findMany({
      where: {
        OR: [
          { titleBn: { contains: q } },
          { titleEn: { contains: q, mode: "insensitive" } },
          { slug: { contains: q } },
        ],
      },
      select: { id: true, titleBn: true, titleEn: true, slug: true },
      take: 4,
    }),
    prisma.author.findMany({
      where: {
        OR: [
          { nameBn: { contains: q } },
          { nameEn: { contains: q, mode: "insensitive" } },
          { slug: { contains: q } },
        ],
      },
      select: { id: true, nameBn: true, nameEn: true, slug: true },
      take: 4,
    }),
    prisma.tag.findMany({
      where: {
        OR: [
          { labelBn: { contains: q } },
          { labelEn: { contains: q, mode: "insensitive" } },
          { slug: { contains: q } },
        ],
      },
      select: { id: true, labelBn: true, labelEn: true, slug: true, kind: true },
      take: 4,
    }),
  ]);

  // Admin pages are deliberately not matched here. They live in
  // `lib/admin-nav` and are fuzzy-matched in the browser by the command
  // palette, which is both instant and typo-tolerant — this route's old
  // `includes()` copy of the route list could be neither, and had already
  // drifted out of date (it never listed Reference Library or the SEO Growth
  // Engine, so ⌘K could not reach either).
  return NextResponse.json({
    ok: true,
    results: {
      pieces: pieces.map((p) => ({
        id: p.id,
        title: p.titleBn,
        subtitle: p.titleEn || p.slug,
        kind: p.kind,
        status: p.status,
        url: `/admin/pieces/${p.id}`,
      })),
      series: series.map((s) => ({
        id: s.id,
        title: s.titleBn,
        subtitle: s.titleEn || s.slug,
        url: `/admin/series`,
      })),
      authors: authors.map((a) => ({
        id: a.id,
        title: a.nameBn,
        subtitle: a.nameEn || a.slug,
        url: `/admin/taxonomy`,
      })),
      tags: tags.map((t) => ({
        id: t.id,
        title: t.labelBn,
        subtitle: t.kind,
        url: `/admin/taxonomy`,
      })),
    },
  });
}
