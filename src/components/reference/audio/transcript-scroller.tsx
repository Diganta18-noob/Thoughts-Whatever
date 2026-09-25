"use client";

import React, { useRef, useEffect, useState } from "react";
import { Cue, formatTimecode } from "@/lib/reference/audio/types";
import { Search, Copy, Check } from "lucide-react";

interface TranscriptScrollerProps {
  cues: Cue[];
  activeCueIndex: number;
  onSeek: (seconds: number) => void;
  autoScroll?: boolean;
}

export function TranscriptScroller({
  cues,
  activeCueIndex,
  onSeek,
  autoScroll = true,
}: TranscriptScrollerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeItemRef = useRef<HTMLDivElement | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Smoothly scroll active cue into center of view
  useEffect(() => {
    if (autoScroll && activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeCueIndex, autoScroll]);

  const handleCopy = (cue: Cue, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`"${cue.text}" — দেবব্রত বিশ্বাস (১৯৭৪)`);
    setCopiedId(cue.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredCues = filterQuery.trim()
    ? cues.filter((c) => c.text.toLowerCase().includes(filterQuery.toLowerCase()))
    : cues;

  return (
    <div className="flex flex-col h-full bg-zinc-950/70 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Search Header */}
      <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="প্রতিলিপির ভেতর খুঁজুন (যেমন: সার্কুলার, দিলীপ রায়, হারমোনি)..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <span className="text-[0.6875rem] font-mono text-zinc-500 shrink-0">
          {filteredCues.length} টি বাক্য
        </span>
      </div>

      {/* Transcript Items List */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto divide-y divide-zinc-900/80 p-2 sm:p-4 space-y-1 custom-scrollbar max-h-[500px]"
      >
        {filteredCues.map((cue) => {
          const isActive = cue.id === activeCueIndex;

          return (
            <div
              key={cue.id}
              ref={isActive ? activeItemRef : null}
              onClick={() => onSeek(cue.start)}
              className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                isActive
                  ? "bg-amber-500/10 border-l-4 border-amber-400 text-zinc-100 shadow-sm"
                  : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {/* Timestamp badge */}
              <button
                type="button"
                className={`font-mono text-[0.6875rem] px-2 py-0.5 rounded shrink-0 transition-colors ${
                  isActive
                    ? "bg-amber-400 text-zinc-950 font-bold"
                    : "bg-zinc-900 text-zinc-500 group-hover:text-amber-400"
                }`}
              >
                {formatTimecode(cue.start)}
              </button>

              {/* Text */}
              <div className="flex-1 text-sm sm:text-base font-bengali leading-relaxed">
                {cue.text}
              </div>

              {/* Action buttons (Copy quote) */}
              <button
                type="button"
                onClick={(e) => handleCopy(cue, e)}
                title="উদ্ধৃতি কপি করুন"
                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-amber-300 rounded transition-opacity"
              >
                {copiedId === cue.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
