import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, getArticles } from "@/lib/supabase/server";
import { ReadingProgress } from "@/components/shared/reading-progress";
import { ShareButtons } from "@/components/shared/share-buttons";
import { InstagramEmbed } from "@/components/features/article/instagram-embed";
import { RelatedArticles } from "@/components/features/article/related-articles";
import { Clock, Calendar, ChevronRight, Layers, Printer } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) return { title: "নিবন্ধ পাওয়া যায়নি — কথা ও কাহিনী" };

  return {
    title: `${article.title} — কথা ও কাহিনী`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: [article.thumbnail_url],
      type: "article",
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = await getArticles();
  const relatedArticles = allArticles.filter(
    (a) => a.id !== article.id && (a.category_id === article.category_id || a.series_id === article.series_id)
  );

  return (
    <article className="max-w-measure-wide mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Scroll Progress Bar */}
      <ReadingProgress />

      {/* Breadcrumb */}
      <nav data-print="hide" className="flex items-center gap-2 font-mono text-[0.6875rem] text-content-faint">
        <Link href="/" className="hover:text-content">
          HOME
        </Link>
        <ChevronRight className="w-3 h-3" />
        {article.category && (
          <>
            <Link href={`/category/${article.category.slug}`} className="hover:text-content uppercase">
              {article.category.name}
            </Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-content truncate max-w-[200px]">{article.title}</span>
      </nav>

      {/* Article Header */}
      <header className="space-y-4 border-b border-rule pb-8">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[0.6875rem]">
          {article.category && (
            <span className="label !text-accent font-bengali-sans tracking-normal">
              {article.category.name}
            </span>
          )}
          {article.series && (
            <Link
              href={`/series/${article.series.slug}`}
              className="px-2.5 py-0.5 rounded-xs bg-accent text-white font-bengali-sans hover:opacity-90 transition-opacity"
            >
              <Layers className="w-3 h-3 inline mr-1" /> {article.series.title} (পর্ব {article.part_number})
            </Link>
          )}
        </div>

        <h1 className="font-bengali text-3xl sm:text-4xl lg:text-5xl font-semibold text-content leading-tight">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="font-bengali text-bengali-lg text-content-soft leading-relaxed italic border-l-2 border-accent pl-4 py-1">
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between font-mono text-xs text-content-faint pt-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              {new Date(article.published_at).toLocaleDateString("bn-BD")}
            </span>
            <span className="flex items-center gap-1 font-bengali">
              <Clock className="w-3.5 h-3.5 text-accent" />
              {article.reading_time_minutes} মি. পাঠ
            </span>
          </div>

          <button
            onClick={() => {
              if (typeof window !== "undefined") window.print();
            }}
            data-print="hide"
            className="flex items-center gap-1 text-content-soft hover:text-content transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> প্রিন্ট / PDF
          </button>
        </div>

        {article.thumbnail_url && (
          <div className="aspect-[16/9] overflow-hidden rounded-xs border border-rule mt-6">
            <img src={article.thumbnail_url} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}
      </header>

      {/* Share Buttons */}
      <ShareButtons title={article.title} slug={article.slug} />

      {/* Prose Bengali Content */}
      <div className="prose-bengali">
        {article.content}
      </div>

      {/* Instagram Media Embed */}
      {article.instagram_link && (
        <InstagramEmbed url={article.instagram_link} articleId={article.id} />
      )}

      {/* Related Content */}
      <RelatedArticles articles={relatedArticles} />
    </article>
  );
}
