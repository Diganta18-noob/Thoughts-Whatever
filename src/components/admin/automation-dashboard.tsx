"use client";
import { useAdminPolling } from "@/lib/hooks/use-admin-polling";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { normalizeError } from "@/lib/errors";
import { Button, TBody, TD, TH, THead, TR } from "@/components/ui";

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

  // Sync initialData if provided from parent page
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
      let res = await fetch("/api/admin/automation", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      // If /api/admin/automation returns non-200, fallback to /api/admin/system-health
      if (!res.ok) {
        const fallbackRes = await fetch("/api/admin/system-health", {
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
      const msg = normalizeError(err, "Failed to load automation status").message;
      // Only set UI error banner if we don't already have live data
      if (!data) {
        setError(msg);
      }
      if (isManualRetry) {
        toast.error("Failed to load automation status");
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    if (!initialData) {
      fetchStatus();
    }
    // fetchStatus changes with the fetched data; it must not trigger another initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);
  useAdminPolling(() => fetchStatus(false), 60000);

  const runPipelineNow = async () => {
    setTriggering(true);
    toast.loading("Triggering Master Production Pipeline...", { id: "pipeline" });
    try {
      let res = await fetch("/api/admin/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run-full-pipeline" }),
      });

      // If /api/admin/automation returns 404 or fails, fallback to /api/admin/maintenance
      if (!res.ok && res.status === 404) {
        const fallbackRes = await fetch("/api/admin/maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "run-full-pipeline" }),
        });
        if (fallbackRes.ok) {
          res = fallbackRes;
        }
      }

      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        toast.success("Pipeline executed successfully!", { id: "pipeline" });
        fetchStatus(true);
      } else {
        const safeError = normalizeError(json?.error, "Pipeline execution failed");
        toast.error(safeError.message, { id: "pipeline" });
      }
    } catch (err: any) {
      const safeError = normalizeError(err, "Network error triggering pipeline");
      toast.error(safeError.message, { id: "pipeline" });
    } finally {
      setTriggering(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6 bg-surface-raised rounded-card border border-rule text-content-soft font-ui text-sm animate-pulse">
        Connecting to Production Automation Hub...
      </div>
    );
  }

  const isHealthy = (data?.health?.status || "HEALTHY") === "HEALTHY";

  return (
    <div className="space-y-6">
      {/* ── Error Banner if any ── */}
      {error && !data && (
        <div className="flex items-center justify-between p-4 bg-warning/10 border border-warning/30 rounded-card text-xs font-ui text-warning">
          <span>Automation status temporarily unavailable: {error}</span>
          <Button variant="warning" size="sm"
            onClick={() => {
              setLoading(true);
              fetchStatus(true);
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Header Controls ── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-content-soft">
        <Button variant="secondary" size="sm" onClick={() => void fetchStatus(true)}>Refresh status</Button>
        <span>Refreshes every minute while this tab is visible.</span>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-raised p-5 rounded-card border border-rule">
        <div>
          <h2 className="text-xl font-semibold text-content">
            Automation
          </h2>
          <p className="text-xs text-content-soft mt-1 font-mono">
            Pipeline status: {" "}
            <span className={isHealthy ? "text-success font-bold" : "text-warning font-bold"}>
              {data?.health?.status || "HEALTHY"}
            </span>
          </p>
        </div>
        <Button variant="primary"
          onClick={runPipelineNow}
          disabled={triggering || data?.isRunning}
          className="bg-accent hover:bg-accent/90"
        >
          {triggering || data?.isRunning ? "Running pipeline…" : "Run pipeline"}
        </Button>
      </div>

      {/* ── Status Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface-raised p-4 rounded border border-rule">
          <p className="text-sm text-content-soft">Database & Health</p>
          <p className="text-xl font-bold text-content mt-1">
            {data?.health
              ? data.health.dbConnected
                ? "Connected"
                : "Disconnected"
              : "Checking…"}
          </p>
          <p className="text-xs text-content-soft font-mono mt-1">
            Heap: {data?.health ? `${data.health.memoryUsageMb} MB` : "—"}
          </p>
        </div>

        <div className="bg-surface-raised p-4 rounded border border-rule">
          <p className="text-sm text-content-soft">Active Sessions</p>
          <p className="text-xl font-bold text-content mt-1">{data?.security?.activeSessions ?? 1}</p>
          <p className="text-xs text-content-soft font-mono mt-1">
            Revoked Reuses: {data?.security?.revokedTokenReuseAttempts ?? 0}
          </p>
        </div>

        <div className="bg-surface-raised p-4 rounded border border-rule">
          <p className="text-sm text-content-soft">Last Run Status</p>
          <p className="text-xl font-bold text-content mt-1">
            {data?.lastReport?.overallStatus || "SUCCESS"}
          </p>
          <p className="text-xs text-content-soft font-mono mt-1">
            {data?.lastReport?.totalDurationMs ? `${(data.lastReport.totalDurationMs / 1000).toFixed(1)}s` : "Nightly 01:00 AM"}
          </p>
        </div>

        <div className="bg-surface-raised p-4 rounded border border-rule">
          <p className="text-sm text-content-soft">Backup Retention</p>
          <p className="text-xl font-bold text-content mt-1">30 Days R2</p>
          <p className="text-xs text-content-soft font-mono mt-1">Auto Gzip & Lifecycle</p>
        </div>
      </div>

      {/* ── Steps Execution Table ── */}
      {data?.lastReport && (
        <div className="bg-surface-raised p-5 rounded-card border border-rule">
          <h3 className="text-sm font-semibold text-content mb-3 flex flex-wrap items-center justify-between gap-2">
            <span>Last pipeline run · {data.lastReport.timestamp.split("T")[0]}</span>
            <span className="text-xs font-ui text-content-soft">
              {data.lastReport.summary.passed}/{data.lastReport.summary.total} Steps Passed
            </span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-ui">
              <THead>
                <TR className="border-b border-rule text-content-faint">
                  <TH className="py-2">Step</TH>
                  <TH className="py-2">Name</TH>
                  <TH className="py-2">Status</TH>
                  <TH className="py-2">Duration</TH>
                  <TH className="py-2">Details</TH>
                </TR>
              </THead>
              <TBody className="divide-y divide-rule">
                {data.lastReport.steps.map((step) => (
                  <TR key={step.stepNumber}>
                    <TD className="py-2 text-content-faint">{step.stepNumber}</TD>
                    <TD className="py-2 font-bold text-content">{step.name}</TD>
                    <TD className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        step.status === "SUCCESS" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}>
                        {step.status}
                      </span>
                    </TD>
                    <TD className="py-2 text-content-soft">{step.durationMs}ms</TD>
                    <TD className="py-2 text-content-soft">{step.message}</TD>
                  </TR>
                ))}
              </TBody>
            </table>
          </div>
        </div>
      )}

      {/* ── Live Log Terminal ── */}
      <div className="bg-surface p-4 rounded-card border border-rule font-ui text-sm text-content">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-rule/40 text-content-faint">
          <span>Recent automation logs</span>
          <span>Last 50 entries</span>
        </div>
        <div className="max-h-60 overflow-y-auto space-y-1 font-mono text-[11px] leading-relaxed select-text">
          {data?.logs && data.logs.length > 0 ? (
            data.logs.map((log, idx) => (
              <div key={idx} className="whitespace-pre-wrap text-success/90">
                {log}
              </div>
            ))
          ) : (
            <p className="text-content-faint italic">No logs recorded yet today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
