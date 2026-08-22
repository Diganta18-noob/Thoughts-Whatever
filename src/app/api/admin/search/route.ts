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
        actions: [],
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

  // Static navigation/action matches
  const adminActions = [
    { title: "Dashboard Overview", path: "/admin", category: "Navigation" },
    { title: "Pieces & Articles", path: "/admin/pieces", category: "Content" },
    { title: "Create New Piece", path: "/admin/pieces/new", category: "Action" },
    { title: "Series Management", path: "/admin/series", category: "Content" },
    { title: "Taxonomy & Tags", path: "/admin/taxonomy", category: "Content" },
    { title: "Analytics & Traffic", path: "/admin/analytics", category: "Intelligence" },
    { title: "Real-Time Activity", path: "/admin/activity", category: "Workflow" },
    { title: "Notification Center", path: "/admin/notifications", category: "Workflow" },
    { title: "Team & Role Management", path: "/admin/team", category: "Administration" },
    { title: "Security Center", path: "/admin/security", category: "Administration" },
    { title: "Audit Log Explorer", path: "/admin/audit-log", category: "Administration" },
    { title: "Newsletter Subscribers", path: "/admin/subscribers", category: "Audience" },
    { title: "Transliteration Engine", path: "/admin/transliteration", category: "Tools" },
    { title: "Import & Migration", path: "/admin/import", category: "Tools" },
    { title: "Prompt History & Ideas", path: "/admin/prompts", category: "Tools" },
    { title: "System Maintenance & Backup", path: "/admin/system", category: "System" },
    { title: "Admin Portal Settings", path: "/admin/settings", category: "Settings" },
  ];

  const matchedActions = adminActions.filter((a) =>
    a.title.toLowerCase().includes(q.toLowerCase()) || a.path.toLowerCase().includes(q.toLowerCase())
  );

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
      actions: matchedActions.map((a) => ({
        title: a.title,
        subtitle: a.category,
        url: a.path,
      })),
    },
  });
}
