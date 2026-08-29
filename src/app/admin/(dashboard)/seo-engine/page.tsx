"use client";

import React, { useState, useEffect } from "react";
import { useSEOWebsite } from "@/contexts/seo-website-context";
import { SEOGrowthCharts } from "@/components/admin/seo-engine/growth-charts";
import Link from "next/link";
import {
  Globe,
  TrendingUp,
  Link2,
  Network,
  PlusCircle,
  AlertTriangle,
  Send,
  Target,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Database,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  website: {
    id: string;
    name: string;
    domain: string;
    gscConnected: boolean;
    gaConnected: boolean;
  };
  dataSources: {
    traffic: string;
    backlinks: string;
    keywords: string;
    isLiveTrafficVerified: boolean;
  };
  stats: {
    totalActiveBacklinks: number;
    totalReferringDomains: number;
    totalMonitoredAllTime: number;
    newBacklinks30d: number;
    lostBacklinks30d: number;
    totalKeywords: number;
    avgKeywordPosition: number | null;
    estimatedTraffic: number | null;
    activeCampaignsCount: number;
    qualifiedOpportunitiesCount: number;
    openIssuesCount: number;
    publishedPiecesCount?: number;
    totalLiveViews?: number;
  };
  charts: {
    hasData: boolean;
    trafficGrowth: Array<{ month: string; traffic: number }>;
    backlinkGrowth: Array<{ month: string; backlinks: number; referringDomains: number }>;
  };
  tables: {
    recentBacklinks: any[];
    lostBacklinksList: any[];
    activeCampaigns: any[];
    recentIssues: any[];
    pendingTasks: any[];
  };
}

