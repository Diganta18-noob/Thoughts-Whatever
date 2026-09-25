import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deriveCapabilities, getRightsBadgeMeta } from "@/lib/reference/rights-engine";
import { ArrowLeft, ExternalLink, ShieldAlert, Sparkles, Headphones } from "lucide-react";
import { ReferenceRightsBadge } from "@/components/reference/reference-rights-badge";
import { ListeningRoom } from "@/components/reference/audio/listening-room";
import type { Metadata } from "next";

interface ListenPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    edition?: string;
  };
}

export async function generateMetadata({ params }: ListenPageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const work = await prisma.referenceWork.findUnique({
    where: { slug },
    select: { titleBn: true, titleEn: true },
  });

  if (!work) return { title: "অডিও পাঠকক্ষ | Thoughts.Whatever" };

  return {
    title: `${work.titleBn} — ডিজিটাল অডিও ও প্রতিলিপি কক্ষ | Thoughts.Whatever`,
    description: `Listen to the archival audio recording and read synchronized captions for ${work.titleBn} at Thoughts.Whatever.`,
  };
}

export default async function ReferenceListenPage({ params, searchParams }: ListenPageProps) {
  const slug = decodeURIComponent(params.slug);

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

  // Find edition with an AUDIO asset
  let selectedEdition =
    work.editions.find((e) => e.assets.some((a) => a.kind === "AUDIO" && a.fileUrl)) ||
    work.editions[0] ||
    null;

  if (searchParams.edition) {
    const matched = work.editions.find((e) => e.id === searchParams.edition);
    if (matched) selectedEdition = matched;
  }

  const rightsStatus = selectedEdition?.rights?.status || "RIGHTS_UNVERIFIED";
  const hostingMode = selectedEdition?.hostingMode || "EXTERNAL";
  const source = selectedEdition?.sources[0] || null;

  const capabilities = deriveCapabilities({
    rightsStatus,
    hostingMode,
    assets: selectedEdition?.assets || [],
    sourceUrl: source?.sourceUrl || null,
  });

  const audioAsset = selectedEdition?.assets.find((a) => a.kind === "AUDIO" && a.fileUrl);

  // If cannot listen or rights not verified, present rights-gate screen
  if (!capabilities.canListen || !audioAsset) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-8">
        <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-zinc-850 pb-4">
          <Link
            href={`/reference/${work.slug}`}
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Edition Details</span>
          </Link>
          <ReferenceRightsBadge status={rightsStatus} size="sm" />
        </header>

        <main className="max-w-2xl mx-auto my-auto text-center p-8 sm:p-12 border border-zinc-800 rounded-3xl bg-zinc-900/60 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-semibold">
              Hosted Listening Unavailable · Rights Under Review
            </span>
            <h1 className="text-2xl sm:text-3xl font-bengali font-bold text-zinc-100 mt-2">
              {work.titleBn}
            </h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              {selectedEdition?.editionTitleBn || "Archival Audio Edition"}
            </p>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-5 text-left space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-semibold uppercase tracking-wider">Thoughts.Whatever Rights Policy</span>
            </div>
            <p className="text-xs text-zinc-300 font-sans leading-relaxed">
              Archival audio recordings require verified public-domain status or explicit licensing before direct streaming is enabled.
            </p>
          </div>

          {source && (
            <div className="pt-2">
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-bold rounded-xl transition-colors"
              >
                <span>Listen at Archival Source ({source.sourceName})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </main>

        <footer className="max-w-4xl mx-auto w-full border-t border-zinc-850 pt-6 text-center text-xs text-zinc-500 font-serif">
          Thoughts.Whatever Archival Preservation Engine
        </footer>
      </div>
    );
  }

  return (
    <ListeningRoom
      work={{
        id: work.id,
        slug: work.slug,
        titleBn: work.titleBn,
        titleEn: work.titleEn,
        subtitleBn: work.subtitleBn,
        author: work.author ? { nameBn: work.author.nameBn, slug: work.author.slug } : null,
      }}
      edition={{
        id: selectedEdition?.id || "",
        editionTitleBn: selectedEdition?.editionTitleBn,
        publicationYear: selectedEdition?.publicationYear,
        coverImage: selectedEdition?.coverImage,
        notes: selectedEdition?.notes,
      }}
      audioAsset={{
        fileUrl: audioAsset.fileUrl,
        durationSec: audioAsset.durationSec,
        audioManifest: audioAsset.audioManifest as any,
      }}
    />
  );
}
