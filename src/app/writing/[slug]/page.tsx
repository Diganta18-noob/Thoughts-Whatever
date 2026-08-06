import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleView } from "@/components/pieces/article-view";
import { JsonLd, articleJsonLd, breadcrumbJsonLd, pieceMetadata } from "@/lib/seo";
import {
  getPieceBySlug,
  getRelatedPieces,
  getSeriesNeighbours,
  getAllPublishedSlugs,
} from "@/lib/pieces";

export const revalidate = 300;

/**
 * Slugs are Bengali, so params arrive percent-encoded. Every route that reads
 * a slug has to decode it before hitting the database, or every Bengali URL
 * 404s.
 */
function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedSlugs();
    return slugs
      .filter((p) => p.kind === "RACHANA")
      .map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const piece = await getPieceBySlug(decodeSlug(params.slug), "RACHANA");
  if (!piece) return { title: "পাওয়া গেল না" };
  return pieceMetadata(piece);
}

export default async function WritingPiecePage({
  params,
}: {
  params: { slug: string };
}) {
  const piece = await getPieceBySlug(decodeSlug(params.slug), "RACHANA");
  if (!piece) notFound();

  const [related, neighbours] = await Promise.all([
    getRelatedPieces({
      slug: piece.slug,
      authorSlugs: piece.authors.map((a) => a.slug),
      tagSlugs: piece.tags.map((t) => t.slug),
    }),
    piece.seriesId ? getSeriesNeighbours(piece.seriesId, piece.seriesOrder) : Promise.resolve({ prev: null, next: null }),

  ]);

  return (
    <>
      <JsonLd data={articleJsonLd(piece)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "রচনা", path: "/writing" },
          { name: piece.titleBn, path: `/writing/${piece.slug}` },
        ])}
      />
      <ArticleView piece={piece} related={related} neighbours={neighbours} />
    </>
  );
}
