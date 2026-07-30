"use client";

import { useEffect, useState } from "react";
import { Award } from "lucide-react";

export function SeriesProgress({
  totalParts,
  episodesSlugs,
}: {
  totalParts: number;
  episodesSlugs: string[];
}) {
  const [readCount, setReadCount] = useState(0);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("bengali_doc_read_articles") || "[]");
    const count = episodesSlugs.filter((slug) => saved.includes(slug)).length;
    setReadCount(count);
  }, [episodesSlugs]);

  const percentage = Math.round((readCount / totalParts) * 100) || 0;

  return (
    <div className="rounded-2xl glass-panel p-6 border border-border mb-8 space-y-3">
      <div className="flex items-center justify-between font-heading">
        <span className="text-sm font-bold flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" /> আপনার সিরিজ পাঠের অগ্রগতি
        </span>
        <span className="text-xs font-semibold text-primary">
          {readCount} / {totalParts} পর্ব সমাপ্ত ({percentage}%)
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
