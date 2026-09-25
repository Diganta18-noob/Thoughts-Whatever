"use client";

import React from "react";
import { Cue } from "@/lib/reference/audio/types";

interface CaptionStageProps {
  cue: Cue | null;
  prevCue: Cue | null;
  nextCue: Cue | null;
  activeWordIndex: number;
}

export function CaptionStage({ cue, prevCue, nextCue, activeWordIndex }: CaptionStageProps) {
  if (!cue) {
    return (
      <div className="w-full min-h-[220px] flex items-center justify-center p-6 text-center text-zinc-500 font-bengali text-lg italic">
        প্লে বোতাম চেপে ১৯৪ সালের অডিও এবং রিয়েল-টাইম বাংলা ক্যাপশন শুরু করুন...
      </div>
    );
  }

  return (
    <div className="w-full min-h-[220px] flex flex-col justify-center items-center text-center p-6 sm:p-10 space-y-4">
      {/* Previous sentence (faded) */}
      {prevCue && (
        <p className="text-xs sm:text-sm font-bengali text-zinc-600 line-clamp-1 transition-opacity duration-300">
          {prevCue.text}
        </p>
      )}

      {/* Active sentence with word-level highlight / karaoke */}
      <div className="text-xl sm:text-2xl md:text-3xl font-bengali font-medium text-zinc-100 leading-relaxed max-w-4xl tracking-wide">
        {cue.words && cue.words.length > 0 ? (
          cue.words.map((word, idx) => {
            const isWordActive = idx === activeWordIndex;
            const isWordPast = idx < activeWordIndex;

            return (
              <span
                key={idx}
                className={`transition-colors duration-150 inline-block mr-1.5 ${
                  isWordActive
                    ? "text-amber-400 font-bold scale-[1.03] drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                    : isWordPast
                    ? "text-zinc-200"
                    : "text-zinc-500"
                }`}
              >
                {word.text}
              </span>
            );
          })
        ) : (
          <span className="text-amber-300">{cue.text}</span>
        )}
      </div>

      {/* Next sentence (hint) */}
      {nextCue && (
        <p className="text-xs sm:text-sm font-bengali text-zinc-600 line-clamp-1 transition-opacity duration-300">
          {nextCue.text}
        </p>
      )}
    </div>
  );
}
