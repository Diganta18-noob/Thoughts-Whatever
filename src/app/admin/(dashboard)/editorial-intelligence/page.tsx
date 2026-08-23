"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  BookOpen,
  FolderPlus,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  Lightbulb,
  Compass,
  FileEdit,
  BarChart2,
  Calendar,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import type { EditorialIntelligenceData } from "@/lib/editorial-intelligence";

export default function EditorialIntelligencePage() {
  const [data, setData] = useState<EditorialIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/editorial-intelligence");
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      } else {
        toast.error("Failed to load editorial intelligence");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-accent">
              Editorial OS &bull; Intelligence Engine
            </span>
          </div>
          <h1 className="font-serif text-2xl font-normal text-content mt-1">
            Editorial Intelligence & Content Strategy
          </h1>
          <p className="font-sans text-xs text-content-soft mt-1 max-w-2xl">
            Algorithmic insights derived from reader attention, completion curves, category demand shifts, and historical publishing velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchIntelligence}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-sm border border-rule bg-surface-raised px-3 py-1.5 font-sans text-xs text-content-soft hover:text-content hover:border-accent/40 transition disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-accent")} />
            {loading ? "Analyzing..." : "Refresh Insights"}
          </button>

          <Link
            href="/admin/pieces/new"
            className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 font-sans text-xs font-medium text-white hover:bg-accent/90 transition"
          >
            <FileEdit className="h-3.5 w-3.5" />
            New Commission
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          <Sparkles className="h-6 w-6 animate-pulse text-accent mx-auto mb-3" />
          Synthesizing reading patterns, taxonomy growth, and editorial recommendations...
        </div>
      ) : !data ? (
        <div className="rounded-sm border border-rule bg-surface-raised p-12 text-center text-xs text-content-faint">
          No intelligence data available. Ensure articles and telemetry events exist.
        </div>
      ) : (
        <>
          {/* Actionable Recommendations Banner */}
          <div className="space-y-3">
            <h2 className="label flex items-center gap-2">
              <Lightbulb className="h-3.5 w-3.5 text-accent" />
              Strategic Editorial Directives
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.actionableInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    "rounded-sm border p-4 transition space-y-2 relative bg-surface-raised",
                    insight.priority === "high"
                      ? "border-accent/40 bg-accent/5"
                      : "border-rule hover:border-rule/80"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-accent">
                      {insight.type.toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase font-bold",
                        insight.priority === "high"
                          ? "bg-accent/20 text-accent"
                          : "bg-surface border border-rule text-content-faint"
                      )}
                    >
                      {insight.priority} priority
                    </span>
                  </div>

                  <h3 className="font-serif text-sm font-semibold text-content">
                    {insight.title}
                  </h3>

                  <p className="font-sans text-xs text-content-soft leading-relaxed">
                    {insight.description}
                  </p>

                  {insight.actionUrl && (
                    <div className="pt-2">
                      <Link
                        href={insight.actionUrl}
                        className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-accent hover:underline"
                      >
                        {insight.actionLabel || "Take Action"} <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: Rising & Declining Topics */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Rising Topics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="label flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Surging Literary Topics (30-Day Velocity)
                </h2>
              </div>

              <div className="rounded-sm border border-rule bg-surface-raised divide-y divide-rule/70">
                {data.risingTopics.length === 0 ? (
                  <div className="p-6 text-center text-xs text-content-faint">
                    No surging topics detected in current 30-day window.
                  </div>
                ) : (
                  data.risingTopics.map((topic) => (
                    <div key={topic.tagId} className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bengali text-base font-semibold text-content" lang="bn">
                            {topic.tagName}
                          </span>
                          <span className="font-mono text-[10px] text-content-faint">
                            ({topic.articleCount} pieces)
                          </span>
                        </div>
                        <p className="font-sans text-xs text-content-soft">
                          {topic.recentViews} views &bull; was {topic.previousViews} prev
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          +{topic.growthPercent}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Declining Topics */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="label flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <TrendingDown className="h-3.5 w-3.5" />
                  Declining / Cooling Topics
                </h2>
              </div>

              <div className="rounded-sm border border-rule bg-surface-raised divide-y divide-rule/70">
                {data.decliningTopics.length === 0 ? (
                  <div className="p-6 text-center text-xs text-content-faint">
                    All active topics are maintaining healthy baseline readership.
                  </div>
                ) : (
                  data.decliningTopics.map((topic) => (
                    <div key={topic.tagId} className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bengali text-base font-semibold text-content" lang="bn">
                            {topic.tagName}
                          </span>
                          <span className="font-mono text-[10px] text-content-faint">
                            ({topic.articleCount} pieces)
                          </span>
                        </div>
                        <p className="font-sans text-xs text-content-soft">
                          {topic.recentViews} views vs {topic.previousViews} prev period
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                          {topic.growthPercent}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Section: Content Gaps & Opportunities */}
          <div className="space-y-4">
            <h2 className="label flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 text-accent" />
              Identified Content Gaps & High-Demand Opportunities
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {data.contentGaps.length === 0 ? (
                <div className="col-span-2 rounded-sm border border-rule bg-surface-raised p-8 text-center text-xs text-content-faint">
                  No critical content inventory deficits detected.
                </div>
              ) : (
                data.contentGaps.map((gap) => (
                  <div
                    key={gap.tagId}
                    className="rounded-sm border border-rule bg-surface-raised p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] uppercase text-content-faint">
                          High Demand &bull; Limited Inventory
                        </span>
                        <h3 className="font-bengali text-lg font-bold text-content mt-0.5" lang="bn">
                          {gap.tagName}
                        </h3>
                      </div>
                      <span className="rounded bg-accent/10 px-2 py-1 font-mono text-xs font-bold text-accent">
                        Score: {gap.opportunityScore}/100
                      </span>
                    </div>

                    <p className="font-sans text-xs text-content-soft leading-relaxed">
                      {gap.recommendation}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-rule/50 text-[11px] font-mono text-content-faint">
                      <span>{gap.articleCount} current piece{gap.articleCount === 1 ? "" : "s"}</span>
                      <span>{gap.avgViewsPerArticle} avg views / piece</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section: Publishing Timing & Article Length Dynamics */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Optimal Publishing Window */}
            <div className="space-y-4 rounded-sm border border-rule bg-surface-raised p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                <h3 className="font-serif text-base font-semibold text-content">
                  Optimal Publishing Time Window
                </h3>
              </div>

              <div className="p-4 rounded bg-surface border border-rule/60 flex items-center justify-between">
                <div>
                  <span className="font-mono text-[10px] uppercase text-content-faint">Recommended Peak</span>
                  <div className="font-serif text-xl font-bold text-accent">
                    {data.publishingTime.bestDayOfWeek}s at {data.publishingTime.bestHourFormatted}
                  </div>
                </div>
                <Calendar className="h-8 w-8 text-content-faint opacity-50" />
              </div>

              <p className="font-sans text-xs text-content-soft">
                Calculated from aggregated hourly read telemetry. Essays released within 2 hours of this window exhibit higher organic social bookmarking and day-one read completion.
              </p>

              {/* Day Distribution Mini-Bar */}
              <div className="space-y-1.5 pt-2">
                <span className="font-mono text-[10px] uppercase text-content-faint">Activity by Day</span>
                <div className="grid grid-cols-7 gap-1">
                  {data.publishingTime.dailyDistribution.map((d) => (
                    <div key={d.day} className="text-center">
                      <div className="h-12 bg-surface rounded flex items-end justify-center p-1 border border-rule/40">
                        <div
                          className="w-full bg-accent/70 rounded-xs"
                          style={{
                            height: `${Math.max(15, Math.min(100, (d.count / Math.max(...data.publishingTime.dailyDistribution.map((x) => x.count || 1))) * 100))}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[9px] text-content-faint block mt-1">
                        {d.day.slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Article Length & Format Dynamics */}
            <div className="space-y-4 rounded-sm border border-rule bg-surface-raised p-6">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" />
                <h3 className="font-serif text-base font-semibold text-content">
                  Article Length vs Completion Retainability
                </h3>
              </div>

              <div className="p-4 rounded bg-surface border border-rule/60">
                <span className="font-mono text-[10px] uppercase text-content-faint">Sweet Spot</span>
                <div className="font-serif text-lg font-bold text-content">
                  {data.articleLength.optimalWordCountRange}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {data.articleLength.avgCompletionByLength.map((b) => (
                  <div key={b.range} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-sans">
                      <span className="text-content font-medium">{b.range} ({b.articleCount} pieces)</span>
                      <span className="font-mono text-content-soft font-bold">{b.avgCompletionRate}% completion</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden border border-rule/40">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${b.avgCompletionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="font-sans text-xs text-content-soft pt-1">
                {data.articleLength.recommendation}
              </p>
            </div>
          </div>

          {/* Section: Series Opportunities & Evergreen Refresh */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Potential Series Expansions */}
            <div className="space-y-4">
              <h2 className="label flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-accent" />
                High-Interest Series Expansion Candidates
              </h2>

              <div className="rounded-sm border border-rule bg-surface-raised divide-y divide-rule/70">
                {data.seriesOpportunities.length === 0 ? (
                  <div className="p-6 text-center text-xs text-content-faint">
                    No standalone articles currently meet high-frequency serialization criteria.
                  </div>
                ) : (
                  data.seriesOpportunities.map((op) => (
                    <div key={op.pieceId} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/admin/pieces/${op.pieceId}`}
                          className="font-bengali text-base font-semibold text-content hover:text-accent transition"
                          lang="bn"
                        >
                          {op.titleBn}
                        </Link>
                        <span className="font-mono text-xs text-content-faint">{op.views} views</span>
                      </div>
                      <p className="font-sans text-xs text-content-soft leading-relaxed">
                        {op.recommendation}
                      </p>
                      <div className="pt-1">
                        <Link
                          href="/admin/series"
                          className="inline-flex items-center gap-1 font-sans text-xs text-accent hover:underline"
                        >
                          <FolderPlus className="h-3 w-3" /> Create Series from Essay
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Evergreen Articles Needing Metadata Refresh */}
            <div className="space-y-4">
              <h2 className="label flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-accent" />
                Evergreen Articles Requiring Refresh
              </h2>

              <div className="rounded-sm border border-rule bg-surface-raised divide-y divide-rule/70">
                {data.staleArticles.length === 0 ? (
                  <div className="p-6 text-center text-xs text-content-faint">
                    All evergreen pieces have been updated within the last 120 days.
                  </div>
                ) : (
                  data.staleArticles.map((piece) => (
                    <div key={piece.id} className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/admin/pieces/${piece.id}`}
                          className="font-bengali text-base font-semibold text-content hover:text-accent transition"
                          lang="bn"
                        >
                          {piece.titleBn}
                        </Link>
                        <span className="font-mono text-[10px] text-accent font-semibold">
                          {piece.daysSincePublished}d ago
                        </span>
                      </div>
                      <p className="font-sans text-xs text-content-soft">
                        {piece.recommendation}
                      </p>
                      <div className="pt-1">
                        <Link
                          href={`/admin/pieces/${piece.id}`}
                          className="inline-flex items-center gap-1 font-sans text-xs text-accent hover:underline"
                        >
                          <FileEdit className="h-3 w-3" /> Edit in Piece Editor
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
