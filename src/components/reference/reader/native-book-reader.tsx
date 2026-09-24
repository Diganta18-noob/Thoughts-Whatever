"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  BookOpen,
  Search,
  Info,
  RotateCcw,
  ArrowLeft,
  ExternalLink,
  Download,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Check,
  X,
  Share2,
  Sparkles,
} from "lucide-react";
import { ReferenceRightsBadge } from "../reference-rights-badge";

export interface BookReaderPageItem {
  pageNumber: number;
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  ocrText?: string;
}

export interface NativeBookReaderProps {
  work: {
    id: string;
    slug: string;
    titleBn: string;
    titleEn?: string | null;
    subtitleBn?: string | null;
    language: string;
    era?: string | null;
    subject?: string | null;
    author?: { nameBn: string; slug: string } | null;
  };
  edition: {
    id: string;
    editionTitleBn?: string | null;
    editor?: string | null;
    translator?: string | null;
    publisher?: string | null;
    publicationYear?: number | null;
    publicationPlace?: string | null;
    pages?: number | null;
    notes?: string | null;
    coverImage?: string | null;
    hostingMode: string;
    rightsStatus: string;
    license?: string | null;
    verificationNotes?: string | null;
  };
  source: {
    sourceName: string;
    sourceUrl: string;
    externalId?: string | null;
    sourceDescription?: string | null;
  } | null;
  pages: BookReaderPageItem[];
  initialPage?: number;
  pdfUrl?: string | null;
  transcriptText?: string | null;
  isRightsVerified: boolean;
  canDownload: boolean;
  downloadUrl?: string | null;
  companionEdition?: {
    slug: string;
    titleBn: string;
    label: string;
  } | null;
}

