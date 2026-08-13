import Link from "next/link";
import { ExternalLink, BarChart3, Users, Eye, Bookmark, Share2 } from "lucide-react";
import { getOverviewStats, getTopArticles, getSeriesAnalytics } from "@/lib/analytics";
import { StatsCard } from "@/components/admin/stats-card";

export const dynamic = "force-dynamic";
export const metadata = { title: "PostHog & Product Analytics — Admin" };

export default async function AdminPostHogAnalyticsPage() {
  const [overview, topArticles, seriesStats] = await Promise.all([
    getOverviewStats("30d"),
    getTopArticles(5, "30d"),
    getSeriesAnalytics(),
  ]);

  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule/60 pb-5">
        <div>
          <h1 className="font-serif text-2xl text-content">Product Analytics & Observability</h1>
          <p className="font-sans text-xs text-content-soft mt-1">
            Coexisting Prisma Database Analytics & PostHog Behavioral Intelligence
          </p>
        </div>

        <a
          href={posthogHost}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-surface shadow transition hover:opacity-90"
        >
          <span>Open PostHog Dashboard</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Summary KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          labelEn="30d Page Views"
          labelBn="৩০ দিনের পৃষ্ঠা দেখা"
          value={overview.totalViews}
          icon={<Eye className="h-4 w-4" />}
        />
        <StatsCard
          labelEn="30d Unique Visitors"
          labelBn="৩০ দিনের মোট পাঠক"
          value={overview.uniqueVisitors}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          labelEn="Total Published Pieces"
          labelBn="মোট প্রকাশিত লেখা"
          value={overview.totalArticles}
          icon={<BarChart3 className="h-4 w-4" />}
        />
        <StatsCard
          labelEn="Active Subscribers"
          labelBn="মোট সাবস্ক্রাইবার"
          value={overview.totalSubscribers}
          icon={<Share2 className="h-4 w-4" />}
        />
      </div>


      {/* PostHog Feature Status */}
      <div className="rounded-lg border border-rule/60 bg-surface-raised/40 p-6 space-y-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-accent">PostHog Event Infrastructure</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs font-sans">
          <div className="rounded-md border border-rule/40 bg-surface p-3 space-y-1">
            <span className="font-medium text-content block">Session Replay</span>
            <span className="text-content-soft block">Inputs & Passwords Masked</span>
            <span className="inline-block rounded bg-accent/10 px-2 py-0.5 text-[0.6875rem] text-accent">Active</span>
          </div>

          <div className="rounded-md border border-rule/40 bg-surface p-3 space-y-1">
            <span className="font-medium text-content block">Content & Series Analytics</span>
            <span className="text-content-soft block">Documentary, Episode & Reading Milestones</span>
            <span className="inline-block rounded bg-accent/10 px-2 py-0.5 text-[0.6875rem] text-accent">Active</span>
          </div>

          <div className="rounded-md border border-rule/40 bg-surface p-3 space-y-1">
            <span className="font-medium text-content block">Search & Engagement</span>
            <span className="text-content-soft block">Search Queries, Bookmarks & Reel Clicks</span>
            <span className="inline-block rounded bg-accent/10 px-2 py-0.5 text-[0.6875rem] text-accent">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
