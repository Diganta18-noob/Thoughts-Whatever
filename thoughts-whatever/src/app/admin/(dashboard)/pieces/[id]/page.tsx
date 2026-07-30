import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PieceEditor, type EditorPiece } from "@/components/admin/piece-editor";
import { DeletePieceButton } from "@/components/admin/delete-piece-button";
import { getEditorOptions } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function EditPiecePage({
  params,
}: {
  params: { id: string };
}) {
  const [piece, options] = await Promise.all([
    prisma.piece.findUnique({
      where: { id: params.id },
      include: {
        authors: { select: { id: true } },
        tags: { select: { id: true } },
        sources: { orderBy: { order: "asc" } },
        timeline: { orderBy: { order: "asc" } },
      },
    }),
    getEditorOptions(),
  ]);

  if (!piece) notFound();

  // Every nullable column becomes "" here, because a controlled React input
  // given `null` logs a warning and then behaves as uncontrolled.
  const initial: EditorPiece = {
    id: piece.id,
    kind: piece.kind,
    status: piece.status,
    slug: piece.slug,
    titleBn: piece.titleBn,
    titleEn: piece.titleEn ?? "",
    subtitleBn: piece.subtitleBn ?? "",
    dekBn: piece.dekBn ?? "",
    bodyBn: piece.bodyBn,
    excerptBn: piece.excerptBn ?? "",
    coverImage: piece.coverImage ?? "",
    reelUrl: piece.reelUrl ?? "",
    videoUrl: piece.videoUrl ?? "",
    audioUrl: piece.audioUrl ?? "",
    audioSec: piece.audioSec === null ? "" : String(piece.audioSec),
    featured: piece.featured,
    seoDescription: piece.seoDescription ?? "",
    ogImage: piece.ogImage ?? "",
    publishedAt: "", // filled in the browser — see PieceEditor
    seriesId: piece.seriesId ?? "",
    seriesOrder: piece.seriesOrder === null ? "" : String(piece.seriesOrder),
    authorIds: piece.authors.map((a) => a.id),
    tagIds: piece.tags.map((t) => t.id),
    sources: piece.sources.map((s) => ({
      label: s.label,
      url: s.url ?? "",
      note: s.note ?? "",
    })),
    timeline: piece.timeline.map((t) => ({
      year: t.year,
      labelBn: t.labelBn,
      descBn: t.descBn ?? "",
    })),
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/admin/pieces"
          className="inline-flex items-center gap-1.5 font-serif text-sm text-content-soft transition hover:text-accent"
          lang="en"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All pieces
        </Link>

        <DeletePieceButton
          id={piece.id}
          titleBn={piece.titleBn}
          redirectTo="/admin/pieces"
        />
      </div>

      <div className="mt-6">
        <PieceEditor
          initial={initial}
          publishedAtIso={piece.publishedAt?.toISOString() ?? null}
          authors={options.authors}
          tags={options.tags}
          series={options.series}
        />
      </div>
    </div>
  );
}