export function NativeBookReader({
  work,
  edition,
  source,
  pages,
  initialPage = 1,
  pdfUrl,
  transcriptText,
  isRightsVerified,
  canDownload,
  downloadUrl,
  companionEdition,
}: NativeBookReaderProps) {
  const totalPages = Math.max(1, pages.length || edition.pages || 1);
  const validatedInitial = Math.min(Math.max(1, initialPage), totalPages);

  const [currentPage, setCurrentPage] = useState<number>(validatedInitial);
  const [zoom, setZoom] = useState<number>(1);
  const [fitMode, setFitMode] = useState<"fit-width" | "fit-page" | "actual">("fit-page");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUiVisible, setIsUiVisible] = useState(true);
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [jumpInputValue, setJumpInputValue] = useState(String(validatedInitial));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasCopiedShare, setHasCopiedShare] = useState(false);
  const [savedPageNotice, setSavedPageNotice] = useState<number | null>(null);
  const [failedPages, setFailedPages] = useState<Record<number, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Check localStorage for saved reading position on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storageKey = `tw_book_reader_${work.slug}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed > 1 && parsed <= totalPages && parsed !== validatedInitial) {
          setSavedPageNotice(parsed);
        }
      }
    } catch {
      // Storage unavailable or blocked
    }
  }, [work.slug, totalPages, validatedInitial]);

  // Persist current page to localStorage and URL query state
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storageKey = `tw_book_reader_${work.slug}`;
      localStorage.setItem(storageKey, String(currentPage));

      // Update URL without reloading page
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(currentPage));
      window.history.replaceState({}, "", url.toString());
    } catch {
      // ignore
    }

    if (currentPage >= totalPages) {
      setIsCompleted(true);
    } else {
      setIsCompleted(false);
    }
  }, [currentPage, totalPages, work.slug]);

  // Preload adjacent pages for instant flipping
  useEffect(() => {
    if (typeof window === "undefined") return;
    const preload = (pageNum: number) => {
      if (pageNum < 1 || pageNum > totalPages) return;
      const targetPage = pages.find((p) => p.pageNumber === pageNum);
      if (targetPage?.imageUrl) {
        const img = new window.Image();
        img.src = targetPage.imageUrl;
      }
    };
    preload(currentPage + 1);
    preload(currentPage - 1);
  }, [currentPage, pages, totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not capture if typing in an input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;

      if (e.key === "ArrowLeft" || e.key === "h" || e.key === "PageUp") {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === "ArrowRight" || e.key === "l" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        handleResetZoom();
      } else if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === "Escape") {
        setIsJumpOpen(false);
        setIsSearchOpen(false);
        setIsInfoOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, totalPages, zoom]);

  // Touch gesture handling for mobile swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;

    // Horizontal swipe threshold: > 50px, and horizontal distance > 1.5x vertical distance
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX > 0) {
        goToPrevPage();
      } else {
        goToNextPage();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  function goToNextPage() {
    if (currentPage < totalPages) {
      setCurrentPage((p) => p + 1);
    } else {
      setIsCompleted(true);
    }
  }

  function goToPrevPage() {
    if (currentPage > 1) {
      setCurrentPage((p) => p - 1);
      setIsCompleted(false);
    }
  }

  function handleJumpSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const target = parseInt(jumpInputValue, 10);
    if (!isNaN(target)) {
      const valid = Math.min(Math.max(1, target), totalPages);
      setCurrentPage(valid);
      setIsJumpOpen(false);
    }
  }

  function handleZoomIn() {
    setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
    setFitMode("actual");
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(0.6, +(z - 0.25).toFixed(2)));
    setFitMode("actual");
  }

  function handleResetZoom() {
    setZoom(1);
    setFitMode("fit-page");
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  function handleShare() {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setHasCopiedShare(true);
    setTimeout(() => setHasCopiedShare(false), 2500);
  }

  // Active page data
  const activePageItem = pages.find((p) => p.pageNumber === currentPage);
  const activePageUrl =
    activePageItem?.imageUrl ||
    (pages.length > 0
      ? pages[Math.min(currentPage - 1, pages.length - 1)].imageUrl
      : edition.coverImage);

  // Search filtered results
  const ocrPages = pages.filter((p) => Boolean(p.ocrText));
  const hasOcr = ocrPages.length > 0;
  const searchResults = searchQuery.trim() && hasOcr
    ? ocrPages
        .filter((p) => p.ocrText?.toLowerCase().includes(searchQuery.toLowerCase().trim()))
        .slice(0, 30)
    : [];

  const progressPercent = ((currentPage / totalPages) * 100).toFixed(1);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col bg-zinc-950 text-zinc-100 select-none overflow-hidden min-h-screen"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Reading Progress Bar */}
      <div className="absolute top-0 inset-x-0 h-1 bg-zinc-900 z-40">
        <div
          className="h-full bg-amber-500/80 transition-all duration-300"
          style={{ width: `${(currentPage / totalPages) * 100}%` }}
        />
      </div>

      {/* Reader Minimalist Header Chrome */}
      <header
        className={`border-b border-zinc-850 bg-zinc-950/95 backdrop-blur sticky top-0 z-30 px-3 sm:px-6 py-2.5 transition-opacity duration-300 ${
          isUiVisible ? "opacity-100" : "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto"
        }`}
      >
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/reference/${work.slug}`}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors shrink-0"
              title="তথ্যপঞ্জিতে ফিরে যান"
              aria-label="Back to Reference dossier"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[0.625rem] font-mono uppercase tracking-wider text-amber-500/90 font-semibold px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/40">
                  {edition.hostingMode === "THOUGHTS_WHATEVER" ? "Archival Reader" : "Reference Scan"}
                </span>
                <span className="text-zinc-600 hidden sm:inline">·</span>
                <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                  {work.language}
                </span>
              </div>
              <h1 className="font-bengali font-medium text-sm sm:text-base text-zinc-100 truncate">
                {work.titleBn}
              </h1>
            </div>
          </div>

          {/* Right: Controls & Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Page indicator pill */}
            <button
              onClick={() => {
                setJumpInputValue(String(currentPage));
                setIsJumpOpen(true);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 text-xs font-mono text-zinc-300 flex items-center gap-1.5 transition-colors"
              title="পৃষ্ঠায় লাফ দিন"
              aria-label="Jump to page"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {currentPage} / {totalPages}
              </span>
            </button>

            {/* Zoom Controls (Desktop / Tablet) */}
            <div className="hidden sm:flex items-center border border-zinc-800 rounded-lg p-0.5 bg-zinc-900/60">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
                title="ছোট করুন (Zoom Out: -)"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-[0.6875rem] font-mono text-zinc-400 hover:text-zinc-200"
                title="রিসেট করুন (Reset: 0)"
                aria-label="Reset zoom"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded"
                title="বড় করুন (Zoom In: +)"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              title="অনুসন্ধান করুন"
              aria-label="Search within book"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Book Info Button */}
            <button
              onClick={() => setIsInfoOpen(true)}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              title="Book Details & Archival Rights"
              aria-label="Book metadata and rights"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Share / Copy URL */}
            <button
              onClick={handleShare}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors hidden sm:inline-flex"
              title="পৃষ্ঠা লিংক কপি করুন"
              aria-label="Share current page link"
            >
              {hasCopiedShare ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
              title={isFullscreen ? "পূর্ণপর্দা থেকে বের হন (Esc)" : "পূর্ণপর্দা পাঠ (F)"}
              aria-label="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Saved Position Banner (Non-intrusive notification) */}
      {savedPageNotice && (
        <div className="bg-amber-950/80 border-b border-amber-800/60 px-4 py-2 text-xs font-mono text-amber-200 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              আপনি পূর্বে পৃষ্ঠা {savedPageNotice}-এ ছিলেন।
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentPage(savedPageNotice);
                setSavedPageNotice(null);
              }}
              className="px-2.5 py-1 bg-amber-400 text-zinc-950 font-bold rounded hover:bg-amber-300 transition-colors"
            >
              পৃষ্ঠা {savedPageNotice}-এ যান
            </button>
            <button
              onClick={() => setSavedPageNotice(null)}
              className="p-1 hover:text-white"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Reading Canvas */}
      <main
        className="flex-1 relative flex items-center justify-center p-2 sm:p-6 md:p-8 overflow-auto touch-pan-y"
        onClick={(e) => {
          // If clicked on canvas outside image, toggle minimal UI for focused reading
          if (e.target === e.currentTarget) {
            setIsUiVisible((v) => !v);
          }
        }}
      >
        {/* Navigation Touch Zones on Mobile & Desktops */}
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="absolute left-0 inset-y-0 w-12 sm:w-20 z-10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-start pl-2 sm:pl-4 focus:opacity-100 disabled:pointer-events-none"
        >
          <div className="p-2 sm:p-3 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 backdrop-blur shadow-xl hover:scale-110 transition-transform">
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="absolute right-0 inset-y-0 w-12 sm:w-20 z-10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-end pr-2 sm:pr-4 focus:opacity-100 disabled:pointer-events-none"
        >
          <div className="p-2 sm:p-3 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-200 backdrop-blur shadow-xl hover:scale-110 transition-transform">
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </button>

        {/* Archival Scanned Page Viewer */}
        {isCompleted ? (
          /* Book Finished View */
          <div className="max-w-xl mx-auto my-auto text-center p-8 sm:p-12 border border-zinc-800 rounded-2xl bg-zinc-900/70 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
                Book Complete · পাঠ সমাপ্ত
              </span>
              <h2 className="text-2xl sm:text-3xl font-bengali font-bold text-zinc-100 mt-2">
                {work.titleBn}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 font-serif mt-2">
                আপনি এই ঐতিহাসিক সংস্করণের শেষ পৃষ্ঠায় পৌঁছেছেন।
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setCurrentPage(1)}
                className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 rounded-lg text-xs font-mono text-zinc-300 hover:text-zinc-100 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>প্রথম পৃষ্ঠায় ফিরে যান</span>
              </button>

              <Link
                href={`/reference/${work.slug}`}
                className="px-5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-semibold rounded-lg"
              >
                তথ্যপঞ্জিতে ফিরুন
              </Link>
            </div>

            {/* Original Source Reference */}
            {source && (
              <div className="border-t border-zinc-800 pt-6 mt-6 text-left space-y-2">
                <span className="text-[0.6875rem] font-mono uppercase tracking-wider text-zinc-400">
                  Original Source & Reference
                </span>
                <p className="text-xs text-zinc-400 font-serif leading-relaxed">
                  The original scan of this historical edition is cataloged and preserved by{" "}
                  <strong>{source.sourceName}</strong>.
                </p>
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 hover:underline pt-1"
                >
                  <span>View Original Source ({source.sourceName})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        ) : failedPages[currentPage] ? (
          /* Safe Error State for Failed Page */
          <div className="max-w-md mx-auto my-auto text-center p-8 border border-zinc-800 rounded-2xl bg-zinc-900/60 space-y-4">
            <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
            <h3 className="font-bengali text-lg font-bold text-zinc-200">
              পৃষ্ঠা {currentPage} লোড করা সম্ভব হয়নি
            </h3>
            <p className="text-xs text-zinc-400 font-serif">
              নেটওয়ার্ক বাধা বা ফাইলের অপ্রাপ্যতার কারণে পৃষ্ঠাটি লোড হয়নি। আপনি পরবর্তী পৃষ্ঠায় এগিয়ে যেতে পারেন।
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setFailedPages((prev) => ({ ...prev, [currentPage]: false }));
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono"
              >
                পুনরায় চেষ্টা করুন
              </button>
              <button
                onClick={goToNextPage}
                className="px-4 py-2 bg-amber-400 text-zinc-950 font-bold rounded-lg text-xs font-mono"
              >
                পরবর্তী পৃষ্ঠা →
              </button>
            </div>
          </div>
        ) : activePageUrl ? (
          /* High-Quality Scanned Archival Page */
          <div
            className={`relative transition-transform duration-200 ease-out shadow-2xl rounded-sm overflow-hidden bg-[#faf7f2] border border-amber-950/20 ${
              fitMode === "fit-width"
                ? "w-full max-w-4xl"
                : "max-h-[82vh] w-auto max-w-[95vw] md:max-w-3xl"
            }`}
            style={{
              transform: zoom !== 1 ? `scale(${zoom})` : undefined,
              transformOrigin: "center center",
            }}
          >
            <img
              src={activePageUrl}
              alt={`${work.titleBn} — পৃষ্ঠা ${currentPage}`}
              className="w-full h-auto object-contain block mx-auto transition-opacity duration-300"
              onError={() => {
                setFailedPages((prev) => ({ ...prev, [currentPage]: true }));
              }}
              loading="eager"
            />
          </div>
        ) : transcriptText ? (
          /* Transcription fallback view if no scan exists */
          <div className="max-w-2xl mx-auto my-auto p-8 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-4 font-serif text-zinc-200 text-base leading-relaxed">
            <h3 className="font-bengali text-xl font-bold text-amber-400 text-center pb-4 border-b border-zinc-800">
              {work.titleBn}
            </h3>
            <p className="whitespace-pre-line text-justify">{transcriptText}</p>
          </div>
        ) : (
          /* Loading skeleton */
          <div className="w-full max-w-2xl h-[70vh] rounded-xl bg-zinc-900/60 animate-pulse border border-zinc-800 flex flex-col items-center justify-center p-6 text-zinc-500 font-mono text-xs">
            <BookOpen className="w-8 h-8 mb-2 opacity-50" />
            <span>পৃষ্ঠা লোড হচ্ছে...</span>
          </div>
        )}
      </main>

      {/* Reader Bottom Controls Chrome (Mobile-First) */}
      <footer
        className={`border-t border-zinc-850 bg-zinc-950/95 backdrop-blur sticky bottom-0 z-30 px-3 sm:px-6 py-2.5 transition-opacity duration-300 ${
          isUiVisible ? "opacity-100" : "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto"
        }`}
      >
        <div className="mx-auto max-w-4xl flex items-center justify-between gap-3">
          {/* Previous Page Button (min 44px touch target) */}
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 text-zinc-200 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 text-xs font-mono transition-colors shadow-sm"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">পূর্ববর্তী</span>
          </button>

          {/* Central Page Pill & Jump Modal Trigger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setJumpInputValue(String(currentPage));
                setIsJumpOpen(true);
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-amber-500/50 text-xs font-mono text-zinc-200 flex items-center gap-2 transition-all shadow-sm"
              aria-label="Jump to page modal"
            >
              <span className="font-semibold text-amber-400">পৃষ্ঠা {currentPage}</span>
              <span className="text-zinc-500">/</span>
              <span className="text-zinc-400">{totalPages}</span>
              <span className="text-[0.625rem] text-zinc-500 font-sans hidden sm:inline">
                ({progressPercent}%)
              </span>
            </button>
          </div>

          {/* Next Page Button (min 44px touch target) */}
          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 text-zinc-200 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 text-xs font-mono transition-colors shadow-sm"
            aria-label="Next page"
          >
            <span className="hidden sm:inline">পরবর্তী</span>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </footer>

      {/* Jump to Page Modal / Bottom Sheet */}
      {isJumpOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="font-bengali font-semibold text-zinc-100 text-sm">
                  পৃষ্ঠায় লাফ দিন (Go to Page)
                </h3>
              </div>
              <button
                onClick={() => setIsJumpOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                aria-label="Close jump modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJumpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[0.6875rem] font-mono uppercase tracking-wider text-zinc-400">
                  পৃষ্ঠা নম্বর লিখুন (১ থেকে {totalPages})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpInputValue}
                    onChange={(e) => setJumpInputValue(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-750 rounded-xl px-4 py-3 text-lg font-mono text-zinc-100 focus:outline-none focus:border-amber-400 text-center"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="min-h-[48px] px-6 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-mono text-xs font-bold transition-colors"
                  >
                    যান (Go)
                  </button>
                </div>
              </div>

              {/* Slider for smooth dragging */}
              <div className="space-y-1 pt-2">
                <input
                  type="range"
                  min={1}
                  max={totalPages}
                  value={jumpInputValue || currentPage}
                  onChange={(e) => setJumpInputValue(e.target.value)}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              {/* Quick jump navigation chips */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(1);
                    setIsJumpOpen(false);
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  প্রচ্ছদ (১)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(Math.round(totalPages / 2));
                    setIsJumpOpen(false);
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  মাঝামাঝি ({Math.round(totalPages / 2)})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage(totalPages);
                    setIsJumpOpen(false);
                  }}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  শেষ পৃষ্ঠা ({totalPages})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Search Drawer */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full p-6 shadow-2xl flex flex-col space-y-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-amber-400" />
                <h3 className="font-bengali font-semibold text-zinc-100 text-sm">
                  গ্রন্থে অনুসন্ধান (Book Search)
                </h3>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                aria-label="Close search drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {hasOcr ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <input
                  type="text"
                  placeholder="শব্দ বা চরণ অনুসন্ধান করুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-750 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-400 font-bengali"
                  autoFocus
                />

                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {searchQuery.trim() === "" ? (
                    <div className="text-center py-12 text-zinc-500 text-xs font-serif">
                      শব্দ টাইপ করে ডিজিটাল টেক্সট অনুসন্ধান করুন।
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs font-serif">
                      কোনো ফলাফল মেলেনি।
                    </div>
                  ) : (
                    searchResults.map((res) => (
                      <button
                        key={res.pageNumber}
                        onClick={() => {
                          setCurrentPage(res.pageNumber);
                          setIsSearchOpen(false);
                        }}
                        className="w-full text-left p-3 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-850 hover:border-amber-500/50 transition-colors group space-y-1"
                      >
                        <div className="flex items-center justify-between text-[0.6875rem] font-mono text-amber-400">
                          <span>পৃষ্ঠা {res.pageNumber}</span>
                          <span className="opacity-0 group-hover:opacity-100 text-zinc-400">
                            যান →
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 font-bengali line-clamp-2 leading-relaxed">
                          {res.ocrText}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* No OCR Available Status Banner (Per Prompt Section 16) */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="font-bengali font-medium text-sm text-zinc-200">
                  ডিজিটাল টেক্সট অনুসন্ধান উপলব্ধ নয়
                </h4>
                <p className="text-xs text-zinc-400 font-serif leading-relaxed">
                  Text search isn't available for this scan. এই ঐতিহাসিক স্ক্যানটি একটি আলোকচিত্র-ভিত্তিক মূল পুথি। পৃষ্ঠা নেভিগেশন ও জুম ব্যবহার করে মূল পুথিপত্র অবিকৃতভাবে পাঠ করুন।
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Book Information & Provenance Drawer */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full p-6 shadow-2xl flex flex-col space-y-5 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <h3 className="font-bengali font-semibold text-zinc-100 text-sm">
                  গ্রন্থ পরিচিতি ও অধিকার (Book Dossier)
                </h3>
              </div>
              <button
                onClick={() => setIsInfoOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                aria-label="Close info drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Meta List */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-mono">Rights Status:</span>
                <ReferenceRightsBadge status={edition.rightsStatus as any} size="sm" />
              </div>

              <div>
                <h4 className="font-bengali text-lg font-bold text-zinc-100">
                  {work.titleBn}
                </h4>
                {work.titleEn && (
                  <p className="font-serif text-xs italic text-zinc-400 mt-0.5">
                    {work.titleEn}
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t border-zinc-800 pt-3 text-zinc-300">
                {work.author && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-mono">Author:</span>
                    <span className="font-bengali font-medium text-zinc-200">
                      {work.author.nameBn}
                    </span>
                  </div>
                )}

                {edition.editor && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-mono">Editor:</span>
                    <span className="font-bengali text-zinc-200">{edition.editor}</span>
                  </div>
                )}

                {edition.translator && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-mono">Translator:</span>
                    <span className="font-bengali text-zinc-200">{edition.translator}</span>
                  </div>
                )}

                {edition.publisher && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-mono">Publisher:</span>
                    <span className="font-bengali text-zinc-200">{edition.publisher}</span>
                  </div>
                )}

                {edition.publicationYear && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-mono">Publication Year:</span>
                    <span className="font-mono text-zinc-200">{edition.publicationYear}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-zinc-500 font-mono">Language:</span>
                  <span className="text-zinc-200">{work.language}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500 font-mono">Total Pages:</span>
                  <span className="font-mono text-zinc-200">{totalPages}</span>
                </div>
              </div>

              {/* Verified Rights Statement */}
              {edition.verificationNotes && (
                <div className="border border-zinc-800 bg-zinc-950/60 p-3.5 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-mono text-[0.6875rem] uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rights Verification Notes</span>
                  </div>
                  <p className="text-xs text-zinc-400 font-serif leading-relaxed">
                    {edition.verificationNotes}
                  </p>
                </div>
              )}

              {/* Downloads if rights permit */}
              {canDownload && downloadUrl && (
                <div className="pt-2">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-mono text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Original Scan (PDF)</span>
                  </a>
                </div>
              )}

              {/* Companion Edition Link (e.g. from 2024 unverified to 1874 Public Domain) */}
              {companionEdition && (
                <div className="border border-amber-800/40 bg-amber-950/20 p-3.5 rounded-xl space-y-2">
                  <span className="text-[0.6875rem] font-mono uppercase text-amber-400 font-semibold block">
                    {companionEdition.label}
                  </span>
                  <p className="text-xs text-zinc-300 font-bengali">
                    {companionEdition.titleBn}
                  </p>
                  <Link
                    href={`/reference/${companionEdition.slug}/read`}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-300 hover:text-white underline"
                  >
                    <span>এই সংস্করণের পাঠকক্ষে যান →</span>
                  </Link>
                </div>
              )}

              {/* Original Source Reference Section at the Bottom */}
              {source && (
                <div className="border-t border-zinc-800 pt-4 mt-4 space-y-2">
                  <span className="text-[0.6875rem] font-mono uppercase tracking-wider text-zinc-400 block font-semibold">
                    Original Source & Reference
                  </span>
                  <p className="text-xs text-zinc-400 font-serif leading-relaxed">
                    This digital reference is based on the archival source listed below.
                  </p>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                    <div className="font-mono text-xs text-zinc-300 font-medium">
                      {source.sourceName}
                    </div>
                    {source.sourceDescription && (
                      <p className="text-[0.6875rem] text-zinc-500 font-serif">
                        {source.sourceDescription}
                      </p>
                    )}
                    <a
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-400 hover:underline pt-1"
                    >
                      <span>View Original Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[0.625rem] text-zinc-500 font-mono">
                    Source: {source.sourceName} · Reading Experience: Thoughts.Whatever
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
