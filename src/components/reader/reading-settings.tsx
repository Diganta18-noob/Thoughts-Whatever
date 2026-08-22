"use client";

import { useEffect, useRef, useState } from "react";
import { Type, RotateCcw, Check } from "lucide-react";
import {
  LEADING_RANGE,
  READING_DEFAULTS,
  SIZE_RANGE,
  useReading,
  type Theme,
} from "@/components/providers/reading-provider";
import { cn } from "@/lib/utils";

interface ThemeOption {
  id: Theme;
  label: string;
  subLabel: string;
  bg: string;
  previewText: string;
  borderPreview: string;
}

const THEMES: ThemeOption[] = [
  {
    id: "cream",
    label: "Light",
    subLabel: "Clean & Bright",
    bg: "#FAF8F5",
    previewText: "#1C1917",
    borderPreview: "rgba(0, 0, 0, 0.08)",
  },
  {
    id: "sepia",
    label: "Sepia",
    subLabel: "Warm & Gentle",
    bg: "#F2E8DC",
    previewText: "#2B2118",
    borderPreview: "rgba(0, 0, 0, 0.08)",
  },
  {
    id: "night",
    label: "Dark",
    subLabel: "Calm & Focused",
    bg: "#0F0F10",
    previewText: "#E7E5E4",
    borderPreview: "rgba(255, 255, 255, 0.1)",
  },
];

export function ReadingSettingsButton() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { theme, setTheme, reading, setReading, reset } = useReading();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" data-print="hide">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Reading settings"
        title="Reading settings"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full text-content-soft transition hover:bg-content/5 hover:text-content",
          open && "bg-content/10 text-content",
        )}
      >
        <Type className="h-[1.05rem] w-[1.05rem]" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Reading settings"
          className="absolute right-0 top-12 z-50 w-[22rem] sm:w-[24rem] max-w-[calc(100vw-2rem)] animate-fade-up rounded-md border border-rule/80 bg-surface-raised p-6 shadow-2xl shadow-black/25 backdrop-blur-md"
        >
          {/* Header & Reset */}
          <div className="flex items-center justify-between pb-4 border-b border-rule/60">
            <div>
              <h2 className="font-serif text-base font-medium text-content tracking-tight">
                Reading
              </h2>
              <p className="text-[0.75rem] text-content-faint mt-0.5">
                Customize your reading experience
              </p>
            </div>
            <button
              type="button"
              onClick={reset}
              className="group flex items-center gap-1.5 text-xs text-content-faint transition hover:text-accent font-mono"
            >
              <RotateCcw className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-rotate-90" />
              Reset
            </button>
          </div>

          {/* Section: Theme */}
          <div className="pt-5 pb-5 border-b border-rule/60">
            <span className="block text-[0.6875rem] font-mono tracking-[0.14em] text-content-faint uppercase mb-3">
              Theme
            </span>
            <div className="grid grid-cols-3 gap-2.5">
              {THEMES.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    aria-pressed={isActive}
                    className={cn(
                      "group relative flex flex-col items-center justify-between rounded-md p-2.5 transition-all duration-200 cursor-pointer border text-left",
                      isActive
                        ? "border-accent bg-accent/[0.08] shadow-sm ring-1 ring-accent/30"
                        : "border-rule/80 hover:border-content-faint hover:bg-content/[0.02]",
                    )}
                  >
                    {/* Visual Color Preview Box */}
                    <div
                      className="relative flex items-center justify-center w-full h-10 rounded-sm mb-2.5 transition-transform duration-200 group-hover:scale-[1.02] border"
                      style={{
                        backgroundColor: t.bg,
                        borderColor: t.borderPreview,
                      }}
                    >
                      <span
                        className="font-serif text-xs font-semibold select-none"
                        style={{ color: t.previewText }}
                      >
                        Aa
                      </span>
                      {isActive && (
                        <div className="absolute top-1 right-1 rounded-full bg-accent p-0.5 text-white shadow-xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Theme Label */}
                    <span
                      className={cn(
                        "text-xs font-medium tracking-tight select-none transition-colors",
                        isActive ? "text-accent font-semibold" : "text-content-soft group-hover:text-content",
                      )}
                    >
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Typography Sliders */}
          <div className="pt-5 pb-4 space-y-5">
            {/* Text Size Slider */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[0.6875rem] font-mono tracking-[0.14em] text-content-faint uppercase">
                  Text Size
                </span>
                <span className="text-xs font-mono font-medium text-content-soft">
                  {reading.size}px
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[0.8125rem] font-serif font-medium text-content-faint select-none">
                  A−
                </span>
                <input
                  type="range"
                  min={SIZE_RANGE.min}
                  max={SIZE_RANGE.max}
                  step={SIZE_RANGE.step}
                  value={reading.size}
                  onChange={(e) => setReading({ size: Number(e.target.value) })}
                  className="w-full h-1.5 bg-rule/70 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--accent))]"
                  aria-label="Text size"
                />
                <span className="text-[1.0625rem] font-serif font-semibold text-content-faint select-none">
                  A+
                </span>
              </div>
            </div>

            {/* Line Height Slider */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[0.6875rem] font-mono tracking-[0.14em] text-content-faint uppercase">
                  Line Height
                </span>
                <span className="text-xs font-mono font-medium text-content-soft">
                  {reading.leading.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-content-faint select-none tracking-tighter">
                  ≡
                </span>
                <input
                  type="range"
                  min={LEADING_RANGE.min}
                  max={LEADING_RANGE.max}
                  step={LEADING_RANGE.step}
                  value={reading.leading}
                  onChange={(e) => setReading({ leading: Number(e.target.value) })}
                  className="w-full h-1.5 bg-rule/70 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--accent))]"
                  aria-label="Line height"
                />
                <span className="text-sm font-mono text-content-faint select-none tracking-widest">
                  ≡
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-2 pt-3.5 border-t border-rule/50 flex items-center justify-center">
            <p className="text-[0.7rem] text-content-faint text-center">
              Settings are saved automatically
            </p>
          </div>
          {reading.size === READING_DEFAULTS.size &&
            reading.leading === READING_DEFAULTS.leading && (
              <span className="sr-only">Default reading settings are active.</span>
            )}
        </div>
      )}
    </div>
  );
}
