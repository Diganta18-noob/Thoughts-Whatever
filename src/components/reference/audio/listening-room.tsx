"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles, Subtitles, ListMusic, FileDown, Radio } from "lucide-react";
import { useAudioEngine } from "./use-audio-engine";
import { useActiveCue } from "./use-active-cue";
import { WaveformTrack } from "./waveform-track";
import { PulseButton } from "./pulse-button";
import { CaptionStage } from "./caption-stage";
import { TranscriptScroller } from "./transcript-scroller";
import { TransportBar } from "./transport-bar";
import { AudioManifest } from "@/lib/reference/audio/types";
import { useAudio } from "@/components/providers/audio-provider";

interface ListeningRoomProps {
  work: {
    id: string;
    slug: string;
    titleBn: string;
    titleEn?: string | null;
    subtitleBn?: string | null;
    author?: { nameBn: string; slug: string } | null;
  };
  edition: {
    id: string;
    editionTitleBn?: string | null;
    publicationYear?: number | null;
    coverImage?: string | null;
    notes?: string | null;
  };
  audioAsset: {
    fileUrl: string;
    durationSec?: number | null;
    audioManifest: AudioManifest;
  };
}

export function ListeningRoom({ work, edition, audioAsset }: ListeningRoomProps) {
  const manifest = audioAsset.audioManifest;
  const cues = manifest?.cues || [];
  const peaks = manifest?.peaks || [];
  const durationSec = manifest?.durationSec || audioAsset.durationSec || 1765;

  // Ensure global miniplayer is closed to prevent double audio playback
  const globalAudio = useAudio();
  useEffect(() => {
    if (globalAudio?.track) {
      globalAudio.close();
    }
  }, [globalAudio]);

  // Audio Engine Hook
  const { state, actions } = useAudioEngine(audioAsset.fileUrl, durationSec);

  // Active Cue Hook (binary searched at 60fps)
  const activeCueInfo = useActiveCue(cues, state.currentTime);

  // Layout mode: "transcript" (split view) or "theatre" (captions focus)
  const [mode, setMode] = useState<"transcript" | "theatre">("transcript");

  // Load user mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tw_reference_audio_mode");
    if (saved === "theatre" || saved === "transcript") {
      setMode(saved);
    }
  }, []);

  const changeMode = (m: "transcript" | "theatre") => {
    setMode(m);
    localStorage.setItem("tw_reference_audio_mode", m);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-850/80 bg-zinc-950/85 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href={`/reference/${work.slug}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">রেফারেন্স ডসিয়ারে ফিরে যান</span>
          <span className="sm:hidden">Back</span>
        </Link>

        {/* Live Audio Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[0.6875rem] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              state.playing ? "bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" : "bg-zinc-600"
            }`}
          />
          <span className="text-zinc-300 uppercase tracking-wider font-semibold">
            {state.playing ? "শোনা হচ্ছে · Live Audio Pulse" : "ঐতিহাসিক অডিও পাঠকক্ষ"}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-xs font-mono">
          <button
            onClick={() => changeMode("transcript")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              mode === "transcript"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="hidden md:inline">পূর্ণাঙ্গ প্রতিলিপি</span>
          </button>
          <button
            onClick={() => changeMode("theatre")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
              mode === "theatre"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">থিয়েটার ক্যাপশন</span>
          </button>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-8 py-6 flex flex-col space-y-6">
        {/* Stage Hero Card */}
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-850 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient background glow synced to audio amplitude */}
          <div
            className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none transition-transform duration-100"
            style={{
              transform: `scale(${1 + state.amplitude * 0.4})`,
              opacity: 0.2 + state.amplitude * 0.5,
            }}
          />

          <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 relative z-10">
            {/* Album / Speaker Portrait with Realtime Pulse Aura */}
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 rounded-2xl bg-amber-500/30 blur-xl pointer-events-none transition-transform duration-100"
                style={{
                  transform: `scale(${1 + state.amplitude * 0.25})`,
                  opacity: state.playing ? 0.8 : 0,
                }}
              />
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl bg-zinc-900">
                {edition.coverImage ? (
                  <Image
                    src={edition.coverImage}
                    alt={work.titleBn}
                    fill
                    className="object-cover"
                    sizes="144px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Radio className="w-12 h-12" />
                  </div>
                )}
              </div>
            </div>

            {/* Metadata & Core Player Transport */}
            <div className="flex-1 w-full space-y-4 text-center md:text-left">
              <div>
                <span className="text-[0.6875rem] font-mono text-amber-400 uppercase tracking-widest font-semibold">
                  ১৯৭৪ ঐতিহাসিক কণ্ঠস্বর · Archival Voice Heritage
                </span>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bengali font-bold text-zinc-100 mt-1">
                  {work.titleBn}
                </h1>
                <p className="text-xs sm:text-sm font-bengali text-zinc-400 mt-1">
                  বক্তা: <strong className="text-zinc-200">{work.author?.nameBn || "দেবব্রত বিশ্বাস"}</strong> · রেকর্ডিং: ৫ই মার্চ ১৯৭৪
                </p>
              </div>

              {/* Main Play / Pulse Controller Row */}
              <div className="flex items-center justify-center md:justify-start gap-5 pt-1">
                <PulseButton
                  playing={state.playing}
                  amplitude={state.amplitude}
                  onClick={actions.toggle}
                />
                <div className="text-left">
                  <div className="text-sm sm:text-base font-bengali font-medium text-zinc-200">
                    {state.playing ? "অডিও চলমান..." : "শুনতে প্লে চাপুন"}
                  </div>
                  <div className="text-xs font-mono text-zinc-500">
                    দৈর্ঘ্য: ২৯ মিনিট ২৫ সেকেন্ড ({cues.length} টি সিঙ্কড বাক্য)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Waveform Track */}
          <div className="mt-6 pt-4 border-t border-zinc-850/80 space-y-2">
            <WaveformTrack
              peaks={peaks}
              currentTime={state.currentTime}
              duration={state.duration}
              amplitude={state.amplitude}
              playing={state.playing}
              onSeek={actions.seek}
            />

            {/* Transport Bar (±15s, playback rate, mute, audio download) */}
            <TransportBar
              currentTime={state.currentTime}
              duration={state.duration}
              rate={state.rate}
              isMuted={state.isMuted}
              onSkip={actions.skip}
              onSetRate={actions.setRate}
              onToggleMute={actions.toggleMute}
              audioUrl={audioAsset.fileUrl}
            />
          </div>
        </div>

        {/* Dynamic Display Area based on mode */}
        {mode === "theatre" ? (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
            <CaptionStage
              cue={activeCueInfo.cue}
              prevCue={activeCueInfo.prevCue}
              nextCue={activeCueInfo.nextCue}
              activeWordIndex={activeCueInfo.activeWordIndex}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Live Subtitle Banner (Left column / sticky on wide screens) */}
            <div className="lg:col-span-5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-6 shadow-xl sticky top-20">
              <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-4 pb-2 border-b border-zinc-800">
                <Subtitles className="w-4 h-4" />
                <span className="uppercase tracking-wider font-semibold">সক্রিয় ক্যাপশন · Live Caption</span>
              </div>
              <CaptionStage
                cue={activeCueInfo.cue}
                prevCue={activeCueInfo.prevCue}
                nextCue={activeCueInfo.nextCue}
                activeWordIndex={activeCueInfo.activeWordIndex}
              />
            </div>

            {/* Full Searchable & Scrollable Transcript (Right column) */}
            <div className="lg:col-span-7 h-[580px]">
              <TranscriptScroller
                cues={cues}
                activeCueIndex={activeCueInfo.cueIndex}
                onSeek={actions.seek}
                autoScroll={true}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer Reference Note */}
      <footer className="w-full border-t border-zinc-850 py-6 px-4 text-center text-xs text-zinc-500 font-serif">
        <p>
          Thoughts.Whatever ডিজিটাল আর্কাইভ · দেবব্রত বিশ্বাসের ঐতিহাসিক রবীন্দ্রসংগীত আলোচনা (১৯৭৪)।
          কপিরাইট ও স্বত্বাধিকার সংক্রান্ত বিস্তারিত তথ্যের জন্য সংস্করণ ডসিয়ার দেখুন।
        </p>
      </footer>
    </div>
  );
}
