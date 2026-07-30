import { getArticles, getSeries, getCategories } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { PieceCard, PieceRow } from "@/components/pieces/piece-card";
import Link from "next/link";
import { Layers } from "lucide-react";

export const revalidate = 60;

export default async function HomePage() {
  const [allArticles, seriesList, categories] = await Promise.all([
    getArticles(),
    getSeries(),
    getCategories(),
  ]);

  const leadArticle = allArticles.find((a) => a.is_featured) || allArticles[0];
  const mainArticles = allArticles.filter((a) => a.id !== leadArticle?.id);
  const popularArticles = [...allArticles].sort((a, b) => b.view_count - a.view_count).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 space-y-12">
      {/* Literary Page Header */}
      <PageHeader
        labelEn="Digital Archive"
        titleBn="কথা ও কাহিনী — সাহিত্য ও তথ্যচিত্র"
        descBn="ইনস্টাগ্রাম রিলসের বিস্তৃত গবেষণা, কালরেখা ও পূর্ণাঙ্গ নথি। রিলের পিছনের মূল রচনাটি এখানে সংগ্রহ করে রাখা।"
        count={`${allArticles.length} টি নিবন্ধ`}
      />

      {/* Featured Lead Story */}
      {leadArticle && (
        <section className="border-b border-rule pb-12">
          <PieceCard article={leadArticle} lead={true} />
        </section>
      )}

      {/* Documentary Series Highlight */}
      {seriesList.length > 0 && (
        <section id="series" className="py-6 border-b border-rule">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bengali text-2xl font-semibold text-content flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent" />
              প্রামাণ্য ডকুমেন্টারি সিরিজ
            </h2>
            <span className="label font-mono">SERIES ARCHIVE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {seriesList.map((series) => (
              <Link
                key={series.id}
                href={`/series/${series.slug}`}
                className="group block border border-rule p-5 bg-surface-raised transition hover:border-accent"
              >
                <div className="aspect-video overflow-hidden rounded-xs mb-4 border border-rule">
                  <img
                    src={series.thumbnail_url}
                    alt={series.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500"
                  />
                </div>
                <span className="label !text-accent font-mono block mb-1">
                  {series.total_parts} PARTS SERIES
                </span>
                <h3 className="font-bengali text-lg font-medium text-content group-hover:text-accent transition-colors">
                  {series.title}
                </h3>
                <p className="mt-2 font-bengali text-bengali-sm text-content-soft line-clamp-2">
                  {series.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Main Grid: Articles vs Popular & Archive Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <h2 className="font-bengali text-xl font-semibold border-b border-rule pb-3">
            সাম্প্রতিক ইতিহাস ও সাহিত্য নিবন্ধ
          </h2>
          <div className="space-y-8">
            {mainArticles.map((art) => (
              <PieceCard key={art.id} article={art} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-8">
          <div className="border border-rule p-6 bg-surface-raised">
            <h3 className="label mb-4 !text-accent">সর্বাধিক পঠিত নিবন্ধ</h3>
            <div className="divide-y divide-rule/60">
              {popularArticles.map((art, idx) => (
                <PieceRow key={art.id} article={art} index={idx} />
              ))}
            </div>
          </div>

          <div className="border border-rule p-6 bg-surface-raised space-y-3">
            <h3 className="label">বিভাগসমূহে ব্রাউজ করুন</h3>
            <div className="flex flex-wrap gap-2 pt-1 font-bengali text-xs">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="px-3 py-1.5 rounded-xs border border-rule hover:border-accent text-content-soft hover:text-content transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
