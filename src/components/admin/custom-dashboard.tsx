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
  HeartPulse,
  SearchCheck,
  Activity,
  FileText,
  BarChart2,
  Cpu,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import type { AnalyticsData } from "@/components/admin/analytics-dashboard";
import { DEFAULT_ADMIN_WIDGETS, type DashboardWidgetConfig } from "@/lib/admin-dashboard-widgets";
import { AdminActivityWidget } from "@/components/admin/activity-widget";
import { KIND_META, piecePath } from "@/lib/nav";
import { formatBengaliDate } from "@/lib/bengali";
import { Button, buttonVariants } from "@/components/ui";

export type { DashboardWidgetConfig } from "@/lib/admin-dashboard-widgets";
const DEFAULT_WIDGETS = DEFAULT_ADMIN_WIDGETS;
const AnalyticsDashboard = dynamic(() => import("./analytics-dashboard").then((module) => module.AnalyticsDashboard), {
  loading: () => <p role="status">Loading analytics…</p>,
});
const ReferenceAnalyticsPanel = dynamic(() => import("./reference-analytics-panel").then((module) => module.ReferenceAnalyticsPanel), {
  loading: () => <p role="status">Loading reference activity…</p>,
});

interface CustomDashboardProps {
  workSummary?: { drafts: number | null; scheduled: number | null; failedJobs: number | null };
  recentError?: boolean;
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
  workSummary,
  recentError = false,
  initialAnalyticsData,
  recentPieces,
}: CustomDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(DEFAULT_WIDGETS);
  const [customizing, setCustomizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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
    <div className="space-y-6">
      {/* Header & Customize Trigger */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <h1 className="admin-page-title text-content">
            Editorial Overview
          </h1>
          <p className="mt-2 text-sm text-content-soft">Continue writing, review your drafts, and keep publishing on track.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm"
            onClick={() => setCustomizing(!customizing)}
            aria-expanded={customizing}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {customizing ? "Close Customizer" : "Customize Layout"}
          </Button>

          <Link
            href="/admin/pieces/new"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            <Plus className="h-4 w-4" />
            New piece
          </Link>
        </div>
      </div>

      <section aria-label="Daily work" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Continue drafts", href: "/admin/pieces?status=DRAFT", count: workSummary?.drafts },
          { label: "Scheduled publishing", href: "/admin/jobs", count: workSummary?.scheduled },
          { label: "Review failed jobs", href: "/admin/jobs", count: workSummary?.failedJobs },
        ].map((item) => (
          <Link key={item.label} href={item.href} className="rounded-card border border-rule bg-surface-raised p-4 transition hover:border-accent">
            <span className="block text-sm text-content">{item.label}</span>
            <span className="mt-2 block text-2xl text-content">{item.count ?? "—"}</span>
            {item.count === null && <span className="text-xs text-content-soft">Currently unavailable</span>}
          </Link>
        ))}
      </section>
      <p className="text-xs text-content-soft">Detailed reports load when opened. <Link href="/admin/analytics" className="text-accent underline">Open analytics</Link></p>

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
                className="flex items-center justify-between rounded-card border border-rule bg-surface p-2.5 text-xs font-sans"
              >
                <div className="flex items-center gap-2 truncate">
                  <button
                    type="button"
                    onClick={() => toggleWidget(w.id)}
                    aria-label={`${w.enabled ? "Hide" : "Show"} ${w.title} widget`}
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
                    aria-label={`Move ${w.title} up`}
                    disabled={idx === 0}
                    className="p-1 text-content-soft hover:text-content disabled:opacity-20"
                  >
                    <MoveUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget(idx, "down")}
                    aria-label={`Move ${w.title} down`}
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
      <div className="space-y-6">
        {enabledWidgets.map((w) => {
          if (w.id === "overview_metrics" || w.id === "reference_activity") {
            return (
              <section key={w.id} className="rounded-card border border-rule p-4">
                <button type="button" aria-expanded={Boolean(expanded[w.id])} aria-controls={`widget-${w.id}`}
                  onClick={() => setExpanded((previous) => ({ ...previous, [w.id]: !previous[w.id] }))}
                  className="flex min-h-10 w-full items-center justify-between gap-3 text-left text-sm font-medium text-content hover:text-accent">
                  {expanded[w.id] ? "Hide" : "Show"} {w.title}
                  <Plus aria-hidden className={cn("h-4 w-4 shrink-0 transition-transform", expanded[w.id] && "rotate-45")} />
                </button>
                {expanded[w.id] && <div id={`widget-${w.id}`} className="mt-4">
                  {w.id === "overview_metrics" ? <AnalyticsDashboard initialData={initialAnalyticsData} /> : <ReferenceAnalyticsPanel />}
                </div>}
              </section>
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
                        {recentError ? "Recent pieces could not be loaded. Open All pieces to retry." : "No pieces created yet."}
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
              <div key={w.id} className="rounded-card border border-rule bg-surface-raised p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <HeartPulse className="h-5 w-5 text-accent" />
                  <div>
                    <h4 className="font-ui text-sm font-semibold text-content">
                      Content health
                    </h4>
                    <p className="font-sans text-xs text-content-soft">
                      Review missing descriptions, cover images, and citations.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/content-health"
                  className="rounded-card border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:border-accent transition shrink-0"
                >
                  View Health Scores
                </Link>
              </div>
            );
          }

          if (w.id === "seo_summary") {
            return (
              <div key={w.id} className="rounded-card border border-rule bg-surface-raised p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <SearchCheck className="h-5 w-5 text-accent" />
                  <div>
                    <h4 className="font-ui text-sm font-semibold text-content">
                      Search visibility
                    </h4>
                    <p className="font-sans text-xs text-content-soft">
                      Check broken links and how search engines read your site.
                    </p>
                  </div>
                </div>
                <Link
                  href="/admin/seo"
                  className="rounded-card border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:border-accent transition shrink-0"
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
