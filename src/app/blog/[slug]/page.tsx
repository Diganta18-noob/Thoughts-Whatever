
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

function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateStaticParams() {
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 4000)
    );
    const slugs = (await Promise.race([getAllPublishedSlugs(), timeout])) as Awaited<ReturnType<typeof getAllPublishedSlugs>>;
    return slugs
      .filter((p) => p.kind === "BLOG")
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
  const piece = await getPieceBySlug(decodeSlug(rawSlug), "BLOG");
  if (!piece) return { title: "পাওয়া গেল না" };
  return pieceMetadata(piece);
}

export default async function BlogPiecePage(props: RouteProps) {
  const params = await props?.params;
  const rawSlug = params?.slug || "";
  const piece = await getPieceBySlug(decodeSlug(rawSlug), "BLOG");
  if (!piece) notFound();

  const [related, neighbours] = await Promise.all([
    getRelatedPieces({
      slug: piece.slug,
      authorSlugs: piece.authors.map((a) => a.slug),
      tagSlugs: piece.tags.map((t) => t.slug),
    }),
    piece.seriesId
      ? getSeriesNeighbours(piece.seriesId, piece.seriesOrder)
      : Promise.resolve(undefined),
  ]);

  return (
    <>
      <JsonLd data={articleJsonLd(piece)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "ব্লগ", path: "/blog" },
          { name: piece.titleBn, path: `/blog/${piece.slug}` },
        ])}
      />
      <ArticleView piece={piece} related={related} neighbours={neighbours} />
    </>
  );
}
