import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { getSeriesList } from "@/lib/pieces";
import { piecePath } from "@/lib/nav";
import { T } from "@/components/i18n/t";
import { Count, CountLink, Num } from "@/components/i18n/values";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "ধারাবাহিক",
  description: "পর পর পড়ার মতো লেখার গুচ্ছ।",
  alternates: { canonical: "/series" },
};

export default async function SeriesIndexPage() {
  const seriesList = await getSeriesList();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <PageHeader
        labelEn="Series"
        titleBn="ধারাবাহিক"
        descBn="কিছু লেখা একা দাঁড়ায় না — পর পর পড়লে তবেই পুরোটা বোঝা যায়। সেগুলো এখানে ক্রম অনুযায়ী সাজানো।"
        descEn="Runs meant to be read in order"
      />

      {seriesList.length === 0 ? (
        <T
          as="p"
          k="empty.noSeries"
          className="py-24 text-center text-bengali-base text-content-faint"
          bnClassName="font-bengali"
        />
      ) : (
        <div className="divide-y divide-rule">
          {seriesList.map((series) => (
            <section key={series.slug} className="py-10">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="font-bengali text-2xl text-content" lang="bn">
                  <Link
                    href={`/series/${series.slug}`}
                    className="transition hover:text-accent"
                  >
                    {series.titleBn}
                  </Link>
                </h2>
                <Count
                  k="series.parts"
                  value={series.pieces.length}
                  className="label shrink-0"
                />
              </div>

              {series.descBn && (
                <p
                  className="mt-3 max-w-measure-wide font-bengali text-bengali-sm text-content-soft"
                  lang="bn"
                >
                  {series.descBn}
                </p>
              )}

              <ol className="mt-5 space-y-2">
                {series.pieces.slice(0, 5).map((piece, i) => (
                  <li key={piece.slug} className="flex gap-3">
                    <Num
                      value={piece.seriesOrder ?? i + 1}
                      className="w-6 shrink-0 text-right text-xs text-content-faint"
                    />
                    <Link
                      href={piecePath(piece.kind, piece.slug)}
                      className="font-bengali text-[0.9375rem] text-content-soft transition hover:text-accent"
                      lang="bn"
                    >
                      {piece.titleBn}
                    </Link>
                  </li>
                ))}
              </ol>

              {series.pieces.length > 5 && (
                <CountLink
                  href={`/series/${series.slug}`}
                  k="series.allParts"
                  value={series.pieces.length}
                  className="mt-4 inline-block text-sm text-accent transition hover:opacity-75"
                />
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
