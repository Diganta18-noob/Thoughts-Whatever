"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSEOWebsite } from "@/contexts/seo-website-context";
import {
  SearchCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Flame,
  Filter,
  Check,
  Clock,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import type { SiteAuditSummary, AuditIssue } from "@/lib/seo-engine/audit-scanner";

export default function TechnicalSEOAuditPage() {
  const { activeWebsite, activeWebsiteId } = useSEOWebsite();
  const [audit, setAudit] = useState<SiteAuditSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<AuditIssue | null>(null);

  const fetchAudit = useCallback(async () => {
    if (!activeWebsiteId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/seo-engine/audit?websiteId=${activeWebsiteId}`);
      if (res.ok) {
        const data = await res.json();
        setAudit(data);
      }
    } catch (err) {
      console.error("Failed to load site audit:", err);
      toast.error("Failed to load site audit data");
    } finally {
      setLoading(false);
    }
  }, [activeWebsiteId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const handleRunAudit = async () => {
    if (!activeWebsiteId || scanning) return;
    try {
      setScanning(true);
      toast.loading("Running comprehensive technical site audit...", { id: "audit-run" });
      const res = await fetch("/api/admin/seo-engine/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId: activeWebsiteId }),
      });
      if (res.ok) {
        const json = await res.json();
        setAudit(json.audit);
        toast.success(`Audit completed! Health score: ${json.audit?.healthScore || 100}/100`, { id: "audit-run" });
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Audit scan failed", { id: "audit-run" });
      }
    } catch (err: any) {
      console.error("Audit run error:", err);
      toast.error(err.message || "Network error during site audit", { id: "audit-run" });
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateStatus = async (issueId: string, newStatus: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "IGNORED") => {
    try {
      const res = await fetch(`/api/admin/seo-engine/audit/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        if (audit) {
          setAudit({
            ...audit,
            issues: audit.issues.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)),
          });
        }
        if (selectedIssue && selectedIssue.id === issueId) {
          setSelectedIssue({ ...selectedIssue, status: newStatus });
        }
        toast.success(`Issue marked as ${newStatus.replace("_", " ").toLowerCase()}`);
      } else {
        toast.error("Failed to update issue status");
      }
    } catch (err) {
      console.error("Failed to update issue status:", err);
      toast.error("Network error updating issue");
    }
  };

  // Filter issues
  const filteredIssues = (audit?.issues || []).filter((issue) => {
    if (severityFilter !== "ALL" && issue.severity !== severityFilter) return false;
    if (statusFilter !== "ALL" && issue.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = issue.title.toLowerCase().includes(q);
      const matchUrl = issue.affectedUrl.toLowerCase().includes(q);
      const matchDesc = issue.description.toLowerCase().includes(q);
      return matchTitle || matchUrl || matchDesc;
    }
    return true;
  });

  const healthScore = audit?.healthScore || 85;

  return (
    <div className="space-y-6">
      {/* Header with Run Audit Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-4">
        <div>
          <div className="flex items-center gap-2">
            <SearchCheck className="h-5 w-5 text-accent" />
            <h1 className="font-sans text-xl font-bold tracking-tight text-content">
              Technical SEO Audit & Priority Engine
            </h1>
          </div>
          <p className="font-sans text-xs text-content-soft mt-0.5">
            Automated crawlers inspecting titles, descriptions, canonical tags, heading structure, images, and broken links
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRunAudit}
            disabled={scanning}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white hover:opacity-90 transition shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", scanning && "animate-spin")} />
            <span>{scanning ? "Crawling Pages..." : "Run Full Site Audit"}</span>
          </button>
        </div>
      </div>

      {/* Health Score and Category Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Overall Health Score Card */}
        <div className="lg:col-span-2 rounded-xl border border-rule bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-content-faint">
              Technical Health Score
            </span>
            <span className="font-mono text-[10px] text-content-faint">
              {audit ? new Date(audit.lastAuditAt).toLocaleTimeString() : "Live"}
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-3">
            <span className={cn(
              "font-sans text-4xl font-extrabold tracking-tight",
              healthScore >= 85 ? "text-emerald-600 dark:text-emerald-400" : healthScore >= 70 ? "text-amber-500" : "text-red-500"
            )}>
              {loading ? "--" : `${healthScore}/100`}
            </span>
            <span className="font-mono text-xs font-semibold text-content-soft">
              {healthScore >= 85 ? "Excellent Condition" : healthScore >= 70 ? "Good — Fix Warnings" : "Needs Immediate Fixes"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-content-soft pt-2 border-t border-rule/60">
            <span>Critical Issues: <strong className="text-red-500">{audit?.criticalIssuesCount || 0}</strong></span>
            <span>Warnings: <strong className="text-amber-500">{audit?.highIssuesCount || 0}</strong></span>
            <span>Resolved: <strong className="text-emerald-500">{audit?.resolvedIssuesCount || 0}</strong></span>
          </div>
        </div>

        {/* 4 Category Breakdown Cards */}
        {[
          { label: "Meta Tags", score: audit?.categoryScores.metaTags ?? 90, desc: "Titles & Descriptions" },
          { label: "Structure", score: audit?.categoryScores.contentStructure ?? 92, desc: "Headings & Duplicates" },
          { label: "Link Health", score: audit?.categoryScores.linkHealth ?? 95, desc: "Outbound & Broken URLs" },
          { label: "Image Alt", score: audit?.categoryScores.imageOptimization ?? 88, desc: "Bilingual Alt Tags" },
        ].map((cat, idx) => (
          <div key={idx} className="rounded-xl border border-rule bg-surface p-4 shadow-xs flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
              {cat.label}
            </span>
            <div className="my-2">
              <span className="font-sans text-2xl font-bold text-content">
                {cat.score}%
              </span>
              <div className="mt-1 h-1.5 w-full rounded-full bg-rule overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    cat.score >= 85 ? "bg-emerald-500" : cat.score >= 70 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
            </div>
            <span className="font-mono text-[10px] text-content-faint truncate">
              {cat.desc}
            </span>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-rule bg-surface p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by URL, issue title, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-rule bg-surface-raised px-3.5 py-1.5 text-xs text-content placeholder:text-content-faint focus:border-accent focus:outline-none"
            />
          </div>

          {/* Severity Tabs */}
          <div className="flex items-center rounded-lg border border-rule bg-surface-raised/40 p-1 text-xs overflow-x-auto">
            {[
              { key: "ALL", label: "All Severities" },
              { key: "CRITICAL", label: "🔥 Critical" },
              { key: "HIGH", label: "🔴 High" },
              { key: "MEDIUM", label: "🟠 Medium" },
              { key: "LOW", label: "🟢 Low" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSeverityFilter(tab.key)}
                className={cn(
                  "rounded px-2.5 py-1 font-medium transition text-xs whitespace-nowrap",
                  severityFilter === tab.key
                    ? "bg-surface font-bold text-content shadow-2xs"
                    : "text-content-soft hover:text-content"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-content focus:border-accent focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open Issues</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="IGNORED">Ignored</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="rounded-xl border border-rule bg-surface shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-rule bg-surface-raised/30 flex items-center justify-between">
          <span className="font-sans text-xs font-semibold text-content">
            Detected Technical Issues ({filteredIssues.length})
          </span>
          <span className="font-mono text-[11px] text-content-faint">
            Sorted by Weighted SEO Priority Formula
          </span>
        </div>

        <div className="divide-y divide-rule/60">
          {filteredIssues.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
              <h3 className="mt-2 font-sans text-sm font-semibold text-content">
                No issues match your current filters!
              </h3>
              <p className="mt-1 font-sans text-xs text-content-soft">
                All inspected pages adhere to high quality technical SEO standards.
              </p>
            </div>
          ) : (
            filteredIssues.map((issue) => (
              <div
                key={issue.id || issue.title}
                className="p-4 sm:p-5 hover:bg-surface-raised/20 transition flex flex-col lg:flex-row lg:items-start justify-between gap-4 text-xs"
              >
                {/* Left: Issue Meta & Details */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Severity Badge */}
                    <span className={cn(
                      "rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                      issue.severity === "CRITICAL"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : issue.severity === "HIGH"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : issue.severity === "MEDIUM"
                        ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}>
                      {issue.severity}
                    </span>

                    {/* Priority Score Tag */}
                    <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      <Flame className="h-3 w-3" />
                      Priority {issue.priorityScore}/100
                    </span>

                    {/* Status Badge */}
                    <span className={cn(
                      "rounded px-2 py-0.5 font-mono text-[10px] font-medium",
                      issue.status === "RESOLVED"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : issue.status === "IN_PROGRESS"
                        ? "bg-blue-500/10 text-blue-600"
                        : issue.status === "IGNORED"
                        ? "bg-surface-raised text-content-faint"
                        : "bg-red-500/10 text-red-600"
                    )}>
                      {issue.status}
                    </span>
                  </div>

                  <h4 className="font-sans text-sm font-bold text-content leading-snug">
                    {issue.title}
                  </h4>

                  <p className="font-sans text-xs text-content-soft leading-relaxed">
                    {issue.description}
                  </p>

                  {/* Affected URL */}
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-content-faint">
                    <span>URL:</span>
                    <a
                      href={issue.affectedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline flex items-center gap-1 truncate max-w-md"
                    >
                      <span className="truncate">{issue.affectedUrl}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>

                  {/* Why it Matters & Recommended Fix Box */}
                  <div className="rounded-lg border border-rule bg-surface-raised/40 p-3 space-y-1.5 text-xs">
                    <div>
                      <strong className="font-mono text-[10px] uppercase text-content-faint block">
                        Why it matters:
                      </strong>
                      <span className="text-content-soft">{issue.whyItMatters}</span>
                    </div>
                    <div>
                      <strong className="font-mono text-[10px] uppercase text-accent block">
                        Recommended fix:
                      </strong>
                      <span className="text-content font-medium">{issue.recommendedFix}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex lg:flex-col items-center gap-2 self-start shrink-0">
                  {issue.status !== "RESOLVED" ? (
                    <button
                      type="button"
                      onClick={() => issue.id && handleUpdateStatus(issue.id, "RESOLVED")}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => issue.id && handleUpdateStatus(issue.id, "OPEN")}
                      className="flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-raised transition shadow-2xs"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Reopen</span>
                    </button>
                  )}

                  {issue.status === "OPEN" && (
                    <button
                      type="button"
                      onClick={() => issue.id && handleUpdateStatus(issue.id, "IN_PROGRESS")}
                      className="flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-raised transition shadow-2xs"
                    >
                      <Clock className="h-3 w-3 text-blue-500" />
                      <span>In Progress</span>
                    </button>
                  )}

                  {issue.status !== "IGNORED" && (
                    <button
                      type="button"
                      onClick={() => issue.id && handleUpdateStatus(issue.id, "IGNORED")}
                      className="rounded-lg px-2.5 py-1 text-xs text-content-faint hover:text-content-soft hover:bg-surface-raised transition"
                    >
                      Ignore
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
