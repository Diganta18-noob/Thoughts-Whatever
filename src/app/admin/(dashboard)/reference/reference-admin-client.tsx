"use client";

import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Search,
  ExternalLink,
  UploadCloud,
  Edit,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Headphones,
  Eye,
} from "lucide-react";
import { RightsBadge } from "@/components/admin/reference/rights-badge";
import { RightsReviewModal } from "@/components/admin/reference/rights-review-modal";
import { ReferenceEditorModal } from "@/components/admin/reference/reference-editor-modal";
import { ReferenceAssetModal } from "@/components/admin/reference/reference-asset-modal";
import { ReferenceClaimsModal } from "@/components/admin/reference/reference-claims-modal";
import toast from "react-hot-toast";

interface ReferenceAdminClientProps {
  initialWorks: any[];
  initialStats: {
    total: number;
    publicDomain: number;
    licensed: number;
    external: number;
    unverified: number;
    restricted: number;
    reviewRequired: number;
  };
}

export function ReferenceAdminClient({ initialWorks, initialStats }: ReferenceAdminClientProps) {
  const [works, setWorks] = useState<any[]>(initialWorks);
  const [stats, setStats] = useState(initialStats);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<any | null>(null);
  const [reviewWork, setReviewWork] = useState<any | null>(null);
  const [assetWork, setAssetWork] = useState<any | null>(null);
  const [isClaimsOpen, setIsClaimsOpen] = useState(false);

  const fetchResources = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/admin/reference?${params.toString()}`);
      const data = await res.json();
      if (data.works) {
        setWorks(data.works);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      toast.error("Failed to refresh reference resources");
    }
  };

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/reference/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Resource deleted successfully");
      setWorks((prev) => prev.filter((w) => w.id !== id));
      fetchResources();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete resource");
    }
  }

  // Client-side quick filter for instantaneous responsiveness
  const filteredWorks = works.filter((w) => {
    const edition = w.editions[0];
    const rightsStatus = edition?.rights?.status || "RIGHTS_UNVERIFIED";

    if (statusFilter !== "ALL" && rightsStatus !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (w.titleBn || "").toLowerCase().includes(q) || (w.titleEn || "").toLowerCase().includes(q);
      const matchSlug = (w.slug || "").toLowerCase().includes(q);
      const matchEditor = (edition?.editor || "").toLowerCase().includes(q);
      const matchPublisher = (edition?.publisher || "").toLowerCase().includes(q);
      return matchTitle || matchSlug || matchEditor || matchPublisher;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-zinc-100">
              Reference Library & Rights Archive
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Rights-aware Bengali literary & historical catalog with strict hosting invariants
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsClaimsOpen(true)}
            className="px-3.5 py-2 text-xs font-mono text-zinc-300 hover:text-zinc-100 border border-zinc-800 rounded-lg hover:bg-zinc-850 flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Takedown Claims
          </button>

          <button
            onClick={() => {
              setEditingWork(null);
              setIsEditorOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Reference
          </button>
        </div>
      </div>

      {/* Rights Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-zinc-400">Total Works</div>
          <div className="font-mono text-xl font-bold text-zinc-100 mt-1">{stats.total}</div>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-emerald-400">Public Domain</div>
          <div className="font-mono text-xl font-bold text-emerald-300 mt-1">{stats.publicDomain}</div>
        </div>
        <div className="bg-sky-950/20 border border-sky-800/40 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-sky-400">Licensed</div>
          <div className="font-mono text-xl font-bold text-sky-300 mt-1">{stats.licensed}</div>
        </div>
        <div className="bg-zinc-900/60 border border-zinc-700/60 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-zinc-300">External Only</div>
          <div className="font-mono text-xl font-bold text-zinc-200 mt-1">{stats.external}</div>
        </div>
        <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-amber-400">Unverified</div>
          <div className="font-mono text-xl font-bold text-amber-300 mt-1">{stats.unverified}</div>
        </div>
        <div className="bg-rose-950/20 border border-rose-800/40 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-rose-400">Restricted</div>
          <div className="font-mono text-xl font-bold text-rose-300 mt-1">{stats.restricted}</div>
        </div>
        <div className="bg-amber-950/30 border border-amber-600/50 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-amber-300">Review Required</div>
          <div className="font-mono text-xl font-bold text-amber-200 mt-1">{stats.reviewRequired}</div>
        </div>
      </div>

      {stats.unverified > 0 && (
        <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>{stats.unverified} items pending rights review.</strong> Unverified resources are automatically restricted to link-only external citations.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter("RIGHTS_UNVERIFIED")}
            className="underline font-mono text-[0.7rem] hover:text-amber-100"
          >
            Filter Unverified →
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-mono">
          {[
            { id: "ALL", label: "All Works" },
            { id: "PUBLIC_DOMAIN", label: "Public Domain" },
            { id: "LICENSED", label: "Licensed" },
            { id: "EXTERNAL_SOURCE", label: "External Source" },
            { id: "RIGHTS_UNVERIFIED", label: "Unverified" },
            { id: "RESTRICTED", label: "Restricted" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-zinc-800 text-emerald-400 font-semibold border border-zinc-700"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-64"
            />
          </div>
          <button
            type="button"
            onClick={fetchResources}
            title="Refresh list"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg hover:bg-zinc-900"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Resource Table */}
      <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950">
        {filteredWorks.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-sm">
            No reference resources found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-mono uppercase text-[0.7rem] tracking-wider">
                  <th className="py-3 px-4">Title & Type</th>
                  <th className="py-3 px-4">Edition / Editor</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Rights Status</th>
                  <th className="py-3 px-4">Hosting</th>
                  <th className="py-3 px-4">Assets</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredWorks.map((w) => {
                  const edition = w.editions[0];
                  const rightsStatus = edition?.rights?.status || "RIGHTS_UNVERIFIED";
                  const hostingMode = edition?.hostingMode || "EXTERNAL";
                  const source = edition?.sources[0];

                  return (
                    <tr key={w.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-sm text-zinc-100 line-clamp-1">
                          {w.titleBn}
                        </div>
                        <div className="text-[0.7rem] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono uppercase text-emerald-400/90">{w.type}</span>
                          <span>•</span>
                          <span>{w.language}</span>
                          {w.author && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-300 font-serif">{w.author.nameBn}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-300">
                        {edition ? (
                          <div>
                            <div className="line-clamp-1">
                              {edition.editor ? `Ed. ${edition.editor}` : edition.publisher || "—"}
                            </div>
                            <div className="text-[0.7rem] text-zinc-500 font-mono">
                              {edition.publicationYear || "Year unrecorded"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">No edition</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {source ? (
                          <a
                            href={source.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-zinc-300 hover:text-emerald-400 line-clamp-1 group"
                          >
                            <span>{source.sourceName}</span>
                            <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-emerald-400" />
                          </a>
                        ) : (
                          <span className="text-zinc-500">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <RightsBadge status={rightsStatus} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono text-[0.65rem] px-2 py-0.5 rounded uppercase ${
                            hostingMode === "THOUGHTS_WHATEVER"
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/50"
                              : "bg-zinc-850 text-zinc-400 border border-zinc-750"
                          }`}
                        >
                          {hostingMode === "THOUGHTS_WHATEVER" ? "Hosted" : "External"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[0.75rem]">
                        {edition?.assets?.length || 0} files
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Preview Button */}
                          <a
                            href={
                              w.type === "AUDIO"
                                ? `/reference/${w.slug}/listen`
                                : `/reference/${w.slug}/read`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            title={
                              w.type === "AUDIO"
                                ? "Open Live Listening Room"
                                : "Open Live Native Reader"
                            }
                            className="p-1.5 rounded-lg border border-amber-800/40 text-amber-400 hover:bg-amber-950/40"
                          >
                            {w.type === "AUDIO" ? (
                              <Headphones className="w-3.5 h-3.5" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </a>

                          {/* Rights Review Button */}
                          <button
                            onClick={() => setReviewWork({ ...w, edition })}
                            title="Evaluate / Review Rights"
                            className="p-1.5 rounded-lg border border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/40"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Add Asset Button */}
                          <button
                            onClick={() => setAssetWork({ ...w, edition })}
                            title="Attach Digital Asset"
                            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Resource */}
                          <button
                            onClick={() => {
                              setEditingWork(w);
                              setIsEditorOpen(true);
                            }}
                            title="Edit Metadata"
                            className="p-1.5 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Resource */}
                          <button
                            onClick={() => handleDelete(w.id, w.titleBn)}
                            title="Delete Resource"
                            className="p-1.5 rounded-lg border border-zinc-800 text-rose-400 hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <ReferenceEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={fetchResources}
        initialData={editingWork}
      />

      {/* Rights Review Modal */}
      {reviewWork && (
        <RightsReviewModal
          isOpen={Boolean(reviewWork)}
          onClose={() => setReviewWork(null)}
          onSuccess={fetchResources}
          workId={reviewWork.id}
          workTitle={reviewWork.titleBn}
          currentStatus={reviewWork.edition?.rights?.status || "RIGHTS_UNVERIFIED"}
          currentLicense={reviewWork.edition?.rights?.license}
          currentRightsHolder={reviewWork.edition?.rights?.rightsHolder}
          currentEvidenceUrl={reviewWork.edition?.rights?.evidenceUrl}
          currentNotes={reviewWork.edition?.rights?.verificationNotes}
          auditLogs={reviewWork.edition?.rightsLogs || []}
        />
      )}

      {/* Asset Modal */}
      {assetWork && (
        <ReferenceAssetModal
          isOpen={Boolean(assetWork)}
          onClose={() => setAssetWork(null)}
          onSuccess={fetchResources}
          workId={assetWork.id}
          workTitle={assetWork.titleBn}
          rightsStatus={assetWork.edition?.rights?.status || "RIGHTS_UNVERIFIED"}
        />
      )}

      {/* Claims Modal */}
      <ReferenceClaimsModal
        isOpen={isClaimsOpen}
        onClose={() => setIsClaimsOpen(false)}
      />
    </div>
  );
}
