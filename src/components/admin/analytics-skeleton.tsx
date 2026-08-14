import React from "react";

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading analytics">
      {/* 4 Stat Cards Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-rule bg-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-content/10" />
              <div className="h-4 w-4 rounded bg-content/10" />
            </div>
            <div className="h-7 w-24 rounded bg-content/15" />
            <div className="h-2.5 w-28 rounded bg-content/10" />
          </div>
        ))}
      </div>

      {/* Traffic Trend Chart Skeleton */}
      <div className="border border-rule bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-rule">
          <div className="space-y-1.5">
            <div className="h-2.5 w-20 rounded bg-content/10" />
            <div className="h-5 w-36 rounded bg-content/15" />
          </div>
          <div className="h-3 w-24 rounded bg-content/10" />
        </div>
        <div className="h-44 w-full rounded bg-content/5 flex items-end justify-between px-6 pb-4 pt-10 gap-2">
          {[40, 65, 30, 85, 50, 70, 95, 60, 45, 80, 55, 75].map((h, idx) => (
            <div
              key={idx}
              className="w-full rounded-t bg-content/10"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between pt-2">
          <div className="h-2.5 w-16 rounded bg-content/10" />
          <div className="h-2.5 w-16 rounded bg-content/10" />
          <div className="h-2.5 w-16 rounded bg-content/10" />
        </div>
      </div>

      {/* Grid: Top Articles & Series Performance Skeleton */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Table skeleton */}
        <div className="border border-rule bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-rule">
            <div className="space-y-1.5">
              <div className="h-2.5 w-24 rounded bg-content/10" />
              <div className="h-5 w-40 rounded bg-content/15" />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-rule/40 last:border-0">
                <div className="space-y-1">
                  <div className="h-3.5 w-44 rounded bg-content/15" />
                  <div className="h-2.5 w-20 rounded bg-content/10" />
                </div>
                <div className="h-3 w-12 rounded bg-content/10" />
              </div>
            ))}
          </div>
        </div>

        {/* Series skeleton */}
        <div className="border border-rule bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-rule">
            <div className="space-y-1.5">
              <div className="h-2.5 w-28 rounded bg-content/10" />
              <div className="h-5 w-36 rounded bg-content/15" />
            </div>
          </div>
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2 border-b border-rule/40 pb-3 last:border-0">
                <div className="flex justify-between">
                  <div className="h-3.5 w-36 rounded bg-content/15" />
                  <div className="h-3 w-10 rounded bg-content/10" />
                </div>
                <div className="h-2 w-48 rounded bg-content/10" />
                <div className="h-1.5 w-full rounded-full bg-content/10" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
