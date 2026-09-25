import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deriveCapabilities, getRightsBadgeMeta } from "@/lib/reference/rights-engine";
import { ReferenceRightsBadge } from "@/components/reference/reference-rights-badge";
import { ReferenceDetailClient } from "./reference-detail-client";
import { BookOpen, ExternalLink, Download, ArrowLeft, ShieldAlert, Sparkles, FileText } from "lucide-react";
import type { Metadata } from "next";

interface ReferenceDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: ReferenceDetailPageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const work = await prisma.referenceWork.findUnique({
    where: { slug },
    select: { titleBn: true, titleEn: true, descriptionBn: true, editions: { take: 1, select: { coverImage: true } } },
  });

  if (!work) return { title: "Resource Not Found | Thoughts.Whatever" };

  const ogImg = work.editions[0]?.coverImage || "/brand/og-default.png";

  return {
    title: `${work.titleBn} (${work.titleEn || "Archival Reference"}) | Reference Library | Thoughts.Whatever`,
    description:
      work.descriptionBn?.slice(0, 160) ||
      `Read the archival edition of ${work.titleBn} through the Thoughts.Whatever Reference Library.`,
    openGraph: {
      title: `${work.titleBn} | Thoughts.Whatever Reference Library`,
      description: work.descriptionBn?.slice(0, 160) || undefined,
      images: [{ url: ogImg }],
    },
  };
}

