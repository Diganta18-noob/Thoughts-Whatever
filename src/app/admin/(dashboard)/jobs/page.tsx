"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
  FileText,
  Terminal,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ScheduledJob {
  id: string;
  name: string;
  description?: string | null;
  schedule: string;
  status: string;
  enabled: boolean;
  lastRunAt?: string | null;
  lastStatus?: string | null;
  lastDurationMs?: number | null;
  executions?: Array<{
    id: string;
    status: string;
    durationMs?: number | null;
    logs?: string[] | null;
    error?: string | null;
    startedAt: string;
  }>;
}

export default function ScheduledJobsCenterPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [executingJobId, setExecutingJobId] = useState<string | null>(null);
  const [selectedLogs, setSelectedLogs] = useState<{ jobName: string; logs: string[] } | null>(null);

  // Add Job Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobDesc, setNewJobDesc] = useState("");
  const [newJobSchedule, setNewJobSchedule] = useState("0 2 * * *");
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/jobs");
      const json = await res.json();
      if (json.ok) {
        setJobs(json.jobs);
      } else {
        toast.error("Failed to load jobs");
      }
    } catch {
      toast.error("Network error fetching jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleRunJob = async (job: ScheduledJob) => {
    setExecutingJobId(job.id);
    toast.loading(`Triggering "${job.name}"...`, { id: "job-run" });

    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/run`, {
        method: "POST",
      });
      const json = await res.json();

      if (json.ok) {
        toast.success(`Job completed successfully in ${json.durationMs}ms`, { id: "job-run" });
        if (json.logs && json.logs.length > 0) {
          setSelectedLogs({ jobName: job.name, logs: json.logs });
        }
      } else {
        toast.error(`Job execution failed: ${json.error || "Unknown error"}`, { id: "job-run" });
      }
      fetchJobs();
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: "job-run" });
    } finally {
      setExecutingJobId(null);
    }
  };

  const handleToggleJob = async (job: ScheduledJob) => {
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", jobId: job.id }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(job.enabled ? "Job paused" : "Job enabled");
        fetchJobs();
      }
    } catch {
      toast.error("Failed to toggle job");
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newJobName,
          description: newJobDesc,
          schedule: newJobSchedule,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Job registered successfully");
        setShowAddModal(false);
        setNewJobName("");
        setNewJobDesc("");
        fetchJobs();
      } else {
        toast.error(json.error || "Failed to register job");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-5">
        <div>
          <span className="label block mb-1 font-mono uppercase tracking-widest text-[11px] text-content-faint">
            Automation & Task Schedulers
          </span>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-content">
            Scheduled Jobs Center
          </h1>
          <p className="font-sans text-xs text-content-soft mt-1">
            Configure automated cron tasks, trigger immediate maintenance pipelines, and inspect execution histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-surface transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Register Job
          </button>
        </div>
      </div>

      {/* Jobs Table / List */}
      <div className="border border-rule bg-surface">
        <div className="border-b border-rule px-6 py-4 flex items-center justify-between">
          <h2 className="label font-mono uppercase tracking-widest text-[11px]">
            Active Scheduler Registry ({jobs.length})
          </h2>
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="p-1 text-content-soft hover:text-content"
            title="Refresh jobs"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="py-20 text-center font-sans text-xs text-content-soft">
            Loading scheduled jobs...
          </div>
        ) : (
          <div className="divide-y divide-rule">
            {jobs.map((job) => {
              const isRunning = executingJobId === job.id || job.status === "RUNNING";
              return (
                <div key={job.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-serif text-base font-bold text-content">
                        {job.name}
                      </h3>
                      <span className={cn(
                        "font-mono text-[10px] uppercase px-2 py-0.5 rounded-xs font-semibold",
                        !job.enabled
                          ? "bg-content-faint/10 text-content-faint"
                          : job.lastStatus === "FAILED"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}>
                        {!job.enabled ? "PAUSED" : job.lastStatus || "READY"}
                      </span>
                    </div>

                    <p className="font-sans text-xs text-content-soft leading-relaxed">
                      {job.description || "No description provided."}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-content-faint pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Cron: <code className="bg-surface-raised px-1 py-0.5 rounded">{job.schedule}</code>
                      </span>
                      {job.lastRunAt && (
                        <span>
                          Last Run: {new Date(job.lastRunAt).toLocaleString()} ({job.lastDurationMs || 0}ms)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {job.executions && job.executions.length > 0 && job.executions[0].logs && (
                      <button
                        onClick={() => setSelectedLogs({ jobName: job.name, logs: job.executions![0].logs as string[] })}
                        className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-sans text-xs text-content-soft hover:border-content-soft hover:text-content"
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        Logs
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleJob(job)}
                      className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-sans text-xs text-content-soft hover:border-content-soft hover:text-content"
                    >
                      {job.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {job.enabled ? "Pause" : "Resume"}
                    </button>

                    <button
                      onClick={() => handleRunJob(job)}
                      disabled={isRunning || !job.enabled}
                      className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-3.5 py-1.5 font-sans text-xs font-medium text-surface transition hover:opacity-90 disabled:opacity-50"
                    >
                      <Play className={cn("h-3.5 w-3.5", isRunning && "animate-spin")} />
                      {isRunning ? "Running..." : "Run Now"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Execution Logs Modal */}
      {selectedLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl border border-rule bg-surface shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-accent" />
                <h3 className="font-serif text-base font-bold text-content">
                  Execution Output — {selectedLogs.jobName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogs(null)}
                className="text-content-soft hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-surface-raised p-4 rounded-sm font-mono text-xs text-content space-y-1.5 max-h-96 overflow-y-auto">
              {selectedLogs.logs.map((line, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-content-faint select-none">[{idx + 1}]</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setSelectedLogs(null)}
                className="rounded-sm border border-rule px-4 py-1.5 font-sans text-xs text-content hover:border-accent"
              >
                Close Output
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-content/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg border border-rule bg-surface shadow-2xl p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="font-serif text-base font-bold text-content">
                Register New Scheduled Job
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-content-soft hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="label block mb-1">Job Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekly Content Audit"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="label block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain what this scheduled automation accomplishes..."
                  value={newJobDesc}
                  onChange={(e) => setNewJobDesc(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-xs text-content outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="label block mb-1">Cron Expression / Schedule</label>
                <input
                  type="text"
                  required
                  placeholder="0 2 * * *"
                  value={newJobSchedule}
                  onChange={(e) => setNewJobSchedule(e.target.value)}
                  className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-xs text-content outline-none focus:border-accent"
                />
                <span className="font-mono text-[10px] text-content-faint block mt-1">
                  Format: minute hour day-of-month month day-of-week
                </span>
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
                  {submitting ? "Registering..." : "Register Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
