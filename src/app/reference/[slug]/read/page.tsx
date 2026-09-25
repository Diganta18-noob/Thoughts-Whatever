import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deriveCapabilities, getRightsBadgeMeta } from "@/lib/reference/rights-engine";
import { ArrowLeft, BookOpen, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";
import { NativeBookReader, type BookReaderPageItem } from "@/components/reference/reader/native-book-reader";
import { ReferenceRightsBadge } from "@/components/reference/reference-rights-badge";
import type { Metadata } from "next";

interface ReaderPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    page?: string;
    edition?: string;
  };
}

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const work = await prisma.referenceWork.findUnique({
    where: { slug },
    select: { titleBn: true, titleEn: true },
  });

  if (!work) return { title: "পাঠকক্ষ | Thoughts.Whatever" };

  return {
    title: `${work.titleBn} — ডিজিটাল পাঠকক্ষ | Thoughts.Whatever`,
    description: `Read the archival edition of ${work.titleBn} through the Thoughts.Whatever Reference Library.`,
  };
}

export default async function ReferenceReaderPage({ params, searchParams }: ReaderPageProps) {
  const slug = decodeURIComponent(params.slug);
  const initialPage = Math.max(1, parseInt(searchParams.page || "1", 10));

  const work = await prisma.referenceWork.findUnique({
    where: { slug },
    include: {
      author: true,
      editions: {
        include: {
          rights: true,
          sources: true,
          assets: true,
        },
      },
    },
  });

  if (!work || !work.published) notFound();

  // If this is an audio work, seamlessly redirect to the listening room
  if (work.type === "AUDIO") {
    redirect(`/reference/${work.slug}/listen`);
  }

  // Find targeted edition or prefer public-domain / licensed hosted edition if available
  let selectedEdition = work.editions[0] || null;
  if (searchParams.edition) {
    const matched = work.editions.find((e) => e.id === searchParams.edition);
    if (matched) selectedEdition = matched;
  } else {
    // If first edition is unverified but another edition in this work is verified & hosted, prefer the readable one
    const readableEdition = work.editions.find((e) => {
      const status = e.rights?.status;
      return (status === "PUBLIC_DOMAIN" || status === "LICENSED") && e.hostingMode === "THOUGHTS_WHATEVER";
    });
    if (readableEdition) {
      selectedEdition = readableEdition;
    }
  }

  let companionEdition: { slug: string; titleBn: string; label: string } | null = null;

  const rightsStatus = selectedEdition?.rights?.status || "RIGHTS_UNVERIFIED";
  const hostingMode = selectedEdition?.hostingMode || "EXTERNAL";
  const source = selectedEdition?.sources[0] || null;
  const manifest = selectedEdition?.readerManifest as any;

  const capabilities = deriveCapabilities({
    rightsStatus,
    hostingMode,
    assets: selectedEdition?.assets || [],
    sourceUrl: source?.sourceUrl || null,
    readerManifest: manifest,
  });

  const pdfAsset = selectedEdition?.assets.find((a) => a.kind === "PDF" && a.fileUrl);
  const transcriptAsset = selectedEdition?.assets.find(
    (a) => a.kind === "TRANSCRIPT" && a.transcriptText,
  );

  // Parse structured pages
  let pages: BookReaderPageItem[] = [];
  if (manifest && Array.isArray(manifest.pages) && manifest.pages.length > 0) {
    pages = manifest.pages;
  } else if (selectedEdition?.pages && selectedEdition.coverImage) {
    // Single / basic cover fallback
    pages = [
      {
        pageNumber: 1,
        imageUrl: selectedEdition.coverImage,
        thumbnailUrl: selectedEdition.coverImage,
      },
    ];
  }

  // Rights Gate Check:
  // If rights are unverified or restricted, and hosting is not allowed, display the rights protected screen
  if (!capabilities.canReadOnline && !capabilities.isRightsVerified) {
    const rightsMeta = getRightsBadgeMeta(rightsStatus);

    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-8">
        <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-zinc-800 pb-4">
          <Link
            href={`/reference/${work.slug}`}
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Edition Details</span>
          </Link>
          <ReferenceRightsBadge status={rightsStatus} size="sm" />
        </header>

        <main className="max-w-2xl mx-auto my-auto text-center p-8 sm:p-12 border border-zinc-800 rounded-2xl bg-zinc-900/60 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Hosted Reading Unavailable · Rights Under Review
            </span>
            <h1 className="text-2xl sm:text-3xl font-bengali font-bold text-zinc-100 mt-2">
              {work.titleBn}
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              {selectedEdition?.editionTitleBn || selectedEdition?.publisher || "Historical Edition"}
            </p>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-semibold uppercase tracking-wider">Thoughts.Whatever Archival & Rights Policy</span>
            </div>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              While cataloged from Internet Archive, this specific digital edition’s commercial publication rights have not yet been independently verified. To uphold archival integrity and copyright safety, Thoughts.Whatever does not host or redistribute files with unverified rights.
            </p>
            {selectedEdition?.rights?.verificationNotes && (
              <p className="text-[0.6875rem] text-zinc-400 font-mono italic border-t border-zinc-850 pt-2">
                Verification Notes: {selectedEdition.rights.verificationNotes}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {source && (
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <span>Read at Archival Source ({source.sourceName})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </main>

        {/* Original Source Reference Section at the very bottom */}
        {source && (
          <footer className="max-w-4xl mx-auto w-full border-t border-zinc-850 pt-6 mt-6 text-center space-y-2">
            <span className="text-[0.6875rem] font-mono uppercase tracking-wider text-zinc-500">
              Original Source & Reference
            </span>
            <p className="text-xs text-zinc-400 font-serif">
              Source: <strong className="text-zinc-200">{source.sourceName}</strong> · Link:{" "}
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline"
              >
                {source.sourceUrl}
              </a>
            </p>
          </footer>
        )}
      </div>
    );
  }

  // Native In-Site Reading Experience
  return (
    <NativeBookReader
      work={{
        id: work.id,
        slug: work.slug,
        titleBn: work.titleBn,
        titleEn: work.titleEn,
        subtitleBn: work.subtitleBn,
        language: work.language,
        era: work.era,
        subject: work.subject,
        author: work.author ? { nameBn: work.author.nameBn, slug: work.author.slug } : null,
      }}
      edition={{
        id: selectedEdition?.id || "",
        editionTitleBn: selectedEdition?.editionTitleBn,
        editor: selectedEdition?.editor,
        translator: selectedEdition?.translator,
        publisher: selectedEdition?.publisher,
        publicationYear: selectedEdition?.publicationYear,
        publicationPlace: selectedEdition?.publicationPlace,
        pages: selectedEdition?.pages,
        notes: selectedEdition?.notes,
        coverImage: selectedEdition?.coverImage,
        hostingMode,
        rightsStatus,
        license: selectedEdition?.rights?.license,
        verificationNotes: selectedEdition?.rights?.verificationNotes,
      }}
      source={
        source
          ? {
              sourceName: source.sourceName,
              sourceUrl: source.sourceUrl,
              externalId: source.externalId,
              sourceDescription: source.sourceDescription,
            }
          : null
      }
      pages={pages}
      initialPage={initialPage}
      pdfUrl={pdfAsset?.fileUrl || null}
      transcriptText={transcriptAsset?.transcriptText || null}
      isRightsVerified={capabilities.isRightsVerified}
      canDownload={capabilities.canDownload}
      downloadUrl={capabilities.downloadUrl}
      companionEdition={companionEdition}
    />
  );
}
