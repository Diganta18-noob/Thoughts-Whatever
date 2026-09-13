"use client";

import React from "react";
import { ReferenceRightsStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface ReferenceRightsBadgeProps {
  status: ReferenceRightsStatus;
  showDot?: boolean;
  className?: string;
  size?: "sm" | "md";
}

const BADGE_CONFIG: Record<
  ReferenceRightsStatus,
  { label: string; dotColor: string }
> = {
  PUBLIC_DOMAIN: {
    label: "Public Domain",
    dotColor: "bg-emerald-500/80",
  },
  LICENSED: {
    label: "Licensed",
    dotColor: "bg-sky-400/80",
  },
  EXTERNAL_SOURCE: {
    label: "External Source",
    dotColor: "bg-content-faint",
  },
  RIGHTS_UNVERIFIED: {
    label: "Unverified Rights",
    dotColor: "bg-amber-400/80",
  },
  RESTRICTED: {
    label: "Restricted",
    dotColor: "bg-rose-400/80",
  },
};

export function ReferenceRightsBadge({
  status,
  showDot = true,
  className,
  size = "sm",
}: ReferenceRightsBadgeProps) {
  const config = BADGE_CONFIG[status] || {
    label: status,
    dotColor: "bg-content-faint",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-rule/70 bg-surface/90 backdrop-blur-sm font-mono tracking-label uppercase text-content-soft transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[0.625rem]" : "px-2.5 py-1 text-[0.6875rem]",
        className,
      )}
    >
      {showDot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dotColor)}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
}
