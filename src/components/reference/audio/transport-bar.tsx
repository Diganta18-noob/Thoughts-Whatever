"use client";

import React from "react";
import { formatTimecode } from "@/lib/reference/audio/types";
import { RotateCcw, RotateCw, Volume2, VolumeX, Download } from "lucide-react";

interface TransportBarProps {
  currentTime: number;
  duration: number;
  rate: number;
  isMuted: boolean;
  onSkip: (seconds: number) => void;
  onSetRate: (rate: number) => void;
  onToggleMute: () => void;
  audioUrl?: string | null;
}

const RATES = [0.75, 1, 1.25, 1.5];

export function TransportBar({
  currentTime,
  duration,
  rate,
  isMuted,
  onSkip,
  onSetRate,
  onToggleMute,
  audioUrl,
}: TransportBarProps) {
  const cycleRate = () => {
    const curIdx = RATES.indexOf(rate);
    const nextIdx = (curIdx + 1) % RATES.length;
    onSetRate(RATES[nextIdx]);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 pt-3 pb-1 border-t border-zinc-850/80 text-zinc-400 text-xs font-mono">
      {/* Timecode & Playback Stats */}
      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        <div className="flex items-center gap-1.5 bg-zinc-900/80 px-2.5 py-1 rounded-lg border border-zinc-800/60">
          <span className="text-zinc-100 font-bold tracking-wider">{formatTimecode(currentTime)}</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400">{formatTimecode(duration)}</span>
        </div>

        {/* Mobile-only download quick link */}
        {audioUrl && (
          <a
            href={audioUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[0.6875rem] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Download className="w-3 h-3 text-amber-400" />
            <span>.m4a</span>
          </a>
        )}
      </div>

      {/* Skips, Rate, and Mute Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto">
        <button
          onClick={() => onSkip(-15)}
          title="১৫ সেকেন্ড পেছনে যান"
          className="p-2 sm:p-1.5 rounded-lg bg-zinc-900/50 sm:bg-transparent border border-zinc-800 sm:border-transparent hover:bg-zinc-800/80 hover:text-amber-400 transition-colors flex items-center gap-1 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[0.6875rem] font-bold">-15s</span>
        </button>

        <button
          onClick={() => onSkip(15)}
          title="১৫ সেকেন্ড সামনে যান"
          className="p-2 sm:p-1.5 rounded-lg bg-zinc-900/50 sm:bg-transparent border border-zinc-800 sm:border-transparent hover:bg-zinc-800/80 hover:text-amber-400 transition-colors flex items-center gap-1 active:scale-95"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="text-[0.6875rem] font-bold">+15s</span>
        </button>

        <button
          onClick={cycleRate}
          title="গতি পরিবর্তন করুন"
          className="px-2.5 py-1.5 sm:py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-amber-400 font-bold transition-all active:scale-95"
        >
          {rate}x
        </button>

        <button
          onClick={onToggleMute}
          title={isMuted ? "শব্দ চালু করুন" : "শব্দ মিউট করুন"}
          className="p-2 sm:p-1.5 rounded-lg bg-zinc-900/50 sm:bg-transparent border border-zinc-800 sm:border-transparent hover:bg-zinc-800/80 hover:text-zinc-200 transition-colors active:scale-95"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Desktop Download Action */}
      {audioUrl && (
        <a
          href={audioUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-zinc-100 hover:border-zinc-700 text-xs transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span>অডিও ফাইল (.m4a)</span>
        </a>
      )}
    </div>
  );
}
