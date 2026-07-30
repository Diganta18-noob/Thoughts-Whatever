import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { getSeriesBySlug, getSeriesList } from "@/lib/pieces";
import { piecePath } from "@/lib/nav";
import { Count, LocalDate, Num, Reading } from "@/components/i18n/values";

export const revalidate = 300;

function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function generateStaticParams() {
  const list = await getSeriesList();
  return list.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const series = await getSeriesBySlug(decodeSlug(params.slug));
  if (!series) return { title: "পাওয়া গেল না" };
  return {
    title: series.titleBn,
    description: series.descBn ?? undefined,
    alternates: { canonical: `/series/${series.slug}` },
  };
}

export default async function SeriesPage({
  params,
}: {
  params: { slug: string };
}) {
  const series = await getSeriesBySlug(decodeSlug(params.slug));
  if (!series) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <PageHeader
        labelEn="Series"
        titleBn={series.titleBn}
        descBn={series.descBn ?? undefined}
        count={<Count k="series.parts" value={series.pieces.length} />}
      />

      <ol className="mx-auto max-w-measure-wide divide-y divide-rule py-8">
        {series.pieces.map((piece, i) => (
          <li key={piece.slug}>
            <Link
              href={piecePath(piece.kind, piece.slug)}
              className="group flex gap-5 py-6 transition"
            >
              <Num
                value={piece.seriesOrder ?? i + 1}
                className="w-10 shrink-0 pt-1 text-sm text-content-faint"
              />
              <div className="min-w-0 flex-1">
                <h2
                  className="font-bengali text-xl leading-snug text-content transition-colors group-hover:text-accent"
                  lang="bn"
                >
                  {piece.titleBn}
                </h2>
                {(piece.dekBn || piece.excerptBn) && (
                  <p
                    className="mt-2 font-bengali text-bengali-sm text-content-soft"
                    lang="bn"
                  >
                    {piece.dekBn || piece.excerptBn}
                  </p>
                )}
                <p className="mt-2 flex flex-wrap gap-x-3 text-[0.6875rem] text-content-faint">
                  {piece.publishedAt && (
                    <LocalDate value={piece.publishedAt} />
                  )}
                  <Reading minutes={piece.readingMinutes} />
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
