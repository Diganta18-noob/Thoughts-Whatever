"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Sun, Moon, BookOpen } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-full border border-rule">
      <button
        onClick={() => setTheme("cream")}
        className={`p-1.5 rounded-full transition-all text-xs flex items-center gap-1 ${
          theme === "cream"
            ? "bg-journal-vermilion text-white font-semibold"
            : "text-content-faint hover:text-content"
        }`}
        title="ক্রিম পেপার মোড"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("sepia")}
        className={`p-1.5 rounded-full transition-all text-xs flex items-center gap-1 ${
          theme === "sepia"
            ? "bg-journal-vermilion text-white font-semibold"
            : "text-content-faint hover:text-content"
        }`}
        title="সেপিয়া মোড"
      >
        <BookOpen className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme("night")}
        className={`p-1.5 rounded-full transition-all text-xs flex items-center gap-1 ${
          theme === "night"
            ? "bg-archive-ember text-white font-semibold"
            : "text-content-faint hover:text-content"
        }`}
        title="নাইট মোড"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
