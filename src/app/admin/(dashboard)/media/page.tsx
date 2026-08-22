"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Image as ImageIcon,
  UploadCloud,
  Search,
  Filter,
  Grid,
  List,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Info,
  AlertTriangle,
  RefreshCw,
  FileText,
  Video,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

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

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Selected item for details slide-over
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [editAltText, setEditAltText] = useState("");
  const [editCaption, setEditCaption] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "24",
        type: filterType,
        search,
        unused: unusedOnly ? "true" : "false",
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
  };

  useEffect(() => {
    fetchMedia();
  }, [filterType, unusedOnly, search, page]);

  useEffect(() => {
    if (selectedMedia) {
      setEditAltText(selectedMedia.altText || "");
      setEditCaption(selectedMedia.caption || "");
    }
  }, [selectedMedia]);

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files.length) return;
    setUploading(true);

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/admin/media", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.ok) successCount++;
      } catch {
        console.error("Upload failed for:", file.name);
      }
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      fetchMedia();
    } else {
      toast.error("Upload failed");
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
        }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Metadata updated");
        setSelectedMedia({ ...selectedMedia, altText: editAltText, caption: editCaption });
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

  const handleDeleteMedia = async (media: MediaItem, force = false) => {
    if (media.usageCount > 0 && !force) {
      if (
        !confirm(
          `WARNING: This file is currently used in ${media.usageCount} place(s) (e.g. "${media.usages[0]?.entityTitle || "content"}"). Deleting it will result in broken images on live articles. Do you wish to force delete?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to delete "${media.filename}"?`)) return;
    }

    try {
      const res = await fetch(`/api/admin/media/${media.id}?force=${force ? "true" : "false"}`, {
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

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success("Media URL copied to clipboard");
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSyncUsages = async () => {
    try {
      toast.loading("Scanning pieces and series for media references...", { id: "sync" });
      const res = await fetch("/api/admin/media/sync-usage", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Synced! Indexed ${data.linkedCount} asset usage references.`, { id: "sync" });
        fetchMedia();
      }
    } catch {
      toast.error("Failed to sync usages", { id: "sync" });
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
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
            Centralized media asset management with drag & drop uploads and usage tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSyncUsages}
            className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-sans text-xs font-medium text-content-soft hover:text-accent transition"
            title="Scan articles and series to refresh usage references"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Sync Usage Tracker
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-white hover:bg-accent/90 transition disabled:opacity-50"
          >
            <UploadCloud className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Files"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
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
        className="cursor-pointer border-2 border-dashed border-rule/80 hover:border-accent/60 rounded-sm bg-surface-raised/40 p-6 text-center transition group"
      >
        <UploadCloud className="h-8 w-8 text-content-faint group-hover:text-accent mx-auto mb-2 transition" />
        <p className="font-serif text-sm text-content">
          Drag & Drop images or files here, or <span className="text-accent underline">browse</span>
        </p>
        <p className="font-sans text-[11px] text-content-soft mt-1">
          Supports PNG, JPG, WebP, SVG, MP4, and PDF (Max 25MB per file)
        </p>
      </div>

      {/* Controls & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-sm border border-rule">
          {[
            { id: "all", label: "All Assets" },
            { id: "image", label: "Images" },
            { id: "video", label: "Videos" },
            { id: "document", label: "Documents" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setFilterType(t.id);
                setPage(1);
              }}
              className={cn(
                "px-3 py-1 text-xs font-sans rounded-sm transition",
                filterType === t.id
                  ? "bg-surface font-semibold text-content shadow-xs"
                  : "text-content-soft hover:text-content"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search, Unused Toggle & View Switcher */}
        <div className="flex items-center gap-3">
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
              className="pl-8 pr-3 py-1.5 text-xs rounded-sm border border-rule bg-surface font-sans text-content placeholder:text-content-faint focus:border-accent focus:outline-none w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center border border-rule rounded-sm bg-surface-raised overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 transition",
                viewMode === "grid" ? "bg-surface text-content" : "text-content-soft hover:text-content"
              )}
              title="Grid View"
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
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid / List Layout */}
      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Loading media library assets...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-sm border border-rule bg-surface-raised p-12 text-center">
          <ImageIcon className="h-8 w-8 text-content-faint mx-auto mb-2" />
          <h3 className="font-serif text-lg font-normal text-content">No Media Assets Found</h3>
          <p className="font-sans text-xs text-content-soft mt-1">
            {search || filterType !== "all" || unusedOnly
              ? "Try adjusting your filters or search query."
              : "Upload your first image, audio, or document using the upload button above."}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((media) => {
            const isSelected = selectedMedia?.id === media.id;
            const isImage = media.mimeType.startsWith("image/");

            return (
              <div
                key={media.id}
                onClick={() => setSelectedMedia(media)}
                className={cn(
                  "group relative cursor-pointer rounded-sm border border-rule bg-surface-raised overflow-hidden transition hover:border-accent/80 hover:shadow-xs",
                  isSelected && "ring-2 ring-accent border-accent"
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square w-full bg-surface overflow-hidden flex items-center justify-center">
                  {isImage ? (
                    <img
                      src={media.url}
                      alt={media.altText || media.filename}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : media.mimeType.startsWith("video/") ? (
                    <Video className="h-8 w-8 text-content-faint" />
                  ) : (
                    <FileText className="h-8 w-8 text-content-faint" />
                  )}

                  {/* Usage Badge overlay */}
                  {media.usageCount > 0 ? (
                    <span className="absolute bottom-1 right-1 rounded bg-surface/90 px-1.5 py-0.5 font-mono text-[9px] font-bold text-accent shadow-xs">
                      {media.usageCount} uses
                    </span>
                  ) : (
                    <span className="absolute bottom-1 right-1 rounded bg-surface/90 px-1.5 py-0.5 font-mono text-[9px] text-content-faint shadow-xs">
                      unused
                    </span>
                  )}
                </div>

                {/* Details Footer */}
                <div className="p-2 space-y-0.5">
                  <p className="truncate font-sans text-xs font-medium text-content" title={media.filename}>
                    {media.filename}
                  </p>
                  <p className="font-mono text-[10px] text-content-faint">
                    {formatBytes(media.sizeBytes)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-sm border border-rule bg-surface-raised overflow-hidden">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-rule bg-surface/60 text-[10px] uppercase tracking-wider text-content-faint font-mono">
                <th className="p-3">Asset</th>
                <th className="p-3">Type</th>
                <th className="p-3">Size</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Uploaded</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/50">
              {items.map((media) => (
                <tr
                  key={media.id}
                  onClick={() => setSelectedMedia(media)}
                  className="cursor-pointer hover:bg-surface/50 transition"
                >
                  <td className="p-3 flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded bg-surface border border-rule/50 overflow-hidden flex items-center justify-center">
                      {media.mimeType.startsWith("image/") ? (
                        <img src={media.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <FileText className="h-4 w-4 text-content-faint" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-content">{media.filename}</p>
                      <p className="text-[11px] text-content-soft truncate max-w-xs">{media.altText || "No alt text"}</p>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-content-soft">{media.mimeType}</td>
                  <td className="p-3 font-mono text-[11px] text-content-soft">{formatBytes(media.sizeBytes)}</td>
                  <td className="p-3">
                    {media.usageCount > 0 ? (
                      <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">
                        {media.usageCount} {media.usageCount === 1 ? "reference" : "references"}
                      </span>
                    ) : (
                      <span className="text-content-faint font-mono text-[11px]">Unused</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-content-faint">
                    {new Date(media.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedia(media);
                      }}
                      className="p-1 text-content-soft hover:text-rose-600 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

          {/* Large Preview */}
          <div className="aspect-video w-full rounded-sm border border-rule bg-surface-raised overflow-hidden flex items-center justify-center relative">
            {selectedMedia.mimeType.startsWith("image/") ? (
              <img
                src={selectedMedia.url}
                alt={selectedMedia.altText || selectedMedia.filename}
                className="h-full w-full object-contain"
              />
            ) : (
              <FileText className="h-12 w-12 text-content-faint" />
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyUrl(selectedMedia.url)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-sm border border-rule px-3 py-2 font-sans text-xs font-medium text-content hover:border-accent hover:text-accent transition"
            >
              {copiedUrl ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedUrl ? "Copied!" : "Copy Asset URL"}
            </button>

            <a
              href={selectedMedia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-sm border border-rule text-content-soft hover:text-accent transition"
              title="Open full size"
            >
              <ExternalLink className="h-4 w-4" />
            </a>

            <button
              type="button"
              onClick={() => handleDeleteMedia(selectedMedia)}
              className="p-2 rounded-sm border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
              title="Delete Asset"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Metadata Specs */}
          <div className="space-y-2 rounded-sm border border-rule/70 bg-surface-raised/40 p-4 font-mono text-xs">
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
              <span className="text-content-faint">Type:</span>
              <span className="text-content">{selectedMedia.mimeType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-content-faint">Uploaded by:</span>
              <span className="text-content">{selectedMedia.uploadedBy || "Admin"}</span>
            </div>
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
                className="w-full p-2 rounded-sm border border-rule bg-surface font-sans text-content focus:border-accent focus:outline-none"
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
                className="w-full p-2 rounded-sm border border-rule bg-surface font-sans text-content focus:border-accent focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveMetadata}
              disabled={savingMetadata}
              className="w-full rounded-sm bg-content px-3 py-2 font-sans text-xs font-semibold text-surface hover:bg-content/90 transition disabled:opacity-50"
            >
              {savingMetadata ? "Saving..." : "Save Metadata"}
            </button>
          </div>

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
                        {u.entityType}
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
