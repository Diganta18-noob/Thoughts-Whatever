import React from "react";

export default function AdminAnalyticsPageLoading() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule/60 pb-5">
        <div className="space-y-2">
          <div className="h-7 w-72 rounded bg-content/15" />
          <div className="h-3 w-96 rounded bg-content/10" />
        </div>
        <div className="h-9 w-44 rounded bg-content/10" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded border border-rule bg-surface p-5" />
        ))}
      </div>

      <div className="h-44 rounded-lg border border-rule/60 bg-surface-raised/40 p-6 space-y-4" />
    </div>
  );
}
