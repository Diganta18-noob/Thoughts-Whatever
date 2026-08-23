"use client";

import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  Clock,
  CheckCircle2,
  RefreshCw,
  Filter,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ExportJobItem {
  id: string;
  entityType: string;
  format: "CSV" | "JSON";
  status: string;
  rowCount?: number | null;
  sizeBytes?: number | null;
  createdById?: string | null;
  createdAt: string;
}

export default function DataExportCenterPage() {
  const [exportHistory, setExportHistory] = useState<ExportJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Form state
  const [selectedEntity, setSelectedEntity] = useState("PIECES");
  const [selectedFormat, setSelectedFormat] = useState<"CSV" | "JSON">("CSV");

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/exports");
      const json = await res.json();
      if (json.ok) {
        setExportHistory(json.exportJobs);
      }
    } catch {
      toast.error("Failed to load export history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const triggerExport = async () => {
    setExporting(true);
    toast.loading(`Generating ${selectedFormat} export for ${selectedEntity}...`, { id: "export-run" });

    try {
      const res = await fetch("/api/admin/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType: selectedEntity,
          format: selectedFormat,
        }),
      });
      const json = await res.json();

      if (json.ok) {
        // Trigger browser file download
        const blob = new Blob([json.content], {
          type: selectedFormat === "CSV" ? "text/csv;charset=utf-8;" : "application/json;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", json.filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`Export ready! Downloaded ${json.exportJob.rowCount} records.`, { id: "export-run" });
        fetchHistory();
      } else {
        toast.error(json.error || "Export failed", { id: "export-run" });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: "export-run" });
    } finally {
      setExporting(false);
    }
  };

  const ENTITIES = [
    { key: "PIECES", label: "Articles & Documentaries", desc: "All pieces, reading times, slug identifiers, views and metadata." },
    { key: "SUBSCRIBERS", label: "Letter Subscribers", desc: "Newsletter subscriber emails, confirmations, and dates." },
    { key: "ANALYTICS", label: "Reader Analytics Events", desc: "Anonymous reading milestones, scroll tracking, and sessions." },
    { key: "AUDIT_LOGS", label: "Audit & Security Logs", desc: "Administrative operations, logins, changes, and security events." },
    { key: "MEDIA", label: "Media Library Catalog", desc: "Image files, dimensions, Cloudinary URLs, and size metadata." },
  ];

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <span className="label block mb-1 font-mono uppercase tracking-widest text-[11px] text-content-faint">
            Data Portability & Archives
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-content">
            Data Export Center
          </h1>
          <p className="font-sans text-xs text-content-soft mt-1">
            Generate clean CSV spreadsheets or structured JSON archives of your editorial database.
          </p>
        </div>
      </div>

      {/* Export Configuration Form */}
      <div className="border border-rule bg-surface p-6 space-y-6">
        <h2 className="label font-mono uppercase tracking-widest text-[11px]">
          Configure Export Package
        </h2>

        {/* Entity Selector Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ENTITIES.map((ent) => (
            <div
              key={ent.key}
              onClick={() => setSelectedEntity(ent.key)}
              className={cn(
                "p-4 border rounded-sm cursor-pointer transition flex flex-col justify-between space-y-2",
                selectedEntity === ent.key
                  ? "border-accent bg-surface-raised ring-1 ring-accent"
                  : "border-rule bg-surface hover:border-content-soft"
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-sm font-bold text-content">{ent.label}</span>
                  {selectedEntity === ent.key && <CheckCircle2 className="h-4 w-4 text-accent" />}
                </div>
                <p className="font-sans text-xs text-content-soft">{ent.desc}</p>
              </div>
              <span className="font-mono text-[10px] uppercase text-content-faint">{ent.key}</span>
            </div>
          ))}
        </div>

        {/* Format Selector & Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-rule pt-5">
          <div className="flex items-center gap-4">
            <span className="label">Export Format:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat("CSV")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs border transition",
                  selectedFormat === "CSV"
                    ? "bg-accent text-surface border-accent font-bold"
                    : "border-rule text-content hover:border-content-soft"
                )}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> CSV (Spreadsheet)
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat("JSON")}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono text-xs border transition",
                  selectedFormat === "JSON"
                    ? "bg-accent text-surface border-accent font-bold"
                    : "border-rule text-content hover:border-content-soft"
                )}
              >
                <FileCode className="h-3.5 w-3.5" /> JSON (Raw Data)
              </button>
            </div>
          </div>

          <button
            onClick={triggerExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-sm bg-accent px-5 py-2 font-sans text-xs font-medium text-surface transition hover:opacity-90 disabled:opacity-50"
          >
            <Download className={cn("h-4 w-4", exporting && "animate-bounce")} />
            {exporting ? "Generating Export..." : `Export ${selectedEntity} (${selectedFormat})`}
          </button>
        </div>
      </div>

      {/* Export History */}
      <div className="border border-rule bg-surface">
        <div className="border-b border-rule px-6 py-4 flex items-center justify-between">
          <h2 className="label font-mono uppercase tracking-widest text-[11px]">
            Export History Archive ({exportHistory.length})
          </h2>
          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-1 text-content-soft hover:text-content"
            title="Refresh history"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        {loading && exportHistory.length === 0 ? (
          <div className="py-16 text-center font-sans text-xs text-content-soft">
            Loading export logs...
          </div>
        ) : exportHistory.length === 0 ? (
          <div className="py-16 text-center font-sans text-xs text-content-soft">
            No past exports recorded.
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {exportHistory.map((job) => (
              <div key={job.id} className="p-4 sm:px-6 flex items-center justify-between gap-4 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-content">{job.entityType}</span>
                    <span className="bg-surface-raised border border-rule px-1.5 py-0.5 rounded text-[10px] text-content-soft font-semibold">
                      {job.format}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] uppercase">
                      {job.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-content-faint">
                    {job.rowCount || 0} rows • {job.sizeBytes ? `${Math.round(job.sizeBytes / 1024)} KB` : "0 KB"} • Generated by {job.createdById}
                  </div>
                </div>

                <div className="text-right text-[11px] text-content-faint">
                  {new Date(job.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
