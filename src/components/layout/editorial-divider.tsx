"use client";

import { cn } from "@/lib/utils";

interface EditorialDividerProps {
  className?: string;
  variant?: "simple" | "ornament" | "diamond";
}

export function EditorialDivider({
  className,
  variant = "ornament",
}: EditorialDividerProps) {
  if (variant === "simple") {
    return <hr className={cn("border-t border-rule/60 my-10 sm:my-14", className)} />;
  }

  return (
    <div className={cn("relative my-12 flex items-center justify-center sm:my-16", className)}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-rule/70" />
      </div>
      <div className="relative flex justify-center bg-surface px-4 text-accent/80">
        {variant === "diamond" ? (
          <span className="text-xs tracking-widest opacity-70">❖</span>
        ) : (
          <svg
            className="h-4 w-12 text-accent/70"
            viewBox="0 0 48 16"
            fill="currentColor"
          >
            <path d="M24 0L27 6L33 8L27 10L24 16L21 10L15 8L21 6L24 0Z" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="40" cy="8" r="1.5" />
          </svg>
        )}
      </div>
    </div>
  );
}
