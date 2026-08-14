import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArticleView } from "@/components/pieces/article-view";
import { JsonLd, articleJsonLd, breadcrumbJsonLd, pieceMetadata } from "@/lib/seo";
import {
  getPieceBySlug,
  getRelatedPieces,
  getSeriesNeighbours,
} from "@/lib/pieces";
import { withTimeout } from "@/lib/utils";
import { getBuildTimeSlugs } from "@/lib/build-params";

export const revalidate = 300;

function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateStaticParams() {
  try {
    const slugs = await getBuildTimeSlugs();
    return slugs
      .filter((p) => p.kind === "DOCUMENTARY")
      .slice(0, 10)
      .map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

type RouteProps = {
  params: Promise<{ slug: string }> | { slug: string };
};

export async function generateMetadata(props: RouteProps): Promise<Metadata> {
  const params = await props?.params;
  const rawSlug = params?.slug || "";
  try {
    const piece = await withTimeout(
      getPieceBySlug(decodeSlug(rawSlug)),
      null,
      8000,
    );
    if (!piece) return { title: "পাওয়া গেল না" };
    return pieceMetadata(piece);
  } catch {
    return { title: "পাওয়া গেল না" };
  }
}

export default async function DocumentaryPiecePage(props: RouteProps) {
  const params = await props?.params;
  const rawSlug = params?.slug || "";
  const piece = await getPieceBySlug(decodeSlug(rawSlug));
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
          { name: "ডকুমেন্টারি", path: "/documentary" },
          { name: piece.titleBn, path: `/documentary/${piece.slug}` },
        ])}
      />
      <ArticleView piece={piece} related={related} neighbours={neighbours} />
    </>
  );
}
