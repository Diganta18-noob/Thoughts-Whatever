"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ReferenceRightsBadge } from "./reference-rights-badge";
import { BookOpen, ExternalLink, ArrowRight } from "lucide-react";
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
    <article className="group relative flex flex-col border border-rule bg-surface transition-all duration-300 hover:border-content-faint/60">
      {/* Cover / Archival Frame */}
      <Link
        href={`/reference/${work.slug}`}
        className="relative aspect-[16/10] w-full overflow-hidden border-b border-rule bg-surface-raised block"
      >
        {coverImage ? (
          <Image
            src={coverImage}
            alt={work.titleBn}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-top opacity-85 transition-transform duration-700 group-hover:scale-[1.03] group-hover:opacity-100"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <BookOpen className="h-7 w-7 text-content-faint transition-colors group-hover:text-accent" />
            <span className="mt-2 font-bengali text-lg text-content-soft">
              {work.titleBn}
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="label !bg-surface/90 !text-[0.625rem] border border-rule/80 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {work.type}
          </span>
          <ReferenceRightsBadge status={rightsStatus} size="sm" />
        </div>
      </Link>

      {/* Meta Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Dateline & Era */}
        <div className="flex items-center gap-2 text-[0.6875rem] font-mono text-content-faint uppercase tracking-wider">
          <span>{work.language}</span>
          {work.era && (
            <>
              <span>·</span>
              <span className="text-content-soft">{work.era}</span>
            </>
          )}
          {edition?.publicationYear && (
            <>
              <span>·</span>
              <span>{edition.publicationYear}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="mt-2.5 font-bengali text-xl font-medium leading-snug text-content transition-colors group-hover:text-accent">
          <Link href={`/reference/${work.slug}`}>
            {work.titleBn}
          </Link>
        </h3>

        {work.titleEn && (
          <p className="mt-1 font-serif text-xs italic text-content-faint line-clamp-1">
            {work.titleEn}
          </p>
        )}

        {/* Bibliographic Details */}
        <div className="mt-4 flex-1 space-y-1 border-t border-rule/60 pt-3 text-xs text-content-soft">
          {work.author && (
            <div className="flex items-baseline gap-1.5 line-clamp-1">
              <span className="label !text-[0.625rem]">Author</span>
              <Link
                href={`/authors/${work.author.slug}`}
                className="font-bengali text-content hover:text-accent transition-colors"
              >
                {work.author.nameBn}
              </Link>
            </div>
          )}

          {edition?.editor && (
            <div className="line-clamp-1 text-content-soft">
              <span className="label !text-[0.625rem] mr-1.5">Editor</span>
              <span className="font-serif">{edition.editor}</span>
            </div>
          )}

          {edition?.source && (
            <div className="line-clamp-1 text-[0.6875rem] text-content-faint">
              <span className="label !text-[0.625rem] mr-1.5">Source</span>
              <span className="font-serif">{edition.source.sourceName}</span>
            </div>
          )}
        </div>

        {/* Actions Row */}
        <div className="mt-5 flex items-center justify-between border-t border-rule pt-3 text-xs">
          <Link
            href={`/reference/${work.slug}`}
            className="inline-flex items-center gap-1 font-serif text-xs text-content-soft hover:text-accent transition-colors"
          >
            <span>Dossier</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <div>
            {work.capabilities.canReadOnline ? (
              <Link
                href={`/reference/${work.slug}/read`}
                className="label !text-accent hover:opacity-75 transition-opacity"
              >
                Read Online →
              </Link>
            ) : edition?.source?.sourceUrl ? (
              <a
                href={edition.source.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="label !text-content-faint hover:!text-content transition-colors inline-flex items-center gap-1"
              >
                <span>Original Source</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
