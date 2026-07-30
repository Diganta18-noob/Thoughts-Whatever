"use client";

import Link from "next/link";
import { Article } from "@/types/database";
import { TrendingUp, Eye } from "lucide-react";

export function PopularSidebar({ articles }: { articles: Article[] }) {
  if (!articles || articles.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4 shadow-sm">
      <h3 className="text-base font-bold font-heading flex items-center gap-2 border-b border-border pb-3">
        <TrendingUp className="w-4 h-4 text-amber-500" />
        সবচেয়ে পঠিত নিবন্ধসমূহ
      </h3>

      <div className="space-y-4">
        {articles.map((art, idx) => (
          <Link
            key={art.id}
            href={`/article/${art.slug}`}
            className="group flex gap-3 items-start border-b border-border/40 pb-3 last:border-0 last:pb-0"
          >
            <span className="text-xl font-bold font-heading text-primary/40 group-hover:text-primary transition-colors w-5">
              0{idx + 1}
            </span>
            <div className="space-y-1 flex-1">
              <h4 className="text-xs sm:text-sm font-semibold font-heading group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {art.title}
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-heading">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-muted-foreground" /> {art.view_count} বার পঠিত
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
