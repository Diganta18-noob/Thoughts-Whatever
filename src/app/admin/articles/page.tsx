import Link from "next/link";
import { getArticles } from "@/lib/supabase/server";
import { Plus, Edit, Eye, Clock } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";

export default async function AdminArticlesListPage() {
  const articles = await getArticles();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">প্রকাশিত নিবন্ধসমূহ ({articles.length})</h1>
          <p className="text-xs text-muted-foreground font-heading mt-0.5">
            সমস্ত নিবন্ধ ম্যানেজ, সম্পাদনা ও নতুন কন্টেন্ট তৈরি করুন
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-heading font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 w-fit"
        >
          <Plus className="w-4 h-4" /> নতুন নিবন্ধ লিখুন
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {articles.map((art) => (
          <div
            key={art.id}
            className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex gap-4 items-center">
              <img src={art.thumbnail_url} alt={art.title} className="w-16 h-16 rounded-xl object-cover" />
              <div className="space-y-1">
                <h3 className="text-base font-bold font-heading">{art.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-heading">
                  <span>{art.category?.name}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {art.reading_time_minutes} মি.
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" /> {art.view_count} পঠিত
                  </span>
                  {art.instagram_link && (
                    <span className="flex items-center gap-1 text-pink-600">
                      <InstagramIcon className="w-3 h-3" /> রিল যুক্ত
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <Link
                href={`/article/${art.slug}`}
                target="_blank"
                className="px-3 py-1.5 rounded-lg bg-secondary text-xs font-heading font-semibold hover:bg-muted"
              >
                প্রিভিউ
              </Link>
              <Link
                href={`/admin/articles/${art.id}/edit`}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-heading font-semibold flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" /> সম্পাদনা
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
