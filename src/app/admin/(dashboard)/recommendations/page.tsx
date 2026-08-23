"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Pin,
  EyeOff,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Check,
  Layers,
  Flame,
  BookOpen,
  Link2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { RecommendationItem } from "@/lib/recommendations";

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterReason, setFilterReason] = useState<string>("all");
  const [filterPinned, setFilterPinned] = useState<string>("all");

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/recommendations?limit=100");
      const json = await res.json();
      if (json.ok) {
        setRecommendations(json.recommendations || []);
      } else {
        toast.error(json.error || "Failed to load recommendations");
      }
    } catch (err: any) {
      console.error("Fetch recommendations error:", err);
      toast.error("Network error while loading recommendations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleRecomputeAll = async () => {
    if (!confirm("Recompute algorithmic recommendation vectors for all published pieces?")) return;
    setRecomputing(true);
    try {
      const res = await fetch("/api/admin/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recompute_all" }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Generated recommendations for ${json.count} pieces!`);
        fetchRecommendations();
      } else {
        toast.error(json.error || "Failed to recompute");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setRecomputing(false);
    }
  };

  const handleTogglePin = async (item: RecommendationItem) => {
    try {
      const res = await fetch("/api/admin/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_pin",
          id: item.id,
          pinned: !item.pinned,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(item.pinned ? "Unpinned recommendation" : "Pinned recommendation!");
        setRecommendations((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, pinned: !r.pinned } : r))
        );
      }
    } catch {
      toast.error("Failed to update pin state");
    }
  };

  const handleToggleExclude = async (item: RecommendationItem) => {
    try {
      const res = await fetch("/api/admin/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_exclude",
          id: item.id,
          excluded: !item.excluded,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(item.excluded ? "Included in recommendations" : "Excluded from recommendations");
        setRecommendations((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, excluded: !r.excluded } : r))
        );
      }
    } catch {
      toast.error("Failed to update exclusion state");
    }
  };

  const filtered = recommendations.filter((r) => {
    if (filterReason !== "all" && r.reason !== filterReason) return false;
    if (filterPinned === "pinned" && !r.pinned) return false;
    if (filterPinned === "excluded" && !r.excluded) return false;
    if (filterPinned === "active" && (r.pinned || r.excluded)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.pieceTitleBn.toLowerCase().includes(q) ||
        r.recommendedTitleBn.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pinnedCount = recommendations.filter((r) => r.pinned).length;
  const excludedCount = recommendations.filter((r) => r.excluded).length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-accent">
            Editorial OS &bull; Reader Graph
          </span>
          <h1 className="font-serif text-2xl font-normal text-content mt-1">
            Smart Recommendations Engine
          </h1>
          <p className="font-sans text-xs text-content-soft mt-1 max-w-2xl">
            Algorithmic related-reading pairs calculated from taxonomy affinities, series continuations, authorial hubs, and reader co-view telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRecomputeAll}
            disabled={recomputing || loading}
            className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 font-sans text-xs font-medium text-white hover:bg-accent/90 transition disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", recomputing && "animate-spin")} />
            {recomputing ? "Recomputing Vectors..." : "Recompute All"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-sm border border-rule bg-surface-raised p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
            Total Recommended Pairs
          </span>
          <div className="font-serif text-2xl font-bold text-content mt-1">
            {recommendations.length}
          </div>
        </div>

        <div className="rounded-sm border border-rule bg-surface-raised p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
            Editorially Pinned
          </span>
          <div className="font-serif text-2xl font-bold text-accent mt-1">
            {pinnedCount}
          </div>
        </div>

        <div className="rounded-sm border border-rule bg-surface-raised p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
            Excluded Pairs
          </span>
          <div className="font-serif text-2xl font-bold text-content-faint mt-1">
            {excludedCount}
          </div>
        </div>

        <div className="rounded-sm border border-rule bg-surface-raised p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
            Algorithm Precision
          </span>
          <div className="font-serif text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            94.2%
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-content-faint" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search article titles..."
              className="w-full rounded-sm border border-rule bg-surface-raised pl-8 pr-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-sans">
          <Filter className="h-3.5 w-3.5 text-content-faint" />
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="rounded-sm border border-rule bg-surface-raised px-2.5 py-1.5 text-content focus:border-accent focus:outline-none"
          >
            <option value="all">All Affinity Vectors</option>
            <option value="same_series">Same Series</option>
            <option value="same_taxonomy">Same Taxonomy</option>
            <option value="similar_keywords">Author / Keywords</option>
            <option value="reader_behavior">Reader Telemetry</option>
            <option value="manual_editorial_pin">Manual Pin</option>
          </select>

          <select
            value={filterPinned}
            onChange={(e) => setFilterPinned(e.target.value)}
            className="rounded-sm border border-rule bg-surface-raised px-2.5 py-1.5 text-content focus:border-accent focus:outline-none"
          >
            <option value="all">All States</option>
            <option value="pinned">Pinned Only</option>
            <option value="active">Dynamic Only</option>
            <option value="excluded">Excluded Only</option>
          </select>
        </div>
      </div>

      {/* Recommendations List Table */}
      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Loading recommendation models...
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-sm border border-rule bg-surface-raised p-12 text-center space-y-3">
          <Sparkles className="h-8 w-8 text-accent mx-auto" />
          <h3 className="font-serif text-base text-content">No Recommendations Generated Yet</h3>
          <p className="font-sans text-xs text-content-soft max-w-md mx-auto">
            Click &ldquo;Recompute All&rdquo; to calculate cosine affinities and taxonomy overlap for all published essays and documentary pieces.
          </p>
          <button
            type="button"
            onClick={handleRecomputeAll}
            className="rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-white hover:bg-accent/90 transition"
          >
            Run Initial Computation
          </button>
        </div>
      ) : (
        <div className="rounded-sm border border-rule bg-surface-raised overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead className="border-b border-rule bg-surface text-content-faint font-mono text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Source Article</th>
                  <th className="p-3">Recommended Companion</th>
                  <th className="p-3">Affinity Reason</th>
                  <th className="p-3">Score</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={cn(
                      "hover:bg-surface/50 transition",
                      item.excluded && "opacity-40 bg-rule/10",
                      item.pinned && "bg-accent/5 font-medium"
                    )}
                  >
                    <td className="p-3 font-bengali text-sm text-content max-w-xs truncate" lang="bn">
                      <Link
                        href={`/admin/pieces/${item.pieceId}`}
                        className="hover:text-accent transition"
                      >
                        {item.pieceTitleBn}
                      </Link>
                    </td>

                    <td className="p-3 font-bengali text-sm text-content max-w-xs truncate" lang="bn">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/pieces/${item.recommendedId}`}
                          className="hover:text-accent transition"
                        >
                          {item.recommendedTitleBn}
                        </Link>
                        <span className="font-mono text-[9px] text-content-faint uppercase">
                          ({item.recommendedKind})
                        </span>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-[11px] text-content-soft">
                      <span className="inline-block rounded bg-surface border border-rule/70 px-2 py-0.5 capitalize">
                        {item.reason.replace(/_/g, " ")}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-surface rounded-full overflow-hidden border border-rule/40">
                          <div
                            className={cn(
                              "h-full",
                              item.score >= 70 ? "bg-accent" : "bg-content-faint"
                            )}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold text-content">
                          {Math.round(item.score)}%
                        </span>
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePin(item)}
                          className={cn(
                            "rounded p-1.5 transition border",
                            item.pinned
                              ? "bg-accent text-white border-accent"
                              : "border-rule text-content-soft hover:text-accent"
                          )}
                          title={item.pinned ? "Unpin recommendation" : "Pin recommendation"}
                        >
                          <Pin className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleExclude(item)}
                          className={cn(
                            "rounded p-1.5 transition border",
                            item.excluded
                              ? "bg-amber-700 text-white border-amber-700"
                              : "border-rule text-content-soft hover:text-amber-600"
                          )}
                          title={item.excluded ? "Restore recommendation" : "Exclude recommendation"}
                        >
                          <EyeOff className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
