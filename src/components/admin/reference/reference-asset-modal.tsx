"use client";

import React, { useState } from "react";
import { ReferenceAssetKind, ReferenceRightsStatus } from "@prisma/client";
import { UploadCloud, X, Loader2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface ReferenceAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workId: string;
  workTitle: string;
  rightsStatus: ReferenceRightsStatus;
}

export function ReferenceAssetModal({
  isOpen,
  onClose,
  onSuccess,
  workId,
  workTitle,
  rightsStatus,
}: ReferenceAssetModalProps) {
  const [kind, setKind] = useState<ReferenceAssetKind>("PDF");
  const [title, setTitle] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [durationSec, setDurationSec] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [narrator, setNarrator] = useState("");
  const [isDownloadable, setIsDownloadable] = useState(true);
  const [isOnlineReadable, setIsOnlineReadable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isRightsVerified =
    rightsStatus === "PUBLIC_DOMAIN" || rightsStatus === "LICENSED";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) {
      toast.error("Please provide both asset title and file URL.");
      return;
    }

    if (!isRightsVerified) {
      toast.error(
        "Cannot attach hosted file assets to unverified or restricted resources. Please complete the rights review first.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reference/${workId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          title,
          fileUrl,
          mimeType: mimeType || undefined,
          durationSec: durationSec ? parseInt(durationSec, 10) : undefined,
          transcriptText: transcriptText || undefined,
          narrator: narrator || undefined,
          isDownloadable,
          isOnlineReadable,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to attach asset");

      toast.success("ডিজিটাল ফাইল সফলভাবে যুক্ত করা হয়েছে।");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to attach asset");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-surface border border-rule rounded-xl shadow-2xl p-6 text-content-faint my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-content-faint hover:text-content-faint/80 p-1.5 rounded-lg hover:bg-surface-raised/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-rule pb-4 mb-5">
          <div className="p-2.5 rounded-lg bg-success/40 border border-success/40 text-success">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-content-faint">
              Attach Digital Archival Asset
            </h2>
            <p className="text-xs text-content-faint line-clamp-1">{workTitle}</p>
          </div>
        </div>

        {!isRightsVerified ? (
          <div className="p-4 bg-danger/30 border border-danger/50 rounded-lg space-y-3">
            <div className="flex items-start gap-2.5 text-danger text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Asset Upload Guard Active</strong>
                <p className="text-xs text-danger/90 mt-1 leading-relaxed">
                  This work is currently marked as{" "}
                  <code className="bg-danger/80 px-1 py-0.5 rounded font-mono">{rightsStatus}</code>.
                  Under the Thoughts.Whatever rights architecture, hosting digital files (PDF, Audio, EPUB) is restricted to verified <strong>PUBLIC_DOMAIN</strong> or <strong>LICENSED</strong> materials.
                </p>
              </div>
            </div>
            <p className="text-xs text-content-faint">
              Please conduct a formal Rights Evaluation review to elevate this item before adding hosted files.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono text-content-faint border border-rule rounded-lg hover:bg-surface-raised"
              >
                Close & Review Rights
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  Asset Kind *
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as ReferenceAssetKind)}
                  className="w-full bg-surface-raised border border-rule rounded-lg px-3 py-2 text-sm text-content-faint focus:outline-none focus:border-success"
                >
                  <option value="PDF">PDF (Digitized Book / Document)</option>
                  <option value="EPUB">EPUB (Digital Reader File)</option>
                  <option value="AUDIO">AUDIO (Narration / Voice Recording)</option>
                  <option value="TRANSCRIPT">TRANSCRIPT (Full Text Transcription)</option>
                  <option value="SCAN_IMAGE">SCAN_IMAGE (Archival Plate / Manuscript Page)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  Asset Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete Historical Edition (PDF)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-raised border border-rule rounded-lg px-3 py-2 text-sm text-content-faint focus:outline-none focus:border-success"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                Hosted File URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://... (Cloudinary, S3, or verified archive link)"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="w-full bg-surface-raised border border-rule rounded-lg px-3 py-2 text-sm text-content-faint focus:outline-none focus:border-success"
              />
            </div>

            {kind === "AUDIO" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    Duration (Seconds)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1820"
                    value={durationSec}
                    onChange={(e) => setDurationSec(e.target.value)}
                    className="w-full bg-surface-raised border border-rule rounded-lg px-3 py-2 text-sm text-content-faint focus:outline-none focus:border-success"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                    Narrator / Reader
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Thoughts.Whatever Voice Archive"
                    value={narrator}
                    onChange={(e) => setNarrator(e.target.value)}
                    className="w-full bg-surface-raised border border-rule rounded-lg px-3 py-2 text-sm text-content-faint focus:outline-none focus:border-success"
                  />
                </div>
              </div>
            )}

            {kind === "TRANSCRIPT" && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                  Full Bengali Transcript / OCR Text
                </label>
                <textarea
                  rows={4}
                  placeholder="সম্পূর্ণ অনুলিপি বা পাঠ্য..."
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  className="w-full bg-surface-raised border border-rule rounded-lg px-3 py-2 text-sm text-content-faint focus:outline-none focus:border-success font-serif"
                />
              </div>
            )}

            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-xs text-content-faint cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDownloadable}
                  onChange={(e) => setIsDownloadable(e.target.checked)}
                  className="rounded border-rule text-success focus:ring-success"
                />
                Allow Direct Download
              </label>
              <label className="flex items-center gap-2 text-xs text-content-faint cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOnlineReadable}
                  onChange={(e) => setIsOnlineReadable(e.target.checked)}
                  className="rounded border-rule text-success focus:ring-success"
                />
                Available in Online Reader
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-rule">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-content-faint hover:text-content-faint/80 border border-rule rounded-lg hover:bg-surface-raised/50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-content bg-success hover:bg-success/85 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Archival Asset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
