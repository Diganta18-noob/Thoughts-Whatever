"use client";

import { useState, useEffect } from "react";
import { Article } from "@/types/database";
import { ArticleGrid } from "@/components/features/homepage/article-grid";
import { Search, Loader2 } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setArticles([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/articles?search=${encodeURIComponent(query)}`);
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold font-heading">বাংলা ডকুমেন্টারি অনুসন্ধান</h1>
        <p className="text-sm text-muted-foreground font-body">
          শিরোনাম, বিষয়বস্তু, ঐতিহাসিক স্থান বা মনীষীদের নাম দিয়ে খুঁজুন
        </p>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-3.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="যেমন: ঈশা খাঁ, মহাস্থানগড়, লালন, রবীন্দ্রনাথ..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-card border border-border text-sm font-heading focus:outline-hidden focus:ring-2 focus:ring-primary shadow-sm"
          autoFocus
        />
        {loading && <Loader2 className="w-5 h-5 text-primary animate-spin absolute right-4 top-3.5" />}
      </div>

      {query && (
        <div className="space-y-4">
          <p className="text-xs font-semibold font-heading text-muted-foreground">
            &quot;{query}&quot; এর জন্য অনুসন্ধান ফলাফল ({articles.length} টি প্রাপ্ত):
          </p>
          <ArticleGrid articles={articles} />
        </div>
      )}
    </div>
  );
}
