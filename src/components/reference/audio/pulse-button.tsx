"use client";

import React from "react";
import { Play, Pause } from "lucide-react";

interface PulseButtonProps {
  playing: boolean;
  amplitude: number;
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}

export function PulseButton({ playing, amplitude, onClick, size = "lg" }: PulseButtonProps) {
  const scale = playing ? 1 + amplitude * 0.18 : 1;
  const glowOpacity = playing ? Math.min(0.85, 0.25 + amplitude * 0.7) : 0;
  const ringScale = playing ? 1 + amplitude * 0.45 : 1;

  const sizeClasses = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-16 h-16 sm:w-20 sm:h-20",
  }[size];

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-7 h-7 sm:w-9 sm:h-9",
  }[size];

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer audio pulse aura synced to amplitude */}
      <div
        className="absolute inset-0 rounded-full bg-amber-500 blur-xl pointer-events-none transition-transform duration-75"
        style={{
          opacity: glowOpacity,
          transform: `scale(${ringScale * 1.3})`,
        }}
      />

      {/* Ripple ring */}
      {playing && (
        <div
          className="absolute inset-0 rounded-full border border-amber-400/50 pointer-events-none transition-transform duration-100 ease-out"
          style={{
            transform: `scale(${ringScale * 1.2})`,
            opacity: Math.max(0, 0.7 - amplitude * 0.3),
          }}
        />
      )}

      {/* Main interactive button */}
      <button
        onClick={onClick}
        aria-label={playing ? "Pause" : "Play audio"}
        className={`relative ${sizeClasses} rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-zinc-950 shadow-2xl flex items-center justify-center transition-transform active:scale-95 hover:from-amber-300 hover:to-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/30`}
        style={{
          transform: `scale(${scale})`,
        }}
      >
        {playing ? (
          <Pause className={`${iconSizes} fill-current`} />
        ) : (
          <Play className={`${iconSizes} fill-current translate-x-0.5`} />
        )}
      </button>
    </div>
  );
}
