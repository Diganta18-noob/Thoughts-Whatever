import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-rule px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? <div className="text-content-faint">{icon}</div> : null}
      <h3 className="font-ui text-step-2 font-semibold text-content">{title}</h3>
      {description ? (
        <p className="max-w-measure font-ui text-step-0 text-content-soft">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
