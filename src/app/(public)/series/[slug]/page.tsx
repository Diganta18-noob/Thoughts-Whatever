import { notFound } from "next/navigation";
import Link from "next/link";
import { getSeriesBySlug, getArticles } from "@/lib/supabase/server";
import { EpisodeList } from "@/components/features/series/episode-list";
import { SeriesProgress } from "@/components/features/series/series-progress";
import { Layers, ChevronRight } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) return { title: "সিরিজ পাওয়া যায়নি — কথা ও কাহিনী" };

  return {
    title: `${series.title} — ডকুমেন্টারি সিরিজ | কথা ও কাহিনী`,
    description: series.description,
  };
}

export default async function SeriesLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);

  if (!series) {
    notFound();
  }

  const allArticles = await getArticles();
  const seriesEpisodes = allArticles
    .filter((a) => a.series_id === series.id)
    .sort((a, b) => (a.part_number || 0) - (b.part_number || 0));

  const episodeSlugs = seriesEpisodes.map((e) => e.slug);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-heading text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          প্রচ্ছদ
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground">ডকুমেন্টারি সিরিজ</span>
      </nav>

      {/* Series Hero Banner */}
      <header className="relative rounded-3xl overflow-hidden shadow-2xl border border-border">
        <div className="relative min-h-[320px] flex items-end p-6 sm:p-10 text-white">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${series.thumbnail_url})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/30" />

          <div className="relative z-10 space-y-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold font-heading bg-red-600 text-white flex items-center gap-1.5 w-fit">
              <Layers className="w-3.5 h-3.5" /> প্রামাণ্য ডকুমেন্টারি সিরিজ
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold font-heading leading-tight">
              {series.title}
            </h1>
            <p className="text-sm text-stone-300 max-w-2xl leading-relaxed font-body">
              {series.description}
            </p>
          </div>
        </div>
      </header>

      {/* Series Reading Progress */}
      <SeriesProgress totalParts={series.total_parts} episodesSlugs={episodeSlugs} />

      {/* Episodes List */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold font-heading">সিরিজের সমস্ত পর্বসমূহ</h2>
        <EpisodeList episodes={seriesEpisodes} />
      </section>
    </div>
  );
}
