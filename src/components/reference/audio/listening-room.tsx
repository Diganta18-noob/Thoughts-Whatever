"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Subtitles, ListMusic, Radio, Layers } from "lucide-react";
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

  // Mobile sub-tab view mode: "both" | "caption" | "transcript"
  const [mobileTab, setMobileTab] = useState<"both" | "caption" | "transcript">("transcript");

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
      {/* Top Header Bar (Mobile & Tablet optimized) */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-850/80 bg-zinc-950/90 backdrop-blur-md px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
        <Link
          href={`/reference/${work.slug}`}
          className="inline-flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-100 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span className="hidden sm:inline">রেফারেন্স ডসিয়ারে ফিরে যান</span>
          <span className="sm:hidden text-[0.75rem]">ডসিয়ার</span>
        </Link>

        {/* Live Audio Status Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[0.6875rem] font-mono shrink-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              state.playing ? "bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" : "bg-zinc-600"
            }`}
          />
          <span className="text-zinc-300 uppercase tracking-wider font-semibold">
            {state.playing ? (
              <>
                <span className="hidden sm:inline">শোনা হচ্ছে · Live Audio Pulse</span>
                <span className="sm:hidden">LIVE PULSE</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">ঐতিহাসিক অডিও পাঠকক্ষ</span>
                <span className="sm:hidden">অডিও কক্ষ</span>
              </>
            )}
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg text-xs font-mono shrink-0">
          <button
            onClick={() => changeMode("transcript")}
            title="পূর্ণাঙ্গ প্রতিলিপি ও ক্যাপশন"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-colors ${
              mode === "transcript"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="hidden md:inline">পূর্ণাঙ্গ প্রতিলিপি</span>
            <span className="md:hidden text-[0.6875rem]">প্রতিলিপি</span>
          </button>
          <button
            onClick={() => changeMode("theatre")}
            title="থিয়েটার ক্যাপশন ভিউ"
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-colors ${
              mode === "theatre"
                ? "bg-amber-500 text-zinc-950 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span className="hidden md:inline">থিয়েটার</span>
            <span className="md:hidden text-[0.6875rem]">থিয়েটার</span>
          </button>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-3 sm:px-6 md:px-8 py-4 sm:py-6 flex flex-col space-y-5 sm:space-y-6">
        {/* Stage Hero Card */}
        <div className="bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-850 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient background glow synced to audio amplitude */}
          <div
            className="absolute top-0 right-1/4 w-80 sm:w-96 h-80 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none transition-transform duration-100"
            style={{
              transform: `scale(${1 + state.amplitude * 0.4})`,
              opacity: 0.2 + state.amplitude * 0.5,
            }}
          />

          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-6 md:gap-8 relative z-10 text-center sm:text-left">
            {/* Album / Speaker Portrait with Realtime Pulse Aura */}
            <div className="relative shrink-0">
              <div
                className="absolute inset-0 rounded-2xl bg-amber-500/30 blur-xl pointer-events-none transition-transform duration-100"
                style={{
                  transform: `scale(${1 + state.amplitude * 0.25})`,
                  opacity: state.playing ? 0.8 : 0,
                }}
              />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-zinc-700 shadow-2xl bg-zinc-900">
                {edition.coverImage ? (
                  <Image
                    src={edition.coverImage}
                    alt={work.titleBn}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 144px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Radio className="w-10 h-10" />
                  </div>
                )}
              </div>
            </div>

            {/* Metadata & Core Player Transport */}
            <div className="flex-1 w-full space-y-3 sm:space-y-4">
              <div>
                <span className="text-[0.625rem] sm:text-[0.6875rem] font-mono text-amber-400 uppercase tracking-widest font-semibold">
                  ১৯৭৪ ঐতিহাসিক কণ্ঠস্বর · Archival Voice Heritage
                </span>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bengali font-bold text-zinc-100 mt-1 leading-snug">
                  {work.titleBn}
                </h1>
                <p className="text-xs sm:text-sm font-bengali text-zinc-400 mt-1">
                  বক্তা: <strong className="text-zinc-200">{work.author?.nameBn || "দেবব্রত বিশ্বাস"}</strong> · রেকর্ডিং: ৫ই মার্চ ১৯৭৪
                </p>
              </div>

              {/* Main Play / Pulse Controller Row */}
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-1">
                <PulseButton
                  playing={state.playing}
                  amplitude={state.amplitude}
                  onClick={actions.toggle}
                />
                <div className="text-left">
                  <div className="text-sm sm:text-base font-bengali font-medium text-zinc-200">
                    {state.playing ? "অডিও চলমান..." : "শুনতে প্লে চাপুন"}
                  </div>
                  <div className="text-[0.6875rem] sm:text-xs font-mono text-zinc-500">
                    দৈর্ঘ্য: ২৯ মিনিট ২৫ সেকেন্ড ({cues.length} টি সিঙ্কড বাক্য)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Waveform Track */}
          <div className="mt-5 sm:mt-6 pt-3 sm:pt-4 border-t border-zinc-850/80 space-y-2">
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
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
            <CaptionStage
              cue={activeCueInfo.cue}
              prevCue={activeCueInfo.prevCue}
              nextCue={activeCueInfo.nextCue}
              activeWordIndex={activeCueInfo.activeWordIndex}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile View Selector Tabs (< md only) */}
            <div className="md:hidden flex items-center justify-center p-1 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs font-mono">
              <button
                onClick={() => setMobileTab("transcript")}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bengali text-xs transition-colors ${
                  mobileTab === "transcript"
                    ? "bg-amber-500 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                প্রতিলিপি
              </button>
              <button
                onClick={() => setMobileTab("caption")}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bengali text-xs transition-colors ${
                  mobileTab === "caption"
                    ? "bg-amber-500 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                লাইভ ক্যাপশন
              </button>
              <button
                onClick={() => setMobileTab("both")}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bengali text-xs transition-colors ${
                  mobileTab === "both"
                    ? "bg-amber-500 text-zinc-950 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                উভয় দৃশ্য
              </button>
            </div>

            {/* Responsive Split Grid: md:grid-cols-12 supports both Tablets (iPad 768px+) and Desktop! */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6 items-start">
              {/* Live Subtitle Banner (Left column / sticky on tablet & desktop) */}
              <div
                className={`md:col-span-5 bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-xl md:sticky md:top-20 ${
                  mobileTab === "transcript" ? "hidden md:block" : "block"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-3 sm:mb-4 pb-2 border-b border-zinc-800">
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
              <div
                className={`md:col-span-7 h-[460px] sm:h-[520px] md:h-[580px] ${
                  mobileTab === "caption" ? "hidden md:block" : "block"
                }`}
              >
                <TranscriptScroller
                  cues={cues}
                  activeCueIndex={activeCueInfo.cueIndex}
                  onSeek={actions.seek}
                  autoScroll={true}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Reference Note */}
      <footer className="w-full border-t border-zinc-850 py-5 sm:py-6 px-4 text-center text-xs text-zinc-500 font-serif">
        <p className="max-w-2xl mx-auto leading-relaxed">
          Thoughts.Whatever ডিজিটাল আর্কাইভ · দেবব্রত বিশ্বাসের ঐতিহাসিক রবীন্দ্রসংগীত আলোচনা (১৯৭৪)।
          কপিরাইট ও স্বত্বাধিকার সংক্রান্ত তথ্যের জন্য সংস্করণ ডসিয়ার দেখুন।
        </p>
      </footer>
    </div>
  );
}
