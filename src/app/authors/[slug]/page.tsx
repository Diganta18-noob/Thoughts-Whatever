import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PieceCard } from "@/components/pieces/piece-card";
import { JsonLd } from "@/lib/seo";
import { getAuthorBySlug } from "@/lib/pieces";
import { prisma } from "@/lib/prisma";
import { T } from "@/components/i18n/t";
import { Count } from "@/components/i18n/values";
import { absoluteUrl } from "@/lib/utils";

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
    const authors = await prisma.author.findMany({ select: { slug: true } });
    return authors.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const author = await getAuthorBySlug(decodeSlug(params.slug));
  if (!author) return { title: "পাওয়া গেল না" };

  const description =
    author.bioBn?.slice(0, 155) ||
    `${author.nameBn} নিয়ে লেখা ও তথ্যচিত্র — এক জায়গায়।`;

  return {
    title: author.nameBn,
    description,
    alternates: { canonical: `/authors/${author.slug}` },
    openGraph: {
      type: "profile",
      title: author.nameBn,
      description,
      images: author.portrait ? [{ url: author.portrait }] : undefined,
    },
  };
}

/**
 * Author hubs are the best surface this site has.
 *
 * Someone searching "জীবনানন্দ দাশ কবিতা" is looking for a page like this, not
 * for a single essay. And a reader who arrives at one essay about a poet is
 * unusually likely to want the other four — so this page exists purely to hand
 * them over.
 */
export default async function AuthorPage({
  params,
}: {
  params: { slug: string };
}) {
  const author = await getAuthorBySlug(decodeSlug(params.slug));
  if (!author) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: author.nameBn,
          alternateName: author.nameEn || undefined,
          description: author.bioBn || undefined,
          image: author.portrait || undefined,
          url: absoluteUrl(`/authors/${author.slug}`),
        }}
      />

      <header className="border-b border-rule pb-8 pt-12 sm:pt-16">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {author.portrait && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.portrait}
              alt=""
              className="h-24 w-24 shrink-0 rounded-sm border border-rule object-cover grayscale"
            />
          )}

          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <T
                k="authors.label"
                className="label"
                bnClassName="font-bengali-sans tracking-normal"
              />
              <Count
                k="common.count"
                value={author.pieces.length}
                className="label"
              />
            </div>

            <h1
              className="mt-3 font-bengali text-[2rem] font-medium leading-tight text-content sm:text-[2.5rem]"
              lang="bn"
            >
              {author.nameBn}
            </h1>

            {author.era && (
              <p className="mt-1 font-mono text-sm text-content-faint">
                {author.era}
              </p>
            )}

            {author.bioBn && (
              <p
                className="mt-4 max-w-measure-wide font-bengali text-bengali-base text-content-soft"
                lang="bn"
              >
                {author.bioBn}
              </p>
            )}
          </div>
        </div>
      </header>

      {author.pieces.length === 0 ? (
        <T
          as="p"
          k="empty.noAuthorPieces"
          className="py-24 text-center text-bengali-base text-content-faint"
          bnClassName="font-bengali"
        />
      ) : (
        <div className="grid gap-9 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {author.pieces.map((piece) => (
            <PieceCard key={piece.slug} piece={piece} showKind />
          ))}
        </div>
      )}
    </div>
  );
}
