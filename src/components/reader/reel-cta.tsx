"use client";

import Image from "next/image";
import { trackReelClick } from "@/lib/tracker";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export interface ReelCTAProps {
  reelUrl: string;
  pieceId?: string;
  titleBn?: string;
  coverImage?: string | null;
  variant?: "banner" | "card" | "button" | "inline";
  placement?: "hero" | "inline" | "sidebar" | "footer";
  className?: string;
}

/** Helper to format and normalize Instagram Reel URLs */
function getMobileReelUrl(reelUrl: string): string {
  if (!reelUrl) return "#";
  const trimmed = reelUrl.trim();
  // Ensure valid HTTPS protocol
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return `https://${trimmed}`;
  }
  return trimmed;
}



import { posthog } from "@/lib/posthog-client";

export function ReelCallToAction({
  reelUrl,
  pieceId,
  titleBn,
  coverImage,
  variant = "banner",
  placement = "hero",
  className,
}: ReelCTAProps) {
  const { isBn } = useLanguage();

  const handleClick = () => {
    trackReelClick(pieceId, reelUrl, placement);
    posthog.capture("reel_clicked", {
      piece_id: pieceId,
      reel_url: reelUrl,
      placement,
      variant,
    });
  };


  const finalUrl = getMobileReelUrl(reelUrl);

  // 1. Inline Banner Variant
  if (variant === "banner" || variant === "inline") {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-rule/60 bg-gradient-to-r from-surface-raised via-surface to-surface-raised p-5 sm:p-6 shadow-md my-8 transition-all hover:shadow-xl group/reel-banner",
          className
        )}
      >
        {/* Instagram Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Instagram Logo / Play Circle Badge */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-md group-hover/reel-banner:scale-105 transition-transform duration-300">
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </div>

            <div>
              <span className="label text-[0.6875rem] uppercase tracking-widest text-[#e6683c] font-mono">
                Instagram Reel
              </span>
              <h4 className="font-bengali text-base sm:text-lg font-medium text-content" lang="bn">
                {titleBn ? `🎬 ${titleBn} - এর ইনস্টাগ্রাম রিল দেখুন` : "🎬 ইনস্টাগ্রামে এই পর্বের রিল দেখুন"}
              </h4>
              <p className="text-xs text-content-soft font-sans">
                Watch the official video reel on Instagram for visuals & narration
              </p>
            </div>
          </div>

          <a
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] px-5 py-2.5 text-xs sm:text-sm font-medium text-white shadow-md transition-all duration-300 hover:opacity-95 hover:shadow-lg hover:scale-[1.02] active:scale-95"
          >
            <span className="font-bengali" lang="bn">ইনস্টাগ্রামে দেখুন</span>
            <span>Watch Reel →</span>
          </a>
        </div>
      </div>
    );
  }

  // 2. Visual Preview Card Variant
  if (variant === "card") {
    return (
      <div className={cn("rounded-2xl border border-rule/60 bg-surface-raised/40 p-5 space-y-4 shadow-sm", className)}>
        <div className="flex items-center justify-between">
          <span className="label text-[0.6875rem] uppercase tracking-widest text-[#e6683c]">
            Visual Reel
          </span>
          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[0.625rem] text-accent font-sans">
            Instagram
          </span>
        </div>

        {coverImage && (
          <a
            href={finalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="group relative block aspect-[16/9] w-full overflow-hidden rounded-xl border border-rule/50"
          >
            <Image
              src={coverImage}
              alt={titleBn || "Reel Preview"}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 transition-opacity group-hover:bg-black/30 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#bc1888] shadow-lg transition-transform group-hover:scale-110">
                <span className="text-xl ml-1">▶</span>
              </div>
            </div>
          </a>
        )}

        <a
          href={finalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] py-2.5 text-xs font-medium text-white shadow transition hover:opacity-95"
        >
          <span>Watch Reel on Instagram</span>
          <span>↗</span>
        </a>
      </div>
    );
  }

  // 3. Compact Button Variant
  return (
    <a
      href={finalUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 hover:scale-[1.02]",
        className
      )}
    >
      <span>🎬</span>
      <span className="font-bengali" lang="bn">রিল দেখুন</span>
      <span>Reel →</span>
    </a>
  );
}
