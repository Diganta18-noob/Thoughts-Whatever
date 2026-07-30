"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { Type } from "lucide-react";

export function TypographyControls() {
  const { fontSize, setFontSize } = useTheme();

  const sizes = [
    { label: "ছোট", value: "sm", size: "text-xs" },
    { label: "সাধারণ", value: "base", size: "text-sm" },
    { label: "বড়", value: "lg", size: "text-base" },
    { label: "বিশাল", value: "xl", size: "text-lg" },
  ] as const;

  return (
    <div className="flex items-center gap-2 bg-secondary/80 px-3 py-1.5 rounded-full border border-border">
      <Type className="w-4 h-4 text-muted-foreground" />
      <div className="flex items-center gap-1">
        {sizes.map((s) => (
          <button
            key={s.value}
            onClick={() => setFontSize(s.value)}
            className={`px-2 py-0.5 rounded text-xs transition-all font-heading ${
              fontSize === s.value
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
