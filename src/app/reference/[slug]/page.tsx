import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deriveCapabilities, getRightsBadgeMeta } from "@/lib/reference/rights-engine";
import { ReferenceRightsBadge } from "@/components/reference/reference-rights-badge";
import { ReferenceDetailClient } from "./reference-detail-client";
import { BookOpen, ExternalLink, Download, ArrowLeft } from "lucide-react";
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
    select: { titleBn: true, titleEn: true, descriptionBn: true },
  });

  if (!work) return { title: "Resource Not Found | Thoughts.Whatever" };

  return {
    title: `${work.titleBn} (${work.titleEn || "Reference"}) | Reference Library | Thoughts.Whatever`,
    description:
      work.descriptionBn || "Thoughts.Whatever Reference Library and Digital Archive.",
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

  const capabilities = deriveCapabilities({
    rightsStatus,
    hostingMode,
    assets: primaryEdition?.assets || [],
    sourceUrl: source?.sourceUrl || null,
  });

  const rightsMeta = getRightsBadgeMeta(rightsStatus);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6">
      {/* Back Link */}
      <div className="mb-8 border-b border-rule pb-4">
        <Link
          href="/reference"
          className="inline-flex items-center gap-1.5 label !text-content-faint hover:!text-accent transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Reference Library</span>
        </Link>
      </div>

      {/* Main Dossier */}
      <div className="border border-rule bg-surface p-6 sm:p-10 space-y-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Cover Frame */}
          <div className="relative aspect-[3/4] w-full md:w-64 border border-rule bg-surface-raised shrink-0 overflow-hidden">
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

          {/* Details */}
          <div className="flex-1 space-y-4">
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
              {/* era shown separately only when it differs from a plain year — e.g. "19th Century" */}
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
                    Volume / Subtitle
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
                  <span className="label !text-[0.6875rem] w-20 shrink-0">Author</span>
                  <span className="flex items-baseline gap-2 flex-wrap">
                    <Link
                      href={`/authors/${work.author.slug}`}
                      className="font-bengali text-content hover:text-accent font-medium transition-colors"
                    >
                      {work.author.nameBn}
                    </Link>
                    {work.author.era && (
                      <span className="font-mono text-[0.625rem] text-content-faint">
                        {work.author.era}
                      </span>
                    )}
                  </span>
                </div>
              )}

              {primaryEdition?.editor && (
                <div className="flex items-baseline gap-2">
                  <span className="label !text-[0.6875rem] w-20 shrink-0">Editor</span>
                  <span className="font-bengali text-content">{primaryEdition.editor}</span>
                </div>
              )}

              {primaryEdition?.translator && (
                <div className="flex items-baseline gap-2">
                  <span className="label !text-[0.6875rem] w-20 shrink-0">Translator</span>
                  <span className="font-bengali text-content">{primaryEdition.translator}</span>
                </div>
              )}

              {primaryEdition?.publisher && (
                <div className="flex items-baseline gap-2">
                  <span className="label !text-[0.6875rem] w-20 shrink-0">Publisher</span>
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
                  <span className="label !text-[0.6875rem] w-20 shrink-0">Pages</span>
                  <span className="font-mono text-xs">{primaryEdition.pages}</span>
                </div>
              )}
            </div>

            {/* Dynamic Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-rule">
              {capabilities.canReadOnline && (
                <Link
                  href={`/reference/${work.slug}/read`}
                  className="label inline-flex items-center gap-2 bg-content text-surface px-4 py-2 hover:bg-content-soft transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Read Online →</span>
                </Link>
              )}

              {capabilities.canDownload && capabilities.downloadUrl && (
                <a
                  href={capabilities.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="label inline-flex items-center gap-2 border border-rule bg-surface-raised px-4 py-2 text-content hover:border-content transition-colors"
                >
                  <Download className="h-3.5 w-3.5 text-accent" />
                  <span>Download PDF</span>
                </a>
              )}

              {source?.sourceUrl && (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="label inline-flex items-center gap-1.5 border border-rule px-4 py-2 text-content-faint hover:text-content hover:border-content transition-colors"
                >
                  <span>Original Source ({source.sourceName})</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bengali Literary Description */}
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

        {/* Source Box */}
        {source && (
          <div className="border border-rule/70 bg-surface-raised p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <span className="label block">Repository Attribution</span>
              <p className="font-serif text-content-faint leading-relaxed max-w-xl">
                This document is cataloged for research by Thoughts.Whatever. The original digital scan is preserved by{" "}
                <strong className="text-content-soft font-medium">{source.sourceName}</strong>.
              </p>
            </div>

            <a
              href={source.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="label shrink-0 inline-flex items-center gap-1 border border-rule px-3 py-1.5 text-content-soft hover:text-accent hover:border-accent transition-colors"
            >
              <span>View Repository Source</span>
              <ExternalLink className="h-3 w-3" />
            </a>
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
      </div>
    </div>
  );
}
