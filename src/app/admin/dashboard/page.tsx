import Link from "next/link";
import { getOverviewStats } from "@/lib/supabase/server";
import { StatsCard } from "@/components/features/admin/stats-card";
import { TrendChart } from "@/components/features/admin/trend-chart";
import { Eye, FileText, Layers, Users, Plus, Edit } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";

export default async function AdminDashboardPage() {
  const stats = await getOverviewStats();

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading">এডমিন অ্যানালিটিক্স ড্যাশবোর্ড</h1>
          <p className="text-xs text-muted-foreground font-heading mt-1">
            কথা ও কাহিনী প্ল্যাটফর্মের সামগ্রিক পারফরম্যান্স ও ট্র্যাফিক মেট্রিক্স
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/articles/new"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-heading font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> নতুন নিবন্ধ লিখুন
          </Link>
          <Link
            href="/admin/series"
            className="px-4 py-2.5 rounded-xl bg-secondary text-foreground font-heading font-semibold text-xs border border-border hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-red-600" /> সিরিজ ম্যানেজমেন্ট
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="মোট নিবন্ধ পঠিত"
          value={stats.totalViews.toLocaleString("bn-BD")}
          subtitle="সর্বশেষ ৩০ দিনে +২৪%"
          icon={Eye}
          trend="+২৪%"
        />
        <StatsCard
          title="প্রকাশিত নিবন্ধ"
          value={stats.totalArticles}
          subtitle={`${stats.totalSeries} টি প্রামাণ্য সিরিজে বিভক্ত`}
          icon={FileText}
        />
        <StatsCard
          title="ইনস্টাগ্রাম রিল ক্লিক"
          value={stats.instagramClicks.toLocaleString("bn-BD")}
          subtitle="কনভার্সন রেট ১৮.৫%"
          icon={InstagramIcon}
          trend="+১৫%"
        />
        <StatsCard
          title="নিউজলেটার সাবস্ক্রাইবার"
          value={stats.totalSubscribers}
          subtitle="সক্রিয় ইমেইল গ্রহীতা"
          icon={Users}
          trend="+৮%"
        />
      </div>

      {/* Trend Chart */}
      <TrendChart data={stats.recentViewsTrend} />

      {/* Top Performing Articles Table */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold font-heading">শীর্ষ পঠিত নিবন্ধসমূহ</h3>
          <Link href="/admin/articles" className="text-xs font-semibold font-heading text-primary hover:underline">
            সকল নিবন্ধ দেখুন →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-xs font-bold font-heading text-muted-foreground uppercase">
                <th className="py-3 px-2">শিরোনাম</th>
                <th className="py-3 px-2">বিভাগ</th>
                <th className="py-3 px-2">মোট পঠিত</th>
                <th className="py-3 px-2">পড়ার গড় সময়</th>
                <th className="py-3 px-2 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs font-heading">
              {stats.topArticles.map((article) => (
                <tr key={article.id} className="hover:bg-secondary/40">
                  <td className="py-3 px-2 font-bold max-w-xs truncate">{article.title}</td>
                  <td className="py-3 px-2">{article.category?.name || "সাধারণ"}</td>
                  <td className="py-3 px-2 font-semibold text-amber-600">{article.view_count} বার</td>
                  <td className="py-3 px-2">{article.reading_time_minutes} মিনিট</td>
                  <td className="py-3 px-2 text-right">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                    >
                      <Edit className="w-3.5 h-3.5" /> এডিট
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
