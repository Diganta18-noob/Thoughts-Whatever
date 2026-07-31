"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * আবৃত্তি — narration playback.
 *
 * One <audio> element lives at the root of the app and never unmounts, so a
 * recitation keeps playing while the reader browses to another piece. This is
 * the whole reason the player is a provider rather than a per-page component.
 */

export type Track = {
  id: string;
  titleBn: string;
  subtitleBn?: string | null;
  src: string;
  href: string;
  durationSec?: number | null;
};

type Ctx = {
  track: Track | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  play: (track: Track) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  setRate: (rate: number) => void;
  close: () => void;
  isCurrent: (id: string) => boolean;
};

const AudioContext = createContext<Ctx | null>(null);

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5] as const;

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);

  const play = useCallback(
    (next: Track) => {
      const el = ref.current;
      if (!el) return;

      // Same track — treat a second press as pause/resume rather than restart.
      if (track?.id === next.id) {
        if (el.paused) void el.play();
        else el.pause();
        return;
      }

      setTrack(next);
      setCurrentTime(0);
      setDuration(next.durationSec ?? 0);
      el.src = next.src;
      el.playbackRate = rate;
      void el.play().catch(() => setPlaying(false));
    },
    [track, rate],
  );

  const toggle = useCallback(() => {
    const el = ref.current;
    if (!el || !track) return;
    if (el.paused) void el.play();
    else el.pause();
  }, [track]);

  const seek = useCallback((seconds: number) => {
    const el = ref.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(seconds, el.duration || seconds));
    setCurrentTime(el.currentTime);
  }, []);

  const setRate = useCallback((next: number) => {
    setRateState(next);
    if (ref.current) ref.current.playbackRate = next;
  }, []);

  const close = useCallback(() => {
    const el = ref.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setTrack(null);
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  const isCurrent = useCallback((id: string) => track?.id === id, [track]);

  // Keep the OS media controls (lock screen, headphone buttons) in sync.
  useEffect(() => {
    if (!track || typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.titleBn,
      artist: track.subtitleBn || "আবৃত্তি",
      album: "Thoughts Whatever",
    });
    navigator.mediaSession.setActionHandler("play", () => ref.current?.play());
    navigator.mediaSession.setActionHandler("pause", () => ref.current?.pause());
    navigator.mediaSession.setActionHandler("seekbackward", () =>
      seek((ref.current?.currentTime ?? 0) - 15),
    );
    navigator.mediaSession.setActionHandler("seekforward", () =>
      seek((ref.current?.currentTime ?? 0) + 15),
    );
  }, [track, seek]);

  const value = useMemo(
    () => ({
      track,
      playing,
      currentTime,
      duration,
      rate,
      play,
      toggle,
      seek,
      setRate,
      close,
      isCurrent,
    }),
    [track, playing, currentTime, duration, rate, play, toggle, seek, setRate, close, isCurrent],
  );

  return (
    <AudioContext.Provider value={value}>
      {children}
      <audio
        ref={ref}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
        }}
      />
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used inside <AudioProvider>");
  return ctx;
}
