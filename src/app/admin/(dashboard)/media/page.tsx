"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Image as ImageIcon,
  UploadCloud,
  Search,
  Grid,
  List,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  FileText,
  Video,
  Music2,
  X,
  Play,
  Pause,
  SlidersHorizontal,
  Compass,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { confirmToast } from "@/lib/confirm-toast";
import { Button, TBody, TD, TH, THead, TR } from "@/components/ui";
import { uploadMediaDirect } from "@/lib/media-upload-client";
import {
  mediaCategory,
  detectOrientation,
  formatDuration,
  ACCEPT_MEDIA_STRING,
} from "@/lib/media-policy";
import { AudioPreviewPlayer } from "@/components/admin/audio-preview-player";

interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  url: string;
  altText?: string | null;
  caption?: string | null;
  metadata?: {
    duration?: number | null;
    orientation?: "landscape" | "portrait" | "square" | null;
    credit?: string;
    license?: string;
    source?: string;
    tags?: string[];
    focalX?: number;
    focalY?: number;
    subtype?: string;
  } | null;
  uploadedBy?: string | null;
  usageCount: number;
  usages: Array<{
    id: string;
    entityType: string;
    entityId: string;
    entityTitle?: string | null;
    field: string;
  }>;
  createdAt: string;
}

