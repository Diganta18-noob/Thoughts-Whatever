"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type LogoVariant = "full" | "compact" | "icon" | "wordmark";
export type LogoTheme = "light" | "dark" | "auto";
export type LogoSize = "sm" | "md" | "lg";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: LogoSize;
  className?: string;
  width?: number;
  height?: number;
  href?: string;
  showSubtitle?: boolean;
}

export function Logo({
  variant = "compact",
  theme = "auto",
  size = "md",
  className,
  width,
  height,
  href,
  showSubtitle = true,
}: LogoProps) {
  const isDarkTarget = theme === "dark";
  const isLightTarget = theme === "light";

  const colorClass = isDarkTarget
    ? "text-[#F7F4EF]"
    : isLightTarget
      ? "text-[#141211]"
      : "text-content";

  const sizeClass =
    size === "sm"
      ? "text-xl sm:text-2xl"
      : size === "lg"
        ? "text-4xl sm:text-5xl"
        : "text-2xl sm:text-3xl";

  const content = (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center transition-opacity hover:opacity-90",
        colorClass,
        className,
      )}
      style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
    >
      {variant === "icon" ? (
        <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-surface-raised border border-rule font-serif text-base font-bold tracking-tighter leading-none">
          t.w
        </div>
      ) : variant === "wordmark" ? (
        <span className="font-serif text-lg font-medium tracking-tight leading-none">
          thoughts.whatever
        </span>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className={cn("font-serif font-bold tracking-tighter leading-none select-none", sizeClass)}>
            t.w
          </span>
          {(variant === "full" || showSubtitle) && (
            <span className="mt-1.5 font-sans text-[0.6rem] font-medium tracking-[0.35em] text-content-faint uppercase select-none">
              THOUGHTS.WHATEVER
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block" aria-label="Thoughts Whatever Home">
        {content}
      </Link>
    );
  }

  return content;
}
