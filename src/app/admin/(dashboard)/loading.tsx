import React from "react";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-10 animate-pulse" aria-busy="true">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-rule pb-5">
        <div className="space-y-2">
          <div className="h-2.5 w-24 rounded bg-content/10" />
          <div className="h-7 w-56 rounded bg-content/15" />
        </div>
        <div className="h-8 w-28 rounded bg-content/10" />
      </div>

      {/* Analytics Skeleton */}
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded border border-rule bg-surface p-5" />
          ))}
        </div>
        <div className="h-64 rounded border border-rule bg-surface" />
      </div>

      {/* Recently Edited list skeleton */}
      <div className="pt-4 space-y-4">
        <div className="h-3 w-28 rounded bg-content/10" />
        <div className="divide-y divide-rule border-y border-rule">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3.5">
              <div className="h-4 w-60 rounded bg-content/15" />
              <div className="h-3 w-20 rounded bg-content/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
