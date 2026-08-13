"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Calendar,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Layers,
  AlertTriangle,
  Info,
  CheckCircle2
} from "lucide-react";
import { toast } from "react-hot-toast";

interface AuditLogItem {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  entitySlug?: string | null;
  summary: string;
  changes?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity: "info" | "warning" | "critical";
  createdAt: string;
}

export function AuditLogDashboard() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters & State
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [autoRefresh, setAutoRefresh] = useState(false);
  const [stats, setStats] = useState({ total: 0, todayCount: 0, criticalCount: 0 });
  const [availableFilters, setAvailableFilters] = useState<{
    actions: string[];
    entityTypes: string[];
    severities: string[];
  }>({ actions: [], entityTypes: [], severities: [] });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (debouncedSearch) params.set("search", debouncedSearch);
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entityType", entityFilter);
      if (severityFilter) params.set("severity", severityFilter);
      if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
      if (dateTo) params.set("to", new Date(dateTo + "T23:59:59").toISOString());

      const res = await fetch(`/api/admin/audit-log?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setLogs(json.logs || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotalCount(json.pagination?.total || 0);
        if (json.stats) setStats(json.stats);
        if (json.filters) setAvailableFilters(json.filters);
      } else {
        toast.error("Failed to load audit logs");
      }
    } catch {
      toast.error("Network error fetching audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, actionFilter, entityFilter, severityFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleExportCSV = () => {
    const params = new URLSearchParams({ export: "csv" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (actionFilter) params.set("action", actionFilter);
    if (entityFilter) params.set("entityType", entityFilter);
    if (severityFilter) params.set("severity", severityFilter);
    if (dateFrom) params.set("from", new Date(dateFrom).toISOString());
    if (dateTo) params.set("to", new Date(dateTo + "T23:59:59").toISOString());

    window.open(`/api/admin/audit-log?${params.toString()}`, "_blank");
    toast.success("Downloading CSV export...");
  };

  const clearFilters = () => {
    setSearch("");
    setActionFilter("");
    setEntityFilter("");
    setSeverityFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // Group logs by Date
  const groupedLogs = logs.reduce((acc, log) => {
    const dateStr = new Date(log.createdAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(log);
    return acc;
  }, {} as Record<string, AuditLogItem[]>);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-red-400 border border-red-500/20">
            <AlertTriangle className="h-3 w-3" /> critical
          </span>
        );
      case "warning":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-amber-400 border border-amber-500/20">
            <Info className="h-3 w-3" /> warning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> info
          </span>
        );
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("create") || action.includes("publish")) return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    if (action.includes("update") || action.includes("reorder")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    if (action.includes("delete") || action.includes("archive")) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (action.includes("login")) return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    return "bg-surface-elevated text-content-soft border-rule";
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-rule pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="label">System Audit & Governance</span>
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-xs font-medium text-accent">
              {totalCount} events
            </span>
          </div>
          <h2 className="mt-1 font-sans text-xl font-medium text-content">
            System Audit Log
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 font-sans text-xs transition ${
              autoRefresh
                ? "border-accent/40 bg-accent/10 text-accent font-medium"
                : "border-rule bg-surface text-content-soft hover:text-content"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto-refreshing (30s)" : "Auto-refresh"}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-sm bg-accent px-4 py-1.5 font-sans text-xs font-medium text-surface transition hover:bg-accent/90"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-rule bg-surface p-4">
          <div className="flex items-center justify-between text-content-soft">
            <span className="font-sans text-xs">Total Recorded Events</span>
            <Activity className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-content">
            {stats.total.toLocaleString()}
          </p>
        </div>

        <div className="rounded-sm border border-rule bg-surface p-4">
          <div className="flex items-center justify-between text-content-soft">
            <span className="font-sans text-xs">Today&apos;s Activity</span>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-content">
            {stats.todayCount.toLocaleString()}
          </p>
        </div>

        <div className="rounded-sm border border-rule bg-surface p-4">
          <div className="flex items-center justify-between text-content-soft">
            <span className="font-sans text-xs">Critical Alerts</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <p className="mt-2 font-mono text-2xl font-semibold text-content">
            {stats.criticalCount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="rounded-sm border border-rule bg-surface p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {/* Free Text Search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-content-soft" />
            <input
              type="text"
              placeholder="Search summary, slug, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-sm border border-rule bg-surface-elevated pl-9 pr-3 py-1.5 font-sans text-xs text-content placeholder:text-content-soft focus:border-accent focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-sm border border-rule bg-surface-elevated px-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="">All Actions</option>

              {availableFilters.actions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-sm border border-rule bg-surface-elevated px-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="">All Entities</option>
              {availableFilters.entityTypes.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-sm border border-rule bg-surface-elevated px-3 py-1.5 font-sans text-xs text-content focus:border-accent focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Clear Button */}
          <div className="flex items-center gap-2">
            {(search || actionFilter || entityFilter || severityFilter || dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="w-full rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content-soft hover:text-content transition text-center"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Date Range Inputs */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-rule/50">
          <div className="flex items-center gap-2 text-xs text-content-soft">
            <Calendar className="h-3.5 w-3.5" />
            <span>Date Range:</span>
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-sm border border-rule bg-surface-elevated px-2.5 py-1 font-sans text-xs text-content"
          />
          <span className="text-xs text-content-soft">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-sm border border-rule bg-surface-elevated px-2.5 py-1 font-sans text-xs text-content"
          />
        </div>
      </div>

      {/* Main Audit Log Timeline View */}
      {loading ? (
        <div className="p-12 text-center font-mono text-xs text-content-soft">
          Loading audit events timeline...
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-sm border border-rule bg-surface p-12 text-center space-y-3">
          <FileText className="mx-auto h-8 w-8 text-content-soft/40" />
          <p className="font-sans text-sm text-content-soft">No audit events match your filters.</p>
          <button
            onClick={clearFilters}
            className="text-xs font-sans text-accent underline hover:text-accent/80"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLogs).map(([dateLabel, groupLogs]) => (
            <div key={dateLabel} className="space-y-3">
              {/* Date Group Sticky Header */}
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-medium text-accent">
                  {dateLabel}
                </span>
                <div className="h-px flex-1 bg-rule/60" />
              </div>

              {/* Log Entry Items */}
              <div className="divide-y divide-rule/40 rounded-sm border border-rule bg-surface">
                {groupLogs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const timeStr = new Date(log.createdAt).toLocaleTimeString("en-US", {
                    hour12: true,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <div
                      key={log.id}
                      className="group transition hover:bg-surface-elevated/40"
                    >
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        className="flex cursor-pointer items-start justify-between p-3.5 sm:items-center"
                      >
                        <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
                          {/* Time */}
                          <span className="font-mono text-xs text-content-soft min-w-[75px]">
                            {timeStr}
                          </span>

                          {/* Severity */}
                          {getSeverityBadge(log.severity)}

                          {/* Action Badge */}
                          <span
                            className={`inline-flex rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium ${getActionBadgeColor(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>

                          {/* Summary */}
                          <span className="font-sans text-xs font-medium text-content">
                            {log.summary}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Admin User */}
                          <div className="hidden sm:flex items-center gap-1.5 font-sans text-xs text-content-soft">
                            <User className="h-3 w-3" />
                            <span>{log.adminName || log.adminEmail}</span>
                          </div>

                          {/* Toggle Expand Icon */}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-content-soft" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-content-soft opacity-0 group-hover:opacity-100 transition" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <div className="border-t border-rule/50 bg-surface-elevated/60 p-4 space-y-3 font-mono text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-content-soft">
                            <div>
                              <span className="text-content font-sans font-medium block mb-1">
                                Event Details
                              </span>
                              <p>Admin Email: <span className="text-content">{log.adminEmail}</span></p>
                              {log.adminName && <p>Admin Name: <span className="text-content">{log.adminName}</span></p>}
                              <p>Entity Type: <span className="text-content">{log.entityType || "N/A"}</span></p>
                              <p>Entity Slug: <span className="text-content">{log.entitySlug || "N/A"}</span></p>
                              {log.entityId && <p>Entity ID: <span className="text-content">{log.entityId}</span></p>}
                            </div>

                            <div>
                              <span className="text-content font-sans font-medium block mb-1">
                                Request Origin
                              </span>
                              <p>IP Address: <span className="text-content">{log.ipAddress || "unknown"}</span></p>
                              <p className="truncate">User Agent: <span className="text-content">{log.userAgent || "N/A"}</span></p>
                              <p>Full Timestamp: <span className="text-content">{new Date(log.createdAt).toISOString()}</span></p>
                            </div>
                          </div>

                          {/* Changes Diff Snapshot */}
                          {log.changes && (
                            <div className="mt-3">
                              <span className="text-content font-sans font-medium block mb-1">
                                Changes Snapshot (Before / After)
                              </span>
                              <pre className="max-h-60 overflow-auto rounded-sm border border-rule bg-surface p-3 text-[11px] text-content">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            </div>
                          )}

                          {/* Additional Metadata */}
                          {log.metadata && (
                            <div className="mt-3">
                              <span className="text-content font-sans font-medium block mb-1">
                                Metadata Context
                              </span>
                              <pre className="max-h-40 overflow-auto rounded-sm border border-rule bg-surface p-3 text-[11px] text-content">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-rule pt-4">
        <span className="font-sans text-xs text-content-soft">
          Showing page <span className="font-mono font-medium text-content">{page}</span> of{" "}
          <span className="font-mono font-medium text-content">{totalPages}</span> ({totalCount} total logs)
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:bg-surface-elevated disabled:opacity-40 disabled:hover:bg-surface transition"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:bg-surface-elevated disabled:opacity-40 disabled:hover:bg-surface transition"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
