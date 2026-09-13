import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deriveCapabilities, getRightsBadgeMeta } from "@/lib/reference/rights-engine";
import { ReferenceRightsBadge } from "@/components/reference/reference-rights-badge";
import { ReferenceDetailClient } from "./reference-detail-client";
import {
  BookOpen,
  ExternalLink,
  Download,
  Headphones,
  Calendar,
  User,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  FileText,
  Building,
  Info,
} from "lucide-react";
import type { Metadata } from "next";

interface ReferenceDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ReferenceDetailPageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const work = await prisma.referenceWork.findUnique({
    where: { slug },
    select: { titleBn: true, titleEn: true, descriptionBn: true },
  });

  if (!work) return { title: "উপাদান খুঁজে পাওয়া যায়নি | Thoughts.Whatever" };

  return {
    title: `${work.titleBn} (${work.titleEn || "Reference"}) | রেফারেন্স লাইব্রেরি | Thoughts.Whatever`,
    description: work.descriptionBn || "Thoughts.Whatever ডিজিটাল রেফারেন্স ও গবেষণা সংগ্রহাগার।",
  };
}

export default async function ReferenceDetailPage({ params }: ReferenceDetailPageProps) {
  const slug = decodeURIComponent(params.slug);

  const work = await prisma.referenceWork.findUnique({
    where: { slug },
    include: {
      author: true,
      editions: {
        orderBy: { publicationYear: "asc" },
        include: {
          rights: true,
          sources: true,
          assets: true,
        },
      },
    },
  });

  if (!work || !work.published) {
    notFound();
  }

  const primaryEdition = work.editions[0] || null;
  const rightsStatus = primaryEdition?.rights?.status || "RIGHTS_UNVERIFIED";
  const hostingMode = primaryEdition?.hostingMode || "EXTERNAL";
  const source = primaryEdition?.sources[0] || null;

  const capabilities = deriveCapabilities({
    rightsStatus,
    hostingMode,
    assets: primaryEdition?.assets || [],
    sourceUrl: source?.sourceUrl || null,
  });

  const rightsMeta = getRightsBadgeMeta(rightsStatus);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Breadcrumb / Back Link */}
        <div className="mb-8">
          <Link
            href="/reference"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>রেফারেন্স লাইব্রেরিতে ফিরুন</span>
          </Link>
        </div>

        {/* Main Dossier Card */}
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 sm:p-10 space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Archival Cover Artwork */}
            <div className="relative aspect-[3/4] w-full md:w-72 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shrink-0 shadow-2xl">
              {primaryEdition?.coverImage ? (
                <Image
                  src={primaryEdition.coverImage}
                  alt={work.titleBn}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-850 to-zinc-950">
                  <BookOpen className="w-12 h-12 text-zinc-700 mb-3" />
                  <span className="font-serif text-xl font-bold text-zinc-300">
                    {work.titleBn}
                  </span>
                </div>
              )}

              <div className="absolute top-3 right-3">
                <ReferenceRightsBadge status={rightsStatus} size="sm" />
              </div>
            </div>

            {/* Header & Meta */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-zinc-400">
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-emerald-400 uppercase font-semibold">
                  {work.type}
                </span>
                <span>•</span>
                <span>{work.language}</span>
                {work.era && (
                  <>
                    <span>•</span>
                    <span>{work.era}</span>
                  </>
                )}
                {primaryEdition?.publicationYear && (
                  <>
                    <span>•</span>
                    <span className="text-zinc-300">{primaryEdition.publicationYear}</span>
                  </>
                )}
              </div>

              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight leading-snug">
                  {work.titleBn}
                </h1>
                {work.titleEn && (
                  <p className="text-sm sm:text-base text-zinc-400 font-sans italic mt-1">
                    {work.titleEn}
                  </p>
                )}
                {work.subtitleBn && (
                  <p className="text-sm text-zinc-300 font-serif mt-2">
                    {work.subtitleBn}
                  </p>
                )}
              </div>

              {/* Author & Editorial Dossier */}
              <div className="pt-2 border-t border-zinc-800/80 text-xs sm:text-sm text-zinc-300 space-y-2">
                {work.author && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs uppercase">লেখক:</span>
                    <Link
                      href={`/authors/${work.author.slug}`}
                      className="font-serif text-emerald-400 hover:underline font-semibold"
                    >
                      {work.author.nameBn} {work.author.era && `(${work.author.era})`}
                    </Link>
                  </div>
                )}

                {primaryEdition?.editor && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs uppercase">সম্পাদনা:</span>
                    <span>{primaryEdition.editor}</span>
                  </div>
                )}

                {primaryEdition?.translator && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs uppercase">অনুবাদ:</span>
                    <span>{primaryEdition.translator}</span>
                  </div>
                )}

                {primaryEdition?.publisher && (
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 font-mono text-xs uppercase">প্রকাশনা:</span>
                    <span>{primaryEdition.publisher}</span>
                    {primaryEdition.publicationPlace && (
                      <span className="text-zinc-500">({primaryEdition.publicationPlace})</span>
                    )}
                  </div>
                )}

                {primaryEdition?.pages && (
                  <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                    <span className="text-zinc-500 uppercase">পৃষ্ঠা:</span>
                    <span>{primaryEdition.pages}</span>
                  </div>
                )}
              </div>

              {/* Dynamic Action Bar */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                {capabilities.canReadOnline && (
                  <Link
                    href={`/reference/${work.slug}/read`}
                    className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold rounded-lg font-mono text-xs flex items-center gap-2 transition-colors shadow-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>পাঠকক্ষে পড়ুন</span>
                  </Link>
                )}

                {capabilities.canDownload && capabilities.downloadUrl && (
                  <a
                    href={capabilities.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg font-mono text-xs flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>PDF ডাউনলোড</span>
                  </a>
                )}

                {source?.sourceUrl && (
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-750 rounded-lg font-mono text-xs flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                    <span>মূল ডিজিটাল উৎস ({source.sourceName}) ↗</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          {work.descriptionBn && (
            <div className="pt-6 border-t border-zinc-800/80">
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-3">
                উপাদান পরিচিতি ও সারসংক্ষেপ
              </h2>
              <div className="text-sm text-zinc-300 leading-relaxed font-serif whitespace-pre-line">
                {work.descriptionBn}
              </div>
            </div>
          )}

          {/* Source Attribution Box */}
          {source && (
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-zinc-500" />
                  <span>মূল ডিজিটাল উৎস (Original Digital Source)</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                  এই উপাদানটি Thoughts.Whatever সংগ্রহাগারে নথিভুক্ত। মূল ডিজিটাইজড প্রতিলিপিটি <strong>{source.sourceName}</strong> কর্তৃক সংরক্ষিত।
                  {source.sourceDescription && ` ${source.sourceDescription}`}
                </p>
              </div>

              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-750 rounded-lg font-mono text-xs inline-flex items-center gap-1.5 shrink-0"
              >
                <span>উৎস পরিদর্শন</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            </div>
          )}

          {/* Rights & Attribution Section & Client Takedown Modal */}
          <ReferenceDetailClient
            rightsStatus={rightsStatus}
            rightsMeta={rightsMeta}
            license={primaryEdition?.rights?.license}
            rightsHolder={primaryEdition?.rights?.rightsHolder}
            evidenceUrl={primaryEdition?.rights?.evidenceUrl}
            verifiedAt={primaryEdition?.rights?.verifiedAt}
            workTitle={work.titleBn}
            workSlug={work.slug}
          />
        </div>
      </div>
    </div>
  );
}
