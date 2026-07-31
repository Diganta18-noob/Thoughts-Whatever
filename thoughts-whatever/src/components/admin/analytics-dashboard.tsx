"use client";

import { useEffect, useState } from "react";
import { StatsCard } from "./stats-card";
import { TrendChart } from "./trend-chart";
import { TopArticlesTable, type TopArticleItem } from "./top-articles-table";
import { toBengaliNumber } from "@/lib/bengali";
import { Eye, Users, Bookmark, ExternalLink } from "lucide-react";
import { useTranslation, useLanguage } from "@/components/providers/language-provider";

export function AnalyticsDashboard() {
  const t = useTranslation();
  const { isBn } = useLanguage();

  const [period, setPeriod] = useState<"7d" | "30d" | "all">("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    overview?: {
      totalViews: number;
      uniqueVisitors: number;
      totalArticles: number;
      totalSubscribers: number;
      totalReelClicks: number;
    };
    dailyTrend?: Array<{ date: string; views: number; visitors: number }>;
    topArticles?: TopArticleItem[];
    seriesAnalytics?: Array<{
      id: string;
      slug: string;
      titleBn: string;
      totalEpisodes: number;
      totalViews: number;
      avgViews: number;
      completionRate: number;
    }>;
  }>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const overview = data.overview;

  const formatNumber = (num: number) => (isBn ? toBengaliNumber(num) : num.toLocaleString());

  return (
    <div className="space-y-8">
      {/* Date Filter Bar */}
      <div className="flex items-center justify-between border-b border-rule pb-4">
        <div>
          <span className="label">
            Analytics & Insights
          </span>
          <h2 className="mt-1 font-sans text-xl font-medium text-content">
            {t("admin.dashboard.title")}
          </h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-sm border border-rule p-1 bg-surface">
          {(["7d", "30d", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-sm px-3 py-1 font-sans text-xs transition ${
                period === p
                  ? "bg-accent text-surface"
                  : "text-content-soft hover:text-content"
              }`}
            >
              {p === "7d"
                ? t("admin.dashboard.period.7d")
                : p === "30d"
                ? t("admin.dashboard.period.30d")
                : t("common.all")}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          labelEn="Total Views"
          labelBn={t("admin.dashboard.totalViews")}
          value={overview?.totalViews ?? 0}
          icon={<Eye className="h-4 w-4" />}
        />
        <StatsCard
          labelEn="Unique Visitors"
          labelBn={t("admin.dashboard.totalPublished")}
          value={overview?.uniqueVisitors ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          labelEn="Instagram Clicks"
          labelBn="Instagram Clicks"
          value={overview?.totalReelClicks ?? 0}
          icon={<ExternalLink className="h-4 w-4" />}
        />
        <StatsCard
          labelEn="Newsletter Subscribers"
          labelBn={t("admin.dashboard.subscribers")}
          value={overview?.totalSubscribers ?? 0}
          icon={<Bookmark className="h-4 w-4" />}
        />
      </div>

      {/* Traffic Chart */}
      <TrendChart data={data.dailyTrend || []} />

      {/* Grid: Top Articles & Series Performance */}
      <div className="grid gap-8 lg:grid-cols-2">
        <TopArticlesTable articles={data.topArticles || []} />

        {/* Series Performance Panel */}
        <div className="border border-rule bg-surface p-5">
          <div className="flex items-center justify-between pb-4 border-b border-rule">
            <div>
              <span className="label">
                Series Completion Rates
              </span>
              <h3 className="font-sans text-lg font-medium text-content">
                {t("admin.series.title")}
              </h3>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {data.seriesAnalytics?.map((s) => (
              <div key={s.id} className="border-b border-rule/60 pb-3 last:border-0">
                <div className="flex items-baseline justify-between">
                  <h4 className="font-bengali text-bengali-base font-medium text-content" lang="bn">
                    {s.titleBn}
                  </h4>
                  <span className="font-mono text-xs font-semibold text-accent">
                    {formatNumber(s.completionRate)}%
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-content-faint">
                  <span>Episodes: {formatNumber(s.totalEpisodes)}</span>
                  <span>Views: {formatNumber(s.totalViews)}</span>
                  <span>Avg: {formatNumber(s.avgViews)}</span>
                </div>
                <div className="mt-2.5 h-1.5 w-full rounded-full bg-rule/50 overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${Math.min(s.completionRate, 100)}%` }}
                  />
                </div>
              </div>
            ))}

            {(!data.seriesAnalytics || data.seriesAnalytics.length === 0) && (
              <p className="py-8 text-center font-sans text-xs text-content-faint">
                {t("common.empty")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
