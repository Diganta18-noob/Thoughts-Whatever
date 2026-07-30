"use client";

import Link from "next/link";
import { Category } from "@/types/database";

export function CategoryFilter({
  categories,
  activeSlug,
}: {
  categories: Category[];
  activeSlug?: string;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar scroll-smooth">
      <Link
        href="/"
        className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-all ${
          !activeSlug
            ? "bg-primary text-primary-foreground shadow-md"
            : "bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        সকল ডকুমেন্টারি
      </Link>

      {categories.map((cat) => {
        const isActive = activeSlug === cat.slug;
        return (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className={`px-4 py-2 rounded-full text-xs font-heading font-semibold whitespace-nowrap transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.name}
          </Link>
        );
      })}
    </div>
  );
}