function variantUrl(media: MediaItem, width: number, height: number) {
  if (!media.mimeType.startsWith("image/") || media.mimeType === "image/svg+xml" || !media.url.includes("/image/upload/")) return null;
  const x = Math.round((media.width || width) * (media.metadata?.focalX ?? 50) / 100);
  const y = Math.round((media.height || height) * (media.metadata?.focalY ?? 50) / 100);
  return media.url.replace("/image/upload/", `/image/upload/c_fill,g_xy_center,x_${x},y_${y},w_${width},h_${height},f_auto,q_auto/`);
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<
    Array<{ file: File; status: "uploading" | "done" | "error"; progress: number; error?: string }>
  >([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterOrientation, setFilterOrientation] = useState<string>("all");
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("createdAt:desc");

  // Selected item for details slide-over
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [editAltText, setEditAltText] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editCredit, setEditCredit] = useState("");
  const [editLicense, setEditLicense] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editFocalX, setEditFocalX] = useState(50);
  const [editFocalY, setEditFocalY] = useState(50);

  // Quick inline audio audition
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const gridAudioRef = useRef<HTMLAudioElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "24",
        type: filterType,
        orientation: filterOrientation,
        search,
        unused: unusedOnly ? "true" : "false",
        sortBy: sort.split(":")[0],
        sortOrder: sort.split(":")[1],
      });

      const res = await fetch(`/api/admin/media?${params}`);
      const data = await res.json();
      if (data.ok) {
        setItems(data.items);
        setTotal(data.total);
      }
    } catch {
      toast.error("Failed to load media library");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterOrientation, unusedOnly, search, page, sort]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    if (selectedMedia) {
      setEditAltText(selectedMedia.altText || "");
      setEditCaption(selectedMedia.caption || "");
      setEditCredit(selectedMedia.metadata?.credit || "");
      setEditLicense(selectedMedia.metadata?.license || "");
      setEditSource(selectedMedia.metadata?.source || "");
      setEditTags(selectedMedia.metadata?.tags?.join(", ") || "");
      setEditFocalX(selectedMedia.metadata?.focalX ?? 50);
      setEditFocalY(selectedMedia.metadata?.focalY ?? 50);
    }
  }, [selectedMedia]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files.length) return;
    setUploading(true);

    const queued = Array.from(files).map((file) => ({
      file,
      status: "uploading" as const,
      progress: 0,
    }));
    setUploadQueue(queued);
    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadMediaDirect(file, (progress) =>
          setUploadQueue((previous) =>
            previous.map((item) => (item.file === file ? { ...item, progress } : item))
          )
        );
        setUploadQueue((previous) =>
          previous.map((item) =>
            item.file === file ? { ...item, status: "done", progress: 100 } : item
          )
        );
        successCount++;
      } catch (error) {
        setUploadQueue((previous) =>
          previous.map((item) =>
            item.file === file
              ? {
                  ...item,
                  status: "error",
                  error: error instanceof Error ? error.message : "Upload failed",
                }
              : item
          )
        );
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      fetchMedia();
    } else {
      toast.error("Upload failed. See file errors below.");
    }
  };

  const handleSaveMetadata = async () => {
    if (!selectedMedia) return;
    setSavingMetadata(true);
    try {
      const res = await fetch(`/api/admin/media/${selectedMedia.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          altText: editAltText,
          caption: editCaption,
          metadata: {
            ...selectedMedia.metadata,
            credit: editCredit,
            license: editLicense,
            source: editSource,
            tags: editTags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            focalX: editFocalX,
            focalY: editFocalY,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Metadata updated");
        setSelectedMedia({
          ...selectedMedia,
          altText: editAltText,
          caption: editCaption,
          metadata: {
            ...selectedMedia.metadata,
            credit: editCredit,
            license: editLicense,
            source: editSource,
            tags: editTags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
            focalX: editFocalX,
            focalY: editFocalY,
          },
        });
        fetchMedia();
      } else {
        toast.error("Failed to update metadata");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSavingMetadata(false);
    }
  };

  const executeDeleteMedia = async (media: MediaItem) => {
    try {
      const res = await fetch(`/api/admin/media/${media.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Deleted ${media.filename}`);
        if (selectedMedia?.id === media.id) setSelectedMedia(null);
        fetchMedia();
      } else {
        toast.error(data.error || "Failed to delete media");
      }
    } catch {
      toast.error("Failed to delete media");
    }
  };

  const handleDeleteMedia = (media: MediaItem) => {
    if (media.usageCount > 0) {
      confirmToast(
        `This file is used in ${media.usageCount} place(s). Remove those references before deleting it.`,
        () => setSelectedMedia(media),
        { title: "Asset In Use", confirmLabel: "View References" }
      );
    } else {
      confirmToast(
        `Are you sure you want to delete "${media.filename}"?`,
        () => executeDeleteMedia(media),
        { title: "Delete Media Asset", confirmLabel: "Delete Asset", variant: "danger" }
      );
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success("Media URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSyncUsages = async () => {
    try {
      toast.loading("Scanning pieces, series, and references for media assets...", { id: "sync" });
      const res = await fetch("/api/admin/media/sync-usage", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success(
          `Synced! Indexed ${data.createdCount} new assets & refreshed ${data.linkedCount} usage links.`,
          { id: "sync" }
        );
        fetchMedia();
      }
    } catch {
      toast.error("Failed to sync usages", { id: "sync" });
    }
  };

  const toggleInlineAudio = (e: React.MouseEvent, media: MediaItem) => {
    e.stopPropagation();
    if (playingAudioId === media.id) {
      if (gridAudioRef.current) gridAudioRef.current.pause();
      setPlayingAudioId(null);
    } else {
      if (!gridAudioRef.current) gridAudioRef.current = new Audio();
      gridAudioRef.current.src = media.url;
      gridAudioRef.current.play().then(() => {
        setPlayingAudioId(media.id);
      }).catch(() => {
        setPlayingAudioId(null);
      });
      gridAudioRef.current.onended = () => setPlayingAudioId(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Media Library
            </h1>
            <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent uppercase">
              {total} ASSETS
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Production asset manager for portrait & landscape photos, cover art, narration audio, video, and documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncUsages}
            className="hover:text-accent"
            title="Scan articles, series, and reference archive to discover and refresh media assets"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Sync Usage Tracker
          </Button>

          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <UploadCloud className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Files"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPT_MEDIA_STRING}
            className="hidden"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer.files?.length) {
            handleFileUpload(e.dataTransfer.files);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Choose media files to upload"
        className="group cursor-pointer rounded-card border-2 border-dashed border-rule/80 bg-surface-raised/40 p-6 text-center transition hover:border-accent/60"
      >
        <UploadCloud className="h-8 w-8 text-content-faint group-hover:text-accent mx-auto mb-2 transition" />
        <p className="font-serif text-sm text-content">
          Drag & drop photos, audio, video, or documents here, or{" "}
          <span className="text-accent underline font-medium">browse files</span>
        </p>
        <p className="font-sans text-[11px] text-content-soft mt-1">
          Photos & documents up to 25 MB; audio narration & video up to 95 MB. Direct signed upload to cloud storage.
        </p>
      </div>

      {/* Upload Queue Progress */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2 rounded-card border border-rule bg-surface-raised p-4" role="status" aria-live="polite">
          <div className="flex items-center justify-between">
            <span className="label">Upload queue ({uploadQueue.length} files)</span>
            <button
              type="button"
              className="text-xs text-content-soft hover:text-accent"
              onClick={() => setUploadQueue([])}
            >
              Clear
            </button>
          </div>
          {uploadQueue.map((item, index) => (
            <div key={`${item.file.name}-${index}`} className="flex items-center gap-3 text-xs font-sans">
              <span className="min-w-0 flex-1 truncate text-content font-medium">{item.file.name}</span>
              <span className="font-mono text-[10px] text-content-faint">
                {formatBytes(item.file.size)}
              </span>
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-rule">
                <div
                  className="h-full bg-accent transition-[width] duration-150"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <span className={item.status === "error" ? "max-w-56 text-danger text-[11px]" : "w-10 text-right text-content-soft font-mono"}>
                {item.status === "error" ? item.error : item.status === "done" ? "Done" : `${item.progress}%`}
              </span>
              {item.status === "error" && (
                <button
                  type="button"
                  className="text-accent underline"
                  onClick={() => handleFileUpload([item.file])}
                >
                  Retry
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Controls & Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Category Tabs */}
          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-card border border-rule">
            {[
              { id: "all", label: "All Assets" },
              { id: "image", label: "Images & Photos" },
              { id: "audio", label: "Narration & Audio" },
              { id: "video", label: "Videos" },
              { id: "document", label: "Documents & Books" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setFilterType(t.id);
                  setPage(1);
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-sans rounded-xs transition",
                  filterType === t.id
                    ? "bg-surface font-semibold text-content shadow-xs"
                    : "text-content-soft hover:text-content"
                )}
                aria-pressed={filterType === t.id}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search, Unused Toggle & View Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 font-sans text-xs text-content-soft cursor-pointer">
              <input
                type="checkbox"
                checked={unusedOnly}
                onChange={(e) => {
                  setUnusedOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-rule text-accent focus:ring-accent"
              />
              Unused media only
            </label>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-faint" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search filename or alt..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-card border border-rule bg-surface font-sans text-content placeholder:text-content-faint focus:border-accent focus:outline-none w-48 sm:w-56"
              />
            </div>

            <select
              aria-label="Sort assets"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              className="rounded-card border border-rule bg-surface px-2.5 py-1.5 text-xs text-content font-sans"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="filename:asc">Name A–Z</option>
              <option value="sizeBytes:desc">Largest File Size</option>
            </select>

            <div className="flex items-center border border-rule rounded-card bg-surface-raised overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-1.5 transition",
                  viewMode === "grid" ? "bg-surface text-content" : "text-content-soft hover:text-content"
                )}
                title="Grid View"
                aria-label="Grid View"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1.5 transition",
                  viewMode === "list" ? "bg-surface text-content" : "text-content-soft hover:text-content"
                )}
                title="List View"
                aria-label="List View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Orientation & Format Sub-filter Bar (for Images and All) */}
        {(filterType === "all" || filterType === "image" || filterType === "svg") && (
          <div className="flex items-center gap-2 pt-1 font-mono text-[11px] overflow-x-auto pb-1">
            <span className="text-content-faint flex items-center gap-1 shrink-0">
              <Compass className="h-3 w-3" /> Orientation:
            </span>
            {[
              { id: "all", label: "All Ratios" },
              { id: "landscape", label: "16:9 Landscape" },
              { id: "portrait", label: "9:16 Portrait" },
              { id: "square", label: "1:1 Square" },
            ].map((ori) => (
              <button
                key={ori.id}
                type="button"
                onClick={() => {
                  setFilterOrientation(ori.id);
                  if (filterType === "svg") setFilterType("image");
                  setPage(1);
                }}
                className={cn(
                  "rounded-card border px-2.5 py-0.5 transition shrink-0",
                  filterOrientation === ori.id && filterType !== "svg"
                    ? "border-accent bg-accent/10 text-accent font-semibold"
                    : "border-rule bg-surface text-content-soft hover:border-rule-strong hover:text-content"
                )}
              >
                {ori.label}
              </button>
            ))}

            <span className="h-3 w-px bg-rule mx-1" />

            <button
              type="button"
              onClick={() => {
                setFilterType(filterType === "svg" ? "image" : "svg");
                setPage(1);
              }}
              className={cn(
                "rounded-card border px-2.5 py-0.5 transition shrink-0",
                filterType === "svg"
                  ? "border-accent bg-accent/10 text-accent font-semibold"
                  : "border-rule bg-surface text-content-soft hover:border-rule-strong hover:text-content"
              )}
            >
              SVG Vectors
            </button>
          </div>
        )}
      </div>

      {/* Main Grid / List Layout */}
      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Loading media library assets...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-rule bg-surface-raised p-12 text-center">
          <ImageIcon className="h-8 w-8 text-content-faint mx-auto mb-2" />
          <h3 className="font-serif text-lg font-normal text-content">No Media Assets Found</h3>
          <p className="font-sans text-xs text-content-soft mt-1 max-w-md mx-auto">
            {search || filterType !== "all" || filterOrientation !== "all" || unusedOnly
              ? "No assets match your active filters or search terms. Try clearing the search or switching orientation tabs."
              : "Upload your first photo, narration audio, video, or document using the upload area above."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((media) => {
            const isSelected = selectedMedia?.id === media.id;
            const isImage = media.mimeType.startsWith("image/");
            const isAudio = media.mimeType.startsWith("audio/");
            const isVideo = media.mimeType.startsWith("video/");
            const orientation =
              media.metadata?.orientation || detectOrientation(media.width, media.height);

            return (
              <div
                key={media.id}
                onClick={() => setSelectedMedia(media)}
                className={cn(
                  "group relative cursor-pointer rounded-card border border-rule bg-surface-raised overflow-hidden transition hover:border-accent hover:shadow-card flex flex-col",
                  isSelected && "ring-2 ring-accent border-accent"
                )}
              >
                {/* Thumbnail Area */}
                <div className="relative aspect-4/3 w-full bg-surface-sunken flex items-center justify-center overflow-hidden border-b border-rule/50">
                  {isImage ? (
                    <Image
                      src={media.url}
                      alt={media.altText || media.filename}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      className="object-contain p-1 transition group-hover:scale-105"
                      unoptimized
                    />
                  ) : isAudio ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 p-3 text-center">
                      <Music2 className="h-8 w-8 text-accent" />
                      <button
                        type="button"
                        onClick={(e) => toggleInlineAudio(e, media)}
                        className="flex items-center gap-1 rounded bg-surface/90 px-2 py-0.5 font-mono text-[10px] text-accent border border-rule hover:bg-surface shadow-xs transition"
                        title={playingAudioId === media.id ? "Pause" : "Play preview"}
                      >
                        {playingAudioId === media.id ? (
                          <>
                            <Pause className="h-2.5 w-2.5 fill-current" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-2.5 w-2.5 fill-current" /> Play
                          </>
                        )}
                      </button>
                    </div>
                  ) : isVideo ? (
                    <div className="flex flex-col items-center justify-center gap-1 p-3">
                      <Video className="h-8 w-8 text-accent" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 p-3">
                      <FileText className="h-8 w-8 text-content-faint" />
                    </div>
                  )}

                  {/* Orientation badge */}
                  {orientation && isImage && (
                    <span className="absolute top-1.5 left-1.5 rounded bg-surface/90 px-1 py-0.2 font-mono text-[9px] uppercase tracking-wider text-content-soft shadow-xs border border-rule/60">
                      {orientation === "landscape" ? "16:9" : orientation === "portrait" ? "9:16" : "1:1"}
                    </span>
                  )}

                  {/* Audio duration badge */}
                  {media.metadata?.duration && (
                    <span className="absolute top-1.5 left-1.5 rounded bg-surface/90 px-1.5 py-0.2 font-mono text-[9px] text-accent shadow-xs border border-rule/60">
                      {formatDuration(media.metadata.duration)}
                    </span>
                  )}

                  {/* Usage Badge overlay */}
                  {media.usageCount > 0 ? (
                    <span className="absolute bottom-1 right-1 rounded bg-surface/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-accent shadow-xs border border-accent/20">
                      {media.usageCount} {media.usageCount === 1 ? "use" : "uses"}
                    </span>
                  ) : (
                    <span className="absolute bottom-1 right-1 rounded bg-surface/90 px-1.5 py-0.5 font-mono text-[9px] text-content-faint shadow-xs border border-rule/40">
                      unused
                    </span>
                  )}
                </div>

                {/* Details Footer */}
                <div className="p-2 space-y-0.5 flex-1 flex flex-col justify-between">
                  <p className="truncate font-sans text-xs font-medium text-content" title={media.filename}>
                    {media.filename}
                  </p>
                  <p className="font-mono text-[10px] text-content-faint">
                    {mediaCategory(media.mimeType)} · {formatBytes(media.sizeBytes)}
                    {media.width && media.height ? ` · ${media.width}×${media.height}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="overflow-x-auto rounded-card border border-rule bg-surface-raised">
          <table className="w-full text-left font-sans text-xs">
            <THead>
              <TR className="border-b border-rule bg-surface/60 text-[10px] uppercase tracking-wider text-content-faint font-mono">
                <TH className="p-3">Asset</TH>
                <TH className="p-3">Type & Ratio</TH>
                <TH className="p-3">Dimensions / Duration</TH>
                <TH className="p-3">Size</TH>
                <TH className="p-3">Usage</TH>
                <TH className="p-3">Uploaded</TH>
                <TH className="p-3 text-right">Actions</TH>
              </TR>
            </THead>
            <TBody className="divide-y divide-rule/50">
              {items.map((media) => {
                const orientation =
                  media.metadata?.orientation || detectOrientation(media.width, media.height);
                return (
                  <TR
                    key={media.id}
                    onClick={() => setSelectedMedia(media)}
                    className="cursor-pointer hover:bg-surface/50 transition"
                  >
                    <TD className="p-3 flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-card bg-surface-sunken border border-rule/50 overflow-hidden flex items-center justify-center relative">
                        {media.mimeType.startsWith("image/") ? (
                          <Image
                            src={media.url}
                            alt={media.altText || media.filename || "Thumbnail"}
                            fill
                            sizes="40px"
                            className="object-contain p-0.5"
                            unoptimized
                          />
                        ) : media.mimeType.startsWith("audio/") ? (
                          <Music2 className="h-4 w-4 text-accent" />
                        ) : media.mimeType.startsWith("video/") ? (
                          <Video className="h-4 w-4 text-content-faint" />
                        ) : (
                          <FileText className="h-4 w-4 text-content-faint" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-content truncate max-w-xs">{media.filename}</p>
                        <p className="text-[11px] text-content-soft truncate max-w-xs">{media.altText || "No alt text"}</p>
                      </div>
                    </TD>
                    <TD className="p-3 font-mono text-[11px] text-content-soft">
                      {mediaCategory(media.mimeType)}
                      {orientation ? ` (${orientation})` : ""}
                    </TD>
                    <TD className="p-3 font-mono text-[11px] text-content-soft">
                      {media.width && media.height ? `${media.width}×${media.height}` : ""}
                      {media.metadata?.duration ? formatDuration(media.metadata.duration) : ""}
                      {!media.width && !media.metadata?.duration ? "—" : ""}
                    </TD>
                    <TD className="p-3 font-mono text-[11px] text-content-soft">{formatBytes(media.sizeBytes)}</TD>
                    <TD className="p-3">
                      {media.usageCount > 0 ? (
                        <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
                          {media.usageCount} {media.usageCount === 1 ? "reference" : "references"}
                        </span>
                      ) : (
                        <span className="text-content-faint font-mono text-[11px]">Unused</span>
                      )}
                    </TD>
                    <TD className="p-3 font-mono text-[11px] text-content-faint">
                      {new Date(media.createdAt).toLocaleDateString()}
                    </TD>
                    <TD className="p-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMedia(media);
                        }}
                        className="p-1 text-content-soft hover:text-danger transition"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </table>
        </div>
      )}

      {total > 24 && (
        <nav aria-label="Media pages" className="flex items-center justify-center gap-3 text-xs text-content-soft">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
            className="rounded-card border border-rule px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page} of {Math.ceil(total / 24)}</span>
          <button
            type="button"
            disabled={page >= Math.ceil(total / 24)}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-card border border-rule px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}

      {/* Media Details Slide-Over Panel */}
      {selectedMedia && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-rule shadow-2xl p-6 overflow-y-auto space-y-6 animate-slide-in">
          <div className="flex items-center justify-between border-b border-rule pb-4">
            <h3 className="font-serif text-lg font-normal text-content">Asset Details</h3>
            <button
              type="button"
              onClick={() => setSelectedMedia(null)}
              className="text-content-soft hover:text-content p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Interactive Preview Container */}
          <div className="w-full rounded-card border border-rule bg-surface-raised overflow-hidden">
            {selectedMedia.mimeType.startsWith("image/") ? (
              <div className="relative aspect-video w-full bg-surface-sunken flex items-center justify-center p-2">
                <Image
                  src={selectedMedia.url}
                  alt={selectedMedia.altText || selectedMedia.filename}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : selectedMedia.mimeType.startsWith("audio/") ? (
              <AudioPreviewPlayer
                url={selectedMedia.url}
                filename={selectedMedia.filename}
                initialDuration={selectedMedia.metadata?.duration || null}
              />
            ) : selectedMedia.mimeType.startsWith("video/") ? (
              <div className="aspect-video w-full bg-black flex items-center justify-center">
                <video
                  controls
                  preload="metadata"
                  src={selectedMedia.url}
                  className="h-full w-full object-contain"
                  aria-label={`Play ${selectedMedia.filename}`}
                />
              </div>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                <FileText className="h-12 w-12 text-content-faint" />
                <a
                  href={selectedMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent underline hover:opacity-80"
                >
                  Open or download document ({formatBytes(selectedMedia.sizeBytes)})
                </a>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => handleCopyUrl(selectedMedia.url)}
              className="flex-1 hover:text-accent font-sans"
            >
              {copiedUrl ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedUrl ? "Copied!" : "Copy Asset URL"}
            </Button>

            <a
              href={selectedMedia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-card border border-rule text-content-soft hover:text-accent transition"
              title="Open full size in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={() => handleDeleteMedia(selectedMedia)}
              className="p-2 rounded-card border border-danger/40 text-danger hover:bg-danger/10 transition"
              title="Delete Asset"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Metadata Specs */}
          <div className="space-y-2 rounded-card border border-rule/70 bg-surface-raised/40 p-4 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-content-faint">Filename:</span>
              <span className="text-content truncate max-w-[200px]" title={selectedMedia.filename}>
                {selectedMedia.filename}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-faint">Size:</span>
              <span className="text-content">{formatBytes(selectedMedia.sizeBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-faint">MIME:</span>
              <span className="text-content">{selectedMedia.mimeType}</span>
            </div>
            {selectedMedia.width && selectedMedia.height && (
              <div className="flex justify-between">
                <span className="text-content-faint">Dimensions:</span>
                <span className="text-content">
                  {selectedMedia.width} × {selectedMedia.height} (
                  {selectedMedia.metadata?.orientation ||
                    detectOrientation(selectedMedia.width, selectedMedia.height)}
                  )
                </span>
              </div>
            )}
            {selectedMedia.metadata?.duration && (
              <div className="flex justify-between">
                <span className="text-content-faint">Duration:</span>
                <span className="text-content">
                  {formatDuration(selectedMedia.metadata.duration)} ({Math.round(selectedMedia.metadata.duration)}s)
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-content-faint">Uploaded on:</span>
              <span className="text-content">{new Date(selectedMedia.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Metadata Form */}
          <div className="space-y-4 font-sans text-xs">
            <div>
              <label className="label">
                Alt Text (for SEO & Accessibility)
              </label>
              <input
                type="text"
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                placeholder="Describe image for screen readers & search engines"
                className="w-full p-2 rounded-card border border-rule bg-surface font-sans text-content focus:border-accent focus:outline-none"
              />
            </div>

            <div>
              <label className="label">
                Caption
              </label>
              <textarea
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                rows={2}
                placeholder="Optional editorial caption or credit"
                className="w-full p-2 rounded-card border border-rule bg-surface font-sans text-content focus:border-accent focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="label">Credit</span>
                <input
                  value={editCredit}
                  onChange={(e) => setEditCredit(e.target.value)}
                  className="w-full rounded-card border border-rule bg-surface p-2 text-content"
                  placeholder="Creator / Photographer"
                />
              </label>
              <label className="space-y-1">
                <span className="label">License</span>
                <input
                  value={editLicense}
                  onChange={(e) => setEditLicense(e.target.value)}
                  className="w-full rounded-card border border-rule bg-surface p-2 text-content"
                  placeholder="e.g. Public Domain"
                />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="label">Source URL</span>
              <input
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                className="w-full rounded-card border border-rule bg-surface p-2 text-content"
                placeholder="https://…"
              />
            </label>
            <label className="block space-y-1">
              <span className="label">Tags</span>
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className="w-full rounded-card border border-rule bg-surface p-2 text-content"
                placeholder="Comma-separated tags"
              />
            </label>
            {selectedMedia.mimeType.startsWith("image/") && (
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="label">Focal X (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editFocalX}
                    onChange={(e) => setEditFocalX(Number(e.target.value))}
                    className="w-full rounded-card border border-rule bg-surface p-2 text-content"
                  />
                </label>
                <label className="space-y-1">
                  <span className="label">Focal Y (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editFocalY}
                    onChange={(e) => setEditFocalY(Number(e.target.value))}
                    className="w-full rounded-card border border-rule bg-surface p-2 text-content"
                  />
                </label>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveMetadata}
              disabled={savingMetadata}
              className="w-full rounded-card bg-content px-3 py-2 font-sans text-xs font-semibold text-surface hover:bg-content/90 transition disabled:opacity-50"
            >
              {savingMetadata ? "Saving..." : "Save Metadata"}
            </button>
          </div>

          {/* Dynamic Image Variants */}
          {selectedMedia.mimeType.startsWith("image/") && selectedMedia.mimeType !== "image/svg+xml" && (
            <div className="space-y-2 border-t border-rule pt-4">
              <span className="label">Image variants</span>
              <p className="text-xs text-content-soft">
                Generated on demand without altering the original file. Save the focal point first.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                {(
                  [
                    ["16:9 Landscape", 1200, 675],
                    ["9:16 Portrait", 800, 1200],
                    ["1:1 Square", 800, 800],
                    ["Social Share (1.91:1)", 1200, 630],
                  ] as const
                ).map(([name, width, height]) => {
                  const url = variantUrl(selectedMedia, width, height);
                  return url ? (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-card border border-rule px-2.5 py-1.5 text-content-soft hover:border-accent hover:text-accent transition flex items-center gap-1"
                    >
                      <span>{name}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Usage Tracking Section */}
          <div className="border-t border-rule pt-4 space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between">
              <span className="label">
                Referenced In ({selectedMedia.usageCount})
              </span>
            </div>

            {selectedMedia.usageCount === 0 ? (
              <p className="text-content-faint italic text-[11px]">
                This asset is not currently referenced in any pieces, series, or author profiles. Safe to delete.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-rule/40">
                {selectedMedia.usages.map((u) => (
                  <div key={u.id} className="pt-2 flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[9px] uppercase px-1 rounded bg-surface-raised border border-rule text-content-soft mr-2">
                        {u.entityType} ({u.field})
                      </span>
                      <span className="font-medium text-content">
                        {u.entityTitle || u.entityId}
                      </span>
                    </div>
                    {u.entityType === "Piece" && (
                      <Link
                        href={`/admin/pieces/${u.entityId}`}
                        className="text-accent hover:underline text-[11px] font-sans"
                      >
                        Edit &rarr;
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
