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
    <div className="flex items-center justify-between flex-wrap gap-4 py-2 border-t border-zinc-800/80 text-zinc-400 text-xs font-mono">
      {/* Timecode */}
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-100 font-bold">{formatTimecode(currentTime)}</span>
        <span className="text-zinc-600">/</span>
        <span className="text-zinc-500">{formatTimecode(duration)}</span>
      </div>

      {/* Skips and Rate controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => onSkip(-15)}
          title="১৫ সেকেন্ড পেছনে যান"
          className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-amber-400 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[0.625rem]">-15s</span>
        </button>

        <button
          onClick={() => onSkip(15)}
          title="১৫ সেকেন্ড সামনে যান"
          className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-amber-400 transition-colors flex items-center gap-1"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="text-[0.625rem]">+15s</span>
        </button>

        <button
          onClick={cycleRate}
          title="গতি পরিবর্তন করুন"
          className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 text-amber-400 font-bold transition-colors"
        >
          {rate}x
        </button>

        <button
          onClick={onToggleMute}
          title={isMuted ? "শব্দ অন করুন" : "শব্দ বন্ধ করুন"}
          className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-zinc-200 transition-colors"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Download Action */}
      {audioUrl && (
        <a
          href={audioUrl}
          target="_blank"
          rel="noreferrer"
          download
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
        >
          <Download className="w-3 h-3 text-amber-400" />
          <span>অডিও ফাইল (.m4a)</span>
        </a>
      )}
    </div>
  );
}
