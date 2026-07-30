import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { derivePieceMeta } from "@/lib/markdown";
import type { PieceInput } from "@/lib/validation";

/**
 * Turning editor input into database rows.
 *
 * Create and update share this so the two paths cannot drift — a piece saved as
 * a draft and then published must end up identical to one published outright.
 */

/**
 * Publishing with an empty date field means "now".
 *
 * The editor leaves the date input blank on a new piece, and the whole public
 * site filters on `publishedAt: { not: null }` — so without this, hitting
 * Publish would appear to work and the piece would never show up anywhere.
 * A date that was typed in is kept as typed, including a future one, which is
 * how scheduling works.
 */
function resolvePublishedAt(input: PieceInput): Date | null {
  if (input.publishedAt) {
    const parsed = new Date(input.publishedAt);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return input.status === "PUBLISHED" ? new Date() : null;
}

function scalarData(input: PieceInput) {
  const derived = derivePieceMeta(input.bodyBn, input.excerptBn);

  return {
    kind: input.kind,
    status: input.status,
    slug: input.slug,
    titleBn: input.titleBn,
    titleEn: input.titleEn ?? null,
    subtitleBn: input.subtitleBn ?? null,
    dekBn: input.dekBn ?? null,
    bodyBn: input.bodyBn,
    excerptBn: derived.excerptBn,
    readingMinutes: derived.readingMinutes,
    coverImage: input.coverImage ?? null,
    reelUrl: input.reelUrl ?? null,
    videoUrl: input.videoUrl ?? null,
    audioUrl: input.audioUrl ?? null,
    audioSec: input.audioSec ?? null,
    featured: input.featured,
    seoDescription: input.seoDescription ?? null,
    ogImage: input.ogImage ?? null,
    publishedAt: resolvePublishedAt(input),
    seriesOrder: input.seriesId ? (input.seriesOrder ?? null) : null,
  };
}

export async function createPiece(input: PieceInput) {
  return prisma.piece.create({
    data: {
      ...scalarData(input),
      seriesId: input.seriesId ?? null,
      authors: { connect: input.authorIds.map((id) => ({ id })) },
      tags: { connect: input.tagIds.map((id) => ({ id })) },
      sources: {
        create: input.sources.map((s, order) => ({
          label: s.label,
          url: s.url ?? null,
          note: s.note ?? null,
          order,
        })),
      },
      timeline: {
        create: input.timeline.map((t, order) => ({
          year: t.year,
          labelBn: t.labelBn,
          descBn: t.descBn ?? null,
          order,
        })),
      },
    },
    select: { id: true, slug: true, kind: true },
  });
}

export async function updatePiece(id: string, input: PieceInput) {
  return prisma.piece.update({
    where: { id },
    data: {
      ...scalarData(input),
      series: input.seriesId
        ? { connect: { id: input.seriesId } }
        : { disconnect: true },
      // `set` rather than `connect` — an author removed in the editor has to
      // actually come off the piece, or the /authors hub keeps listing it.
      authors: { set: input.authorIds.map((authorId) => ({ id: authorId })) },
      tags: { set: input.tagIds.map((tagId) => ({ id: tagId })) },
      // Sources and the timeline are ordered lists the publisher reorders
      // freely. Diffing them by id would buy nothing; replacing is honest.
      sources: {
        deleteMany: {},
        create: input.sources.map((s, order) => ({
          label: s.label,
          url: s.url ?? null,
          note: s.note ?? null,
          order,
        })),
      },
      timeline: {
        deleteMany: {},
        create: input.timeline.map((t, order) => ({
          year: t.year,
          labelBn: t.labelBn,
          descBn: t.descBn ?? null,
          order,
        })),
      },
    },
    select: { id: true, slug: true, kind: true },
  });
}

/** True when the failure was a unique-constraint clash on `slug`. */
export function isSlugTaken(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    String(error.meta?.target ?? "").includes("slug")
  );
}
