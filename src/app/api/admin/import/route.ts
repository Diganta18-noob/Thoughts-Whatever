import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bengaliSlug } from "@/lib/bengali";
import { formatMarkdownBody } from "@/lib/markdown";
import { z } from "zod";

import { pieceKindSchema } from "@/lib/validation";

const importRowSchema = z.object({
  kind: pieceKindSchema.optional().default("RACHANA"),
  titleBn: z.string().trim().min(1, "Title is required"),
  titleEn: z.string().trim().optional(),
  subtitleBn: z.string().trim().optional(),
  dekBn: z.string().trim().optional(),
  bodyBn: z.string().trim().min(1, "Body is required"),
  reelUrl: z.string().trim().optional(),
  videoUrl: z.string().trim().optional(),
  coverImage: z.string().trim().optional(),
  seriesTitle: z.string().trim().optional(),
  seriesOrder: z.coerce.number().int().optional(),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
      return NextResponse.json({ error: "Please provide an import array containing between 1 and 500 rows." }, { status: 400 });
    }

    let importedCount = 0;

    for (const rawRow of rows) {
      const parsed = importRowSchema.safeParse(rawRow);
      if (!parsed.success) continue;

      const row = parsed.data;


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
          bodyBn: formatMarkdownBody(row.bodyBn.trim()),
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
