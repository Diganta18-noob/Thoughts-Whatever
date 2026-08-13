"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { PromptCard, PromptItem } from "./prompt-card";

export function PromptsDashboard() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [limit] = useState(30);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [stats, setStats] = useState<{
    total: number;
    sources: { source: string; count: number }[];
    statuses: { status: string; count: number }[];
    categories: { category: string; count: number }[];
  }>({ total: 0, sources: [], statuses: [], categories: [] });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sourceFilter) params.set("source", sourceFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (tagFilter) params.set("tag", tagFilter);

      const res = await fetch(`/api/admin/prompts?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setPrompts(json.prompts || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalCount(json.pagination?.total || 0);
        if (json.stats) setStats(json.stats);
      } else {
        toast.error("Failed to load prompts");
      }
    } catch {
      toast.error("Network error loading prompt library");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, sourceFilter, statusFilter, categoryFilter, tagFilter]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchPrompts, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchPrompts]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/prompts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Prompt status updated to "${newStatus}"`);
        fetchPrompts();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Network error updating status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this prompt?")) return;
    try {
      const res = await fetch(`/api/admin/prompts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Prompt deleted");
        fetchPrompts();
      } else {
        toast.error("Failed to delete prompt");
      }
    } catch {
      toast.error("Network error deleting prompt");
    }
  };

  const handleExport = (format: "json" | "markdown") => {
    const params = new URLSearchParams({ export: format });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (sourceFilter) params.set("source", sourceFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);

    window.open(`/api/admin/prompts?${params.toString()}`, "_blank");
    toast.success(`Downloading ${format.toUpperCase()} export...`);
  };

  const clearFilters = () => {
    setSearch("");
    setSourceFilter("");
    setStatusFilter("");
    setCategoryFilter("");
    setTagFilter("");
    setPage(1);
  };

  const doneCount = stats.statuses.find((s) => s.status === "done")?.count || 0;
  const plannedCount = stats.statuses.find((s) => s.status === "planned")?.count || 0;
  const ideaCount = stats.statuses.find((s) => s.status === "idea")?.count || 0;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="label">Prompt Library & Intelligence</span>
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-xs font-medium text-accent">
              {totalCount} stored
            </span>
          </div>
          <h2 className="mt-1 font-sans text-xl font-medium text-content">
            Universal Prompt Library
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 font-sans text-xs transition ${
              autoRefresh
                ? "border-accent/40 bg-accent/10 text-accent font-medium"
                : "border-rule bg-surface text-content-soft hover:text-content"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto (30s)" : "Auto-refresh"}
          </button>

          <button
            onClick={() => handleExport("json")}
            className="flex items-center gap-1.5 rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content hover:bg-surface transition"
          >
            <Download className="h-3.5 w-3.5" />
            JSON
          </button>

          <button
            onClick={() => handleExport("markdown")}
            className="flex items-center gap-1.5 rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content hover:bg-surface transition"
          >
            <Download className="h-3.5 w-3.5" />
            Markdown
          </button>

          <Link
            href="/admin/prompts/new"
            className="flex items-center gap-2 rounded-sm bg-accent px-4 py-1.5 font-sans text-xs font-medium text-surface transition hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Add Prompt
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-sm border border-rule bg-surface p-4">
          <div className="flex items-center justify-between text-content-soft">
            <span className="font-sans text-xs">Total Prompts</span>
            <BookOpen className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-content">
            {stats.total}
          </p>
        </div>

        <div className="rounded-sm border border-rule bg-surface p-4">
          <div className="flex items-center justify-between text-content-soft">
            <span className="font-sans text-xs">Completed (Done)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-content">
            {doneCount}
          </p>
        </div>

        <div className="rounded-sm border border-rule bg-surface p-4">
          <div className="flex items-center justify-between text-content-soft">
            <span className="font-sans text-xs">Planned / In Progress</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-content">
            {plannedCount}
          </p>
        </div>

        <div className="rounded-sm border border-rule bg-surface p-4">
          <div className="flex items-center justify-between text-content-soft">
            <span className="font-sans text-xs">Ideas / Backlog</span>
            <Layers className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-content">
            {ideaCount}
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="rounded-sm border border-rule bg-surface p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-5">
          {/* Search Box */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-content-soft" />
            <input
              type="text"
              placeholder="Search prompt text, summary, tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-sm border border-rule bg-surface-raised pl-9 pr-3 py-1.5 font-sans text-xs text-content placeholder:text-content-soft focus:border-accent focus:outline-none"
            />
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="kiro">Kiro</option>
              <option value="antigravity">Antigravity</option>
              <option value="manual">Manual</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="idea">💡 Idea</option>
              <option value="planned">🟡 Planned</option>
              <option value="in-progress">🔵 In Progress</option>
              <option value="done">🟢 Done</option>
              <option value="rejected">🔴 Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="feature">Feature</option>
              <option value="design">Design</option>
              <option value="bug">Bug Fix</option>
              <option value="plan">Plan / Architecture</option>
              <option value="question">Question</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {(search || sourceFilter || statusFilter || categoryFilter || tagFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-rule/50">
            <span className="font-sans text-xs text-content-soft">
              Active filters applied
            </span>
            <button
              onClick={clearFilters}
              className="font-sans text-xs text-accent underline hover:text-accent/80"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Prompts Cards Grid */}
      {loading ? (
        <div className="p-12 text-center font-mono text-xs text-content-soft">
          Loading prompt library...
        </div>
      ) : prompts.length === 0 ? (
        <div className="rounded-sm border border-rule bg-surface p-12 text-center space-y-3">
          <FileText className="mx-auto h-8 w-8 text-content-soft/40" />
          <p className="font-sans text-sm text-content-soft">No prompts match your criteria.</p>
          <Link
            href="/admin/prompts/new"
            className="inline-flex items-center gap-2 text-xs font-sans text-accent underline hover:text-accent/80"
          >
            Add a new prompt now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {prompts.map((p) => (
            <PromptCard
              key={p.id}
              prompt={p}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-rule pt-4">
        <span className="font-sans text-xs text-content-soft">
          Showing page <span className="font-mono font-medium text-content">{page}</span> of{" "}
          <span className="font-mono font-medium text-content">{totalPages}</span> ({totalCount} prompts total)
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:bg-surface-raised disabled:opacity-40 disabled:hover:bg-surface transition"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:bg-surface-raised disabled:opacity-40 disabled:hover:bg-surface transition"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