export default function SEODashboardOverviewPage() {
  const { activeWebsite, activeWebsiteId, websites } = useSEOWebsite();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    async function loadMetrics() {
      if (!activeWebsiteId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/seo-engine/dashboard?websiteId=${activeWebsiteId}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load SEO dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, [activeWebsiteId]);

  const stats = data?.stats;

  const statCards = [
    {
      title: "Total Websites",
      value: websites.length,
      subtext: activeWebsite ? `${activeWebsite.name} (Active Scope)` : `${websites.length} Active Projects`,
      sourceTag: "System Registry",
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/admin/seo-engine/websites",
    },
    {
      title: "Organic Traffic",
      value: stats?.estimatedTraffic !== null && stats?.estimatedTraffic !== undefined
        ? stats.estimatedTraffic.toLocaleString()
        : stats?.totalLiveViews !== null && stats?.totalLiveViews !== undefined
        ? stats.totalLiveViews.toLocaleString()
        : "0",
      subtext: stats?.publishedPiecesCount
        ? `Verified across ${stats.publishedPiecesCount} Published Pieces`
        : stats?.totalKeywords
        ? `Estimated from ${stats.totalKeywords} Tracked Keywords`
        : "Requires Google Search Console",
      sourceTag: data?.dataSources.isLiveTrafficVerified ? "Verified Telemetry" : "SERP Estimated",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/admin/seo-engine/keywords",
    },
    {
      title: "Active Backlinks",
      value: stats ? stats.totalActiveBacklinks : 0,
      subtext: stats ? `${stats.lostBacklinks30d} Lost • ${stats.totalMonitoredAllTime} Total Tracked` : "0 Tracked",
      sourceTag: "Database Verified",
      icon: Link2,
      color: "text-accent",
      bg: "bg-accent/10",
      href: "/admin/seo-engine/backlinks",
    },
    {
      title: "Referring Domains",
      value: stats ? stats.totalReferringDomains : 0,
      subtext: stats ? `${stats.totalReferringDomains} Unique Root Domains` : "0 Domains",
      sourceTag: "Database Verified",
      icon: Network,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      href: "/admin/seo-engine/backlinks",
    },
    {
      title: "New Backlinks (30d)",
      value: stats ? `+${stats.newBacklinks30d}` : "+0",
      subtext: "Detected in Past 30 Days",
      sourceTag: "Database Verified",
      icon: PlusCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/admin/seo-engine/backlinks?filter=new",
    },
    {
      title: "Lost Backlinks",
      value: stats ? stats.lostBacklinks30d : 0,
      subtext: stats && stats.lostBacklinks30d > 0 ? "Review for Recovery" : "Zero Lost Links",
      sourceTag: "Database Monitored",
      icon: AlertTriangle,
      color: stats && stats.lostBacklinks30d > 0 ? "text-amber-500" : "text-content-soft",
      bg: "bg-amber-500/10",
      href: "/admin/seo-engine/backlinks?filter=lost",
    },
    {
      title: "Active Campaigns",
      value: stats ? stats.activeCampaignsCount : 0,
      subtext: stats ? `${stats.qualifiedOpportunitiesCount} Qualified Prospects` : "0 Active Campaigns",
      sourceTag: "Outreach CRM",
      icon: Send,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/admin/seo-engine/campaigns",
    },
    {
      title: "Avg Keyword Position",
      value: stats?.avgKeywordPosition ? `#${stats.avgKeywordPosition}` : "No Rank Data",
      subtext: stats && stats.totalKeywords > 0 ? `Across ${stats.totalKeywords} Tracked Keywords` : "Add keywords to track",
      sourceTag: "Database Rank Tracker",
      icon: Target,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      href: "/admin/seo-engine/keywords",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-xl font-bold tracking-tight text-content">
              {activeWebsite?.name || "SEO Growth Engine"} Dashboard
            </h1>
            <span className="rounded bg-surface-raised px-2 py-0.5 font-mono text-[10px] text-content-faint border border-rule">
              {activeWebsite?.domain || "No Project Selected"}
            </span>
          </div>
          <p className="font-sans text-xs text-content-soft mt-0.5">
            Verified database telemetry, backlink status tracking, and SERP keyword visibility
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-rule bg-surface p-1 text-xs">
            {["7d", "30d", "90d", "All"].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDateRange(range)}
                className={cn(
                  "rounded px-2.5 py-1 font-mono transition text-xs",
                  dateRange === range
                    ? "bg-surface-raised font-bold text-content shadow-2xs"
                    : "text-content-soft hover:text-content"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <Link
            href="/admin/seo-engine/websites"
            className="flex items-center gap-1.5 rounded-lg border border-rule bg-surface px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-raised transition shadow-2xs"
          >
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Manage Websites</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="group relative rounded-xl border border-rule bg-surface p-4 shadow-xs transition hover:border-accent/40 hover:shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-content-faint">
                    {card.title}
                  </span>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition group-hover:scale-110", card.bg)}>
                    <Icon className={cn("h-4 w-4", card.color)} />
                  </div>
                </div>

                <div className="mt-1 font-sans text-2xl font-bold tracking-tight text-content">
                  {loading ? (
                    <span className="inline-block h-7 w-16 animate-pulse rounded bg-rule/60" />
                  ) : (
                    card.value
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-rule/60 space-y-1">
                <div className="text-content-soft font-mono text-[11px] truncate">
                  {card.subtext}
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="inline-flex items-center gap-1 rounded bg-surface-raised/80 px-1.5 py-0.5 font-mono text-[9px] font-medium text-content-faint border border-rule/50">
                    <Database className="h-2.5 w-2.5 text-accent" />
                    {card.sourceTag}
                  </span>
                  <ChevronRight className="h-3 w-3 text-content-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Growth Trajectory Charts */}
      <SEOGrowthCharts
        trafficData={data?.charts.trafficGrowth || []}
        backlinkData={data?.charts.backlinkGrowth || []}
        isEstimated={!data?.dataSources.isLiveTrafficVerified}
      />

      {/* Two Column Section: Recent Acquired Backlinks & Active Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Backlinks Table */}
        <div className="rounded-xl border border-rule bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-500" />
              <h3 className="font-sans text-sm font-semibold text-content">
                Monitored Active Backlinks
              </h3>
            </div>
            <Link
              href="/admin/seo-engine/backlinks"
              className="font-mono text-xs text-accent hover:underline flex items-center gap-1"
            >
              <span>View all ({data?.stats.totalActiveBacklinks ?? 0})</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-rule/60">
            {!data?.tables.recentBacklinks || data.tables.recentBacklinks.length === 0 ? (
              <div className="py-8 text-center">
                <Link2 className="mx-auto h-6 w-6 text-content-faint" />
                <p className="mt-1 font-sans text-xs text-content-soft">
                  No monitored backlinks found for {activeWebsite?.name || "this website"}.
                </p>
                <Link
                  href="/admin/seo-engine/opportunities"
                  className="mt-2 inline-flex items-center gap-1 font-mono text-xs font-semibold text-accent hover:underline"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Discover Opportunities &rarr;</span>
                </Link>
              </div>
            ) : (
              data.tables.recentBacklinks.map((link: any) => (
                <div key={link.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-content truncate font-mono">
                        {link.referringDomain}
                      </span>
                      <span className="rounded bg-surface-raised px-1.5 py-0.2 font-mono text-[10px] text-content-faint">
                        DA {link.domainAuthority}
                      </span>
                      <span className={cn(
                        "rounded px-1.5 py-0.2 font-mono text-[9px] font-semibold",
                        link.isFollow ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rule/60 text-content-faint"
                      )}>
                        {link.isFollow ? "Dofollow" : "Nofollow"}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-content-soft truncate">
                      Anchor: &ldquo;<span className="text-content">{link.anchorText}</span>&rdquo;
                    </p>
                  </div>
                  <a
                    href={link.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-content-faint hover:text-accent p-1 transition"
                    title="Open source page"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Outreach Campaigns & Opportunities Pipeline */}
        <div className="rounded-xl border border-rule bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-purple-500" />
              <h3 className="font-sans text-sm font-semibold text-content">
                Active Outreach Campaigns
              </h3>
            </div>
            <Link
              href="/admin/seo-engine/campaigns"
              className="font-mono text-xs text-accent hover:underline flex items-center gap-1"
            >
              <span>Manage CRM</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {!data?.tables.activeCampaigns || data.tables.activeCampaigns.length === 0 ? (
              <div className="py-8 text-center">
                <Send className="mx-auto h-6 w-6 text-content-faint" />
                <p className="mt-1 font-sans text-xs text-content-soft">
                  No active outreach campaigns running for {activeWebsite?.name || "this project"}.
                </p>
                <Link
                  href="/admin/seo-engine/campaigns"
                  className="mt-2 inline-flex items-center gap-1 font-mono text-xs font-semibold text-accent hover:underline"
                >
                  <PlusCircle className="h-3 w-3" />
                  <span>Create First Campaign &rarr;</span>
                </Link>
              </div>
            ) : (
              data.tables.activeCampaigns.map((c: any) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-rule bg-surface-raised/30 p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-content truncate">{c.name}</span>
                      <span className="rounded bg-purple-500/10 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-purple-600 dark:text-purple-400">
                        {c.campaignType}
                      </span>
                    </div>
                    <span className="mt-1 block font-mono text-[10px] text-content-faint">
                      {c._count?.prospects || 0} prospects enrolled &bull; Human approval required
                    </span>
                  </div>

                  <Link
                    href={`/admin/seo-engine/campaigns?id=${c.id}`}
                    className="rounded-md border border-rule bg-surface px-2.5 py-1 text-[11px] font-medium text-content hover:bg-surface-raised transition shadow-2xs"
                  >
                    View
                  </Link>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-rule flex items-center justify-between text-xs">
            <span className="font-mono text-content-soft text-[11px]">
              Qualified Opportunities: <strong>{data?.stats.qualifiedOpportunitiesCount ?? 0}</strong>
            </span>
            <Link
              href="/admin/seo-engine/opportunities"
              className="font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Score opportunities &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
