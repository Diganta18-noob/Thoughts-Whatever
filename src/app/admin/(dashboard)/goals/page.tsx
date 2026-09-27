"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { confirmToast } from "@/lib/confirm-toast";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

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

  const handleDeleteGoal = (id: string) => {
    confirmToast(
      "Are you sure you want to delete this editorial goal?",
      async () => {
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
      },
      { title: "Delete Goal", confirmLabel: "Delete", variant: "danger" }
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Editorial Goals & KPI Tracking"
        subtitle="Define publication growth targets, track monthly readership milestones, and monitor pacing."
        className="border-b border-rule"
        actions={
          <>
            <Badge tone="accent" className="font-mono uppercase">
              {goals.length} Active
            </Badge>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4" /> Add Editorial Goal
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Evaluating goal progress against real database telemetry...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const isOnTrack = goal.status === "ON_TRACK";

            return (
              <div
                key={goal.id}
                className="rounded-sm border border-rule bg-surface-raised p-6 space-y-4 font-sans text-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      tone={
                        isOnTrack
                          ? "success"
                          : goal.status === "AT_RISK"
                          ? "warning"
                          : "danger"
                      }
                      className="font-mono font-bold uppercase"
                    >
                      {goal.status.replace("_", " ")}
                    </Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGoal(goal.id)}
                      aria-label={`Delete goal: ${goal.title}`}
                      className="px-2 hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
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
                    <div
                      role="progressbar"
                      aria-valuenow={goal.progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${goal.title} progress`}
                      className="h-2 w-full bg-rule/40 rounded-full overflow-hidden"
                    >
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isOnTrack ? "bg-success" : goal.status === "AT_RISK" ? "bg-warning" : "bg-danger"
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
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogTitle className="border-b border-rule pb-3 pr-8">
            Set New Editorial Target
          </DialogTitle>

          <form onSubmit={handleCreateGoal} className="mt-4 space-y-4">
            <div>
              <label htmlFor="goal-title" className="label mb-1 block">
                Goal Title
              </label>
              <Input
                id="goal-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Monthly Reader Growth Target"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="goal-metric" className="label mb-1 block">
                  Metric
                </label>
                <Select value={metricKey} onValueChange={setMetricKey}>
                  <SelectTrigger id="goal-metric">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pageviews">Page Views</SelectItem>
                    <SelectItem value="articles_published">Articles Published</SelectItem>
                    <SelectItem value="subscribers">Subscribers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="goal-target" className="label mb-1 block">
                  Target Value
                </label>
                <Input
                  id="goal-target"
                  type="number"
                  required
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="goal-period" className="label mb-1 block">
                  Time Period
                </label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger id="goal-period">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cumulative">All-Time Milestone</SelectItem>
                    <SelectItem value="monthly">Monthly Target</SelectItem>
                    <SelectItem value="quarterly">Quarterly Target</SelectItem>
                    <SelectItem value="annual">Annual Target</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="goal-owner" className="label mb-1 block">
                  Owner
                </label>
                <Input
                  id="goal-owner"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Editorial Team"
                />
              </div>
            </div>

            <DialogFooter className="border-t border-rule pt-3">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