export default async function ReferenceDetailPage({
  params,
}: ReferenceDetailPageProps) {
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
  const manifest = primaryEdition?.readerManifest as any;

  const capabilities = deriveCapabilities({
    rightsStatus,
    hostingMode,
    assets: primaryEdition?.assets || [],
    sourceUrl: source?.sourceUrl || null,
    readerManifest: manifest,
  });

  const rightsMeta = getRightsBadgeMeta(rightsStatus);

  // Check if there is an alternative verified public-domain edition of this work (e.g. 1874 scan)
  let companionEdition: { slug: string; titleBn: string; titleEn?: string | null; year?: number | null } | null = null;
  if (slug === "kalika-puran-ed-1") {
    const pdWork = await prisma.referenceWork.findUnique({
      where: { slug: "kalika-puran-1874" },
      select: { slug: true, titleBn: true, titleEn: true, editions: { take: 1, select: { publicationYear: true } } },
    });
    if (pdWork) {
      companionEdition = {
        slug: pdWork.slug,
        titleBn: pdWork.titleBn,
        titleEn: pdWork.titleEn,
        year: pdWork.editions[0]?.publicationYear || 1874,
      };
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      {/* Top Header / Back Navigation */}
      <div className="mb-6 border-b border-rule pb-4 flex items-center justify-between">
        <Link
          href="/reference"
          className="inline-flex items-center gap-1.5 label !text-content-faint hover:!text-accent transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Reference Library</span>
        </Link>

        <span className="text-[0.625rem] font-mono uppercase tracking-widest text-content-faint">
          Reference Library · Thoughts.Whatever
        </span>
      </div>

      {/* Main Archival Dossier (Mobile: Cover -> Title -> Metadata -> Description -> Action) */}
      <div className="border border-rule bg-surface p-6 sm:p-10 space-y-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Dedicated Archival Book Cover Frame */}
          <div className="relative aspect-[3/4] w-full max-w-[260px] mx-auto md:mx-0 border border-rule bg-surface-raised shrink-0 overflow-hidden shadow-lg rounded-sm">
            {primaryEdition?.coverImage ? (
              <Image
                src={primaryEdition.coverImage}
                alt={work.titleBn}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 260px"
                className="object-cover object-top"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                <BookOpen className="h-10 w-10 text-content-faint" />
                <span className="mt-3 font-bengali text-lg text-content-soft">
                  {work.titleBn}
                </span>
              </div>
            )}

            <div className="absolute top-2.5 right-2.5">
              <ReferenceRightsBadge status={rightsStatus} size="sm" />
            </div>
          </div>

          {/* Details & Dossier */}
          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="label !bg-surface-raised border border-rule px-2 py-0.5 rounded">
                {work.type}
              </span>
              <span className="text-rule">·</span>
              <span className="label !text-content-faint">{work.language}</span>
              {primaryEdition?.publicationYear && (
                <>
                  <span className="text-rule">·</span>
                  <span className="label">{primaryEdition.publicationYear}</span>
                </>
              )}
              {work.era && !primaryEdition?.publicationYear && (
                <>
                  <span className="text-rule">·</span>
                  <span className="label !text-content-soft">{work.era}</span>
                </>
              )}
            </div>

            <div>
              <h1 className="font-bengali text-3xl sm:text-4xl font-medium text-content leading-tight">
                {work.titleBn}
              </h1>
              {work.titleEn && (
                <p className="mt-1 font-serif text-sm sm:text-base italic text-content-faint">
                  {work.titleEn}
                </p>
              )}
              {work.subtitleBn && (
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="label !text-[0.625rem] shrink-0 text-content-faint">
                    Edition / Subtitle
                  </span>
                  <p className="font-bengali text-base text-content-soft">
                    {work.subtitleBn}
                  </p>
                </div>
              )}
            </div>

            {/* Bibliographic Dossier */}
            <div className="space-y-1.5 border-t border-rule/60 pt-4 text-xs sm:text-sm text-content-soft">
              {work.author && (
                <div className="flex items-baseline gap-2">
                  <span className="label !text-[0.6875rem] w-24 shrink-0">Author</span>
                  <span className="flex items-baseline gap-2 flex-wrap">
                    <Link
                      href={`/authors/${work.author.slug}`}
                      className="font-bengali text-content hover:text-accent font-medium transition-colors"
                    >
                      {work.author.nameBn}
                    </Link>
                  </span>
                </div>
              )}

              {primaryEdition?.editor && (
                <div className="flex items-baseline gap-2">
                  <span className="label !text-[0.6875rem] w-24 shrink-0">Editor</span>
                  <span className="font-bengali text-content">{primaryEdition.editor}</span>
                </div>
              )}

              {primaryEdition?.translator && (
                <div className="flex items-baseline gap-2">
                  <span className="label !text-[0.6875rem] w-24 shrink-0">Translator</span>
                  <span className="font-bengali text-content">{primaryEdition.translator}</span>
                </div>
              )}

              {primaryEdition?.publisher && (
                <div className="flex items-baseline gap-2">
                  <span className="label !text-[0.6875rem] w-24 shrink-0">Publisher</span>
                  <span className="font-bengali text-content">
                    {primaryEdition.publisher}
                    {primaryEdition.publicationPlace && (
                      <span className="font-mono text-[0.625rem] text-content-faint ml-1.5 not-bengali">
                        ({primaryEdition.publicationPlace})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {primaryEdition?.pages && (
                <div className="flex items-baseline gap-2">
                  <span className="label !text-[0.6875rem] w-24 shrink-0">Pages</span>
                  <span className="font-mono text-xs text-content">{primaryEdition.pages}</span>
                </div>
              )}

              {source && (
                <div className="flex items-baseline gap-2">
                  <span className="label !text-[0.6875rem] w-24 shrink-0">Archival Source</span>
                  <span className="font-serif text-content-soft text-xs">{source.sourceName}</span>
                </div>
              )}
            </div>

            {/* Rights Warning & Companion Link if Rights Unverified */}
            {!capabilities.isRightsVerified && (
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-4 space-y-2 mt-4">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span className="font-semibold uppercase tracking-wider">Rights Under Review (Unverified Rights)</span>
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  Commercial and redistribution rights for this specific digital edition have not yet been independently verified. In accordance with Thoughts.Whatever policy, direct file hosting and downloads are suspended pending verification.
                </p>
                {companionEdition && (
                  <div className="pt-2 border-t border-amber-800/30 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-emerald-400 font-sans">
                      The complete work can be read in the verified 1874 Public Domain edition:
                    </span>
                    <Link
                      href={`/reference/${companionEdition.slug}/read`}
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 hover:text-emerald-100 underline"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Go to 1874 Public Domain Reading Room →</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Dynamic Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-rule">
              {capabilities.canReadOnline ? (
                <Link
                  href={`/reference/${work.slug}/read`}
                  className="label inline-flex items-center gap-2 bg-content text-surface px-5 py-2.5 hover:bg-content-soft transition-colors text-xs font-bold"
                >
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  <span>READ BOOK · গ্রন্থ পাঠ করুন →</span>
                </Link>
              ) : (
                <Link
                  href={`/reference/${work.slug}/read`}
                  className="label inline-flex items-center gap-2 border border-rule bg-surface-raised px-4 py-2 text-content hover:border-content transition-colors text-xs"
                >
                  <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                  <span>Open Archival Reader Shell</span>
                </Link>
              )}

              {capabilities.canDownload && capabilities.downloadUrl && (
                <a
                  href={capabilities.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="label inline-flex items-center gap-2 border border-rule bg-surface-raised px-4 py-2 text-content hover:border-content transition-colors text-xs"
                >
                  <Download className="h-3.5 w-3.5 text-accent" />
                  <span>Download PDF</span>
                </a>
              )}

              {source?.sourceUrl && (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label inline-flex items-center gap-1.5 border border-rule px-4 py-2 text-content-faint hover:text-content hover:border-content transition-colors text-xs"
                >
                  <span>View Repository Source ({source.sourceName})</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bengali Literary Description & Archival Notes */}
        {work.descriptionBn && (
          <div className="border-t border-rule pt-6 space-y-3">
            <div className="space-y-0.5">
              <span className="label">Archival Notes & Overview</span>
              <p className="font-serif text-[0.6875rem] italic text-content-faint">
                Historical description and cataloguing notes — in Bengali
              </p>
            </div>
            <div className="font-bengali text-bengali-base text-content-soft leading-relaxed whitespace-pre-line">
              {work.descriptionBn}
            </div>
          </div>
        )}

        {/* Rights Dossier & Takedown Form */}
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

        {/* Section 24 & 25: Mandatory ORIGINAL SOURCE & REFERENCE Section at the VERY BOTTOM */}
        {source && (
          <div className="border-t border-rule pt-8 space-y-4">
            <div className="border border-rule/80 bg-surface-raised p-6 rounded-lg space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-rule pb-3">
                <span className="label !text-amber-500 font-semibold tracking-wider">
                  ORIGINAL SOURCE & REFERENCE
                </span>
                <span className="text-[0.6875rem] font-mono text-content-faint">
                  Archival Provenance Record
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-content-soft font-serif leading-relaxed">
                  This digital reference is based on the archival source listed below.
                </p>
                <div className="text-xs font-mono text-content space-y-1">
                  <div>
                    <span className="text-content-faint">Repository: </span>
                    <strong className="text-content">{source.sourceName}</strong>
                  </div>
                  <div>
                    <span className="text-content-faint">Original Item: </span>
                    <span className="text-content-soft">
                      {primaryEdition?.editionTitleBn || work.titleBn} ({source.externalId || "archive-record"})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label inline-flex items-center justify-center gap-2 bg-surface border border-rule hover:border-content px-4 py-2 text-content text-xs transition-colors"
                >
                  <span>VIEW ORIGINAL SOURCE</span>
                  <ExternalLink className="h-3.5 w-3.5 text-accent" />
                </a>

                <div className="text-[0.625rem] text-content-faint font-mono leading-tight">
                  <div>Source Preservation: {source.sourceName}</div>
                  <div>Digital Reading Experience: Thoughts.Whatever</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
