import React from "react";

export default function AdminSeriesLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-5">
        <div className="space-y-1.5">
          <div className="h-6 w-36 rounded bg-content/15" />
          <div className="h-3 w-48 rounded bg-content/10" />
        </div>
        <div className="h-8 w-28 rounded bg-content/10" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border border-rule bg-surface p-5 space-y-4 rounded">
            <div className="h-36 rounded bg-content/10" />
            <div className="h-5 w-3/4 rounded bg-content/15" />
            <div className="h-3 w-1/2 rounded bg-content/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
