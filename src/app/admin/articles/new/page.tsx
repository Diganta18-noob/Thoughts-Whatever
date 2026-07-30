import { getCategories, getSeries } from "@/lib/supabase/server";
import { ArticleForm } from "@/components/features/admin/article-form";

export default async function NewArticlePage() {
  const [categories, seriesList] = await Promise.all([getCategories(), getSeries()]);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold font-heading">নতুন নিবন্ধ প্রকাশ করুন</h1>
        <p className="text-xs text-muted-foreground font-heading mt-0.5">
          ইনস্টাগ্রাম রিলসের বিস্তৃত গল্প ও প্রামাণ্য নথি প্রকাশ করুন
        </p>
      </div>

      <ArticleForm categories={categories} seriesList={seriesList} />
    </div>
  );
}
