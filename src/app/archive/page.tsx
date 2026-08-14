import Link from "next/link";
import type { Metadata } from "next";
import type { PieceKind } from "@prisma/client";
import { PageHeader } from "@/components/layout/page-header";
import { PieceRow } from "@/components/pieces/piece-card";
import { FilterGroup } from "@/components/archive/filter-group";
import { T } from "@/components/i18n/t";
import { Count, Num } from "@/components/i18n/values";
import { getArchivePieces, getFilterFacets } from "@/lib/pieces";
import { KIND_META } from "@/lib/nav";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "সংগ্রহ",
  description: "সব লেখা — লেখক, যুগ, রূপ ও বিষয় ধরে সাজানো।",
  alternates: { canonical: "/archive" },
};

/** What arrives in the URL: every value is a string, or nothing. */
type RawParams = {
  kind?: string;
  tag?: string;
  author?: string;
  series?: string;
  year?: string;
};

/** What the query layer accepts: `kind` has been checked against the enum. */
type Filters = {
  kind?: PieceKind;
  tag?: string;
  author?: string;
  series?: string;
  year?: string;
};

const KIND_VALUES = ["RACHANA", "BLOG", "DOCUMENTARY"] as const;

/**
 * `?kind=` is user input, so an unknown value becomes `undefined` (show
 * everything) rather than reaching Prisma as an invalid enum member.
 */
function isKind(value: string | undefined): value is PieceKind {
  return (KIND_VALUES as readonly string[]).includes(value ?? "");
}

const TAG_GROUPS: { kind: string; labelBn: string; labelEn: string }[] = [
  { kind: "FORM", labelBn: "রূপ", labelEn: "Form" },
  { kind: "THEME", labelBn: "বিষয়", labelEn: "Theme" },
  { kind: "ERA", labelBn: "কাল", labelEn: "Era" },
  { kind: "TOPIC", labelBn: "অন্যান্য", labelEn: "Topic" },
];

/**
 * Filters are URL state, not component state.
 *
 * That is deliberate: a filtered archive view is a thing readers link to each
 * other — "সব জীবনানন্দ এখানে" — and a page that keeps its filters in React
 * state cannot be shared, bookmarked, or opened in a new tab.
 */
