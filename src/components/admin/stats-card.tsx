"use client";

import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { toBengaliNumber } from "@/lib/bengali";
import { useLanguage } from "@/components/providers/language-provider";
import { AnimatedNumber } from "@/components/admin/ui/animated-number";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  labelEn: string;
  labelBn: string;
  value: number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: number;
}

export function StatsCard({ labelEn, labelBn, value, subtext, icon, trend }: StatsCardProps) {
  const { isBn } = useLanguage();
  const label = isBn ? labelBn : labelEn;
  const format = (n: number) => (isBn ? toBengaliNumber(n) : n.toLocaleString());

  const rising = trend !== undefined && trend >= 0;
  const TrendIcon = rising ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "group border border-rule bg-surface p-5",
        // Lift and rule-darkening only, no shadow bloom: the tiles sit in a grid
        // of shared borders, and a glow on one makes the row look misaligned.
        "transition-[transform,border-color] duration-150 ease-out",
        "hover:-translate-y-px hover:border-accent/40"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="label">{labelEn}</span>
        {icon && (
          <span className="text-content-faint transition-colors group-hover:text-accent">
            {icon}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <AnimatedNumber
          value={value}
          format={format}
          className="font-sans text-[2rem] font-medium leading-none text-content"
        />

        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 font-mono text-xs font-semibold",
              rising
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            )}
          >
            {/* The arrow carries the direction for anyone who cannot separate
                the two greens and reds, which the sign alone does not. */}
            <TrendIcon className="h-3 w-3" aria-hidden />
            {rising ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>

      <p className="mt-2 font-sans text-xs text-content-faint">
        {label} {subtext ? `· ${subtext}` : ""}
      </p>
    </div>
  );
}
