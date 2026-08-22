"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  TrendingUp,
  Percent,
  CheckCircle2,
  ArrowRight,
  Filter,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface EngagementData {
  period: string;
  totalViews: number;
  averageReadingTimeSec: number;
  depthFunnel: Array<{ label: string; count: number; pct: number }>;
  topEngagedPieces: Array<{
    id: string;
    titleBn: string;
    slug: string;
    views: number;
    avgMinutes: number;
    estimatedCompletionRate: number;
  }>;
}

export default function EngagementIntelligencePage() {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("30d");

  const fetchEngagement = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/engagement?period=${period}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        toast.error("Failed to load engagement intelligence");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngagement();
  }, [period]);

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Reading & Engagement Intelligence
            </h1>
            <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent uppercase">
              BEHAVIORAL TELEMETRY
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Granular reader behavior tracking: scroll depth curves, average reading duration, completion drop-offs.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center bg-surface-raised p-1 rounded-sm border border-rule font-sans text-xs">
          {[
            { id: "7d", label: "7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "90d", label: "90 Days" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={cn(
                "px-2.5 py-1 rounded-sm transition text-xs",
                period === p.id
                  ? "bg-surface font-semibold text-content shadow-xs"
                  : "text-content-soft hover:text-content"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Analyzing scroll milestones and audience reading depth...
        </div>
      ) : data ? (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-sm border border-rule bg-surface-raised p-5 space-y-1">
              <span className="label">Average Reading Duration</span>
              <div className="font-serif text-3xl font-normal text-content">
                {formatSec(data.averageReadingTimeSec)}
              </div>
              <p className="font-mono text-[11px] text-content-faint">Active dwell time per piece</p>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-5 space-y-1">
              <span className="label">Midpoint Retention (50%)</span>
              <div className="font-serif text-3xl font-normal text-emerald-700 dark:text-emerald-400">
                {data.depthFunnel[2]?.pct}%
              </div>
              <p className="font-mono text-[11px] text-content-faint">Readers reaching middle of essay</p>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-5 space-y-1">
              <span className="label">Full Completion Rate</span>
              <div className="font-serif text-3xl font-normal text-accent">
                {data.depthFunnel[4]?.pct}%
              </div>
              <p className="font-mono text-[11px] text-content-faint">Readers reaching concluding note</p>
            </div>
          </div>

          {/* Scroll Funnel Visualization */}
          <div className="rounded-sm border border-rule bg-surface-raised p-6 space-y-4 font-sans text-xs">
            <h3 className="font-serif text-base text-content">Scroll Depth Retention Funnel</h3>
            <p className="text-content-soft -mt-2">
              Visualizing how readers progress through longform content and where drop-offs occur.
            </p>

            <div className="space-y-4 pt-2">
              {data.depthFunnel.map((step, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between font-sans text-xs">
                    <span className="font-medium text-content">{step.label}</span>
                    <span className="font-mono text-content-soft">
                      {step.count.toLocaleString()} readers ({step.pct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full bg-rule/40 rounded-sm overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-sm transition-all",
                        idx === 0 ? "bg-content" : idx <= 2 ? "bg-emerald-600" : "bg-accent"
                      )}
                      style={{ width: `${step.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Engaged Articles Table */}
          <div className="rounded-sm border border-rule bg-surface-raised overflow-hidden font-sans text-xs">
            <div className="p-4 border-b border-rule bg-surface/50">
              <h3 className="font-serif text-base text-content">Most Engaging Articles</h3>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-rule bg-surface/60 text-[10px] uppercase tracking-wider text-content-faint font-mono">
                  <th className="p-3">Article</th>
                  <th className="p-3">Estimated Length</th>
                  <th className="p-3">Total Readers</th>
                  <th className="p-3">Completion Rate</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {data.topEngagedPieces.map((piece) => (
                  <tr key={piece.id} className="hover:bg-surface/50 transition">
                    <td className="p-3 max-w-sm">
                      <p className="font-medium text-content font-bengali text-sm" lang="bn">
                        {piece.titleBn}
                      </p>
                      <span className="font-mono text-[10px] text-content-faint">/{piece.slug}</span>
                    </td>
                    <td className="p-3 font-mono text-content-soft">{piece.avgMinutes} min read</td>
                    <td className="p-3 font-mono text-content">{piece.views.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {piece.estimatedCompletionRate}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/admin/pieces/${piece.id}`}
                        className="text-accent hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Inspect <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
