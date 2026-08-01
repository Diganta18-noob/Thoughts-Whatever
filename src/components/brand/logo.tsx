"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type LogoVariant = "full" | "compact" | "icon" | "wordmark";
export type LogoTheme = "light" | "dark" | "auto";

interface LogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  className?: string;
  width?: number;
  height?: number;
  href?: string;
  showSubtitle?: boolean;
}

export function Logo({
  variant = "compact",
  theme = "auto",
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
        <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-surface-raised border border-rule font-serif text-lg font-bold tracking-tighter">
          t.w
        </div>
      ) : variant === "wordmark" ? (
        <span className="font-serif text-xl font-medium tracking-tight">
          thoughts.whatever
        </span>
      ) : (
        <div className="flex flex-col items-center">
          <span className="font-serif text-2xl sm:text-3xl font-medium tracking-tighter leading-none select-none">
            t.w
          </span>
          {(variant === "full" || showSubtitle) && (
            <span className="mt-1 font-sans text-[0.6rem] sm:text-[0.65rem] font-medium tracking-[0.35em] text-content-faint uppercase select-none">
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
