"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart2,
  TrendingUp,
  Users,
  Eye,
  Clock,
  ExternalLink,
  Download,
  Calendar,
  Share2,
  ArrowUpRight,
  BookOpen,
  Filter,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  period: string;
  overview: {
    totalViews: number;
    uniqueVisitors: number;
    returningVisitors: number;
    totalArticles: number;
    totalSubscribers: number;
    totalReelClicks: number;
    completionRate: number;
    avgReadingMinutes: number;
    bounceRate: number;
  };
  dailyTrend: Array<{ date: string; views: number; visitors: number }>;
  topArticles: Array<{
    id: string;
    slug: string;
    titleBn: string;
    kind: string;
    views: number;
    clicks: number;
    readingMinutes: number;
  }>;
  seriesStats: Array<{
    id: string;
    slug: string;
    titleBn: string;
    totalEpisodes: number;
    totalViews: number;
    avgViews: number;
    completionRate: number;
  }>;
  sources: Array<{ source: string; count: number; pct: number }>;
}

export default function AdvancedAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>("30d");
  const [activeTab, setActiveTab] = useState<"traffic" | "content" | "series" | "sources">("traffic");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const json = await res.json();
      if (json.ok) {
        setData(json);
      } else {
        toast.error("Failed to load analytics");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleExportCSV = () => {
    window.open(`/api/admin/analytics?period=${period}&format=csv`, "_blank");
    toast.success("Downloading CSV report...");
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${period}.json`;
    a.click();
    toast.success("Downloaded JSON data");
  };

  // Find max value in daily trend for chart scaling
  const maxTrendViews = Math.max(1, ...(data?.dailyTrend.map((d) => d.views) || [1]));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Advanced Analytics & Observability
            </h1>
            <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent uppercase">
              EDITORIAL INTELLIGENCE
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Comprehensive readership metrics, traffic flow analysis, content performance, and growth trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter Buttons */}
          <div className="flex items-center bg-surface-raised p-1 rounded-sm border border-rule font-sans text-xs">
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
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

          {/* Export Actions */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-sans text-xs font-medium text-content-soft hover:text-content hover:border-content transition"
          >
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-sans text-xs font-medium text-content-soft hover:text-content hover:border-content transition"
          >
            <Download className="h-3.5 w-3.5" /> JSON
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center font-sans text-xs text-content-faint">
          Aggregating reader telemetry and engagement metrics...
        </div>
      ) : data ? (
        <>
          {/* Top KPI Cards (6 metrics) */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-sm border border-rule bg-surface-raised p-4 space-y-1">
              <span className="label">Page Views</span>
              <div className="font-serif text-2xl font-normal text-content">
                {data.overview.totalViews.toLocaleString()}
              </div>
              <p className="font-mono text-[10px] text-content-faint">Total article views</p>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-4 space-y-1">
              <span className="label">Unique Visitors</span>
              <div className="font-serif text-2xl font-normal text-content">
                {data.overview.uniqueVisitors.toLocaleString()}
              </div>
              <p className="font-mono text-[10px] text-content-faint">Distinct sessions</p>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-4 space-y-1">
              <span className="label">Returning Readers</span>
              <div className="font-serif text-2xl font-normal text-content">
                {data.overview.returningVisitors.toLocaleString()}
              </div>
              <p className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Loyal audience</p>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-4 space-y-1">
              <span className="label">Avg Read Time</span>
              <div className="font-serif text-2xl font-normal text-content">
                {data.overview.avgReadingMinutes}m
              </div>
              <p className="font-mono text-[10px] text-content-faint">Per session duration</p>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-4 space-y-1">
              <span className="label">Completion Rate</span>
              <div className="font-serif text-2xl font-normal text-content">
                {data.overview.completionRate}%
              </div>
              <p className="font-mono text-[10px] text-content-faint">Read to finish</p>
            </div>

            <div className="rounded-sm border border-rule bg-surface-raised p-4 space-y-1">
              <span className="label">Bounce Rate</span>
              <div className="font-serif text-2xl font-normal text-content">
                {data.overview.bounceRate}%
              </div>
              <p className="font-mono text-[10px] text-content-faint">Single page exits</p>
            </div>
          </div>

          {/* Traffic Trend Visualizer (Editorial Bar Chart) */}
          <div className="rounded-sm border border-rule bg-surface-raised p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base text-content">Daily Traffic Flow</h3>
                <p className="font-sans text-xs text-content-soft">Page views and unique visitor volume over time</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-sans">
                <span className="flex items-center gap-1.5 text-content">
                  <span className="h-2.5 w-2.5 rounded-xs bg-accent" /> Views
                </span>
                <span className="flex items-center gap-1.5 text-content-soft">
                  <span className="h-2.5 w-2.5 rounded-xs bg-content-faint" /> Visitors
                </span>
              </div>
            </div>

            {/* Custom Bar Visualization */}
            <div className="h-48 flex items-end gap-1.5 pt-6 border-b border-rule">
              {data.dailyTrend.map((d, i) => {
                const heightPct = Math.max(8, Math.round((d.views / maxTrendViews) * 100));
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 bg-content text-surface text-[10px] font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap">
                      {d.date}: {d.views} views ({d.visitors} visitors)
                    </div>

                    <div
                      className="w-full bg-accent/80 hover:bg-accent rounded-xs transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between font-mono text-[10px] text-content-faint pt-1">
              <span>{data.dailyTrend[0]?.date}</span>
              <span>{data.dailyTrend[Math.floor(data.dailyTrend.length / 2)]?.date}</span>
              <span>{data.dailyTrend[data.dailyTrend.length - 1]?.date}</span>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-rule pb-2 font-sans text-xs">
            {[
              { id: "traffic", label: "Top Articles" },
              { id: "series", label: "Series Performance" },
              { id: "sources", label: "Referral Sources" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-3 py-1.5 rounded-sm transition",
                  activeTab === tab.id
                    ? "bg-surface font-semibold text-content border border-rule shadow-xs"
                    : "text-content-soft hover:text-content"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab 1: Top Articles Table */}
          {activeTab === "traffic" && (
            <div className="rounded-sm border border-rule bg-surface-raised overflow-hidden">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="border-b border-rule bg-surface/60 text-[10px] uppercase tracking-wider text-content-faint font-mono">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Piece Title</th>
                    <th className="p-3">Kind</th>
                    <th className="p-3">Read Time</th>
                    <th className="p-3">Views</th>
                    <th className="p-3 text-right">Reel Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/50">
                  {data.topArticles.map((article, idx) => (
                    <tr key={article.id} className="hover:bg-surface/50 transition">
                      <td className="p-3 font-mono text-content-faint w-12">{idx + 1}</td>
                      <td className="p-3 max-w-sm">
                        <Link
                          href={`/admin/pieces/${article.id}`}
                          className="font-medium text-content hover:text-accent font-bengali text-sm"
                          lang="bn"
                        >
                          {article.titleBn}
                        </Link>
                        <p className="font-mono text-[10px] text-content-faint">/{article.slug}</p>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-content-soft">{article.kind}</td>
                      <td className="p-3 font-mono text-[11px] text-content-soft">{article.readingMinutes} min</td>
                      <td className="p-3 font-mono text-[11px] font-bold text-content">{article.views.toLocaleString()}</td>
                      <td className="p-3 font-mono text-[11px] text-right text-accent">{article.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 2: Series Performance */}
          {activeTab === "series" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.seriesStats.map((s) => (
                <div key={s.id} className="rounded-sm border border-rule bg-surface-raised p-5 space-y-3 font-sans text-xs">
                  <div className="flex items-start justify-between">
                    <h4 className="font-bengali font-bold text-base text-content" lang="bn">
                      {s.titleBn}
                    </h4>
                    <span className="font-mono text-[10px] text-content-faint">
                      {s.totalEpisodes} episodes
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rule/50 font-mono text-[11px]">
                    <div>
                      <span className="text-content-faint">Total Views:</span>
                      <p className="font-bold text-content">{s.totalViews.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-content-faint">Completion:</span>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">{s.completionRate}%</p>
                    </div>
                  </div>

                  {/* Episode progress bar */}
                  <div className="space-y-1 pt-2">
                    <span className="font-mono text-[10px] text-content-faint">Audience Retention:</span>
                    <div className="h-1.5 w-full bg-rule/50 rounded-full overflow-hidden">
                      <div className="h-full bg-accent" style={{ width: `${s.completionRate}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Referral Sources */}
          {activeTab === "sources" && (
            <div className="rounded-sm border border-rule bg-surface-raised p-6 space-y-4 font-sans text-xs">
              <h3 className="font-serif text-base text-content">Traffic Acquisition Channels</h3>
              <div className="space-y-3">
                {data.sources.map((src) => (
                  <div key={src.source} className="space-y-1">
                    <div className="flex justify-between font-sans text-xs">
                      <span className="font-medium text-content">{src.source}</span>
                      <span className="font-mono text-content-soft">{src.count.toLocaleString()} visits ({src.pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-rule/40 rounded-full overflow-hidden">
                      <div className="h-full bg-accent/80 rounded-full" style={{ width: `${src.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
