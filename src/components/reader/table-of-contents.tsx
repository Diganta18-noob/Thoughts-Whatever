"use client";

import { useEffect, useState } from "react";
import { type Heading } from "@/lib/markdown";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const { locale, isBn } = useLanguage();
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
      window.history.replaceState(null, "", `#${id}`);
      setActiveId(id);
    }
  };

  return (
    <nav className="rounded-md border border-rule/60 bg-surface-raised/30 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-content-soft">
        <List className="h-3.5 w-3.5" />
        <span>{isBn ? "সূচিপত্র" : "Contents"}</span>
      </div>
      <ul className="space-y-1.5 text-xs">
        {headings.map((h) => {
          const isActive = activeId === h.id;
          return (
            <li
              key={h.id}
              style={{ paddingLeft: `${(h.level - 2) * 12}px` }}
            >
              <button
                onClick={() => scrollToHeading(h.id)}
                className={cn(
                  "block w-full text-left transition-colors duration-200 hover:text-accent",
                  isBn ? "font-bengali-sans" : "font-sans",
                  isActive
                    ? "font-medium text-accent underline underline-offset-4"
                    : "text-content-soft"
                )}
                lang={locale}
              >
                {h.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
