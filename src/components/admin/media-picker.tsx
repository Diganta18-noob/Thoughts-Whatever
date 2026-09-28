"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FileText, Music2, Video, X, Search, Play, Pause, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { detectOrientation, formatDuration, mediaCategory } from "@/lib/media-policy";

export type MediaAsset = {
  id: string;
  filename: string;
  mimeType: string;
  url: string;
  width?: number | null;
  height?: number | null;
  sizeBytes?: number;
  metadata?: { duration?: number | null; orientation?: "landscape" | "portrait" | "square" | null } | null;
};

interface MediaPickerProps {
  type?: "all" | "image" | "audio" | "video" | "document";
  orientation?: "all" | "landscape" | "portrait" | "square";
  onSelect: (asset: MediaAsset) => void;
  onClose: () => void;
  title?: string;
}

export function MediaPicker({
  type = "all",
  orientation: initialOrientation = "all",
  onSelect,
  onClose,
  title = "Choose from Media Library",
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<string>(type);
  const [activeOrientation, setActiveOrientation] = useState<string>(initialOrientation);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Audio preview state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fetchAssets = useCallback(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      limit: "60",
      type: activeTab,
      orientation: activeTab === "image" || activeTab === "all" ? activeOrientation : "all",
      search,
    });

    setLoading(true);
    fetch(`/api/admin/media?${params}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setItems(data.items);
        else setItems([]);
      })
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [activeTab, activeOrientation, search]);

  useEffect(() => {
    const timer = setTimeout(fetchAssets, 150);
    return () => clearTimeout(timer);
  }, [fetchAssets]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [onClose]);

  const togglePlayAudio = (e: React.MouseEvent, asset: MediaAsset) => {
    e.stopPropagation();
    if (playingAudioId === asset.id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = asset.url;
      audioRef.current.play().then(() => {
        setPlayingAudioId(asset.id);
      }).catch(() => {
        setPlayingAudioId(null);
      });
      audioRef.current.onended = () => setPlayingAudioId(null);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-fade-in"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-card border border-rule bg-surface p-6 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule pb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-lg font-normal text-content">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media picker"
            className="rounded-card p-1.5 text-content-soft hover:bg-surface-raised hover:text-content transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-card border border-rule text-xs font-sans">
            {(type === "all" ? [
              { id: "all", label: "All Assets" },
              { id: "image", label: "Images" },
              { id: "audio", label: "Audio" },
              { id: "video", label: "Video" },
              { id: "document", label: "Documents" },
            ] : [{ id: type, label: `${type[0].toUpperCase()}${type.slice(1)}` }]).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-xs transition",
                  activeTab === tab.id
                    ? "bg-surface font-semibold text-content shadow-xs"
                    : "text-content-soft hover:text-content"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orientation pills (for images) */}
          {(activeTab === "image" || activeTab === "all") && (
            <div className="flex items-center gap-1 font-mono text-[11px]">
              {[
                { id: "all", label: "All Ratios" },
                { id: "landscape", label: "16:9 Landscape" },
                { id: "portrait", label: "9:16 Portrait" },
                { id: "square", label: "1:1 Square" },
              ].map((ori) => (
                <button
                  key={ori.id}
                  type="button"
                  onClick={() => setActiveOrientation(ori.id)}
                  className={cn(
                    "px-2 py-0.5 rounded-card border transition",
                    activeOrientation === ori.id
                      ? "border-accent bg-accent/10 text-accent font-semibold"
                      : "border-rule/80 text-content-soft hover:border-rule"
                  )}
                >
                  {ori.label}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative min-w-44 flex-1 sm:max-w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-faint" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename or alt…"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-card border border-rule bg-surface-raised font-sans text-content placeholder:text-content-faint focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Assets Grid */}
        <div className="grid min-h-48 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="col-span-full p-12 text-center text-xs text-content-soft font-sans">
              Loading library assets…
            </div>
          ) : items.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-content-soft font-sans border border-dashed border-rule rounded-card">
              <ImageIcon className="h-6 w-6 text-content-faint mx-auto mb-2" />
              <p className="font-medium text-content">No assets match your search or filter</p>
              <p className="mt-1 text-content-faint">Try switching tabs or resetting the search query.</p>
            </div>
          ) : (
            items.map((asset) => {
              const isImage = asset.mimeType.startsWith("image/");
              const isAudio = asset.mimeType.startsWith("audio/");
              const isVideo = asset.mimeType.startsWith("video/");
              const orientation =
                asset.metadata?.orientation || detectOrientation(asset.width, asset.height);

              return (
                <div
                  key={asset.id}
                  className="group relative overflow-hidden rounded-card border border-rule bg-surface-raised transition hover:border-accent hover:shadow-card"
                >
                  <button type="button" className="flex w-full flex-col text-left focus-visible:ring-2 focus-visible:ring-accent"
                    onClick={() => {
                      if (type !== "all" && mediaCategory(asset.mimeType) !== type) return;
                      if (audioRef.current) audioRef.current.pause();
                      onSelect(asset);
                      onClose();
                    }}>
                  {/* Thumbnail Container */}
                  <div className="relative aspect-4/3 w-full bg-surface flex items-center justify-center overflow-hidden">
                    {isImage ? (
                      <Image
                        src={asset.url}
                        alt={asset.filename}
                        fill
                        sizes="200px"
                        className="object-contain p-1 transition group-hover:scale-105"
                        unoptimized
                      />
                    ) : isAudio ? (
                      <div className="flex flex-col items-center justify-center gap-1.5 p-3">
                        <Music2 className="h-8 w-8 text-accent" />
                      </div>
                    ) : isVideo ? (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <Video className="h-8 w-8 text-accent" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1">
                        <FileText className="h-8 w-8 text-content-faint" />
                      </div>
                    )}

                    {/* Orientation or duration badge */}
                    {orientation && isImage && (
                      <span className="absolute bottom-1 right-1 rounded bg-surface/90 px-1 font-mono text-[9px] text-content-soft shadow-xs uppercase">
                        {orientation}
                      </span>
                    )}
                    {asset.metadata?.duration && (
                      <span className="absolute bottom-1 right-1 rounded bg-surface/90 px-1 font-mono text-[9px] text-accent shadow-xs">
                        {formatDuration(asset.metadata.duration)}
                      </span>
                    )}
                  </div>

                  {/* Metadata footer */}
                  <div className="p-2 space-y-0.5">
                    <p className="truncate font-sans text-xs font-medium text-content" title={asset.filename}>
                      {asset.filename}
                    </p>
                    <p className="font-mono text-[10px] text-content-faint truncate">
                      {asset.width && asset.height ? `${asset.width}×${asset.height}` : asset.mimeType}
                    </p>
                  </div>
                  </button>
                  {isAudio && <button type="button" onClick={(event) => togglePlayAudio(event, asset)}
                    className="absolute right-2 top-2 flex items-center gap-1 rounded border border-rule bg-surface/95 px-2 py-1 font-mono text-[10px] text-accent shadow-xs"
                    aria-label={`${playingAudioId === asset.id ? "Pause" : "Preview"} ${asset.filename}`}>
                    {playingAudioId === asset.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    {playingAudioId === asset.id ? "Pause" : "Audition"}
                  </button>}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
