import React from "react";
import { ArrowUpRight } from "lucide-react";

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold font-heading text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-extrabold font-heading">{value}</span>
        {trend && (
          <span className="inline-flex items-center text-xs font-bold text-emerald-600 font-heading">
            <ArrowUpRight className="w-3.5 h-3.5" /> {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-[11px] text-muted-foreground font-heading">{subtitle}</p>}
    </div>
  );
}
