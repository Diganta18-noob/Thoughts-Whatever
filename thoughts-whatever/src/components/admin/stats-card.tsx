"use client";

import React from "react";
import { toBengaliNumber } from "@/lib/bengali";
import { useLanguage } from "@/components/providers/language-provider";

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
  const displayValue = isBn ? toBengaliNumber(value) : value.toLocaleString();
  const label = isBn ? labelBn : labelEn;

  return (
    <div className="border border-rule bg-surface p-5 transition hover:border-accent/40">
      <div className="flex items-center justify-between">
        <span className="label">
          {labelEn}
        </span>
        {icon && <span className="text-content-faint">{icon}</span>}
      </div>
      <div className="mt-3 flex items-baseline justify-between">
        <p className="font-sans text-[2rem] font-medium leading-none text-content">
          {displayValue}
        </p>
        {trend !== undefined && (
          <span
            className={`font-mono text-xs font-semibold ${
              trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend >= 0 ? `+${trend}%` : `${trend}%`}
          </span>
        )}
      </div>
      <p className="mt-2 font-sans text-xs text-content-faint">
        {label} {subtext ? `· ${subtext}` : ""}
      </p>
    </div>
  );
}
