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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-success/40 border border-success/40 text-success">
              <BookOpen className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-content-faint">
              Reference Library & Rights Archive
            </h1>
          </div>
          <p className="text-xs text-content-faint mt-1">
            Rights-aware Bengali literary & historical catalog with strict hosting invariants
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsClaimsOpen(true)}
            className="px-3.5 py-2 text-xs font-mono text-content-faint hover:text-content-faint/80 border border-rule rounded-lg hover:bg-surface-raised flex items-center gap-1.5 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-warning" />
            Takedown Claims
          </button>

          <button
            onClick={() => {
              setEditingWork(null);
              setIsEditorOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-content bg-success hover:bg-success/85 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Reference
          </button>
        </div>
      </div>

      {/* Rights Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-surface-raised/60 border border-rule p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-content-faint">Total Works</div>
          <div className="font-mono text-xl font-bold text-content-faint mt-1">{stats.total}</div>
        </div>
        <div className="bg-success/20 border border-success/40 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-success">Public Domain</div>
          <div className="font-mono text-xl font-bold text-success mt-1">{stats.publicDomain}</div>
        </div>
        <div className="bg-info/20 border border-info/40 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-info">Licensed</div>
          <div className="font-mono text-xl font-bold text-info mt-1">{stats.licensed}</div>
        </div>
        <div className="bg-surface-raised/60 border border-rule/60 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-content-faint">External Only</div>
          <div className="font-mono text-xl font-bold text-content-faint mt-1">{stats.external}</div>
        </div>
        <div className="bg-warning/20 border border-warning/40 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-warning">Unverified</div>
          <div className="font-mono text-xl font-bold text-warning mt-1">{stats.unverified}</div>
        </div>
        <div className="bg-danger/20 border border-danger/40 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-danger">Restricted</div>
          <div className="font-mono text-xl font-bold text-danger mt-1">{stats.restricted}</div>
        </div>
        <div className="bg-warning/30 border border-warning/50 p-3 rounded-lg">
          <div className="text-[0.65rem] font-mono uppercase text-warning">Review Required</div>
          <div className="font-mono text-xl font-bold text-warning mt-1">{stats.reviewRequired}</div>
        </div>
      </div>

      {stats.unverified > 0 && (
        <div className="p-3 bg-warning/30 border border-warning/50 rounded-lg flex items-center justify-between text-xs text-warning">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>{stats.unverified} items pending rights review.</strong> Unverified resources are automatically restricted to link-only external citations.
            </span>
          </div>
          <button
            onClick={() => setStatusFilter("RIGHTS_UNVERIFIED")}
            className="underline font-mono text-[0.7rem] hover:text-warning"
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
                  ? "bg-surface-raised text-success font-semibold border border-rule"
                  : "text-content-soft hover:text-content-faint hover:bg-surface-raised"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-content-faint" />
            <input
              type="text"
              placeholder="Search archive..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-surface-raised border border-rule rounded-lg text-xs text-content-faint placeholder-content-faint focus:outline-none focus:border-success w-48 sm:w-64"
            />
          </div>
          <button
            type="button"
            onClick={fetchResources}
            title="Refresh list"
            className="p-1.5 text-content-faint hover:text-content-faint/80 border border-rule rounded-lg hover:bg-surface-raised"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Resource Table */}
      <div className="border border-rule rounded-xl overflow-hidden bg-surface">
        {filteredWorks.length === 0 ? (
          <div className="py-16 text-center text-content-faint text-sm">
            No reference resources found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-rule bg-surface-raised/50 text-content-faint font-mono uppercase text-[0.7rem] tracking-wider">
                  <th className="py-3 px-4">Title & Type</th>
                  <th className="py-3 px-4">Edition / Editor</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Rights Status</th>
                  <th className="py-3 px-4">Hosting</th>
                  <th className="py-3 px-4">Assets</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {filteredWorks.map((w) => {
                  const edition = w.editions[0];
                  const rightsStatus = edition?.rights?.status || "RIGHTS_UNVERIFIED";
                  const hostingMode = edition?.hostingMode || "EXTERNAL";
                  const source = edition?.sources[0];

                  return (
                    <tr key={w.id} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-sm text-content-faint line-clamp-1">
                          {w.titleBn}
                        </div>
                        <div className="text-[0.7rem] text-content-faint flex items-center gap-2 mt-0.5">
                          <span className="font-mono uppercase text-success/90">{w.type}</span>
                          <span>•</span>
                          <span>{w.language}</span>
                          {w.author && (
                            <>
                              <span>•</span>
                              <span className="text-content-faint font-serif">{w.author.nameBn}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-content-faint">
                        {edition ? (
                          <div>
                            <div className="line-clamp-1">
                              {edition.editor ? `Ed. ${edition.editor}` : edition.publisher || "—"}
                            </div>
                            <div className="text-[0.7rem] text-content-faint font-mono">
                              {edition.publicationYear || "Year unrecorded"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-content-faint italic">No edition</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {source ? (
                          <a
                            href={source.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-content-faint hover:text-success line-clamp-1 group"
                          >
                            <span>{source.sourceName}</span>
                            <ExternalLink className="w-3 h-3 text-content-faint group-hover:text-success" />
                          </a>
                        ) : (
                          <span className="text-content-faint">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <RightsBadge status={rightsStatus} size="sm" />
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono text-[0.65rem] px-2 py-0.5 rounded uppercase ${
                            hostingMode === "THOUGHTS_WHATEVER"
                              ? "bg-success/60 text-success border border-success/50"
                              : "bg-surface-raised text-content-faint border border-rule"
                          }`}
                        >
                          {hostingMode === "THOUGHTS_WHATEVER" ? "Hosted" : "External"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-content-faint font-mono text-[0.75rem]">
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
                            className="p-1.5 rounded-lg border border-warning/40 text-warning hover:bg-warning/40"
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
                            className="p-1.5 rounded-lg border border-success/40 text-success hover:bg-success/40"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </button>

                          {/* Add Asset Button */}
                          <button
                            onClick={() => setAssetWork({ ...w, edition })}
                            title="Attach Digital Asset"
                            className="p-1.5 rounded-lg border border-rule text-content-faint hover:bg-surface-raised"
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
                            className="p-1.5 rounded-lg border border-rule text-content-faint hover:bg-surface-raised"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Resource */}
                          <button
                            onClick={() => handleDelete(w.id, w.titleBn)}
                            title="Delete Resource"
                            className="p-1.5 rounded-lg border border-rule text-danger hover:bg-danger/40"
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
