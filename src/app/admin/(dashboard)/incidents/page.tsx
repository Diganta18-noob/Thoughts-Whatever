"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  X,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Incident {
  id: string;
  title: string;
  description?: string | null;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "DETECTED" | "INVESTIGATING" | "RESOLVED";
  affectedArea: string;
  assignedTo?: string | null;
  timeline?: Array<{ timestamp: string; message: string; author: string }> | null;
  rootCause?: string | null;
  resolution?: string | null;
  detectedAt: string;
  resolvedAt?: string | null;
}

export default function IncidentsCenterPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newSeverity, setNewSeverity] = useState<"INFO" | "WARNING" | "CRITICAL">("WARNING");
  const [newArea, setNewArea] = useState("database");
  const [submitting, setSubmitting] = useState(false);

  // Resolution / Details Drawer Modal
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [rootCauseText, setRootCauseText] = useState("");
  const [timelineNote, setTimelineNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/incidents");
      const json = await res.json();
      if (json.ok) {
        setIncidents(json.incidents);
        setSummary(json.summary);
      } else {
        toast.error("Failed to load incidents");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          severity: newSeverity,
          affectedArea: newArea,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Incident logged");
        setShowAddModal(false);
        setNewTitle("");
        setNewDesc("");
        fetchIncidents();
      } else {
        toast.error(json.error || "Failed to create incident");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (status: "DETECTED" | "INVESTIGATING" | "RESOLVED") => {
    if (!activeIncident) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/incidents/${activeIncident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolution: status === "RESOLVED" ? resolutionText : undefined,
          rootCause: status === "RESOLVED" ? rootCauseText : undefined,
          note: timelineNote || undefined,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`Incident status updated to ${status}`);
        setActiveIncident(json.incident);
        setTimelineNote("");
        fetchIncidents();
      } else {
        toast.error(json.error || "Failed to update incident");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setUpdating(false);
    }
  };

  const filtered = incidents.filter((i) => {
    if (filterSeverity !== "ALL" && i.severity !== filterSeverity) return false;
    if (filterStatus !== "ALL" && i.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <span className="label block mb-1 font-mono uppercase tracking-widest text-[11px] text-content-faint">
            Operations & Triage
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-content">
            Alert & Incident Center
          </h1>
          <p className="font-sans text-xs text-content-soft mt-1">
            Track operational interruptions, manage root-cause investigations, and audit post-mortem resolutions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-surface transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Declare Incident
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="border border-rule bg-surface p-5 space-y-1">
          <span className="font-mono text-[11px] uppercase text-content-faint">Active Incidents</span>
          <div className="font-serif text-2xl font-bold text-amber-600 dark:text-amber-400">
            {summary?.activeCount || 0}
          </div>
        </div>

        <div className="border border-rule bg-surface p-5 space-y-1">
          <span className="font-mono text-[11px] uppercase text-content-faint">Critical Alerts</span>
          <div className="font-serif text-2xl font-bold text-red-600 dark:text-red-400">
            {summary?.criticalCount || 0}
          </div>
        </div>

        <div className="border border-rule bg-surface p-5 space-y-1">
          <span className="font-mono text-[11px] uppercase text-content-faint">Resolved</span>
          <div className="font-serif text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary?.resolvedCount || 0}
          </div>
        </div>

        <div className="border border-rule bg-surface p-5 space-y-1">
          <span className="font-mono text-[11px] uppercase text-content-faint">Total Tracked</span>
          <div className="font-serif text-2xl font-bold text-content">
            {summary?.totalCount || 0}
          </div>
        </div>
      </div>

      {/* Incident List */}
      <div className="border border-rule bg-surface">
        <div className="border-b border-rule px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="label font-mono uppercase tracking-widest text-[11px]">
            Incident Log ({filtered.length})
          </h2>

          <div className="flex items-center gap-3">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="rounded-sm border border-rule bg-surface px-2 py-1 font-sans text-xs text-content outline-none focus:border-accent"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-sm border border-rule bg-surface px-2 py-1 font-sans text-xs text-content outline-none focus:border-accent"
            >
              <option value="ALL">All Statuses</option>
              <option value="DETECTED">Detected</option>
              <option value="INVESTIGATING">Investigating</option>
              <option value="RESOLVED">Resolved</option>
            </select>

            <button
              onClick={fetchIncidents}
              disabled={loading}
              className="p-1 text-content-soft hover:text-content"
              title="Refresh incidents"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center font-sans text-xs text-content-soft">
            No incidents found matching the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {filtered.map((inc) => (
              <div
                key={inc.id}
                onClick={() => {
                  setActiveIncident(inc);
                  setResolutionText(inc.resolution || "");
                  setRootCauseText(inc.rootCause || "");
                }}
                className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-surface-raised transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className={cn(
                      "font-mono text-[10px] uppercase px-2 py-0.5 rounded-xs font-bold",
                      inc.severity === "CRITICAL"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : inc.severity === "WARNING"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    )}>
                      {inc.severity}
                    </span>

                    <h3 className="font-serif text-base font-bold text-content">
                      {inc.title}
                    </h3>
                  </div>

                  <p className="font-sans text-xs text-content-soft line-clamp-1">
                    {inc.description || "No details provided."}
                  </p>

                  <div className="flex items-center gap-4 font-mono text-[11px] text-content-faint">
                    <span>Area: <b>{inc.affectedArea}</b></span>
                    <span>Detected: {new Date(inc.detectedAt).toLocaleString()}</span>
                    {inc.resolvedAt && <span>Resolved: {new Date(inc.resolvedAt).toLocaleString()}</span>}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <span className={cn(
                    "font-mono text-xs uppercase px-2.5 py-1 rounded-sm font-semibold",
                    inc.status === "RESOLVED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : inc.status === "INVESTIGATING"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  )}>
                    {inc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Detail & Triage Modal */}
      {activeIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl border border-rule bg-surface shadow-2xl p-6 space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="space-y-0.5">
                <span className="font-mono text-[10px] uppercase font-bold text-accent">
                  Incident Triage & Post-Mortem
                </span>
                <h3 className="font-serif text-lg font-bold text-content">
                  {activeIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveIncident(null)}
                className="text-content-soft hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="label block mb-1">Description</span>
                <p className="font-sans text-xs text-content-soft leading-relaxed bg-surface-raised p-3 rounded-sm">
                  {activeIncident.description || "No description provided."}
                </p>
              </div>

              {/* Timeline Notes */}
              <div>
                <span className="label block mb-2">Incident Timeline</span>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-rule p-3 bg-surface-raised rounded-sm">
                  {(activeIncident.timeline as any[])?.map((t, idx) => (
                    <div key={idx} className="font-mono text-[11px] text-content flex justify-between border-b border-rule/50 pb-1.5 last:border-0">
                      <span>• {t.message}</span>
                      <span className="text-content-faint shrink-0 ml-2">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Note */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add timeline investigation note..."
                  value={timelineNote}
                  onChange={(e) => setTimelineNote(e.target.value)}
                  className="flex-1 rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeIncident.status)}
                  disabled={updating || !timelineNote.trim()}
                  className="rounded-sm border border-rule px-3 py-1.5 font-sans text-xs text-content hover:border-accent disabled:opacity-50"
                >
                  Post Note
                </button>
              </div>

              {/* Root Cause & Resolution for Resolving */}
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div>
                  <label className="label block mb-1">Root Cause</label>
                  <textarea
                    rows={2}
                    placeholder="Identify why the incident happened..."
                    value={rootCauseText}
                    onChange={(e) => setRootCauseText(e.target.value)}
                    className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="label block mb-1">Resolution Summary</label>
                  <textarea
                    rows={2}
                    placeholder="Describe how the issue was mitigated..."
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t border-rule pt-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus("INVESTIGATING")}
                  disabled={updating}
                  className="rounded-sm border border-rule px-3 py-1.5 font-sans text-xs text-content hover:border-amber-600"
                >
                  Mark Investigating
                </button>

                <button
                  onClick={() => handleUpdateStatus("RESOLVED")}
                  disabled={updating}
                  className="rounded-sm bg-emerald-600 px-3.5 py-1.5 font-sans text-xs font-medium text-white transition hover:opacity-90"
                >
                  Resolve Incident
                </button>
              </div>

              <button
                onClick={() => setActiveIncident(null)}
                className="rounded-sm border border-rule px-4 py-1.5 font-sans text-xs text-content hover:border-content-soft"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Declare Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg border border-rule bg-surface shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="font-serif text-base font-bold text-content">
                Declare Operational Incident
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-content-soft hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="label block mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database connection timeouts during peak traffic"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label block mb-1">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e: any) => setNewSeverity(e.target.value)}
                    className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                  >
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="label block mb-1">Affected Subsystem</label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                  >
                    <option value="database">Database Pool</option>
                    <option value="api">API / Edge Routing</option>
                    <option value="storage">Media / Cloudinary</option>
                    <option value="backups">R2 Backups</option>
                    <option value="cron">Automated Pipelines</option>
                    <option value="security">Authentication & JWT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide context on symptoms, error logs, and impact..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-sm border border-rule px-4 py-1.5 font-sans text-xs text-content hover:border-content-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-sm bg-accent px-4 py-1.5 font-sans text-xs font-medium text-surface transition hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Declaring..." : "Declare Incident"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
