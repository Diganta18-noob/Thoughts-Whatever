"use client";

import { useState, useEffect } from "react";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  title: string;
  metricKey: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string;
  startDate: string;
  endDate: string;
  owner?: string | null;
  status: string;
  progressPct: number;
}

export default function GoalsKPITrackingPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [metricKey, setMetricKey] = useState("pageviews");
  const [targetValue, setTargetValue] = useState("10000");
  const [period, setPeriod] = useState("monthly");
  const [owner, setOwner] = useState("Editorial Team");
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/goals");
      const json = await res.json();
      if (json.ok) {
        setGoals(json.goals);
      } else {
        toast.error("Failed to load goals");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetValue) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          metricKey,
          targetValue,
          period,
          owner,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success("Editorial goal created!");
        setShowAddModal(false);
        setTitle("");
        fetchGoals();
      } else {
        toast.error(json.error || "Failed to create goal");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this goal?")) return;

    try {
      const res = await fetch(`/api/admin/goals?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        toast.success("Goal deleted");
        fetchGoals();
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Editorial Goals & KPI Tracking
            </h1>
            <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent uppercase">
              {goals.length} ACTIVE GOALS
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Define publication growth targets, track monthly readership milestones, and monitor pacing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 font-sans text-xs font-medium text-white hover:bg-accent/90 transition"
        >
          <Plus className="h-4 w-4" /> Add Editorial Goal
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Evaluating goal progress against real database telemetry...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const isOnTrack = goal.status === "ON_TRACK";
            const isBehind = goal.status === "BEHIND";

            return (
              <div
                key={goal.id}
                className="rounded-sm border border-rule bg-surface-raised p-6 space-y-4 font-sans text-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
                        isOnTrack && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                        goal.status === "AT_RISK" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                        isBehind && "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                      )}
                    >
                      {goal.status.replace("_", " ")}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-content-faint hover:text-rose-600 transition"
                      title="Delete goal"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-serif text-lg font-normal text-content">
                      {goal.title}
                    </h3>
                    <p className="font-mono text-[10px] text-content-faint capitalize">
                      {goal.period} target • Owner: {goal.owner || "Team"}
                    </p>
                  </div>

                  {/* Target vs Actual */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-mono text-content-faint">Current</span>
                      <p className="font-serif text-2xl font-normal text-content">
                        {goal.currentValue.toLocaleString()}
                      </p>
                    </div>

                    <div className="text-right space-y-0.5">
                      <span className="text-[10px] uppercase font-mono text-content-faint">Target</span>
                      <p className="font-serif text-2xl font-normal text-content-soft">
                        {goal.targetValue.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-content-soft">Progress</span>
                      <span className="font-bold text-content">{goal.progressPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-rule/40 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isOnTrack ? "bg-emerald-600" : goal.status === "AT_RISK" ? "bg-amber-500" : "bg-rose-600"
                        )}
                        style={{ width: `${goal.progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-rule/50 pt-3 flex items-center justify-between text-[10px] font-mono text-content-faint">
                  <span>Target Date:</span>
                  <span>{new Date(goal.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-sm border border-rule bg-surface p-6 shadow-2xl space-y-4 animate-fade-in font-sans text-xs">
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <h3 className="font-serif text-lg text-content">Set New Editorial Target</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-content-soft hover:text-content"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="label">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monthly Reader Growth Target"
                  className="w-full p-2 rounded-sm border border-rule bg-surface text-content focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Metric
                  </label>
                  <select
                    value={metricKey}
                    onChange={(e) => setMetricKey(e.target.value)}
                    className="w-full p-2 rounded-sm border border-rule bg-surface text-content focus:outline-none focus:border-accent"
                  >
                    <option value="pageviews">Page Views</option>
                    <option value="articles_published">Articles Published</option>
                    <option value="subscribers">Subscribers</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    Target Value
                  </label>
                  <input
                    type="number"
                    required
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="w-full p-2 rounded-sm border border-rule bg-surface text-content focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Time Period
                  </label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full p-2 rounded-sm border border-rule bg-surface text-content focus:outline-none focus:border-accent"
                  >
                    <option value="cumulative">All-Time Milestone</option>
                    <option value="monthly">Monthly Target</option>
                    <option value="quarterly">Quarterly Target</option>
                    <option value="annual">Annual Target</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    Owner
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Editorial Team"
                    className="w-full p-2 rounded-sm border border-rule bg-surface text-content focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rule">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-sm border border-rule text-content-soft hover:text-content"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-sm bg-accent font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
