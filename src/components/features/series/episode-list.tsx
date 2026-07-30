"use client";

import Link from "next/link";
import { Article } from "@/types/database";
import { CheckCircle2, Circle, Clock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export function EpisodeList({ episodes }: { episodes: Article[] }) {
  const [readSlugs, setReadSlugs] = useState<string[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("bengali_doc_read_articles") || "[]");
    setReadSlugs(saved);
  }, []);

  return (
    <div className="space-y-4">
      {episodes.map((episode) => {
        const isRead = readSlugs.includes(episode.slug);
        return (
          <Link
            key={episode.id}
            href={`/article/${episode.slug}`}
            className="group flex flex-col sm:flex-row gap-4 p-5 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg items-center"
          >
            <div className="relative w-full sm:w-48 h-32 rounded-xl overflow-hidden shrink-0">
              <img
                src={episode.thumbnail_url}
                alt={episode.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold font-heading bg-black/70 text-white backdrop-blur-xs">
                পর্ব {episode.part_number}
              </span>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start text-xs font-heading">
                {isRead ? (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> পঠিত সম্পন্ন
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                    <Circle className="w-3.5 h-3.5" /> অপঠিত
                  </span>
                )}
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {episode.reading_time_minutes} মিনিট
                </span>
              </div>

              <h3 className="text-lg font-bold font-heading group-hover:text-primary transition-colors">
                {episode.title}
              </h3>

              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-body">
                {episode.excerpt}
              </p>
            </div>

            <div className="shrink-0 pt-2 sm:pt-0">
              <span className="inline-flex items-center gap-1 text-xs font-bold font-heading text-primary group-hover:translate-x-1 transition-transform">
                পাঠ শুরু করুন <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
