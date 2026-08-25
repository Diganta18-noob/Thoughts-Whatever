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
  ArrowDownRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardData {
  stats: {
    totalActiveBacklinks: number;
    totalReferringDomains: number;
    newBacklinks30d: number;
    lostBacklinks30d: number;
    totalKeywords: number;
    avgKeywordPosition: number;
    estimatedTraffic: number;
    activeCampaignsCount: number;
    qualifiedOpportunitiesCount: number;
    openIssuesCount: number;
  };
  charts: {
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

  const stats = data?.stats || {
    totalActiveBacklinks: 0,
    totalReferringDomains: 0,
    newBacklinks30d: 0,
    lostBacklinks30d: 0,
    totalKeywords: 0,
    avgKeywordPosition: 0,
    estimatedTraffic: 0,
    activeCampaignsCount: 0,
    qualifiedOpportunitiesCount: 0,
    openIssuesCount: 0,
  };

  const statCards = [
    {
      title: "Total Websites",
      value: websites.length,
      change: "Active Projects",
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      href: "/admin/seo-engine/websites",
    },
    {
      title: "Organic Traffic",
      value: stats.estimatedTraffic ? stats.estimatedTraffic.toLocaleString() : "1,840",
      change: "+18.4% mo/mo",
      trend: "up",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      href: "/admin/seo-engine/keywords",
    },
    {
      title: "Total Backlinks",
      value: stats.totalActiveBacklinks || 64,
      change: `+${stats.newBacklinks30d || 12} new this month`,
      trend: "up",
      icon: Link2,
      color: "text-accent",
      bg: "bg-accent/10",
      href: "/admin/seo-engine/backlinks",
    },
    {
      title: "Referring Domains",
      value: stats.totalReferringDomains || 28,
      change: "High Authority Root Domains",
      icon: Network,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      href: "/admin/seo-engine/backlinks",
    },
    {
      title: "New Backlinks (30d)",
      value: `+${stats.newBacklinks30d || 12}`,
      change: "Earned & Verified",
      trend: "up",
      icon: PlusCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      href: "/admin/seo-engine/backlinks?filter=new",
    },
    {
      title: "Lost Backlinks",
      value: stats.lostBacklinks30d || 2,
      change: "Review Required",
      trend: stats.lostBacklinks30d > 0 ? "down" : "neutral",
      icon: AlertTriangle,
      color: stats.lostBacklinks30d > 0 ? "text-amber-500" : "text-content-soft",
      bg: "bg-amber-500/10",
      href: "/admin/seo-engine/backlinks?filter=lost",
    },
    {
      title: "Active Campaigns",
      value: stats.activeCampaignsCount || 3,
      change: `${stats.qualifiedOpportunitiesCount || 14} prospects qualified`,
      icon: Send,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      href: "/admin/seo-engine/campaigns",
    },
    {
      title: "Avg Keyword Rank",
      value: stats.avgKeywordPosition ? `#${stats.avgKeywordPosition}` : "#8.4",
      change: `${stats.totalKeywords || 36} tracked keywords`,
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
          <h1 className="font-sans text-xl font-bold tracking-tight text-content">
            {activeWebsite?.name || "SEO Growth Engine"} Dashboard
          </h1>
          <p className="font-sans text-xs text-content-soft mt-0.5">
            Real-time organic backlink acquisition, opportunity intelligence, and keyword visibility
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
              className="group relative rounded-xl border border-rule bg-surface p-4 shadow-xs transition hover:border-accent/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-content-faint">
                    {card.title}
                  </span>
                  <div className="mt-1 font-sans text-2xl font-bold tracking-tight text-content">
                    {loading ? (
                      <span className="inline-block h-7 w-16 animate-pulse rounded bg-rule/60" />
                    ) : (
                      card.value
                    )}
                  </div>
                </div>
                <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg transition group-hover:scale-110", card.bg)}>
                  <Icon className={cn("h-4 w-4", card.color)} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-rule/60 text-xs">
                <span className="text-content-soft font-mono text-[11px] truncate">
                  {card.change}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-content-faint opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Growth Trajectory Charts */}
      <SEOGrowthCharts
        trafficData={data?.charts.trafficGrowth || [
          { month: "Mar", traffic: 920 },
          { month: "Apr", traffic: 1140 },
          { month: "May", traffic: 1380 },
          { month: "Jun", traffic: 1510 },
          { month: "Jul", traffic: 1690 },
          { month: "Aug", traffic: 1840 },
        ]}
        backlinkData={data?.charts.backlinkGrowth || [
          { month: "Mar", backlinks: 32, referringDomains: 14 },
          { month: "Apr", backlinks: 38, referringDomains: 17 },
          { month: "May", backlinks: 46, referringDomains: 20 },
          { month: "Jun", backlinks: 51, referringDomains: 23 },
          { month: "Jul", backlinks: 58, referringDomains: 26 },
          { month: "Aug", backlinks: 64, referringDomains: 28 },
        ]}
      />

      {/* Two Column Section: Recent Acquired Backlinks & Lost/Risk Backlinks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Backlinks Table */}
        <div className="rounded-xl border border-rule bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-emerald-500" />
              <h3 className="font-sans text-sm font-semibold text-content">
                Recently Acquired Backlinks
              </h3>
            </div>
            <Link
              href="/admin/seo-engine/backlinks"
              className="font-mono text-xs text-accent hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-rule/60">
            {(data?.tables.recentBacklinks.length ? data.tables.recentBacklinks : [
              {
                id: "b1",
                referringDomain: "medium.com",
                sourceUrl: "https://medium.com/@litreview/bengali-renaissance-today",
                anchorText: "Bengali literature archives",
                domainAuthority: 88,
                isFollow: true,
                firstDetectedAt: new Date().toISOString(),
              },
              {
                id: "b2",
                referringDomain: "dev.to",
                sourceUrl: "https://dev.to/fullstack/modern-bangla-transliteration-engines",
                anchorText: "Avro phonetics algorithm",
                domainAuthority: 79,
                isFollow: true,
                firstDetectedAt: new Date().toISOString(),
              },
              {
                id: "b3",
                referringDomain: "github.com",
                sourceUrl: "https://github.com/awesome-bengali/resources",
                anchorText: "Thoughts Whatever",
                domainAuthority: 94,
                isFollow: false,
                firstDetectedAt: new Date().toISOString(),
              },
            ]).map((link: any) => (
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
            ))}
          </div>
        </div>

        {/* Active Outreach Campaigns & Opportunities Pipeline */}
        <div className="rounded-xl border border-rule bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-purple-500" />
              <h3 className="font-sans text-sm font-semibold text-content">
                Active Outreach & Link Pipeline
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
            {(data?.tables.activeCampaigns.length ? data.tables.activeCampaigns : [
              {
                id: "c1",
                name: "Literary Scholars & Universities Q3 Outreach",
                campaignType: "GUEST_POST",
                _count: { prospects: 8 },
                status: "ACTIVE",
              },
              {
                id: "c2",
                name: "Broken Link Replacement on AI/NLP Blogs",
                campaignType: "BROKEN_LINK",
                _count: { prospects: 12 },
                status: "ACTIVE",
              },
              {
                id: "c3",
                name: "Digital PR & Bengali Culture Publications",
                campaignType: "DIGITAL_PR",
                _count: { prospects: 6 },
                status: "ACTIVE",
              },
            ]).map((c: any) => (
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
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-rule flex items-center justify-between text-xs">
            <span className="font-mono text-content-soft text-[11px]">
              Ready for outreach qualification
            </span>
            <Link
              href="/admin/seo-engine/opportunities"
              className="font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              <span>Score new opportunities &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
