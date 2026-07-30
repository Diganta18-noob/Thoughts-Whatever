import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/utils";
import { deriveExcerpt } from "@/lib/markdown";
import { piecePath, KIND_META, type PieceKindKey } from "@/lib/nav";

type SeoPiece = {
  slug: string;
  kind: PieceKindKey;
  titleBn: string;
  titleEn?: string | null;
  subtitleBn?: string | null;
  dekBn?: string | null;
  excerptBn?: string | null;
  bodyBn: string;
  coverImage?: string | null;
  ogImage?: string | null;
  seoDescription?: string | null;
  publishedAt: Date | null;
  updatedAt?: Date;
  authors?: { nameBn: string }[];
  tags?: { labelBn: string }[];
};

/**
 * Metadata for a piece.
 *
 * The title stays in Bengali. An English translation in the <title> would rank
 * for searches the site cannot satisfy and would look wrong in the tab of
 * exactly the reader it is for. `titleEn`, where set, goes in the OG
 * description instead — useful to diaspora readers scanning a share card.
 */
export function pieceMetadata(piece: SeoPiece): Metadata {
  const url = absoluteUrl(piecePath(piece.kind, piece.slug));
  const description =
    piece.seoDescription ||
    piece.dekBn ||
    piece.excerptBn ||
    deriveExcerpt(piece.bodyBn, 160);

  const image = piece.ogImage || piece.coverImage;

  return {
    title: piece.titleBn,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: piece.titleBn,
      description,
      siteName: siteConfig.name,
      locale: "bn_BD",
      publishedTime: piece.publishedAt?.toISOString(),
      modifiedTime: piece.updatedAt?.toISOString(),
      tags: piece.tags?.map((t) => t.labelBn),
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: piece.titleBn,
      description,
      images: image ? [image] : undefined,
    },
  };
}

/**
 * Article JSON-LD.
 *
 * `inLanguage: "bn"` matters more here than usual — without it, search engines
 * frequently mis-detect literary Bengali and surface the page to the wrong
 * audience.
 */
export function articleJsonLd(piece: SeoPiece) {
  const url = absoluteUrl(piecePath(piece.kind, piece.slug));

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: piece.titleBn,
    alternativeHeadline: piece.titleEn || piece.subtitleBn || undefined,
    description:
      piece.seoDescription || piece.dekBn || piece.excerptBn || undefined,
    inLanguage: "bn",
    image: piece.ogImage || piece.coverImage || undefined,
    datePublished: piece.publishedAt?.toISOString(),
    dateModified: (piece.updatedAt ?? piece.publishedAt)?.toISOString(),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    about: piece.authors?.map((a) => ({ "@type": "Person", name: a.nameBn })),
    keywords: piece.tags?.map((t) => t.labelBn).join(", ") || undefined,
    articleSection: KIND_META[piece.kind].labelEn,
  };
}

export function breadcrumbJsonLd(
  trail: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Inline a JSON-LD block. Kept in one place so the escaping is consistent. */
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // The payload is our own database content, and the replace guards the
      // one sequence that could break out of a <script> block.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
