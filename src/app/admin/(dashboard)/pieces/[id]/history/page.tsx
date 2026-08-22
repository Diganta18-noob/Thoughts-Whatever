"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  History,
  ArrowLeft,
  RotateCcw,
  GitCompare,
  Eye,
  Check,
  Clock,
  User,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { RevisionDiffViewer } from "@/components/admin/revision-diff-viewer";
import { cn } from "@/lib/utils";

interface Revision {
  id: string;
  version: number;
  titleBn: string;
  titleEn?: string | null;
  subtitleBn?: string | null;
  dekBn?: string | null;
  bodyBn: string;
  excerptBn?: string | null;
  coverImage?: string | null;
  editedByName?: string | null;
  editedByEmail?: string | null;
  changeSummary?: string | null;
  status: string;
  createdAt: string;
}

export default function PieceRevisionHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const pieceId = params?.id as string;

  const [piece, setPiece] = useState<{ id: string; titleBn: string; slug: string } | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);

  // Compare states
  const [versionA, setVersionA] = useState<Revision | null>(null);
  const [versionB, setVersionB] = useState<Revision | null>(null);
  const [previewRevision, setPreviewRevision] = useState<Revision | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pieces/${pieceId}/revisions`);
      const data = await res.json();
      if (data.ok) {
        setPiece(data.piece);
        setRevisions(data.revisions);
        if (data.revisions.length >= 2) {
          setVersionA(data.revisions[1]);
          setVersionB(data.revisions[0]);
        } else if (data.revisions.length === 1) {
          setVersionB(data.revisions[0]);
        }
      } else {
        toast.error("Failed to load revision history");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pieceId) fetchHistory();
  }, [pieceId]);

  const handleRestore = async (revision: Revision) => {
    if (
      !confirm(
        `Are you sure you want to restore "${piece?.titleBn}" to Version ${revision.version}? A new snapshot of the current state will be preserved automatically.`
      )
    )
      return;

    setRestoring(true);
    try {
      const res = await fetch(`/api/admin/pieces/${pieceId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", revisionId: revision.id }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Restored to Version ${revision.version}!`);
        router.push(`/admin/pieces/${pieceId}`);
      } else {
        toast.error(data.error || "Failed to restore revision");
      }
    } catch {
      toast.error("Failed to restore revision");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <Link
            href={`/admin/pieces/${pieceId}`}
            className="inline-flex items-center gap-1.5 font-sans text-xs text-content-soft hover:text-accent transition mb-2"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Editor
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Revision History & Version Control
            </h1>
            <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent uppercase">
              {revisions.length} {revisions.length === 1 ? "SNAPSHOT" : "SNAPSHOTS"}
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft font-bengali text-base" lang="bn">
            {piece?.titleBn}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Loading version timeline and snapshots...
        </div>
      ) : revisions.length === 0 ? (
        <div className="rounded-sm border border-rule bg-surface-raised p-12 text-center">
          <History className="h-8 w-8 text-content-faint mx-auto mb-3" />
          <h3 className="font-serif text-lg font-normal text-content">
            No Historical Snapshots Yet
          </h3>
          <p className="font-sans text-xs text-content-soft mt-1 max-w-md mx-auto">
            Revisions are created automatically whenever this piece is saved or updated in the editor.
          </p>
          <Link
            href={`/admin/pieces/${pieceId}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-white hover:bg-accent/90 transition"
          >
            Open in Editor
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Revision Timeline List (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="label">
              Snapshot Timeline
            </h2>

            <div className="rounded-sm border border-rule bg-surface-raised divide-y divide-rule/70 max-h-[700px] overflow-y-auto">
              {revisions.map((rev, idx) => {
                const isSelectedA = versionA?.id === rev.id;
                const isSelectedB = versionB?.id === rev.id;
                const isLatest = idx === 0;

                return (
                  <div
                    key={rev.id}
                    className={cn(
                      "p-4 transition hover:bg-surface/50 text-xs font-sans space-y-2",
                      isSelectedB && "bg-accent/5 border-l-2 border-accent"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-content text-sm">
                          v{rev.version}
                        </span>
                        {isLatest && (
                          <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                            CURRENT
                          </span>
                        )}
                        <span className="rounded border border-rule px-1 font-mono text-[9px] text-content-faint">
                          {rev.status}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRestore(rev)}
                        disabled={restoring || isLatest}
                        className="flex items-center gap-1 font-sans text-[11px] text-content-soft hover:text-accent disabled:opacity-30 transition"
                        title={isLatest ? "Already on this version" : "Restore this snapshot"}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </button>
                    </div>

                    <p className="font-sans text-content font-medium leading-snug">
                      {rev.changeSummary || `Version ${rev.version} snapshot`}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-content-faint font-mono pt-1">
                      <span>{rev.editedByName || rev.editedByEmail || "Admin"}</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Compare Selector buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-rule/40 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setVersionA(rev)}
                        className={cn(
                          "px-2 py-0.5 rounded border transition",
                          isSelectedA
                            ? "bg-content text-surface font-semibold border-content"
                            : "border-rule text-content-soft hover:border-content"
                        )}
                      >
                        Set Base (A)
                      </button>

                      <button
                        type="button"
                        onClick={() => setVersionB(rev)}
                        className={cn(
                          "px-2 py-0.5 rounded border transition",
                          isSelectedB
                            ? "bg-accent text-white font-semibold border-accent"
                            : "border-rule text-content-soft hover:border-accent"
                        )}
                      >
                        Set Target (B)
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewRevision(rev)}
                        className="ml-auto text-content-soft hover:text-accent p-1"
                        title="Preview markdown"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Visual Diff & Preview (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="label">
                Visual Comparison (Diff)
              </h2>
              {versionA && versionB && (
                <span className="font-mono text-xs text-content-soft">
                  v{versionA.version} &rarr; v{versionB.version}
                </span>
              )}
            </div>

            {versionA && versionB ? (
              <div className="space-y-4">
                <RevisionDiffViewer
                  originalText={versionA.bodyBn}
                  revisedText={versionB.bodyBn}
                  originalLabel={`v${versionA.version} (${new Date(versionA.createdAt).toLocaleDateString()})`}
                  revisedLabel={`v${versionB.version} (${new Date(versionB.createdAt).toLocaleDateString()})`}
                />

                {/* Metadata differences */}
                <div className="rounded-sm border border-rule bg-surface-raised p-4 space-y-3 font-sans text-xs">
                  <h4 className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
                    Metadata Comparison
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-surface rounded border border-rule/50 space-y-1">
                      <span className="font-mono text-[10px] text-content-faint">Base: v{versionA.version}</span>
                      <p className="font-bold text-content">{versionA.titleBn}</p>
                      {versionA.dekBn && <p className="text-content-soft">{versionA.dekBn}</p>}
                    </div>

                    <div className="p-3 bg-surface rounded border border-rule/50 space-y-1">
                      <span className="font-mono text-[10px] text-content-faint">Target: v{versionB.version}</span>
                      <p className="font-bold text-content">{versionB.titleBn}</p>
                      {versionB.dekBn && <p className="text-content-soft">{versionB.dekBn}</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-sm border border-rule bg-surface-raised p-12 text-center font-sans text-xs text-content-faint">
                Select a Base (A) and Target (B) snapshot from the timeline to compare changes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
