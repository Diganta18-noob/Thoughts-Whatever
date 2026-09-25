"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export interface StoryReadLinkProps {
  href: string;
  className?: string;
  variant?: "link" | "button" | "pill";
  label?: string;
  ariaLabel?: string;
}

/**
 * Standardized Story CTA component (Issue 8).
 * Normalizes wording across the site:
 *   - English: "Read Story →"
 *   - Bengali: "রচনাটি পড়ুন →"
 */
export function StoryReadLink({
  href,
  className,
  variant = "link",
  label,
  ariaLabel,
}: StoryReadLinkProps) {
  const { isBn } = useLanguage();
  const defaultLabel = isBn ? "রচনাটি পড়ুন" : "Read Story";
  const displayLabel = label || defaultLabel;

  if (variant === "button") {
    return (
      <Link
        href={href}
        aria-label={ariaLabel || displayLabel}
        className={cn(
          "group/cta inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sm bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-accent/90 hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isBn ? "font-bengali-sans" : "font-sans",
          className,
        )}
      >
        <span>{displayLabel}</span>
        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1"
        />
      </Link>
    );
  }

  if (variant === "pill") {
    return (
      <Link
        href={href}
        aria-label={ariaLabel || displayLabel}
        className={cn(
          "group/cta inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-accent/80 bg-accent/20 px-4 py-2 font-mono text-xs uppercase tracking-wider text-accent backdrop-blur-sm transition-all duration-200 hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          className,
        )}
      >
        <span>{displayLabel}</span>
        <ArrowRight
          aria-hidden="true"
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-1"
        />
      </Link>
    );
  }

  // Default "link" variant
  return (
    <Link
      href={href}
      aria-label={ariaLabel || displayLabel}
      className={cn(
        "group/cta inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-accent transition-colors duration-200 hover:text-accent/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
        className,
      )}
    >
      <span>{displayLabel}</span>
      <span
        aria-hidden="true"
        className="transition-transform duration-200 group-hover/cta:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
