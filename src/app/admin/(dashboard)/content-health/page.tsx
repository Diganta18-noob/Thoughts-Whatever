"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Issue {
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
}

interface PieceReport {
  id: string;
  slug: string;
  titleBn: string;
  kind: string;
  status: string;
  score: number;
  grade: "healthy" | "needs_attention" | "critical";
  wordCount: number;
  readingMinutes: number;
  hasCoverImage: boolean;
  hasMetaDescription: boolean;
  hasAuthors: boolean;
  hasDek: boolean;
  hasTags: boolean;
  lastUpdatedDaysAgo: number;
  issues: Issue[];
  updatedAt: string;
}

export default function ContentHealthPage() {
  const [data, setData] = useState<{
    averageScore: number;
    totalPieces: number;
    healthyCount: number;
    needsAttentionCount: number;
    criticalCount: number;
    topIssues: Array<{ message: string; count: number }>;
    pieces: PieceReport[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score-asc" | "score-desc" | "updated">("score-asc");

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content-health");
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        toast.error("Failed to load content health");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const filteredPieces = (data?.pieces || []).filter((p) => {
    if (filterGrade !== "all" && p.grade !== filterGrade) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.titleBn.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "score-asc") return a.score - b.score;
    if (sortBy === "score-desc") return b.score - a.score;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Content Health Dashboard
            </h1>
            {data && (
              <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent uppercase">
                AVG SCORE {data.averageScore} / 100
              </span>
            )}
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Editorial quality inspection, missing metadata surveillance, and actionable content health scoring.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-sans text-xs font-medium text-content-soft hover:text-content hover:border-content transition disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Re-evaluate Health
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Evaluating content health criteria across all published and draft articles...
        </div>
      ) : data ? (
        <>
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Overall Score */}
            <div className="rounded-sm border border-rule bg-surface-raised p-5 space-y-2">
              <span className="label">
                Overall Index
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl font-normal text-content">
                  {data.averageScore}
                </span>
                <span className="font-mono text-xs text-content-faint">/ 100</span>
              </div>
              <div className="h-1.5 w-full bg-rule/50 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all",
                    data.averageScore >= 80 ? "bg-emerald-600" : data.averageScore >= 50 ? "bg-amber-500" : "bg-rose-600"
                  )}
                  style={{ width: `${data.averageScore}%` }}
                />
              </div>
            </div>

            {/* Healthy Card */}
            <div
              onClick={() => setFilterGrade(filterGrade === "healthy" ? "all" : "healthy")}
              className={cn(
                "cursor-pointer rounded-sm border border-rule bg-surface-raised p-5 space-y-1 transition hover:border-emerald-500/50",
                filterGrade === "healthy" && "ring-2 ring-emerald-500"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="label">
                  Healthy
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="font-serif text-3xl font-normal text-emerald-700 dark:text-emerald-400">
                {data.healthyCount}
              </div>
              <p className="font-sans text-[11px] text-content-soft">Score 80–100 (Optimal)</p>
            </div>

            {/* Needs Attention Card */}
            <div
              onClick={() => setFilterGrade(filterGrade === "needs_attention" ? "all" : "needs_attention")}
              className={cn(
                "cursor-pointer rounded-sm border border-rule bg-surface-raised p-5 space-y-1 transition hover:border-amber-500/50",
                filterGrade === "needs_attention" && "ring-2 ring-amber-500"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="label">
                  Needs Attention
                </span>
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="font-serif text-3xl font-normal text-amber-700 dark:text-amber-400">
                {data.needsAttentionCount}
              </div>
              <p className="font-sans text-[11px] text-content-soft">Score 50–79 (Missing elements)</p>
            </div>

            {/* Critical Card */}
            <div
              onClick={() => setFilterGrade(filterGrade === "critical" ? "all" : "critical")}
              className={cn(
                "cursor-pointer rounded-sm border border-rule bg-surface-raised p-5 space-y-1 transition hover:border-rose-500/50",
                filterGrade === "critical" && "ring-2 ring-rose-500"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="label">
                  Critical
                </span>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div className="font-serif text-3xl font-normal text-rose-700 dark:text-rose-400">
                {data.criticalCount}
              </div>
              <p className="font-sans text-[11px] text-content-soft">Score &lt; 50 (Major issues)</p>
            </div>
          </div>

          {/* Actionable Editorial Recommendations Box */}
          {data.topIssues.length > 0 && (
            <div className="rounded-sm border border-rule bg-surface-raised/60 p-5 space-y-3 font-sans text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <h3 className="label">
                  Key Recommendations for Improvement
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {data.topIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-surface rounded-sm border border-rule/70 flex items-start justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-content">{issue.message}</p>
                      <p className="text-[11px] text-content-soft mt-0.5">{issue.count} affected piece(s)</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-content-faint" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter pieces by title..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-sm border border-rule bg-surface font-sans text-content placeholder:text-content-faint focus:border-accent focus:outline-none w-56 sm:w-72"
                />
              </div>

              {filterGrade !== "all" && (
                <button
                  type="button"
                  onClick={() => setFilterGrade("all")}
                  className="text-xs font-mono text-accent underline"
                >
                  Clear filter ({filterGrade})
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-sans text-content-soft">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-sm border border-rule bg-surface px-2 py-1 text-xs text-content focus:outline-none focus:border-accent"
              >
                <option value="score-asc">Lowest Health Score First</option>
                <option value="score-desc">Highest Health Score First</option>
                <option value="updated">Recently Updated</option>
              </select>
            </div>
          </div>

          {/* Articles Table */}
          <div className="rounded-sm border border-rule bg-surface-raised overflow-hidden">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="border-b border-rule bg-surface/60 text-[10px] uppercase tracking-wider text-content-faint font-mono">
                  <th className="p-3">Score</th>
                  <th className="p-3">Piece Title</th>
                  <th className="p-3">Detected Issues</th>
                  <th className="p-3">Length</th>
                  <th className="p-3">Last Updated</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {filteredPieces.map((piece) => {
                  const isHealthy = piece.grade === "healthy";
                  const isCritical = piece.grade === "critical";

                  return (
                    <tr key={piece.id} className="hover:bg-surface/50 transition">
                      {/* Score Badge */}
                      <td className="p-3 w-20">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center font-mono text-xs font-bold px-2 py-0.5 rounded-sm border",
                            isHealthy && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                            piece.grade === "needs_attention" && "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                            isCritical && "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                          )}
                        >
                          {piece.score}
                        </span>
                      </td>

                      {/* Title & Slug */}
                      <td className="p-3 max-w-xs">
                        <p className="font-medium text-content truncate font-bengali text-sm" lang="bn">
                          {piece.titleBn}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px] text-content-faint">
                          <span>{piece.kind}</span>
                          <span>•</span>
                          <span>{piece.status}</span>
                        </div>
                      </td>

                      {/* Issues Pills */}
                      <td className="p-3">
                        {piece.issues.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-3 w-3" /> All criteria satisfied
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {piece.issues.map((iss, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "rounded px-1.5 py-0.5 font-sans text-[10px]",
                                  iss.severity === "critical" && "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                                  iss.severity === "warning" && "bg-amber-500/10 text-amber-800 dark:text-amber-400",
                                  iss.severity === "info" && "bg-surface text-content-soft border border-rule/50"
                                )}
                              >
                                {iss.message}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Word Count */}
                      <td className="p-3 font-mono text-[11px] text-content-soft whitespace-nowrap">
                        {piece.wordCount} words <br />
                        <span className="text-[10px] text-content-faint">{piece.readingMinutes} min read</span>
                      </td>

                      {/* Last Updated */}
                      <td className="p-3 font-mono text-[11px] text-content-faint whitespace-nowrap">
                        {new Date(piece.updatedAt).toLocaleDateString()}
                      </td>

                      {/* Action */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/pieces/${piece.id}`}
                          className="inline-flex items-center gap-1 font-sans text-xs text-accent hover:underline font-medium"
                        >
                          Fix in Editor <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
