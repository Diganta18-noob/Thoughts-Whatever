import React from "react";

export function HeroCardSkeleton() {
  return (
    <div className="w-full rounded-sm border border-rule bg-surface p-6 animate-pulse">
      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        <div className="aspect-[9/16] w-full max-w-[200px] rounded bg-content/10"></div>
        <div className="flex-1 space-y-4">
          <div className="h-4 w-28 rounded bg-content/10"></div>
          <div className="h-8 w-3/4 rounded bg-content/10"></div>
          <div className="h-4 w-full rounded bg-content/5"></div>
          <div className="h-4 w-2/3 rounded bg-content/5"></div>
          <div className="h-10 w-36 rounded bg-content/10"></div>
        </div>
      </div>
    </div>
  );
}

export function SeriesGridSkeleton() {
  return (
    <div className="space-y-6 py-8 animate-pulse">
      <div className="h-6 w-40 rounded bg-content/10"></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-[3/4] w-full rounded-sm bg-content/5"></div>
            <div className="h-5 w-3/4 rounded bg-content/10"></div>
            <div className="h-3 w-1/2 rounded bg-content/5"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EpisodesSkeleton() {
  return (
    <div className="space-y-6 py-8 animate-pulse">
      <div className="h-6 w-44 rounded bg-content/10"></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[16/9] w-full rounded-sm bg-content/5"></div>
            <div className="h-4 w-5/6 rounded bg-content/10"></div>
            <div className="h-3 w-1/2 rounded bg-content/5"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
