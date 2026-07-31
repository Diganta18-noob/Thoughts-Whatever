"use client";

import { useEffect, useRef, useState } from "react";
import { Type, RotateCcw } from "lucide-react";
import {
  LEADING_RANGE,
  READING_DEFAULTS,
  SIZE_RANGE,
  useReading,
  type Theme,
} from "@/components/providers/reading-provider";
import { toBengaliNumber } from "@/lib/bengali";
import { cn } from "@/lib/utils";

const THEMES: { id: Theme; labelEn: string; labelBn: string; swatch: string }[] = [
  { id: "cream", labelEn: "Cream", labelBn: "ক্রিম", swatch: "#FDFBF5" },
  { id: "sepia", labelEn: "Sepia", labelBn: "সেপিয়া", swatch: "#F4ECDC" },
  { id: "night", labelEn: "Night", labelBn: "রাত", swatch: "#0D0D0E" },
];

/**
 * পাঠ-মোদ — reading settings.
 *
 * Bengali readers need this more than English readers do: the script carries
 * more vertical detail, so a default line-height that is merely tight in
 * Latin is genuinely hard to read in Bangla, and the comfortable size varies
 * a lot by device and by eyesight.
 */
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
        className="grid h-9 w-9 place-items-center rounded-full text-content-soft transition hover:bg-content/5 hover:text-content"
      >
        <Type className="h-[1.05rem] w-[1.05rem]" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Reading settings"
          className="absolute right-0 top-11 z-50 w-[19rem] animate-fade-up rounded-sm border border-rule bg-surface-raised p-5 shadow-xl shadow-black/5"
        >
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-serif text-sm font-medium text-content">Reading</h2>
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-[0.6875rem] text-content-faint transition hover:text-accent"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          {/* Theme */}
          <fieldset className="mb-5">
            <legend className="label mb-2">Paper</legend>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  aria-pressed={theme === t.id}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-1.5 rounded-sm border px-2 py-2.5 transition",
                    theme === t.id
                      ? "border-accent/60 bg-accent/5"
                      : "border-rule hover:border-content-faint",
                  )}
                >
                  <span
                    className="h-6 w-full rounded-[2px] border border-black/10"
                    style={{ backgroundColor: t.swatch }}
                  />
                  <span className="font-bengali-sans text-[0.6875rem] text-content-soft">
                    {t.labelBn}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {/* Size */}
          <div className="mb-4">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="label">Size</span>
              <span className="font-bengali-sans text-xs text-content-faint">
                {toBengaliNumber(reading.size)}
              </span>
            </div>
            <input
              type="range"
              min={SIZE_RANGE.min}
              max={SIZE_RANGE.max}
              step={SIZE_RANGE.step}
              value={reading.size}
              onChange={(e) => setReading({ size: Number(e.target.value) })}
              className="w-full accent-[rgb(var(--accent))]"
              aria-label="Text size"
            />
          </div>

          {/* Line height */}
          <div className="mb-5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="label">Line height</span>
              <span className="font-bengali-sans text-xs text-content-faint">
                {toBengaliNumber(reading.leading.toFixed(2))}
              </span>
            </div>
            <input
              type="range"
              min={LEADING_RANGE.min}
              max={LEADING_RANGE.max}
              step={LEADING_RANGE.step}
              value={reading.leading}
              onChange={(e) => setReading({ leading: Number(e.target.value) })}
              className="w-full accent-[rgb(var(--accent))]"
              aria-label="Line height"
            />
          </div>

          {/* Typeface */}
          <fieldset>
            <legend className="label mb-2">Typeface</legend>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReading({ family: "serif" })}
                aria-pressed={reading.family === "serif"}
                className={cn(
                  "flex-1 rounded-sm border px-3 py-2 font-bengali text-[0.9375rem] transition",
                  reading.family === "serif"
                    ? "border-accent/60 bg-accent/5 text-content"
                    : "border-rule text-content-soft hover:border-content-faint",
                )}
              >
                অক্ষর
              </button>
              <button
                type="button"
                onClick={() => setReading({ family: "sans" })}
                aria-pressed={reading.family === "sans"}
                className={cn(
                  "flex-1 rounded-sm border px-3 py-2 font-bengali-sans text-[0.9375rem] transition",
                  reading.family === "sans"
                    ? "border-accent/60 bg-accent/5 text-content"
                    : "border-rule text-content-soft hover:border-content-faint",
                )}
              >
                অক্ষর
              </button>
            </div>
          </fieldset>

          <p className="mt-4 border-t border-rule pt-3 font-bengali-sans text-[0.6875rem] leading-relaxed text-content-faint">
            আপনার পছন্দ এই ব্রাউজারে সংরক্ষিত থাকবে।
          </p>
          {reading.size === READING_DEFAULTS.size &&
            reading.leading === READING_DEFAULTS.leading && (
              <span className="sr-only">Default reading settings are active.</span>
            )}
        </div>
      )}
    </div>
  );
}
