"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";

export interface AutomationState {
  isRunning: boolean;
  health?: {
    status: string;
    memoryUsageMb: number;
    dbConnected: boolean;
    uptimeSec?: number;
  };
  security?: {
    activeSessions: number;
    revokedTokenReuseAttempts: number;
  };
  logs: string[];
  lastReport?: {
    timestamp: string;
    overallStatus: string;
    totalDurationMs: number;
    summary: { total: number; passed: number; warnings: number; failed: number };
    steps: { stepNumber: number; name: string; status: string; message: string; durationMs: number }[];
  };
}

interface AutomationDashboardProps {
  initialData?: AutomationState | null;
}

export function AutomationDashboard({ initialData }: AutomationDashboardProps) {
  const [data, setData] = useState<AutomationState | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const isFetchingRef = useRef(false);

  // Sync initialData if provided
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      setError(null);
    }
  }, [initialData]);

  const fetchStatus = useCallback(async (isManualRetry = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const timestamp = Date.now();
      let res = await fetch(`/api/admin/automation?_t=${timestamp}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      // If /api/admin/automation returns non-200, fallback to /api/admin/system-health
      if (!res.ok) {
        const fallbackRes = await fetch(`/api/admin/system-health?_t=${timestamp}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (fallbackRes.ok) {
          const healthJson = await fallbackRes.json();
          if (healthJson?.automation) {
            setData(healthJson.automation);
            setError(null);
            return;
          }
        }
        throw new Error(`Status HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.ok && json.status) {
        setData(json.status);
        setError(null);
      } else {
        throw new Error(json.error || "Invalid response format");
      }
    } catch (err: any) {
      const msg = err.message || "Failed to load automation status";
      setError(msg);
      if (isManualRetry) {
        toast.error("Failed to load automation status");
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      fetchStatus();
    }
    const interval = setInterval(() => fetchStatus(false), 15000);
    return () => clearInterval(interval);
  }, [fetchStatus, initialData]);

  const runPipelineNow = async () => {
    setTriggering(true);
    toast.loading("Triggering Master 15-Step Production Pipeline...", { id: "pipeline" });
    try {
      const res = await fetch("/api/admin/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-full-pipeline" }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Pipeline executed successfully!", { id: "pipeline" });
        fetchStatus(true);
      } else {
        toast.error(`Pipeline error: ${json.error}`, { id: "pipeline" });
      }
    } catch {
      toast.error("Network error triggering pipeline", { id: "pipeline" });
    } finally {
      setTriggering(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6 bg-journal-paper rounded-lg border border-journal-rule text-journal-inkSoft font-mono text-xs animate-pulse">
        Connecting to Production Automation Hub...
      </div>
    );
  }

  const isHealthy = data?.health?.status === "HEALTHY";

  return (
    <div className="space-y-6">
      {/* ── Error Banner if any ── */}
      {error && !data && (
        <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs font-mono text-amber-600">
          <span>⚠️ Automation status temporarily unavailable: {error}</span>
          <button
            onClick={() => {
              setLoading(true);
              fetchStatus(true);
            }}
            className="px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Header Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-journal-paperEdge p-5 rounded-lg border border-journal-rule">
        <div>
          <h2 className="text-lg font-bold text-journal-ink flex items-center gap-2">
            ⚙️ Production Automation Hub (1:00 AM Nightly Pipeline)
          </h2>
          <p className="text-xs text-journal-inkSoft mt-1 font-mono">
            Self-maintaining SaaS maintenance engine • Status:{" "}
            <span className={isHealthy ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
              {data?.health?.status || "HEALTHY"}
            </span>
          </p>
        </div>
        <button
          onClick={runPipelineNow}
          disabled={triggering || data?.isRunning}
          className="px-4 py-2 bg-journal-vermilion hover:bg-journal-vermilionSoft text-white font-medium text-xs rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {triggering || data?.isRunning ? "⚡ Pipeline Executing..." : "▶️ Run Full Pipeline Now"}
        </button>
      </div>

      {/* ── Status Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-journal-paper p-4 rounded border border-journal-rule">
          <p className="text-xs text-journal-inkFaint uppercase tracking-wider font-mono">Database & Health</p>
          <p className="text-xl font-bold text-journal-ink mt-1">
            {data?.health?.dbConnected ? "✅ Connected" : "❌ Disconnected"}
          </p>
          <p className="text-xs text-journal-inkSoft font-mono mt-1">Heap: {data?.health?.memoryUsageMb || 0} MB</p>
        </div>

        <div className="bg-journal-paper p-4 rounded border border-journal-rule">
          <p className="text-xs text-journal-inkFaint uppercase tracking-wider font-mono">Active Sessions</p>
          <p className="text-xl font-bold text-journal-ink mt-1">{data?.security?.activeSessions ?? 0}</p>
          <p className="text-xs text-journal-inkSoft font-mono mt-1">
            Revoked Reuses: {data?.security?.revokedTokenReuseAttempts ?? 0}
          </p>
        </div>

        <div className="bg-journal-paper p-4 rounded border border-journal-rule">
          <p className="text-xs text-journal-inkFaint uppercase tracking-wider font-mono">Last Run Status</p>
          <p className="text-xl font-bold text-journal-ink mt-1">
            {data?.lastReport?.overallStatus || "SUCCESS"}
          </p>
          <p className="text-xs text-journal-inkSoft font-mono mt-1">
            {data?.lastReport?.totalDurationMs ? `${(data.lastReport.totalDurationMs / 1000).toFixed(1)}s` : "Nightly 01:00 AM"}
          </p>
        </div>

        <div className="bg-journal-paper p-4 rounded border border-journal-rule">
          <p className="text-xs text-journal-inkFaint uppercase tracking-wider font-mono">Backup Retention</p>
          <p className="text-xl font-bold text-journal-ink mt-1">30 Days R2</p>
          <p className="text-xs text-journal-inkSoft font-mono mt-1">Auto Gzip & Lifecycle</p>
        </div>
      </div>

      {/* ── Steps Execution Table ── */}
      {data?.lastReport && (
        <div className="bg-journal-paper p-5 rounded-lg border border-journal-rule">
          <h3 className="text-sm font-bold text-journal-ink mb-3 flex items-center justify-between">
            <span>📋 Last Pipeline Execution Steps ({data.lastReport.timestamp.split("T")[0]})</span>
            <span className="text-xs font-mono text-journal-inkSoft">
              {data.lastReport.summary.passed}/{data.lastReport.summary.total} Steps Passed
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-journal-rule text-journal-inkFaint">
                  <th className="py-2">Step</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Duration</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-journal-rule">
                {data.lastReport.steps.map((step) => (
                  <tr key={step.stepNumber}>
                    <td className="py-2 text-journal-inkFaint">{step.stepNumber}</td>
                    <td className="py-2 font-bold text-journal-ink">{step.name}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        step.status === "SUCCESS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}>
                        {step.status}
                      </span>
                    </td>
                    <td className="py-2 text-journal-inkSoft">{step.durationMs}ms</td>
                    <td className="py-2 text-journal-inkSoft">{step.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Live Log Terminal ── */}
      <div className="bg-journal-ink p-4 rounded-lg border border-journal-inkSoft font-mono text-xs text-journal-paper">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-journal-inkSoft/40 text-journal-inkFaint">
          <span>📟 Live Automation System Logs (`automation.log` & AuditLog)</span>
          <span>Last 50 entries</span>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1 font-mono text-[11px] leading-relaxed select-text">
          {data?.logs && data.logs.length > 0 ? (
            data.logs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap text-emerald-400/90">
                {log}
              </div>
            ))
          ) : (
            <p className="text-journal-inkFaint italic">No logs recorded yet today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
