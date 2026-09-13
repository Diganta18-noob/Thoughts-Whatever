import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ReferenceType, ReferenceRightsStatus, Prisma } from "@prisma/client";
import { deriveCapabilities } from "@/lib/reference/rights-engine";
import { ReferenceCard } from "@/components/reference/reference-card";
import {
  BookOpen,
  Search,
  SlidersHorizontal,
  ShieldCheck,
  Headphones,
  FileText,
  Building2,
  Archive,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface ReferencePageProps {
  searchParams: {
    q?: string;
    type?: string;
    language?: string;
    rights?: string;
    format?: string;
    page?: string;
  };
}

export default async function ReferenceLibraryPage({ searchParams }: ReferencePageProps) {
  const query = searchParams.q?.trim() || "";
  const typeFilter = searchParams.type as ReferenceType | undefined;
  const rightsFilter = searchParams.rights as ReferenceRightsStatus | undefined;
  const formatFilter = searchParams.format?.toLowerCase();
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

  if (formatFilter) {
    if (formatFilter === "audio") {
      where.editions = {
        some: { assets: { some: { kind: "AUDIO" } } },
      };
    } else if (formatFilter === "pdf") {
      where.editions = {
        some: { assets: { some: { kind: "PDF" } } },
      };
    }
  }

  const [total, works, statsGroup, featuredWorks] = await Promise.all([
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
        where: { published: true, type: { in: ["DOCUMENT", "MANUSCRIPT", "ARCHIVE"] } },
      }),
      prisma.referenceAsset.count({ where: { kind: "AUDIO" } }),
      prisma.referenceSource.count(),
    ]),
    prisma.referenceWork.findMany({
      where: { published: true, featured: true },
      take: 3,
      include: {
        author: true,
        editions: {
          take: 1,
          include: { rights: true, sources: true, assets: true },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Editorial Archive Hero */}
      <section className="relative border-b border-zinc-850 pt-16 pb-12 sm:pt-24 sm:pb-20 overflow-hidden bg-gradient-to-b from-zinc-900/40 via-zinc-950 to-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.08),rgba(255,255,255,0))] pointer-events-none" />

        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full mb-4">
              <Archive className="w-3.5 h-3.5" />
              <span>Digital Reference Archive & Research Library</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-100 leading-[1.15]">
              রেফারেন্স লাইব্রেরি
            </h1>
            <p className="font-serif text-lg sm:text-2xl text-zinc-400 font-light mt-2 tracking-wide">
              সাহিত্যের মূল উৎস, ঐতিহাসিক নথি ও গবেষণা সংগ্রহ
            </p>

            <p className="mt-4 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl font-sans">
              Thoughts.Whatever-এর গল্প ও বিশ্লেষণের নেপথ্যে থাকা গ্রন্থ, প্রাচীন নথি, পাণ্ডুলিপি ও ঐতিহাসিক সূত্রের একটি উন্মুক্ত ডিজিটাল সংগ্রহশালা। স্বত্ব ও কপিরাইট নীতির প্রতি সর্বোচ্চ মর্যাদা রেখে পরিচালিত।
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono">
              <a
                href="#catalog"
                className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <span>সংগ্রহশালা অনুসন্ধান</span>
                <span>↓</span>
              </a>

              <Link
                href="/reference/rights"
                className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 rounded-lg transition-colors flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>স্বত্ব ও সংরক্ষণ নীতি</span>
              </Link>
            </div>
          </div>

          {/* Dynamic Live Archive Statistics Counters */}
          <div className="mt-12 pt-8 border-t border-zinc-850/80 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 font-mono">
            <div className="border-l border-zinc-800 pl-4">
              <div className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                {statsGroup[0]}
              </div>
              <div className="text-[0.7rem] uppercase tracking-wider text-zinc-500 mt-0.5">
                Total Works
              </div>
            </div>

            <div className="border-l border-zinc-800 pl-4">
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight">
                {statsGroup[1]}
              </div>
              <div className="text-[0.7rem] uppercase tracking-wider text-zinc-500 mt-0.5">
                Texts & Books
              </div>
            </div>

            <div className="border-l border-zinc-800 pl-4">
              <div className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                {statsGroup[2]}
              </div>
              <div className="text-[0.7rem] uppercase tracking-wider text-zinc-500 mt-0.5">
                Documents & Records
              </div>
            </div>

            <div className="border-l border-zinc-800 pl-4">
              <div className="text-2xl sm:text-3xl font-bold text-sky-400 tracking-tight">
                {statsGroup[4]}
              </div>
              <div className="text-[0.7rem] uppercase tracking-wider text-zinc-500 mt-0.5">
                External Archives
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <nav className="border-b border-zinc-850 bg-zinc-950/80 sticky top-16 z-20 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-3 text-xs font-mono no-scrollbar">
          <Link
            href="/reference"
            className={`px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
              !typeFilter
                ? "bg-zinc-800 border-zinc-700 text-emerald-400 font-semibold"
                : "border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-750"
            }`}
          >
            সব সংগ্রহ (All)
          </Link>
          <Link
            href="/reference?type=BOOK"
            className={`px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
              typeFilter === "BOOK"
                ? "bg-zinc-800 border-zinc-700 text-emerald-400 font-semibold"
                : "border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-750"
            }`}
          >
            বই ও সাহিত্য (Books)
          </Link>
          <Link
            href="/reference?type=DOCUMENT"
            className={`px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
              typeFilter === "DOCUMENT"
                ? "bg-zinc-800 border-zinc-700 text-emerald-400 font-semibold"
                : "border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-750"
            }`}
          >
            ঐতিহাসিক নথি (Documents)
          </Link>
          <Link
            href="/reference?type=MANUSCRIPT"
            className={`px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
              typeFilter === "MANUSCRIPT"
                ? "bg-zinc-800 border-zinc-700 text-emerald-400 font-semibold"
                : "border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-750"
            }`}
          >
            পাণ্ডুলিপি (Manuscripts)
          </Link>
          <Link
            href="/reference?type=AUDIO"
            className={`px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
              typeFilter === "AUDIO"
                ? "bg-zinc-800 border-zinc-700 text-emerald-400 font-semibold"
                : "border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-750"
            }`}
          >
            শ্রব্য কথিকা (Audio)
          </Link>
          <Link
            href="/reference?rights=PUBLIC_DOMAIN"
            className={`px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
              rightsFilter === "PUBLIC_DOMAIN"
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-400 font-semibold"
                : "border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-750"
            }`}
          >
            পাবলিক ডোমেইন (Public Domain)
          </Link>
        </div>
      </nav>

      {/* Main Catalog Section */}
      <main id="catalog" className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Search and Filters Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-zinc-100">
              সংগ্রহ তালিকা
            </h2>
            <p className="text-xs text-zinc-400 mt-1 font-mono">
              মোট {total} টি উপাদান তালিকাভুক্ত রয়েছে
            </p>
          </div>

          {/* Search Input Form */}
          <form method="GET" action="/reference" className="flex items-center gap-2">
            {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
            {rightsFilter && <input type="hidden" name="rights" value={rightsFilter} />}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="শিরোনাম, সম্পাদক বা বিষয় দিয়ে খুঁজুন..."
                className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-64 sm:w-80"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-300"
            >
              অনুসন্ধান
            </button>
          </form>
        </div>

        {/* Resources Grid */}
        {works.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-zinc-800 rounded-2xl p-8 space-y-3">
            <BookOpen className="w-10 h-10 text-zinc-700 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-zinc-300">
              কোনো উপাদান খুঁজে পাওয়া যায়নি
            </h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              আপনার অনুসন্ধান শর্ত পরিবর্তন করে পুনরায় চেষ্টা করুন অথবা সমস্ত উপাদান দেখুন।
            </p>
            <div className="pt-2">
              <Link
                href="/reference"
                className="px-4 py-2 text-xs font-mono text-emerald-400 border border-emerald-800/60 rounded-lg hover:bg-emerald-950/40"
              >
                সব সংগ্রহ দেখুন
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="pt-8 border-t border-zinc-850 flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-500">
              পৃষ্ঠা {page} / {totalPages}
            </span>

            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/reference?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}${rightsFilter ? `&rights=${rightsFilter}` : ""}`}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 hover:text-zinc-100"
                >
                  ← পূর্ববর্তী
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/reference?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}${rightsFilter ? `&rights=${rightsFilter}` : ""}`}
                  className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-300 hover:text-zinc-100"
                >
                  পরবর্তী →
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
