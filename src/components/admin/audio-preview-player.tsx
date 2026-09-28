"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { formatDuration } from "@/lib/media-policy";

interface AudioPreviewPlayerProps {
  url: string;
  filename: string;
  initialDuration?: number | null;
  className?: string;
  autoPlay?: boolean;
}

export function AudioPreviewPlayer({
  url,
  filename,
  initialDuration,
  className = "",
}: AudioPreviewPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(initialDuration || 0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize audio element state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      setError("Unable to play audio");
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [url]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        setError(null);
      }).catch((e) => {
        console.warn("Audio play prevented:", e);
        setError("Audio playback error");
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current;
    const audio = audioRef.current;
    if (!bar || !audio || !duration) return;

    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  // Waveform bars simulation
  const waveformHeights = [
    30, 45, 75, 60, 90, 40, 65, 85, 50, 70, 95, 60, 40, 80, 55, 90, 70, 45, 85, 60, 35, 75, 90, 50, 65, 40, 80, 55,
  ];

  return (
    <div
      className={`rounded-card border border-rule/80 bg-surface-raised/70 p-4 shadow-sm font-sans ${className}`}
      role="region"
      aria-label={`Audio player for ${filename}`}
    >
      <audio ref={audioRef} src={url} preload="metadata" />

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-surface shadow transition hover:opacity-90 active:scale-95 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-content" title={filename}>
              {filename}
            </p>
            <p className="font-mono text-[11px] text-content-soft">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            aria-label="Restart audio"
            className="rounded p-1.5 text-content-soft hover:text-content hover:bg-surface transition"
            title="Restart"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="rounded p-1.5 text-content-soft hover:text-content hover:bg-surface transition"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-3.5 w-3.5 text-danger" /> : <Volume2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Simulated Waveform & Progress Scrubber */}
      <div
        ref={progressRef}
        onClick={handleSeek}
        className="group relative h-9 w-full cursor-pointer rounded bg-surface/80 p-1 flex items-end gap-1 overflow-hidden select-none border border-rule/50"
        role="slider"
        aria-label="Audio playback scrubber"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (!audioRef.current) return;
          if (e.key === "ArrowRight") audioRef.current.currentTime = Math.min(duration, currentTime + 5);
          if (e.key === "ArrowLeft") audioRef.current.currentTime = Math.max(0, currentTime - 5);
          if (e.key === " ") {
            e.preventDefault();
            togglePlay();
          }
        }}
      >
        {waveformHeights.map((h, i) => {
          const barPercent = (i / waveformHeights.length) * 100;
          const isPassed = barPercent <= progressPercent;
          return (
            <div
              key={i}
              className={`flex-1 rounded-xs transition-all duration-100 ${
                isPassed ? "bg-accent" : "bg-content-faint/30 group-hover:bg-content-faint/50"
              } ${isPlaying ? "motion-safe:animate-pulse" : ""}`}
              style={{
                height: `${h}%`,
                animationDelay: `${(i % 5) * 80}ms`,
              }}
            />
          );
        })}

        {/* Playhead Indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-accent shadow pointer-events-none transition-[left] duration-75"
          style={{ left: `${progressPercent}%` }}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-[11px] text-danger font-sans">{error}</p>
      )}
    </div>
  );
}
