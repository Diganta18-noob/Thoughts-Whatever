"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioEngineState {
  playing: boolean;
  currentTime: number;
  duration: number;
  rate: number;
  amplitude: number; // 0..1 real-time audio energy / pulse level
  volume: number;
  isMuted: boolean;
  isLoading: boolean;
  hasAudioContext: boolean;
}

export interface AudioEngineActions {
  play: () => Promise<void>;
  pause: () => void;
  toggle: () => Promise<void>;
  seek: (seconds: number) => void;
  skip: (seconds: number) => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

export function useAudioEngine(src: string, initialDuration: number = 0) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const [state, setState] = useState<AudioEngineState>({
    playing: false,
    currentTime: 0,
    duration: initialDuration,
    rate: 1,
    amplitude: 0,
    volume: 1,
    isMuted: false,
    isLoading: true,
    hasAudioContext: false,
  });

  // Setup <audio> element
  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audio.src = src;
    audioRef.current = audio;

    const onPlay = () => setState((s) => ({ ...s, playing: true }));
    const onPause = () => setState((s) => ({ ...s, playing: false }));
    const onEnded = () => setState((s) => ({ ...s, playing: false, currentTime: 0 }));
    const onTimeUpdate = () => {
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    };
    const onLoadedMetadata = () => {
      setState((s) => ({
        ...s,
        duration: Number.isFinite(audio.duration) ? audio.duration : initialDuration,
        isLoading: false,
      }));
    };
    const onWaiting = () => setState((s) => ({ ...s, isLoading: true }));
    const onCanPlay = () => setState((s) => ({ ...s, isLoading: false }));

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.pause();
      audio.src = "";
    };
  }, [src, initialDuration]);

  // Lazy initialize AudioContext on user interaction
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current || !audioRef.current || typeof window === "undefined") {
      return;
    }
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const sourceNode = ctx.createMediaElementSource(audioRef.current);
      sourceNode.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = sourceNode;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      setState((s) => ({ ...s, hasAudioContext: true }));
    } catch {
      // Cross-origin restriction fallback: synthetic pulse will be used
      setState((s) => ({ ...s, hasAudioContext: false }));
    }
  }, []);

  // Animation frame loop for real-time amplitude/pulse calculation
  useEffect(() => {
    let lastTime = performance.now();

    const sample = (now: number) => {
      if (state.playing) {
        let amp = 0;
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;

        if (analyser && dataArray) {
          analyser.getByteFrequencyData(dataArray as any);
          // Focus on voice frequency range (buckets 2 to 36)
          let sum = 0;
          let count = 0;
          for (let i = 2; i < Math.min(36, dataArray.length); i++) {
            sum += dataArray[i];
            count++;
          }
          const rawAmp = count > 0 ? sum / (count * 255) : 0;
          amp = rawAmp;
        }

        // If Web Audio API graph is silent (e.g. cross-origin muted) or zero,
        // use an organic breathing envelope during active playback
        if (amp < 0.02) {
          const delta = (now - lastTime) / 1000;
          const breath = Math.sin(now * 0.005) * 0.25 + 0.45;
          const flutter = Math.sin(now * 0.013) * 0.15;
          amp = Math.max(0.15, Math.min(0.9, breath + flutter));
        }

        setState((s) => ({ ...s, amplitude: amp }));
      } else {
        setState((s) => (s.amplitude > 0.01 ? { ...s, amplitude: s.amplitude * 0.85 } : s));
      }

      lastTime = now;
      rafIdRef.current = requestAnimationFrame(sample);
    };

    rafIdRef.current = requestAnimationFrame(sample);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [state.playing]);

  const play = useCallback(async () => {
    initAudioContext();
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
    if (audioRef.current) {
      await audioRef.current.play();
    }
  }, [initAudioContext]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const toggle = useCallback(async () => {
    if (state.playing) {
      pause();
    } else {
      await play();
    }
  }, [state.playing, pause, play]);

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      const clamped = Math.max(0, Math.min(seconds, audioRef.current.duration || 999999));
      audioRef.current.currentTime = clamped;
      setState((s) => ({ ...s, currentTime: clamped }));
    }
  }, []);

  const skip = useCallback(
    (seconds: number) => {
      if (audioRef.current) {
        seek(audioRef.current.currentTime + seconds);
      }
    },
    [seek],
  );

  const setRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setState((s) => ({ ...s, rate }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setState((s) => ({ ...s, volume, isMuted: volume === 0 }));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const nextMuted = !audioRef.current.muted;
      audioRef.current.muted = nextMuted;
      setState((s) => ({ ...s, isMuted: nextMuted }));
    }
  }, []);

  return {
    state,
    actions: {
      play,
      pause,
      toggle,
      seek,
      skip,
      setRate,
      setVolume,
      toggleMute,
    },
  };
}
