
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSeriesBySlug, getSeriesList } from "@/lib/pieces";
import { piecePath } from "@/lib/nav";
import { Count, LocalDate, Num, Reading } from "@/components/i18n/values";
import { EditorialImage } from "@/components/pieces/editorial-image";
import { Play, BookOpen, Layers } from "lucide-react";
import { withTimeout } from "@/lib/utils";

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
    const list = await withTimeout(getSeriesList(), [], 8000);
    return list.slice(0, 10).map((s) => ({ slug: s.slug }));
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
    const series = await withTimeout(
      getSeriesBySlug(decodeSlug(rawSlug)),
      null,
      8000,
    );
    if (!series) return { title: "পাওয়া গেল না" };
    return {
      title: `${series.titleBn} — সিরিজ`,
      description: series.descBn ?? undefined,
      alternates: { canonical: `/series/${series.slug}` },
    };
  } catch {
    return { title: "পাওয়া গেল না" };
  }
}

import { SeriesTracker } from "@/components/analytics/series-tracker";

export default async function SeriesPage(props: RouteProps) {
  const params = await props?.params;
  const rawSlug = params?.slug || "";
  let series = null;
  try {
    series = await withTimeout(
      getSeriesBySlug(decodeSlug(rawSlug)),
      null,
      8000,
    );
  } catch {
    series = null;
  }
  if (!series) notFound();

  const totalReadingMinutes = series.pieces.reduce(
    (acc, p) => acc + (p.readingMinutes || 0),
    0
  );
  const firstPiece = series.pieces[0];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <SeriesTracker
        seriesId={series.id}
        seriesName={series.titleBn}
        totalEpisodes={series.pieces.length}
      />

      {/* Series Hero Section */}
      <div className="my-8 rounded-xl border border-rule/80 bg-surface-raised/40 p-6 sm:p-10 shadow-sm backdrop-blur">
        <div className="grid gap-8 md:grid-cols-[1.5fr_2.5fr] md:items-center">
          {series.coverImage ? (
            <EditorialImage
              src={series.coverImage}
              alt={series.titleBn}
              priority
              aspectRatioOverride="aspect-[4/3]"
              className="rounded-lg shadow-md"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-surface/60 border border-rule/60 text-content-faint">
              <Layers className="h-16 w-16 opacity-40" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent">
              <Layers className="h-3.5 w-3.5" />
              <span>সিরিজ</span>
            </div>

            <h1 className="font-bengali text-3xl font-semibold leading-tight text-content sm:text-4xl">
              {series.titleBn}
            </h1>

            {series.descBn && (
              <p className="font-bengali text-base leading-relaxed text-content-soft">
                {series.descBn}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-content-faint pt-2 border-t border-rule/50">
              <Count k="series.parts" value={series.pieces.length} />
              <span>·</span>
              <Reading minutes={totalReadingMinutes} />
            </div>

            {firstPiece && (
              <div className="pt-4">
                <Link
                  href={piecePath(firstPiece.kind, firstPiece.slug)}
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-bengali text-sm font-medium text-surface shadow transition hover:opacity-90"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>প্রথম পর্ব থেকে শুরু করুন</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Episode Grid & Reading Order */}
      <div className="mx-auto max-w-measure-wide py-6">
        <h2 className="font-mono text-xs uppercase tracking-wider text-content-faint mb-6">
          পর্বের তালিকা ({series.pieces.length})
        </h2>

        <ol className="divide-y divide-rule/60">
          {series.pieces.map((piece, i) => (
            <li key={piece.slug}>
              <Link
                href={piecePath(piece.kind, piece.slug)}
                className="group flex gap-5 py-6 transition hover:bg-surface-raised/20 rounded-lg px-3 -mx-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rule/60 bg-surface text-content-soft transition group-hover:border-accent group-hover:text-accent">
                  <Num value={piece.seriesOrder ?? i + 1} className="font-mono text-sm" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3
                    className="font-bengali text-xl font-medium leading-snug text-content transition-colors group-hover:text-accent"
                    lang="bn"
                  >
                    {piece.titleBn}
                  </h3>
                  {(piece.dekBn || piece.excerptBn) && (
                    <p
                      className="mt-2 font-bengali text-bengali-sm text-content-soft line-clamp-2"
                      lang="bn"
                    >
                      {piece.dekBn || piece.excerptBn}
                    </p>
                  )}
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 text-[0.6875rem] text-content-faint">
                    {piece.publishedAt && <LocalDate value={piece.publishedAt} />}
                    <span>·</span>
                    <Reading minutes={piece.readingMinutes} />
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
