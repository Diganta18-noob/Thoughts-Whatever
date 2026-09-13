"use client";

import React, { useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, ExternalLink, FileText } from "lucide-react";

interface OnlineReaderClientProps {
  workTitle: string;
  pdfUrl?: string | null;
  transcriptText?: string | null;
  sourceUrl?: string | null;
  sourceName?: string;
}

export function OnlineReaderClient({
  workTitle,
  pdfUrl,
  transcriptText,
  sourceUrl,
  sourceName,
}: OnlineReaderClientProps) {
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<"dark" | "sepia" | "paper">("dark");
  const [isFullscreen, setIsFullscreen] = useState(false);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  const themeStyles = {
    dark: "bg-zinc-950 text-zinc-200 border-zinc-800",
    sepia: "bg-[#28241e] text-[#f4ecd8] border-[#3d372e]",
    paper: "bg-[#1f2022] text-[#e8e6e3] border-zinc-700",
  };

  return (
    <div className={`flex-1 flex flex-col ${themeStyles[theme]} transition-colors duration-300`}>
      {/* Control Bar */}
      <div className="border-b border-inherit px-4 py-2 flex items-center justify-between text-xs font-mono">
        {/* Typography Controls (only relevant if transcript text exists) */}
        <div className="flex items-center gap-2">
          {transcriptText && (
            <div className="flex items-center gap-1 border border-inherit rounded-lg p-1">
              <button
                onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                className="px-2 py-0.5 hover:bg-white/10 rounded"
                title="ছোট হরফ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 text-zinc-400">{fontSize}px</span>
              <button
                onClick={() => setFontSize((s) => Math.min(32, s + 2))}
                className="px-2 py-0.5 hover:bg-white/10 rounded"
                title="বড় হরফ"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Theme Selector */}
          <div className="flex items-center gap-1 border border-inherit rounded-lg p-1">
            <button
              onClick={() => setTheme("dark")}
              className={`px-2 py-0.5 rounded ${theme === "dark" ? "bg-white/20 font-bold" : "opacity-60"}`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme("sepia")}
              className={`px-2 py-0.5 rounded ${theme === "sepia" ? "bg-white/20 font-bold" : "opacity-60"}`}
            >
              Sepia
            </button>
            <button
              onClick={() => setTheme("paper")}
              className={`px-2 py-0.5 rounded ${theme === "paper" ? "bg-white/20 font-bold" : "opacity-60"}`}
            >
              Paper
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 border border-inherit rounded-lg hover:bg-white/10"
            title="পূর্ণ পর্দা"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Reader Content Area */}
      <div className="flex-1 flex justify-center p-4 sm:p-8 overflow-y-auto">
        {pdfUrl ? (
          <div className="w-full max-w-5xl h-[85vh] bg-zinc-900 rounded-xl overflow-hidden border border-inherit shadow-2xl">
            <iframe
              src={`${pdfUrl}#toolbar=1`}
              className="w-full h-full border-0"
              title={workTitle}
            />
          </div>
        ) : transcriptText ? (
          <div
            style={{ fontSize: `${fontSize}px` }}
            className="w-full max-w-3xl font-serif leading-loose tracking-normal space-y-6 py-4"
          >
            <div className="text-center pb-8 border-b border-inherit">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                {workTitle}
              </h2>
              <p className="font-mono text-xs opacity-60">
                ডিজিটাল পাঠ্য সংস্করণ — Thoughts.Whatever সংগ্রহ
              </p>
            </div>

            <div className="whitespace-pre-line text-justify hyphens-auto">
              {transcriptText}
            </div>
          </div>
        ) : sourceUrl ? (
          <div className="w-full max-w-xl my-auto text-center p-8 border border-inherit rounded-2xl bg-white/5 space-y-4">
            <FileText className="w-12 h-12 mx-auto text-emerald-400" />
            <h3 className="font-serif text-xl font-bold">
              মূল প্রাতিষ্ঠানিক ডিজিটাল সংস্করণ
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              এই উপাদানটির পূর্ণাঙ্গ ডিজিটাল কপিটি সংরক্ষণ করেছে <strong>{sourceName}</strong>। আমাদের অধিকার নীতি অনুযায়ী আমরা সরাসরি এই ফাইলটি হোস্ট করি না। নিচের বোতামে ক্লিক করে সরাসরি মূল সংগ্রহাগারে পাঠ করুন।
            </p>
            <div className="pt-2">
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-mono text-xs font-semibold rounded-lg"
              >
                <span>{sourceName}-এ পাঠ করুন</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
