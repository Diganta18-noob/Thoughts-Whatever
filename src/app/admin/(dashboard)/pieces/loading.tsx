import React from "react";

export default function AdminPiecesLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-5">
        <div className="space-y-1.5">
          <div className="h-6 w-36 rounded bg-content/15" />
          <div className="h-3 w-48 rounded bg-content/10" />
        </div>
        <div className="h-8 w-28 rounded bg-content/10" />
      </div>

      <div className="flex gap-2">
        <div className="h-8 w-64 rounded bg-content/10" />
        <div className="h-8 w-24 rounded bg-content/10" />
      </div>

      <div className="rounded border border-rule bg-surface divide-y divide-rule">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center justify-between p-4">
            <div className="space-y-2">
              <div className="h-4 w-72 rounded bg-content/15" />
              <div className="flex gap-2">
                <div className="h-3 w-16 rounded bg-content/10" />
                <div className="h-3 w-20 rounded bg-content/10" />
              </div>
            </div>
            <div className="h-3 w-24 rounded bg-content/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
