import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deriveCapabilities } from "@/lib/reference/rights-engine";
import { ArrowLeft, BookOpen, ExternalLink, ShieldAlert } from "lucide-react";
import { OnlineReaderClient } from "./online-reader-client";
import type { Metadata } from "next";

interface ReaderPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const work = await prisma.referenceWork.findUnique({
    where: { slug },
    select: { titleBn: true },
  });

  if (!work) return { title: "পাঠকক্ষ | Thoughts.Whatever" };

  return {
    title: `${work.titleBn} — অনলাইন পাঠকক্ষ | Thoughts.Whatever`,
    description: "Thoughts.Whatever ডিজিটাল রেফারেন্স পাঠকক্ষ।",
  };
}

export default async function ReferenceReaderPage({ params }: ReaderPageProps) {
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

  // Strict invariant: If not readable, redirect to detail page
  if (!capabilities.canReadOnline) {
    redirect(`/reference/${work.slug}`);
  }

  const pdfAsset = primaryEdition?.assets.find((a) => a.kind === "PDF" && a.fileUrl);
  const transcriptAsset = primaryEdition?.assets.find(
    (a) => a.kind === "TRANSCRIPT" && a.transcriptText,
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Reader Top Bar */}
      <header className="border-b border-zinc-850 bg-zinc-950/90 backdrop-blur sticky top-0 z-30 px-4 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/reference/${work.slug}`}
              className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              title="বিবরণ পাতায় ফিরে যান"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div>
              <h1 className="font-serif font-bold text-sm sm:text-base text-zinc-100 line-clamp-1">
                {work.titleBn}
              </h1>
              <p className="text-[0.7rem] text-zinc-400 font-mono line-clamp-1">
                {primaryEdition?.editor ? `সম্পাদনা: ${primaryEdition.editor}` : work.titleEn || ""}
                {primaryEdition?.publicationYear ? ` (${primaryEdition.publicationYear})` : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/reference/${work.slug}`}
              className="px-3 py-1 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg hover:bg-zinc-900"
            >
              তথ্যপঞ্জি
            </Link>
          </div>
        </div>
      </header>

      {/* Reader Body (Client Component for Controls & Display) */}
      <main className="flex-1 flex flex-col">
        <OnlineReaderClient
          workTitle={work.titleBn}
          pdfUrl={pdfAsset?.fileUrl || null}
          transcriptText={transcriptAsset?.transcriptText || null}
          sourceUrl={source?.sourceUrl || null}
          sourceName={source?.sourceName || "Original Source"}
        />
      </main>
    </div>
  );
}
