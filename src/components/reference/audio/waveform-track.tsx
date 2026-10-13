"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { formatTimecode } from "@/lib/reference/audio/types";

interface WaveformTrackProps {
  peaks: number[];
  currentTime: number;
  duration: number;
  amplitude: number;
  playing: boolean;
  onSeek: (seconds: number) => void;
}

export function WaveformTrack({
  peaks,
  currentTime,
  duration,
  amplitude,
  playing,
  onSeek,
}: WaveformTrackProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Draw the high-resolution precomputed waveform track + dynamic pulse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
    const playheadX = progress * width;

    // Resample peaks to fit canvas pixel columns (~2-3px per bar)
    const barWidth = 2.5;
    const gap = 1.5;
    const step = barWidth + gap;
    const totalBars = Math.floor(width / step);

    const peakRatio = peaks.length / totalBars;

    // Check reduced motion
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (let i = 0; i < totalBars; i++) {
      const x = i * step;
      const peakIdx = Math.floor(i * peakRatio);
      let rawVal = peaks[peakIdx] || 0.1;

      // Distance to playhead for ripple/pulse effect
      const distToPlayhead = Math.abs(x - playheadX);
      if (playing && !prefersReducedMotion && distToPlayhead < 60) {
        const pulseBoost = (1 - distToPlayhead / 60) * amplitude * 0.45;
        rawVal = Math.min(1, rawVal + pulseBoost);
      }

      // Height centered vertically
      const barH = Math.max(3, rawVal * (height - 8));
      const y = (height - barH) / 2;

      // Color coding: amber gradient for played, muted zinc for unplayed
      if (x <= playheadX) {
        // Active / played bars
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, "#fbbf24"); // amber-400
        grad.addColorStop(1, "#d97706"); // amber-600
        ctx.fillStyle = grad;
      } else {
        // Unplayed bars
        ctx.fillStyle = "rgba(113, 113, 122, 0.35)"; // zinc-500 @ 35%
      }

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 1);
      ctx.fill();
    }

    // Playhead indicator needle
    if (playheadX > 0 && playheadX < width) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "#f59e0b";
      ctx.shadowBlur = 8;
      ctx.fillRect(playheadX - 1, 0, 2, height);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }, [peaks, currentTime, duration, amplitude, playing]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const targetTime = (x / rect.width) * duration;

    setHoverX(x);
    setHoverTime(targetTime);

    if (isDragging) {
      seekFromPointer(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverTime(null);
      setHoverX(null);
    }
  };

  const seekFromPointer = useCallback(
    (clientX: number) => {
      if (!containerRef.current || duration <= 0) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const pct = clickX / rect.width;
      onSeek(pct * duration);
    },
    [duration, onSeek],
  );

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-16 sm:h-20 bg-zinc-950/80 rounded-xl border border-zinc-800/80 p-1 cursor-pointer select-none group touch-none transition-all hover:border-amber-500/40"
      role="slider"
      aria-label="Audio timeline waveform"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 5));
        if (e.key === "ArrowRight") onSeek(Math.min(duration, currentTime + 5));
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Hover scrubber tooltip */}
      {hoverTime !== null && hoverX !== null && (
        <div
          className="absolute -top-7 transform -translate-x-1/2 pointer-events-none z-20 bg-zinc-900 border border-zinc-700 text-amber-300 font-mono text-[0.625rem] px-2 py-0.5 rounded shadow-lg"
          style={{ left: `${hoverX}px` }}
        >
          {formatTimecode(hoverTime)}
        </div>
      )}
    </div>
  );
}
