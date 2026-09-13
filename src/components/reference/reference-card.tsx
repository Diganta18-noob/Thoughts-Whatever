"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ReferenceRightsBadge } from "./reference-rights-badge";
import { BookOpen, ExternalLink, Headphones, ArrowRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferenceCardProps {
  work: {
    id: string;
    slug: string;
    titleBn: string;
    titleEn?: string | null;
    subtitleBn?: string | null;
    type: string;
    language: string;
    era?: string | null;
    author?: { id: string; nameBn: string; slug: string } | null;
    primaryEdition?: {
      id: string;
      editor?: string | null;
      publisher?: string | null;
      publicationYear?: number | null;
      coverImage?: string | null;
      rightsStatus: any;
      source?: { sourceName: string; sourceUrl: string } | null;
    } | null;
    capabilities: {
      canReadOnline: boolean;
      canDownload: boolean;
      canListen: boolean;
      canViewOriginalSource: boolean;
      downloadUrl?: string | null;
      originalSourceUrl?: string | null;
    };
  };
}

export function ReferenceCard({ work }: ReferenceCardProps) {
  const edition = work.primaryEdition;
  const rightsStatus = edition?.rightsStatus || "RIGHTS_UNVERIFIED";
  const coverImage = edition?.coverImage;

  return (
    <article className="group relative flex flex-col bg-zinc-950/80 border border-zinc-850 hover:border-zinc-750 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/40">
      {/* Cover / Visual Frame */}
      <div className="relative aspect-[16/10] w-full bg-zinc-900 overflow-hidden border-b border-zinc-850">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={work.titleBn}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-top opacity-85 transition-transform duration-500 group-hover:scale-105 group-hover:opacity-95"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 p-6 text-center">
            <BookOpen className="w-8 h-8 text-zinc-700 group-hover:text-emerald-500/80 transition-colors mb-2" />
            <span className="font-serif text-lg font-bold text-zinc-400 line-clamp-1">
              {work.titleBn}
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
          <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-700/60 text-zinc-300 uppercase tracking-wider">
            {work.type}
          </span>
          <ReferenceRightsBadge status={rightsStatus} size="sm" />
        </div>
      </div>

      {/* Meta Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <div className="text-[0.7rem] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-2 mb-1.5">
          <span>{work.language}</span>
          {work.era && (
            <>
              <span>•</span>
              <span>{work.era}</span>
            </>
          )}
          {edition?.publicationYear && (
            <>
              <span>•</span>
              <span className="text-zinc-400">{edition.publicationYear}</span>
            </>
          )}
        </div>

        <h3 className="font-serif text-lg font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
          <Link href={`/reference/${work.slug}`} className="focus:outline-none">
            {work.titleBn}
          </Link>
        </h3>

        {work.titleEn && (
          <div className="text-xs text-zinc-400 font-sans italic line-clamp-1 mt-0.5">
            {work.titleEn}
          </div>
        )}

        {/* Bibliographic Attribution */}
        <div className="mt-3 pt-3 border-t border-zinc-900 text-xs text-zinc-400 space-y-1 flex-1">
          {work.author && (
            <div className="flex items-center gap-1 text-zinc-300">
              <span className="text-zinc-500">লেখক:</span>
              <Link
                href={`/authors/${work.author.slug}`}
                className="hover:text-emerald-400 font-serif"
              >
                {work.author.nameBn}
              </Link>
            </div>
          )}

          {edition?.editor && (
            <div className="line-clamp-1 text-zinc-400">
              <span className="text-zinc-500">সম্পাদনা:</span> {edition.editor}
            </div>
          )}

          {edition?.publisher && (
            <div className="line-clamp-1 text-zinc-500 text-[0.75rem]">
              প্রকাশক: {edition.publisher}
            </div>
          )}

          {edition?.source && (
            <div className="text-[0.7rem] text-zinc-500 line-clamp-1 flex items-center gap-1">
              <span>উৎস:</span>
              <span className="text-zinc-400">{edition.source.sourceName}</span>
            </div>
          )}
        </div>

        {/* Dynamic Action System */}
        <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-xs">
          <Link
            href={`/reference/${work.slug}`}
            className="inline-flex items-center gap-1 text-zinc-400 group-hover:text-zinc-200 font-mono text-[0.75rem] transition-colors"
          >
            <span>বিবরণ ও বিবরণী</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <div className="flex items-center gap-2">
            {work.capabilities.canListen && (
              <span
                title="শ্রব্য সংস্করণ লভ্য"
                className="p-1 rounded bg-zinc-900 text-emerald-400 border border-zinc-800"
              >
                <Headphones className="w-3.5 h-3.5" />
              </span>
            )}

            {work.capabilities.canReadOnline && (
              <Link
                href={`/reference/${work.slug}/read`}
                className="px-2.5 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 font-mono text-[0.7rem] transition-colors"
              >
                পাঠকক্ষ
              </Link>
            )}

            {!work.capabilities.canReadOnline && edition?.source?.sourceUrl && (
              <a
                href={edition.source.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-750 font-mono text-[0.7rem] transition-colors"
              >
                <span>উৎস</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
