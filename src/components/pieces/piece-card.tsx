"use client";

import Link from "next/link";
import { Article } from "@/types/database";
import { Clock } from "lucide-react";

export function PieceCard({
  article,
  variant = "journal",
  lead = false,
}: {
  article: Article;
  variant?: "journal" | "archive";
  lead?: boolean;
}) {
  const archive = variant === "archive";

  return (
    <article
      className={`group transition-all ${
        archive
          ? "border border-archive-panelEdge bg-archive-panel/60 p-5 rounded-sm"
          : "border-b border-rule pb-8"
      }`}
    >
      <Link href={`/article/${article.slug}`} className="block">
        {article.thumbnail_url && (lead || archive) && (
          <div
            className={`mb-4 overflow-hidden rounded-xs border border-rule ${
              lead ? "aspect-[16/9]" : "aspect-video"
            }`}
          >
            <img
              src={article.thumbnail_url}
              alt={article.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6875rem] text-content-faint">
          {article.category && (
            <span className="label !text-accent font-bengali-sans tracking-normal">
              {article.category.name}
            </span>
          )}
          <span>·</span>
          <span>{new Date(article.published_at).toLocaleDateString("bn-BD")}</span>
          <span>·</span>
          <span className="flex items-center gap-1 font-bengali">
            <Clock className="w-3 h-3 text-accent" /> {article.reading_time_minutes} মি. পাঠ
          </span>
          {article.instagram_link && (
            <>
              <span>·</span>
              <span className="text-accent font-semibold">রিল যুক্ত</span>
            </>
          )}
        </div>

        <h3
          className={`font-bengali font-medium text-content transition-colors group-hover:text-accent ${
            lead ? "text-2xl leading-snug sm:text-[1.75rem]" : "text-lg leading-snug"
          }`}
          lang="bn"
        >
          {article.title}
        </h3>

        {article.excerpt && (
          <p
            className={`mt-2.5 font-bengali text-content-soft leading-relaxed ${
              lead ? "text-bengali-base line-clamp-3" : "text-bengali-sm line-clamp-2"
            }`}
            lang="bn"
          >
            {article.excerpt}
          </p>
        )}
      </Link>
    </article>
  );
}

export function PieceRow({ article, index }: { article: Article; index?: number }) {
  return (
    <Link
      href={`/article/${article.slug}`}
      className="group flex gap-4 border-b border-rule py-4 transition hover:bg-accent/[0.03]"
    >
      {typeof index === "number" && (
        <span aria-hidden className="w-6 shrink-0 pt-1 text-xs text-content-faint font-mono">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3
          className="font-bengali text-[1.0625rem] leading-snug text-content transition-colors group-hover:text-accent font-medium"
          lang="bn"
        >
          {article.title}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-[0.6875rem] text-content-faint">
          {article.category && (
            <span className="label !text-accent font-bengali-sans tracking-normal">
              {article.category.name}
            </span>
          )}
          <span>·</span>
          <span>{article.reading_time_minutes} মিনিট সময়</span>
        </div>
      </div>
    </Link>
  );
}
