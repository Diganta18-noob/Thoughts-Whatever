"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function SystemMonitoringPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/system/monitoring");
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      } else {
        toast.error("Failed to load telemetry metrics");
      }
    } catch {
      toast.error("Network error fetching metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <span className="label block mb-1 font-mono uppercase tracking-widest text-[11px] text-content-faint">
            Infrastructure & Telemetry
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-content">
            Advanced System Monitoring
          </h1>
          <p className="font-sans text-xs text-content-soft mt-1">
            Real-time server telemetry, connection pools, memory pressures, and active error streams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-sans text-content-soft">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-rule text-accent focus:ring-accent"
            />
            Auto-refresh (10s)
          </label>

          <button
            onClick={() => fetchMetrics(false)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content transition hover:border-accent disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-20 text-center font-sans text-sm text-content-soft">
          Connecting to telemetry sensors...
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* API Health */}
            <div className="border border-rule bg-surface p-5 space-y-2">
              <div className="flex items-center justify-between text-content-faint">
                <span className="font-mono text-[11px] uppercase tracking-wider">Edge API</span>
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-content">
                  {data?.api?.latencyMs}ms
                </span>
                <span className="font-sans text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Healthy
                </span>
              </div>
              <p className="font-mono text-[11px] text-content-faint">
                Uptime: {Math.floor((data?.api?.uptimeSec || 0) / 3600)}h {Math.floor(((data?.api?.uptimeSec || 0) % 3600) / 60)}m
              </p>
            </div>

            {/* Database Health */}
            <div className="border border-rule bg-surface p-5 space-y-2">
              <div className="flex items-center justify-between text-content-faint">
                <span className="font-mono text-[11px] uppercase tracking-wider">Database</span>
                <Database className="h-4 w-4 text-accent" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-content">
                  {data?.database?.latencyMs}ms
                </span>
                <span className="font-sans text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              </div>
              <p className="font-mono text-[11px] text-content-faint">
                PostgreSQL (Supabase Pooler)
              </p>
            </div>

            {/* Memory Allocation */}
            <div className="border border-rule bg-surface p-5 space-y-2">
              <div className="flex items-center justify-between text-content-faint">
                <span className="font-mono text-[11px] uppercase tracking-wider">Heap Memory</span>
                <Cpu className="h-4 w-4 text-content-soft" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-content">
                  {data?.memory?.heapUsedMb} MB
                </span>
                <span className="font-mono text-xs text-content-soft">
                  / {data?.memory?.heapTotalMb} MB
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-rule rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${data?.memory?.usagePct || 0}%` }}
                />
              </div>
            </div>

            {/* Incident Summary */}
            <div className="border border-rule bg-surface p-5 space-y-2">
              <div className="flex items-center justify-between text-content-faint">
                <span className="font-mono text-[11px] uppercase tracking-wider">Active Alerts</span>
                <AlertTriangle className={cn("h-4 w-4", data?.summary?.activeIncidentsCount > 0 ? "text-amber-600" : "text-content-faint")} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-content">
                  {data?.summary?.activeIncidentsCount || 0}
                </span>
                <span className="font-sans text-xs text-content-soft">
                  active incidents
                </span>
              </div>
              <p className="font-mono text-[11px] text-content-faint">
                {data?.summary?.totalJobs || 0} registered background jobs
              </p>
            </div>
          </div>

          {/* Node & OS Environment Details */}
          <div className="border border-rule bg-surface p-6 space-y-4">
            <h2 className="label font-mono uppercase tracking-widest text-[11px]">
              Runtime Environment Details
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="border-l-2 border-accent pl-3">
                <span className="font-mono text-[10px] uppercase text-content-faint block">Node Engine</span>
                <span className="font-mono text-xs font-semibold text-content">{data?.api?.nodeVersion}</span>
              </div>
              <div className="border-l-2 border-rule pl-3">
                <span className="font-mono text-[10px] uppercase text-content-faint block">OS Platform</span>
                <span className="font-mono text-xs font-semibold text-content">{data?.system?.platform}</span>
              </div>
              <div className="border-l-2 border-rule pl-3">
                <span className="font-mono text-[10px] uppercase text-content-faint block">CPU Cores</span>
                <span className="font-mono text-xs font-semibold text-content">{data?.system?.cpus} Virtual Cores</span>
              </div>
              <div className="border-l-2 border-rule pl-3">
                <span className="font-mono text-[10px] uppercase text-content-faint block">System RAM</span>
                <span className="font-mono text-xs font-semibold text-content">{Math.round(data?.system?.totalMemMb / 1024)} GB</span>
              </div>
            </div>
          </div>

          {/* Recent Error Telemetry Stream */}
          <div className="border border-rule bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="label font-mono uppercase tracking-widest text-[11px]">
                Recent Audit & Telemetry Warnings
              </h2>
              <span className="font-mono text-[11px] text-content-faint">
                Showing last {data?.recentErrors?.length || 0} events
              </span>
            </div>

            {data?.recentErrors?.length === 0 ? (
              <p className="font-sans text-xs text-content-soft py-4">
                No system warnings or error events recorded. All operations nominal.
              </p>
            ) : (
              <div className="divide-y divide-rule border-y border-rule">
                {data?.recentErrors?.map((err: any) => (
                  <div key={err.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono text-[10px] uppercase px-1.5 py-0.5 rounded-xs font-bold",
                          err.severity === "critical" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        )}>
                          {err.severity}
                        </span>
                        <span className="font-mono text-xs font-medium text-content">
                          {err.action}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-content-soft mt-1">
                        {err.summary}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-[11px] text-content-faint block">
                        {new Date(err.createdAt).toLocaleTimeString()}
                      </span>
                      <span className="font-mono text-[10px] text-content-faint block">
                        {err.adminEmail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
