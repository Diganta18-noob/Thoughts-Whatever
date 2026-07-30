import { getSeries, getArticles } from "@/lib/supabase/server";
import { SeriesManager } from "@/components/features/admin/series-manager";

export default async function AdminSeriesPage() {
  const [seriesList, articles] = await Promise.all([getSeries(), getArticles()]);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold font-heading">ডকুমেন্টারি সিরিজ পরিচালনা</h1>
        <p className="text-xs text-muted-foreground font-heading mt-0.5">
          ধারাবাহিক পর্ব তৈরি, পুনর্সাজানো ও নতুন নিবন্ধ সংযুক্ত করুন
        </p>
      </div>

      <SeriesManager seriesList={seriesList} articles={articles} />
    </div>
  );
}
