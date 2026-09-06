"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Layers } from "lucide-react";
import { bannerSrc } from "@/lib/images";

export interface SeriesHeroBannerProps {
  slug: string;
  titleBn: string;
  descBn?: string | null;
  bannerImage?: string | null;
  coverImage?: string | null;
  pieceCount: number;
  totalReadingMinutes: number;
  firstPieceHref?: string | null;
}

export function SeriesHeroBanner({
  slug,
  titleBn,
  descBn,
  bannerImage,
  coverImage,
  pieceCount,
  totalReadingMinutes,
  firstPieceHref,
}: SeriesHeroBannerProps) {
  const banner = bannerSrc(slug, bannerImage, coverImage);
  const hasDedicatedBanner = !!bannerImage?.trim();

  return (
    <div className="relative my-8 w-full overflow-hidden rounded-xl border border-rule/80 bg-surface-raised/40 shadow-sm backdrop-blur">
      {/* 21:9 cinematic banner — falls back to 16:9 if no dedicated art */}
      <div
        className={`relative w-full ${
          hasDedicatedBanner ? "aspect-[21/9]" : "aspect-[16/9] md:aspect-[21/9]"
        }`}
      >
        <Image
          src={banner}
          alt={titleBn}
          fill
          priority
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 1200px"
        />
        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/90 via-black/60 to-black/25" />
      </div>

      {/* Overlaid text content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-14">
        <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent">
          <Layers className="h-3.5 w-3.5" />
          <span>সিরিজ</span>
        </div>
        <h1 className="font-bengali text-2xl font-semibold leading-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
          {titleBn}
        </h1>
        {descBn && (
          <p className="mt-3 max-w-2xl font-bengali text-xs leading-relaxed text-white/80 sm:text-sm lg:text-base line-clamp-2 sm:line-clamp-3">
            {descBn}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4 font-mono text-xs text-white/70">
          <span>{pieceCount} পর্ব</span>
          <span>·</span>
          <span>{totalReadingMinutes} মিনিট পাঠ</span>
        </div>
        {firstPieceHref && (
          <div className="mt-6">
            <Link
              href={firstPieceHref}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 font-bengali text-sm font-medium text-surface shadow transition hover:opacity-90"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>প্রথম পর্ব থেকে শুরু করুন</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
