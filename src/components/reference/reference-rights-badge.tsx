"use client";

import React from "react";
import { ReferenceRightsStatus } from "@prisma/client";
import { getRightsBadgeMeta } from "@/lib/reference/rights-engine";
import { ShieldCheck, ExternalLink, HelpCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferenceRightsBadgeProps {
  status: ReferenceRightsStatus;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function ReferenceRightsBadge({
  status,
  showIcon = true,
  className,
  size = "sm",
}: ReferenceRightsBadgeProps) {
  const meta = getRightsBadgeMeta(status);

  const icons = {
    PUBLIC_DOMAIN: ShieldCheck,
    LICENSED: ShieldCheck,
    EXTERNAL_SOURCE: ExternalLink,
    RIGHTS_UNVERIFIED: HelpCircle,
    RESTRICTED: Lock,
  };

  const IconComponent = icons[status] || ExternalLink;

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-medium rounded-full border tracking-wide uppercase transition-colors",
        meta.colorClass,
        size === "sm" ? "text-[0.65rem] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5",
        className,
      )}
      title={`${meta.labelEn} — ${meta.labelBn}: ${meta.descriptionBn}`}
    >
      {showIcon && <IconComponent className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
      <span>{meta.labelEn}</span>
    </span>
  );
}
