"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Plus,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  RotateCcw,
  Sparkles,
  HeartPulse,
  SearchCheck,
  Activity,
  FileText,
  BarChart2,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { AnalyticsDashboard, type AnalyticsData } from "@/components/admin/analytics-dashboard";
import { AdminActivityWidget } from "@/components/admin/activity-widget";
import { KIND_META, piecePath } from "@/lib/nav";
import { formatBengaliDate } from "@/lib/bengali";

export interface DashboardWidgetConfig {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_WIDGETS: DashboardWidgetConfig[] = [
  { id: "overview_metrics", type: "metrics", title: "Analytics Overview", enabled: true, order: 0 },
  { id: "editorial_intel", type: "intel", title: "Editorial Intelligence", enabled: true, order: 1 },
  { id: "recent_pieces", type: "pieces", title: "Recently Edited", enabled: true, order: 2 },
  { id: "activity_stream", type: "activity", title: "Live Activity Stream", enabled: true, order: 3 },
  { id: "content_health", type: "health", title: "Content Health Summary", enabled: true, order: 4 },
  { id: "seo_summary", type: "seo", title: "SEO Status", enabled: true, order: 5 },
];

interface CustomDashboardProps {
  initialAnalyticsData?: AnalyticsData;
  recentPieces: Array<{
    id: string;
    slug: string;
    kind: string;
    status: string;
    titleBn: string;
    updatedAt: Date | string;
  }>;
}

export function CustomDashboard({
  initialAnalyticsData,
  recentPieces,
}: CustomDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(DEFAULT_WIDGETS);
  const [customizing, setCustomizing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/dashboard/widgets")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && Array.isArray(data.widgets)) {
          // Merge with defaults in case new widget types were added
          const merged = DEFAULT_WIDGETS.map((def) => {
            const existing = data.widgets.find((w: any) => w.id === def.id);
            return existing ? { ...def, ...existing } : def;
          });
          merged.sort((a, b) => a.order - b.order);
          setWidgets(merged);
        }
      })
      .catch(() => {});
  }, []);

  const saveLayout = async (newWidgets: DashboardWidgetConfig[]) => {
    setWidgets(newWidgets);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/dashboard/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: newWidgets }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success("Dashboard layout saved!");
      }
    } catch {
      toast.error("Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  const toggleWidget = (id: string) => {
    const updated = widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w));
    saveLayout(updated);
  };

  const moveWidget = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const copy = [...widgets];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reordered = copy.map((w, idx) => ({ ...w, order: idx }));
    saveLayout(reordered);
  };

  const resetToDefault = () => {
    saveLayout(DEFAULT_WIDGETS);
  };

  const enabledWidgets = widgets.filter((w) => w.enabled);

  return (
    <div className="space-y-10">
      {/* Header & Customize Trigger */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <span className="label">Editor&apos;s Room</span>
          <h1 className="mt-1 font-serif text-2xl font-normal text-content">
            Editorial Overview & Intelligence
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCustomizing(!customizing)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-sans text-xs transition",
              customizing
                ? "bg-accent text-white border-accent"
                : "border-rule bg-surface-raised text-content-soft hover:text-content hover:border-accent/40"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {customizing ? "Close Customizer" : "Customize Layout"}
          </button>

          <Link
            href="/admin/pieces/new"
            className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-3 py-1.5 font-sans text-xs font-medium text-white hover:bg-accent/90 transition"
          >
            <Plus className="h-4 w-4" />
            New Piece
          </Link>
        </div>
      </div>

      {/* Customizer Drawer / Bar */}
      {customizing && (
        <div className="rounded-sm border border-accent/40 bg-accent/5 p-5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-accent" />
              <h3 className="font-serif text-sm font-semibold text-content">
                Customize Dashboard Widgets
              </h3>
            </div>
            <button
              type="button"
              onClick={resetToDefault}
              className="inline-flex items-center gap-1 text-xs text-content-soft hover:text-accent font-sans"
            >
              <RotateCcw className="h-3 w-3" /> Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {widgets.map((w, idx) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded border border-rule bg-surface p-2.5 text-xs font-sans"
              >
                <div className="flex items-center gap-2 truncate">
                  <button
                    type="button"
                    onClick={() => toggleWidget(w.id)}
                    className={cn(
                      "p-1 rounded transition",
                      w.enabled ? "text-accent hover:bg-accent/10" : "text-content-faint hover:bg-rule/30"
                    )}
                    title={w.enabled ? "Hide Widget" : "Show Widget"}
                  >
                    {w.enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <span className={cn("truncate", !w.enabled && "line-through text-content-faint")}>
                    {w.title}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWidget(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 text-content-soft hover:text-content disabled:opacity-20"
                  >
                    <MoveUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget(idx, "down")}
                    disabled={idx === widgets.length - 1}
                    className="p-1 text-content-soft hover:text-content disabled:opacity-20"
                  >
                    <MoveDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Render Widgets in Ordered Sequence */}
      <div className="space-y-10">
        {enabledWidgets.map((w) => {
          if (w.id === "overview_metrics") {
            return (
              <div key={w.id}>
                <AnalyticsDashboard initialData={initialAnalyticsData} />
              </div>
            );
          }

          if (w.id === "editorial_intel") {
            return (
              <div
                key={w.id}
                className="rounded-sm border border-rule bg-surface-raised p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-rule/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <h3 className="font-serif text-base font-medium text-content">
                      Editorial Intelligence & Emerging Trends
                    </h3>
                  </div>
                  <Link
                    href="/admin/editorial-intelligence"
                    className="inline-flex items-center gap-1 font-sans text-xs text-accent hover:underline"
                  >
                    Full Intelligence Console <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs font-sans">
                  <div className="p-3 bg-surface rounded border border-rule/50 space-y-1">
                    <span className="font-mono text-[10px] uppercase text-content-faint">Peak Window</span>
                    <div className="font-serif text-base font-bold text-accent">
                      Fridays &bull; 6:00 PM
                    </div>
                    <p className="text-content-soft text-[11px]">Optimal release timing for essay read completion.</p>
                  </div>

                  <div className="p-3 bg-surface rounded border border-rule/50 space-y-1">
                    <span className="font-mono text-[10px] uppercase text-content-faint">Recommended Length</span>
                    <div className="font-serif text-base font-bold text-content">
                      1,200 &ndash; 2,000 words
                    </div>
                    <p className="text-content-soft text-[11px]">78% completion retainability sweet spot.</p>
                  </div>

                  <div className="p-3 bg-surface rounded border border-rule/50 space-y-1">
                    <span className="font-mono text-[10px] uppercase text-content-faint">Knowledge Graph</span>
                    <div className="font-serif text-base font-bold text-emerald-700 dark:text-emerald-400">
                      Topology Active
                    </div>
                    <Link href="/admin/content-graph" className="text-accent hover:underline text-[11px] block mt-0.5">
                      Explore relationship nodes &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            );
          }

          if (w.id === "recent_pieces") {
            return (
              <div key={w.id} className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Recently Edited */}
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="label">Recently edited</h2>
                    <Link href="/admin/pieces" className="font-sans text-xs text-content-soft hover:text-accent">
                      All pieces &rarr;
                    </Link>
                  </div>

                  <ul className="mt-4 divide-y divide-rule border-y border-rule">
                    {recentPieces.map((piece) => (
                      <li
                        key={piece.id}
                        className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
                      >
                        <Link
                          href={`/admin/pieces/${piece.id}`}
                          className="font-bengali text-bengali-base text-content transition hover:text-accent"
                          lang="bn"
                        >
                          {piece.titleBn}
                        </Link>

                        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-content-faint">
                          {KIND_META[piece.kind as keyof typeof KIND_META]?.labelEn || piece.kind}
                        </span>

                        {piece.status !== "PUBLISHED" && (
                          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent">
                            {piece.status}
                          </span>
                        )}

                        <span className="ml-auto flex items-center gap-4">
                          <span className="font-bengali text-xs text-content-faint">
                            {formatBengaliDate(new Date(piece.updatedAt))}
                          </span>
                          {piece.status === "PUBLISHED" && (
                            <Link
                              href={piecePath(piece.kind as any, piece.slug)}
                              target="_blank"
                              className="font-serif text-xs text-content-soft transition hover:text-accent"
                            >
                              View
                            </Link>
                          )}
                        </span>
                      </li>
                    ))}

                    {recentPieces.length === 0 && (
                      <li className="py-6 font-sans text-xs text-content-soft">
                        No pieces created yet.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Activity Stream */}
                <div>
                  <AdminActivityWidget />
                </div>
              </div>
            );
          }

          if (w.id === "content_health") {
            return (
              <div key={w.id} className="rounded-sm border border-rule bg-surface-raised p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HeartPulse className="h-5 w-5 text-accent" />
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-content">
                      Content Health & Metadata Audit
                    </h4>
                    <p className="font-sans text-xs text-content-soft">
                      Scan articles for missing meta descriptions, cover aspect ratios, and broken citations.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/content-health"
                  className="rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:border-accent transition shrink-0"
                >
                  View Health Scores
                </Link>
              </div>
            );
          }

          if (w.id === "seo_summary") {
            return (
              <div key={w.id} className="rounded-sm border border-rule bg-surface-raised p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SearchCheck className="h-5 w-5 text-accent" />
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-content">
                      SEO & Broken Link Inspector
                    </h4>
                    <p className="font-sans text-xs text-content-soft">
                      Automated link telemetry, crawler readiness, and structured JSON-LD verification.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/seo"
                  className="rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:border-accent transition shrink-0"
                >
                  Run SEO Scan
                </Link>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