function buildHref(current: Filters, patch: Filters) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/archive?${qs}` : "/archive";
}

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: RawParams & { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10) || 1);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const filters: Filters = {
    kind: isKind(searchParams.kind) ? searchParams.kind : undefined,
    tag: searchParams.tag,
    author: searchParams.author,
    series: searchParams.series,
    year: searchParams.year,
  };

  const [pieces, facets] = await Promise.all([
    getArchivePieces({ ...filters, take: pageSize, skip }),
    getFilterFacets(),
  ]);

  const active = Object.values(filters).filter(Boolean).length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <PageHeader
        labelEn="Archive"
        titleBn="সংগ্রহ"
        descBn="সব লেখা এক জায়গায়। লেখক, যুগ, রূপ বা বিষয় বেছে নিলে ঠিক সেটুকুই থাকবে।"
        descEn="Everything, by author, era, form, and theme"
        count={<Count k="common.count" value={pieces.length} />}
      />

      <div className="grid gap-10 py-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
        {/* ─── Filters ──────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          {active && (
            <Link
              href="/archive"
              className="mb-6 inline-block text-sm text-accent transition hover:opacity-75"
            >
              ← <T k="archive.clearFilters" bnClassName="font-bengali" />
            </Link>
          )}

          <FilterGroup labelEn="Kind" labelBn="ধরন">
            {KIND_VALUES.map((value) => (
              <Chip
                key={value}
                href={buildHref(filters, {
                  kind: filters.kind === value ? undefined : value,
                })}
                active={filters.kind === value}
                label={KIND_META[value].labelBn}
              />
            ))}
          </FilterGroup>

          {facets.authors.length > 0 && (
            <FilterGroup labelEn="Author" labelBn="লেখক">
              {facets.authors.map((author) => (
                <Chip
                  key={author.slug}
                  href={buildHref(filters, {
                    author:
                      filters.author === author.slug ? undefined : author.slug,
                  })}
                  active={filters.author === author.slug}
                  label={author.nameBn}
                  count={author._count.pieces}
                />
              ))}
            </FilterGroup>
          )}

          {TAG_GROUPS.map((group) => {
            const tags = facets.tags.filter((t) => t.kind === group.kind);
            if (!tags.length) return null;
            return (
              <FilterGroup
                key={group.kind}
                labelEn={group.labelEn}
                labelBn={group.labelBn}
              >
                {tags.map((tag) => (
                  <Chip
                    key={tag.slug}
                    href={buildHref(filters, {
                      tag: filters.tag === tag.slug ? undefined : tag.slug,
                    })}
                    active={filters.tag === tag.slug}
                    label={tag.labelBn}
                    count={tag._count.pieces}
                  />
                ))}
              </FilterGroup>
            );
          })}

          {facets.series.length > 0 && (
            <FilterGroup labelEn="Series" labelBn="ধারাবাহিক">
              {facets.series.map((series) => (
                <Chip
                  key={series.slug}
                  href={buildHref(filters, {
                    series:
                      filters.series === series.slug ? undefined : series.slug,
                  })}
                  active={filters.series === series.slug}
                  label={series.titleBn}
                />
              ))}
            </FilterGroup>
          )}

          {facets.years.length > 0 && (
            <FilterGroup labelEn="Year" labelBn="বছর">
              {facets.years.map((year) => (
                <Chip
                  key={year}
                  href={buildHref(filters, {
                    year:
                      filters.year === String(year) ? undefined : String(year),
                  })}
                  active={filters.year === String(year)}
                  label={<Num value={year} />}
                  numeric
                />
              ))}
            </FilterGroup>
          )}
        </aside>

        {/* ─── Results ──────────────────────────────────────── */}
        <div>
          {pieces.length === 0 ? (
            <div className="py-20 text-center">
              <T
                as="p"
                k="archive.noMatch"
                className="text-bengali-base text-content-soft"
                bnClassName="font-bengali"
              />
              <Link
                href="/archive"
                className="mt-3 inline-block text-sm text-accent hover:opacity-75"
              >
                <T k="archive.clearFilters" bnClassName="font-bengali" />
              </Link>
            </div>
          ) : (
            <>
              <ol className="border-t border-rule">
                {pieces.map((piece, i) => (
                  <li key={piece.slug}>
                    <PieceRow piece={piece} index={i} />
                  </li>
                ))}
              </ol>

              {(page > 1 || pieces.length === pageSize) && (
                <div className="mt-8 flex items-center justify-between border-t border-rule pt-4 font-sans text-xs">
                  {page > 1 ? (
                    <Link
                      href={buildHref(filters, {})}
                      className="text-accent underline hover:opacity-80"
                    >
                      ← Previous page
                    </Link>
                  ) : (
                    <span />
                  )}

                  {pieces.length === pageSize && (
                    <Link
                      href={`/archive?${new URLSearchParams({
                        ...(searchParams.kind ? { kind: searchParams.kind } : {}),
                        ...(searchParams.tag ? { tag: searchParams.tag } : {}),
                        ...(searchParams.author ? { author: searchParams.author } : {}),
                        ...(searchParams.series ? { series: searchParams.series } : {}),
                        ...(searchParams.year ? { year: searchParams.year } : {}),
                        page: String(page + 1),
                      }).toString()}`}
                      className="text-accent underline hover:opacity-80"
                    >
                      Next page →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * One filter chip.
 *
 * Most chips carry content — an author's name, a tag, a series title — so the
 * default is Bengali, tagged `lang="bn"` whatever the interface language is.
 * Years are the exception: a year is chrome, not writing, so it follows the
 * interface locale and passes `numeric` to drop the Bengali defaults. The
 * label arrives as a node so that one case can hand in a `<Num>`.
 */
function Chip({
  href,
  active,
  label,
  count,
  numeric,
}: {
  href: string;
  active: boolean;
  label: React.ReactNode;
  count?: number;
  numeric?: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1 text-[0.8125rem] transition",
        !numeric && "font-bengali",
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-rule text-content-soft hover:border-content-faint hover:text-content",
      )}
      lang={numeric ? undefined : "bn"}
    >
      {label}
      {typeof count === "number" && (
        <Num value={count} className="text-[0.625rem] opacity-60" />
      )}
    </Link>
  );
}
