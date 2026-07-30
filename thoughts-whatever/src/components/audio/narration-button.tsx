"use client";

import { Pause, Play } from "lucide-react";
import { useAudio, type Track } from "@/components/providers/audio-provider";
import { formatBengaliDuration } from "@/lib/bengali";
import { cn } from "@/lib/utils";

/**
 * আবৃত্তি — start the narration.
 *
 * The audio is the reel voiceover, already recorded. For কবিতা especially,
 * hearing the piece read aloud is not a nice-to-have; it is how the form is
 * meant to arrive.
 */
export function NarrationButton({
  track,
  className,
}: {
  track: Track;
  className?: string;
}) {
  const { play, isCurrent, playing } = useAudio();
  const active = isCurrent(track.id);
  const isPlaying = active && playing;

  return (
    <button
      type="button"
      data-print="hide"
      onClick={() => play(track)}
      aria-pressed={isPlaying}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-xs transition",
        active
          ? "border-accent/50 bg-accent/5 text-accent"
          : "border-rule text-content-soft hover:border-content-faint hover:text-content",
        className,
      )}
    >
      {isPlaying ? (
        <Pause className="h-3.5 w-3.5" fill="currentColor" />
      ) : (
        <Play className="h-3.5 w-3.5" fill="currentColor" />
      )}
      <span className="font-bengali-sans">আবৃত্তি শুনুন</span>
      {track.durationSec ? (
        <span className="font-mono text-[0.6875rem] opacity-70">
          {formatBengaliDuration(track.durationSec)}
        </span>
      ) : null}
    </button>
  );
}
