"use client";

import { Logo } from "./logo";
import { cn } from "@/lib/utils";

interface BrandLoadingProps {
  fullscreen?: boolean;
  message?: string;
  className?: string;
}

export function BrandLoading({
  fullscreen = false,
  message = "Loading...",
  className,
}: BrandLoadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        fullscreen ? "fixed inset-0 z-50 bg-surface/95 backdrop-blur-sm" : "min-h-[300px]",
        className,
      )}
    >
      <div className="animate-pulse">
        <Logo variant="compact" showSubtitle={true} width={90} />
      </div>
      {message && (
        <p className="mt-4 font-mono text-xs text-content-faint tracking-wider uppercase">
          {message}
        </p>
      )}
    </div>
  );
}
