"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Terminal,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  EmptyState,
  Input,
  PageHeader,
  Textarea,
} from "@/components/ui";

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
      <PageHeader
        title="Scheduled Jobs Center"
        subtitle="Configure automated cron tasks, trigger immediate maintenance pipelines, and inspect execution histories."
        className="border-b border-rule"
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" />
            Register Job
          </Button>
        }
      />

      {/* Jobs Table / List */}
      <div className="rounded-card border border-rule bg-surface">
        <div className="border-b border-rule px-6 py-4 flex items-center justify-between">
          <h2 className="label font-mono uppercase tracking-widest text-[11px]">
            Active Scheduler Registry ({jobs.length})
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchJobs}
            disabled={loading}
            aria-label="Refresh jobs"
            className="px-2"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>

        {loading && jobs.length === 0 ? (
          <div className="py-20 text-center font-sans text-xs text-content-soft">
            Loading scheduled jobs...
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState
            className="border-0"
            icon={<Clock className="h-6 w-6" />}
            title="No scheduled jobs yet"
            description="Register a cron task to automate maintenance pipelines and recurring editorial checks."
            action={
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4" />
                Register Job
              </Button>
            }
          />
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
                      <Badge
                        tone={
                          !job.enabled
                            ? "neutral"
                            : job.lastStatus === "FAILED"
                            ? "danger"
                            : "success"
                        }
                        className="font-mono uppercase"
                      >
                        {!job.enabled ? "PAUSED" : job.lastStatus || "READY"}
                      </Badge>
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedLogs({ jobName: job.name, logs: job.executions![0].logs as string[] })}
                      >
                        <Terminal className="h-3.5 w-3.5" />
                        Logs
                      </Button>
                    )}

                    <Button variant="secondary" size="sm" onClick={() => handleToggleJob(job)}>
                      {job.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {job.enabled ? "Pause" : "Resume"}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleRunJob(job)}
                      disabled={isRunning || !job.enabled}
                    >
                      <Play className={cn("h-3.5 w-3.5", isRunning && "animate-spin")} />
                      {isRunning ? "Running..." : "Run Now"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Execution Logs Modal */}
      <Dialog
        open={selectedLogs !== null}
        onOpenChange={(next) => {
          if (!next) setSelectedLogs(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogTitle className="flex items-center gap-2 border-b border-rule pb-3 pr-8">
            <Terminal className="h-4 w-4 shrink-0 text-accent" />
            Execution Output — {selectedLogs?.jobName}
          </DialogTitle>

          <div className="mt-4 max-h-96 space-y-1.5 overflow-y-auto rounded-card bg-surface p-4 font-mono text-xs text-content">
            {selectedLogs?.logs.map((line, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="select-none text-content-faint">[{idx + 1}]</span>
                <span>{line}</span>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedLogs(null)}>
              Close Output
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Job Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogTitle className="border-b border-rule pb-3 pr-8">
            Register New Scheduled Job
          </DialogTitle>

          <form onSubmit={handleCreateJob} className="mt-4 space-y-4">
            <div>
              <label htmlFor="job-name" className="label mb-1 block">
                Job Name
              </label>
              <Input
                id="job-name"
                required
                placeholder="e.g. Weekly Content Audit"
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="job-desc" className="label mb-1 block">
                Description
              </label>
              <Textarea
                id="job-desc"
                rows={2}
                placeholder="Explain what this scheduled automation accomplishes..."
                value={newJobDesc}
                onChange={(e) => setNewJobDesc(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="job-schedule" className="label mb-1 block">
                Cron Expression / Schedule
              </label>
              <Input
                id="job-schedule"
                required
                placeholder="0 2 * * *"
                value={newJobSchedule}
                onChange={(e) => setNewJobSchedule(e.target.value)}
                aria-describedby="job-schedule-hint"
                className="font-mono"
              />
              <span
                id="job-schedule-hint"
                className="mt-1 block font-mono text-[10px] text-content-faint"
              >
                Format: minute hour day-of-month month day-of-week
              </span>
            </div>

            <DialogFooter className="border-t border-rule pt-3">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Registering..." : "Register Job"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
