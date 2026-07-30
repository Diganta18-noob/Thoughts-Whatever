import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bengaliSlug } from "@/lib/bengali";

interface ImportRow {
  kind?: "RACHANA" | "BLOG" | "DOCUMENTARY";
  titleBn: string;
  titleEn?: string;
  subtitleBn?: string;
  dekBn?: string;
  bodyBn: string;
  reelUrl?: string;
  videoUrl?: string;
  coverImage?: string;
  seriesTitle?: string;
  seriesOrder?: number;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { rows }: { rows: ImportRow[] } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No valid rows provided" }, { status: 400 });
    }

    let importedCount = 0;

    for (const row of rows) {
      if (!row.titleBn || !row.bodyBn) continue;

      const slug = bengaliSlug(row.titleBn) || `piece-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const kind = row.kind || "RACHANA";

      let seriesId: string | undefined = undefined;
      if (row.seriesTitle?.trim()) {
        const seriesSlug = bengaliSlug(row.seriesTitle.trim());
        let series = await prisma.series.findUnique({ where: { slug: seriesSlug } });
        if (!series) {
          series = await prisma.series.create({
            data: {
              slug: seriesSlug,
              titleBn: row.seriesTitle.trim(),
            },
          });
        }
        seriesId = series.id;
      }

      await prisma.piece.create({
        data: {
          kind,
          status: "DRAFT",
          slug,
          titleBn: row.titleBn.trim(),
          titleEn: row.titleEn?.trim() || null,
          subtitleBn: row.subtitleBn?.trim() || null,
          dekBn: row.dekBn?.trim() || null,
          bodyBn: row.bodyBn.trim(),
          reelUrl: row.reelUrl?.trim() || null,
          videoUrl: row.videoUrl?.trim() || null,
          coverImage: row.coverImage?.trim() || null,
          seriesId: seriesId || null,
          seriesOrder: row.seriesOrder ? Number(row.seriesOrder) : null,
        },
      });

      importedCount++;
    }

    return NextResponse.json({ ok: true, importedCount });
  } catch (error) {
    console.error("CSV import failed:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
