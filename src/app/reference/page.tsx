import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReferenceType, ReferenceRightsStatus, Prisma } from "@prisma/client";
import { deriveCapabilities } from "@/lib/reference/rights-engine";
import { ReferenceCard } from "@/components/reference/reference-card";
import { PageHeader } from "@/components/layout/page-header";
import { Search, RotateCcw, BookOpen, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reference Library | Thoughts.Whatever",
  description:
    "A rights-aware digital archive of texts, historical documents, recordings, and sources behind Thoughts.Whatever.",
};

interface ReferencePageProps {
  searchParams: {
    q?: string;
    type?: string;
    rights?: string;
    page?: string;
  };
}

export default async function ReferenceLibraryPage({
  searchParams,
}: ReferencePageProps) {
  const query = searchParams.q?.trim() || "";
  const typeFilter = searchParams.type as ReferenceType | undefined;
  const rightsFilter = searchParams.rights as ReferenceRightsStatus | undefined;
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: Prisma.ReferenceWorkWhereInput = {
    published: true,
  };

  if (typeFilter && Object.values(ReferenceType).includes(typeFilter)) {
    where.type = typeFilter;
  }

  if (rightsFilter && Object.values(ReferenceRightsStatus).includes(rightsFilter)) {
    where.editions = {
      some: {
        rights: { status: rightsFilter },
      },
    };
  }

  if (query) {
    where.OR = [
      { titleBn: { contains: query, mode: "insensitive" } },
      { titleEn: { contains: query, mode: "insensitive" } },
      { subtitleBn: { contains: query, mode: "insensitive" } },
      { descriptionBn: { contains: query, mode: "insensitive" } },
      { subject: { contains: query, mode: "insensitive" } },
      {
        editions: {
          some: {
            OR: [
              { editor: { contains: query, mode: "insensitive" } },
              { publisher: { contains: query, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  const [total, works, stats] = await Promise.all([
    prisma.referenceWork.count({ where }),
    prisma.referenceWork.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: { id: true, slug: true, nameBn: true, nameEn: true },
        },
        editions: {
          take: 1,
          orderBy: { publicationYear: "asc" },
          include: {
            rights: true,
            sources: { take: 1 },
            assets: true,
          },
        },
      },
    }),
    Promise.all([
      prisma.referenceWork.count({ where: { published: true } }),
      prisma.referenceWork.count({
        where: { published: true, type: { in: ["BOOK", "ARTICLE"] } },
      }),
      prisma.referenceWork.count({
        where: {
          published: true,
          type: { in: ["DOCUMENT", "MANUSCRIPT", "ARCHIVE"] },
        },
      }),
      prisma.referenceSource.count(),
      prisma.referenceWork.count({
        where: { published: true, type: "AUDIO" },
      }),
    ]),
  ]);

  const totalPages = Math.ceil(total / limit);
  const activeFilters = Boolean(typeFilter || rightsFilter || query);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* Editorial Section Masthead */}
      <PageHeader
        labelEn="Reference Library"
        titleBn="রেফারেন্স লাইব্রেরি"
        descEn="Texts, historical documents, manuscripts, and archival sources behind Thoughts.Whatever."
        descBn="সাহিত্যের মূল উৎস, ঐতিহাসিক নথি, প্রাচীন পাণ্ডুলিপি ও গবেষণা সংগ্রহ।"
        count={
          <span className="label !text-content-faint">
            {total} {total === 1 ? "entry" : "entries"}
          </span>
        }
      />

      {/* Stats Bar & Archive Policy Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule py-4 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-content-faint tracking-label uppercase">
          <span>{stats[0]} Works Cataloged</span>
          {stats[1] > 0 && (
            <>
              <span>·</span>
              <span>{stats[1]} Texts & Books</span>
            </>
          )}
          {stats[2] > 0 && (
            <>
              <span>·</span>
              <span>{stats[2]} Historical Documents</span>
            </>
          )}
          {stats[4] > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-400 font-semibold">{stats[4]} Audio Recordings</span>
            </>
          )}
          {stats[3] > 0 && (
            <>
              <span>·</span>
              <span>{stats[3]} Archival Sources</span>
            </>
          )}
        </div>

        <Link
          href="/reference/rights"
          className="inline-flex items-center gap-1 font-serif text-xs text-accent hover:opacity-75 transition-opacity"
        >
          <span>Rights & Provenance Policy</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Filter and Search Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8">
        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {[
            { id: "", label: "All" },
            { id: "BOOK", label: "Books" },
            { id: "DOCUMENT", label: "Documents" },
            { id: "MANUSCRIPT", label: "Manuscripts" },
            { id: "AUDIO", label: "Audio" },
          ].map((cat) => {
            const isActive = (!typeFilter && cat.id === "") || typeFilter === cat.id;
            const queryParams = new URLSearchParams();
            if (cat.id) queryParams.set("type", cat.id);
            if (rightsFilter) queryParams.set("rights", rightsFilter);
            if (query) queryParams.set("q", query);

            return (
              <Link
                key={cat.id}
                href={`/reference${queryParams.toString() ? `?${queryParams.toString()}` : ""}`}
                className={`label rounded-full border px-3 py-1 transition-colors whitespace-nowrap ${
                  isActive
                    ? "!border-content !text-content font-medium"
                    : "border-rule text-content-faint hover:border-content-faint/80 hover:text-content-soft"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}

          <span className="text-rule mx-1">|</span>

          {/* Quick Rights Filter */}
          <Link
            href={`/reference?rights=PUBLIC_DOMAIN${typeFilter ? `&type=${typeFilter}` : ""}${query ? `&q=${query}` : ""}`}
            className={`label rounded-full border px-3 py-1 transition-colors whitespace-nowrap ${
              rightsFilter === "PUBLIC_DOMAIN"
                ? "!border-emerald-500/70 !text-emerald-400 font-medium"
                : "border-rule text-content-faint hover:border-content-faint/80 hover:text-content-soft"
            }`}
          >
            Public Domain Only
          </Link>
        </div>

        {/* Search Input */}
        <form method="GET" action="/reference" className="flex items-center gap-2">
          {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
          {rightsFilter && <input type="hidden" name="rights" value={rightsFilter} />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-faint" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search the archive..."
              className="bg-surface-raised border border-rule rounded px-3 py-1.5 pl-8 text-xs text-content placeholder-content-faint focus:border-accent focus:outline-none w-56 sm:w-64"
            />
          </div>
          {activeFilters && (
            <Link
              href="/reference"
              className="p-1.5 border border-rule rounded text-content-faint hover:text-content hover:border-content transition-colors"
              title="Clear filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Link>
          )}
        </form>
      </div>

      {/* Catalog Grid */}
      {works.length === 0 ? (
        <div className="border border-dashed border-rule py-20 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-content-faint" />
          <h2 className="mt-3 font-bengali text-lg text-content-soft">
            কোনো উপাদান খুঁজে পাওয়া যায়নি
          </h2>
          <p className="mt-1 font-serif text-xs italic text-content-faint">
            No reference resources match your filter criteria.
          </p>
          <div className="mt-4">
            <Link
              href="/reference"
              className="label !text-accent hover:opacity-75 transition-opacity"
            >
              Clear filters and view all →
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {works.map((w) => {
            const primaryEdition = w.editions[0] || null;
            const rightsStatus = primaryEdition?.rights?.status || "RIGHTS_UNVERIFIED";
            const hostingMode = primaryEdition?.hostingMode || "EXTERNAL";
            const sourceUrl = primaryEdition?.sources[0]?.sourceUrl || null;

            const capabilities = deriveCapabilities({
              rightsStatus,
              hostingMode,
              assets: primaryEdition?.assets || [],
              sourceUrl,
            });

            return (
              <ReferenceCard
                key={w.id}
                work={{
                  id: w.id,
                  slug: w.slug,
                  titleBn: w.titleBn,
                  titleEn: w.titleEn,
                  subtitleBn: w.subtitleBn,
                  type: w.type,
                  language: w.language,
                  era: w.era,
                  author: w.author,
                  primaryEdition: primaryEdition
                    ? {
                        id: primaryEdition.id,
                        editor: primaryEdition.editor,
                        publisher: primaryEdition.publisher,
                        publicationYear: primaryEdition.publicationYear,
                        coverImage: primaryEdition.coverImage,
                        rightsStatus,
                        source: primaryEdition.sources[0] || null,
                      }
                    : null,
                  capabilities,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between border-t border-rule pt-6 text-xs">
          <span className="label !text-content-faint">
            Page {page} of {totalPages}
          </span>

          <div className="flex items-center gap-3">
            {page > 1 && (
              <Link
                href={`/reference?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}${rightsFilter ? `&rights=${rightsFilter}` : ""}`}
                className="label !text-content-soft hover:!text-accent transition-colors"
              >
                ← Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/reference?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}${rightsFilter ? `&rights=${rightsFilter}` : ""}`}
                className="label !text-content-soft hover:!text-accent transition-colors"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
