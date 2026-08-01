import { prisma } from "@/lib/prisma";
import type { EditorOption, EditorTag } from "@/components/admin/piece-editor";

/**
 * The pickers in the editor. Shared by the new and edit pages so a tag added
 * mid-session shows up in both without a second query written twice.
 */
export async function getEditorOptions() {
  try {
    const [authors, tags, series] = await Promise.all([
      prisma.author.findMany({
        select: { id: true, nameBn: true, nameEn: true, era: true },
        orderBy: { nameBn: "asc" },
      }),
      prisma.tag.findMany({
        select: { id: true, labelBn: true, labelEn: true, kind: true },
        orderBy: [{ kind: "asc" }, { labelBn: "asc" }],
      }),
      prisma.series.findMany({
        select: { id: true, titleBn: true, titleEn: true },
        orderBy: { titleBn: "asc" },
      }),
    ]);

    console.log('✅ Editor options loaded:', {
      authors: authors.length,
      tags: tags.length,
      series: series.length
    });

    return {
      authors: authors.map(
        (a): EditorOption & { era?: string | null } => ({
          id: a.id,
          labelBn: a.nameBn,
          labelEn: a.nameEn,
          era: a.era,
        }),
      ),
      tags: tags.map(
        (t): EditorTag => ({
          id: t.id,
          labelBn: t.labelBn,
          labelEn: t.labelEn,
          kind: t.kind,
        }),
      ),
      series: series.map(
        (s): EditorOption => ({ id: s.id, labelBn: s.titleBn, labelEn: s.titleEn }),
      ),
    };
  } catch (error) {
    console.error("getEditorOptions DB error:", error);
    return { authors: [], tags: [], series: [] };
  }
}
