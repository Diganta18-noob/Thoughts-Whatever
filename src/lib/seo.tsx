import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/utils";
import { absoluteCoverUrl, absoluteImageUrl } from "@/lib/images";
import { deriveExcerpt } from "@/lib/markdown";
import { piecePath, KIND_META, type PieceKindKey } from "@/lib/nav";
import { toIsoString } from "@/lib/i18n/format";

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
 * Always resolves: a real `ogImage` URL wins, otherwise the cover — and
 * `absoluteCoverUrl` is total. So every piece has a share image, and
 * `summary_large_image` is always the right card type.
 */
function shareImage(piece: SeoPiece): string {
  return (
    absoluteImageUrl(piece.ogImage) ??
    absoluteCoverUrl("piece", piece.slug, piece.coverImage)
  );
}

export function pieceMetadata(piece: SeoPiece): Metadata {
  const url = absoluteUrl(piecePath(piece.kind, piece.slug));
  const description =
    piece.seoDescription ||
    piece.dekBn ||
    piece.excerptBn ||
    deriveExcerpt(piece.bodyBn, 160);

  const image = shareImage(piece);

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
      publishedTime: toIsoString(piece.publishedAt),
      modifiedTime: toIsoString(piece.updatedAt),
      tags: piece.tags?.map((t) => t.labelBn),
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: piece.titleBn,
      description,
      images: [image],
    },
  };
}

export function articleJsonLd(piece: SeoPiece) {
  const url = absoluteUrl(piecePath(piece.kind, piece.slug));

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: piece.titleBn,
    alternativeHeadline: piece.titleEn || piece.subtitleBn || undefined,
    description:
      piece.seoDescription || piece.dekBn || piece.excerptBn || undefined,
    inLanguage: "bn-IN",
    image: shareImage(piece),
    datePublished: toIsoString(piece.publishedAt),
    dateModified: toIsoString(piece.updatedAt ?? piece.publishedAt),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      sameAs: [siteConfig.instagram].filter(Boolean),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/logo-full.svg"),
      },
      sameAs: [siteConfig.instagram].filter(Boolean),
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

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: [siteConfig.nameEn, "t.w"],
    url: siteConfig.url,
    logo: absoluteUrl("/brand/logo-full.svg"),
    sameAs: [siteConfig.instagram].filter(Boolean),
    description: siteConfig.tagline,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: [siteConfig.nameEn, "t.w"],
    url: siteConfig.url,
    description: siteConfig.tagline,
    inLanguage: ["bn", "en"],
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/logo-full.svg"),
      },
      sameAs: [siteConfig.instagram].filter(Boolean),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/archive?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function authorPersonJsonLd(author: {
  slug: string;
  nameBn: string;
  nameEn?: string | null;
  bioBn?: string | null;
  portrait?: string | null;
  era?: string | null;
}) {
  const url = absoluteUrl(`/authors/${author.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.nameBn,
    alternateName: author.nameEn || undefined,
    description: author.bioBn || undefined,
    image: author.portrait || undefined,
    url,
    mainEntityOfPage: {
      "@type": "ProfilePage",
      "@id": url,
    },
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function seriesJsonLd(series: {
  slug: string;
  titleBn: string;
  descriptionBn?: string | null;
  coverImage?: string | null;
  pieces: {
    slug: string;
    kind: PieceKindKey;
    titleBn: string;
    seriesOrder?: number | null;
    publishedAt: Date | null;
  }[];
}) {
  const url = absoluteUrl(`/series/${series.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWorkSeries",
    name: series.titleBn,
    description: series.descriptionBn || undefined,
    url,
    inLanguage: "bn",
    image: absoluteCoverUrl("series", series.slug, series.coverImage) ?? undefined,
    numberOfEpisodes: series.pieces.length,
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      sameAs: [siteConfig.instagram].filter(Boolean),
    },
    hasPart: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: series.pieces.length,
      itemListElement: series.pieces.map((piece, i) => ({
        "@type": "ListItem",
        position: piece.seriesOrder ?? i + 1,
        item: {
          "@type": "Article",
          name: piece.titleBn,
          url: absoluteUrl(piecePath(piece.kind, piece.slug)),
          inLanguage: "bn",
          datePublished: toIsoString(piece.publishedAt),
        },
      })),
    },
  };
}

export function itemListJsonLd(
  pieces: { slug: string; kind: PieceKindKey; titleBn: string }[],
  listName: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: listName,
    numberOfItems: pieces.length,
    itemListElement: pieces.map((piece, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: piece.titleBn,
      url: absoluteUrl(piecePath(piece.kind, piece.slug)),
    })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

