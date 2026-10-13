"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Cue, formatTimecode } from "@/lib/reference/audio/types";
import { Search, Copy, Check, ArrowDownCircle, Lock, Unlock, X } from "lucide-react";

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
  const isProgrammaticScrollRef = useRef(false);

  const [filterQuery, setFilterQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(autoScroll);
  const [userHasScrolledAway, setUserHasScrolledAway] = useState(false);

  // Smoothly scroll container ONLY (never moves window/page viewport)
  const scrollToActiveItem = useCallback(() => {
    const container = containerRef.current;
    const activeItem = activeItemRef.current;
    if (!container || !activeItem) return;

    isProgrammaticScrollRef.current = true;
    const itemOffsetTop = activeItem.offsetTop;
    const containerHeight = container.clientHeight;
    const itemHeight = activeItem.clientHeight;

    const targetTop = itemOffsetTop - containerHeight / 2 + itemHeight / 2;

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });

    // Reset programmatic scroll flag after animation
    setTimeout(() => {
      isProgrammaticScrollRef.current = false;
    }, 500);
  }, []);

  // Follow active cue if autoScroll is enabled and user hasn't scrolled away
  useEffect(() => {
    if (autoScrollEnabled && !userHasScrolledAway) {
      scrollToActiveItem();
    }
  }, [activeCueIndex, autoScrollEnabled, userHasScrolledAway, scrollToActiveItem]);

  // Detect when user manually scrolls or touches the container
  const handleUserScrollInteraction = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    setUserHasScrolledAway(true);
  }, []);

  const handleResumeSync = () => {
    setUserHasScrolledAway(false);
    setAutoScrollEnabled(true);
    scrollToActiveItem();
  };

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
    <div className="relative flex flex-col h-full bg-zinc-950/70 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
      {/* Search & Toolbar Header */}
      <div className="p-3 sm:p-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="প্রতিলিপিতে খুঁজুন..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
          />
          {filterQuery && (
            <button
              onClick={() => setFilterQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Auto-scroll mode toggle pill button */}
        <button
          onClick={() => {
            const next = !autoScrollEnabled;
            setAutoScrollEnabled(next);
            if (next) {
              setUserHasScrolledAway(false);
              scrollToActiveItem();
            }
          }}
          title={autoScrollEnabled ? "স্বয়ংক্রিয় স্ক্রোল চালু (ক্লিক করে বন্ধ করুন)" : "স্বয়ংক্রিয় স্ক্রোল বন্ধ (ক্লিক করে চালু করুন)"}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors shrink-0 ${
            autoScrollEnabled && !userHasScrolledAway
              ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {autoScrollEnabled && !userHasScrolledAway ? (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">অটো-সিঙ্ক চালু</span>
            </>
          ) : (
            <>
              <Unlock className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden sm:inline">অটো-সিঙ্ক বন্ধ</span>
            </>
          )}
        </button>

        <span className="text-[0.6875rem] font-mono text-zinc-500 shrink-0 hidden md:inline">
          {filteredCues.length} টি বাক্য
        </span>
      </div>

      {/* Transcript Items List */}
      <div
        ref={containerRef}
        onWheel={handleUserScrollInteraction}
        onTouchMove={handleUserScrollInteraction}
        className="flex-1 overflow-y-auto divide-y divide-zinc-900/80 p-2 sm:p-4 space-y-1 custom-scrollbar min-h-[350px] max-h-[520px] lg:max-h-[600px]"
      >
        {filteredCues.map((cue) => {
          const isActive = cue.id === activeCueIndex;

          return (
            <div
              key={cue.id}
              ref={isActive ? activeItemRef : null}
              onClick={() => {
                onSeek(cue.start);
                setUserHasScrolledAway(false);
              }}
              className={`group flex items-start gap-2.5 sm:gap-3.5 p-3 sm:p-3.5 rounded-xl cursor-pointer transition-all duration-200 select-text ${
                isActive
                  ? "bg-amber-500/15 border-l-4 border-amber-400 text-zinc-100 shadow-md ring-1 ring-amber-500/20"
                  : "hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {/* Timestamp badge */}
              <button
                type="button"
                className={`font-mono text-xs px-2 sm:px-2.5 py-1 rounded-md shrink-0 transition-colors ${
                  isActive
                    ? "bg-amber-400 text-zinc-950 font-bold shadow-sm"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-amber-400 group-hover:border-zinc-700"
                }`}
              >
                {formatTimecode(cue.start)}
              </button>

              {/* Text */}
              <div className="flex-1 text-sm sm:text-base font-bengali leading-relaxed pt-0.5">
                {cue.text}
              </div>

              {/* Action buttons (Copy quote) */}
              <button
                type="button"
                onClick={(e) => handleCopy(cue, e)}
                title="উদ্ধৃতি কপি করুন"
                className="opacity-70 sm:opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-amber-300 rounded-lg transition-opacity shrink-0"
              >
                {copiedId === cue.id ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Floating "Resume Auto-scroll" Pill Button */}
      {userHasScrolledAway && autoScrollEnabled && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={handleResumeSync}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-zinc-950 font-bengali font-bold text-xs sm:text-sm shadow-xl hover:bg-amber-400 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>চলমান বাক্যে ফিরে যান (অটো-সিঙ্ক)</span>
          </button>
        </div>
      )}
    </div>
  );
}
