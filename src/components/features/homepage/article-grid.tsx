"use client";

import Link from "next/link";
import { Article } from "@/types/database";
import { Clock } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";
import { motion } from "framer-motion";

export function ArticleGrid({ articles }: { articles: Article[] }) {
  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-2xl">
        <p className="text-muted-foreground font-heading">কোন নিবন্ধ পাওয়া যায়নি।</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article, idx) => (
        <motion.div
          key={article.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
        >
          <article className="group flex flex-col h-full rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-all hover:shadow-lg">
            {/* Thumbnail */}
            <Link href={`/article/${article.slug}`} className="relative h-48 overflow-hidden block">
              <img
                src={article.thumbnail_url}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                {article.category && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-heading bg-background/90 backdrop-blur-md text-foreground shadow-xs">
                    {article.category.name}
                  </span>
                )}
              </div>
              {article.instagram_link && (
                <span className="absolute top-3 right-3 p-1.5 rounded-full bg-pink-600/90 text-white backdrop-blur-md shadow-xs">
                  <InstagramIcon className="w-3.5 h-3.5" />
                </span>
              )}
            </Link>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
              <div className="space-y-2">
                {article.series && (
                  <span className="text-[11px] font-semibold font-heading text-red-600 block">
                    {article.series.title} • পর্ব {article.part_number}
                  </span>
                )}
                <h3 className="text-lg font-bold font-heading leading-snug group-hover:text-primary transition-colors">
                  <Link href={`/article/${article.slug}`}>{article.title}</Link>
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed font-body">
                  {article.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-[11px] font-heading text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {article.reading_time_minutes} মিনিট পড়া
                </span>
                <span>{new Date(article.published_at).toLocaleDateString("bn-BD")}</span>
              </div>
            </div>
          </article>
        </motion.div>
      ))}
    </div>
  );
}
