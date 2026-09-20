"use client";

import React from "react";
import { ReferenceRightsStatus } from "@prisma/client";
import { getRightsBadgeMeta } from "@/lib/reference/rights-engine";
import { ShieldCheck, ShieldAlert, ExternalLink, HelpCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RightsBadgeProps {
  status: ReferenceRightsStatus;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function RightsBadge({
  status,
  showIcon = true,
  className,
  size = "md",
}: RightsBadgeProps) {
  const meta = getRightsBadgeMeta(status);

  const icons = {
    PUBLIC_DOMAIN: ShieldCheck,
    LICENSED: ShieldCheck,
    EXTERNAL_SOURCE: ExternalLink,
    RIGHTS_UNVERIFIED: HelpCircle,
    RESTRICTED: Lock,
  };

  const IconComponent = icons[status] || ShieldAlert;

  const sizeClasses = {
    sm: "text-[0.65rem] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-medium rounded-full border tracking-wide uppercase shadow-sm transition-colors",
        meta.colorClass,
        sizeClasses[size],
        className,
      )}
      title={`${meta.labelEn}: ${meta.descriptionEn}`}
    >
      {showIcon && <IconComponent className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
      <span>{meta.labelEn}</span>
    </span>
  );
}
