"use client";

import Link from "next/link";
import { Pause, Play, X, Rewind, FastForward } from "lucide-react";
import { PLAYBACK_RATES, useAudio } from "@/components/providers/audio-provider";
import { formatBengaliDuration, toBengaliNumber } from "@/lib/bengali";
import { cn } from "@/lib/utils";

/**
 * The narration bar. Sits above everything, survives navigation, and stays
 * out of the way — one line on mobile, one line on desktop.
 */
export function MiniPlayer() {
  const { track, playing, currentTime, duration, rate, toggle, seek, setRate, close } =
    useAudio();

  if (!track) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      data-print="hide"
      className="fixed inset-x-0 bottom-0 z-40 animate-slide-up border-t border-rule bg-surface-raised/95 backdrop-blur"
    >
      {/* Scrubber sits on the top edge so it reads as the bar's own progress. */}
      <label className="sr-only" htmlFor="narration-scrubber">
        আবৃত্তির অগ্রগতি
      </label>
      <input
        id="narration-scrubber"
        type="range"
        min={0}
        max={Math.max(duration, 1)}
        step={1}
        value={currentTime}
        onChange={(e) => seek(Number(e.target.value))}
        className="absolute -top-1.5 h-3 w-full cursor-pointer appearance-none bg-transparent
          [&::-webkit-slider-runnable-track]:h-[3px] [&::-webkit-slider-runnable-track]:bg-rule
          [&::-webkit-slider-thumb]:mt-[-4.5px] [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-accent
          [&::-moz-range-track]:h-[3px] [&::-moz-range-track]:bg-rule
          [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent"
        aria-label="আবৃত্তির অগ্রগতি"
      />
      <div
        aria-hidden
        className="absolute -top-px h-[3px] bg-accent/70 transition-[width] duration-200"
        style={{ width: `${progress}%` }}
      />

      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "থামান" : "শুনুন"}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-surface transition hover:opacity-90"
        >
          {playing ? (
            <Pause className="h-4 w-4" fill="currentColor" />
          ) : (
            <Play className="h-4 w-4 translate-x-[1px]" fill="currentColor" />
          )}
        </button>

        <button
          type="button"
          onClick={() => seek(currentTime - 15)}
          aria-label="১৫ সেকেন্ড পিছনে"
          className="hidden h-8 w-8 shrink-0 place-items-center rounded-full text-content-soft transition hover:text-content sm:grid"
        >
          <Rewind className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => seek(currentTime + 15)}
          aria-label="১৫ সেকেন্ড সামনে"
          className="hidden h-8 w-8 shrink-0 place-items-center rounded-full text-content-soft transition hover:text-content sm:grid"
        >
          <FastForward className="h-4 w-4" />
        </button>

        <Link href={track.href} className="min-w-0 flex-1 group">
          <p className="truncate font-bengali text-[0.9375rem] leading-snug text-content group-hover:text-accent">
            {track.titleBn}
          </p>
          <p className="label mt-0.5 truncate normal-case tracking-normal">
            আবৃত্তি · {formatBengaliDuration(currentTime)}
            {duration > 0 && ` / ${formatBengaliDuration(duration)}`}
          </p>
        </Link>

        <div className="hidden items-center gap-1 sm:flex">
          {PLAYBACK_RATES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRate(r)}
              className={cn(
                "rounded px-1.5 py-1 font-mono text-[0.6875rem] transition",
                rate === r
                  ? "bg-accent/12 text-accent"
                  : "text-content-faint hover:text-content",
              )}
              aria-pressed={rate === r}
            >
              {toBengaliNumber(r)}×
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={close}
          aria-label="প্লেয়ার বন্ধ করুন"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-content-faint transition hover:text-content"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
