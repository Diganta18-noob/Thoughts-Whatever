"use client";

import Link from "next/link";
import { Article } from "@/types/database";
import { Clock } from "lucide-react";

export function RelatedArticles({ articles }: { articles: Article[] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="mt-14 pt-8 border-t border-border no-print">
      <h3 className="text-xl font-bold font-heading mb-6">সম্পর্কিত ডকুমেন্টারি নিবন্ধ</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((art) => (
          <Link
            key={art.id}
            href={`/article/${art.slug}`}
            className="group block rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all hover:shadow-md"
          >
            <div className="h-36 overflow-hidden">
              <img
                src={art.thumbnail_url}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4 space-y-2">
              <h4 className="text-sm font-bold font-heading group-hover:text-primary transition-colors line-clamp-2">
                {art.title}
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-heading">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{art.reading_time_minutes} মিনিট পড়া</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
