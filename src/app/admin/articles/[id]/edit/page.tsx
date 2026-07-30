import { notFound } from "next/navigation";
import { getArticles, getCategories, getSeries } from "@/lib/supabase/server";
import { ArticleForm } from "@/components/features/admin/article-form";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [allArticles, categories, seriesList] = await Promise.all([
    getArticles(),
    getCategories(),
    getSeries(),
  ]);

  const article = allArticles.find((a) => a.id === id);

  if (!article) notFound();

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold font-heading">নিবন্ধ সম্পাদনা করুন</h1>
        <p className="text-xs text-muted-foreground font-heading mt-0.5">{article.title}</p>
      </div>

      <ArticleForm initialData={article} categories={categories} seriesList={seriesList} />
    </div>
  );
}
