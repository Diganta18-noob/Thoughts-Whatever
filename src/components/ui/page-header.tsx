import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-wrap items-center justify-between gap-3 pb-5", className)}
    >
      <div className="min-w-0">
        <h1 className="font-ui text-step-4 font-semibold text-content">{title}</h1>
        {subtitle ? (
          <p className="mt-1 font-mono text-step-0 text-content-faint">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
