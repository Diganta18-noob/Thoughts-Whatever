import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategories, getArticles } from "@/lib/supabase/server";
import { ArticleGrid } from "@/components/features/homepage/article-grid";
import { ChevronRight } from "lucide-react";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === slug);

  if (!cat) return { title: "বিভাগ পাওয়া যায়নি — কথা ও কাহিনী" };

  return {
    title: `${cat.name} — কথা ও কাহিনী`,
    description: cat.description,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === slug);

  if (!cat) notFound();

  const articles = await getArticles({ categorySlug: slug });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <nav className="flex items-center gap-2 text-xs font-heading text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          প্রচ্ছদ
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground">{cat.name}</span>
      </nav>

      <div className="p-8 rounded-3xl bg-card border border-border space-y-2">
        <span className="px-3 py-1 rounded-full text-xs font-bold font-heading bg-primary/10 text-primary">
          বিভাগ আর্কাইভ
        </span>
        <h1 className="text-3xl font-bold font-heading">{cat.name}</h1>
        <p className="text-sm text-muted-foreground font-body">{cat.description}</p>
      </div>

      <ArticleGrid articles={articles} />
    </div>
  );
}
