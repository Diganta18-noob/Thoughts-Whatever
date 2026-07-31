"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Languages } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

/**
 * Interface language. Two options, so a dropdown is arguably one control too
 * many — but a bare toggle can't say *what* it switches, and here that matters:
 * readers need to know the writing isn't about to be translated. The note at
 * the bottom of the panel is the whole reason this isn't a single button.
 */
export function LanguageToggle() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const { locale, setLocale, t, isBn } = useLanguage();

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
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;

      // Wrap around the two options. Focus starts on the current locale, so
      // one press lands on the other one either way.
      e.preventDefault();
      const items = optionRefs.current.filter(Boolean) as HTMLButtonElement[];
      if (!items.length) return;
      const at = items.indexOf(document.activeElement as HTMLButtonElement);
      const step = e.key === "ArrowDown" ? 1 : -1;
      const next = at === -1 ? 0 : (at + step + items.length) % items.length;
      items[next]?.focus();
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

  // Opening with the keyboard should put focus inside the panel, on whichever
  // option is already active.
  useEffect(() => {
    if (!open) return;
    const current = LOCALES.indexOf(locale);
    optionRefs.current[current === -1 ? 0 : current]?.focus();
  }, [open, locale]);

  const choose = (next: Locale) => {
    setLocale(next);
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div className="relative" data-print="hide">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("lang.choose")}
        title={t("lang.label")}
        className="grid h-9 min-w-9 place-items-center gap-1 rounded-full px-1.5 text-content-soft transition hover:bg-content/5 hover:text-content sm:flex sm:w-auto"
      >
        <Languages className="h-[1.05rem] w-[1.05rem]" />
        <span
          aria-hidden
          className={cn(
            "hidden text-[0.6875rem] uppercase tracking-wider sm:inline",
            isBn && "font-bengali-sans normal-case tracking-normal",
          )}
        >
          {LOCALE_META[locale].short}
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label={t("lang.label")}
          className="absolute right-0 top-11 z-50 w-56 animate-fade-up rounded-sm border border-rule bg-surface-raised p-2 shadow-xl shadow-black/5"
        >
          <p
            className={cn(
              "label px-2 pb-1.5 pt-1",
              isBn && "font-bengali-sans tracking-normal",
            )}
          >
            {t("lang.label")}
          </p>

          {LOCALES.map((code, i) => {
            const meta = LOCALE_META[code];
            const active = code === locale;
            return (
              <button
                key={code}
                ref={(el) => {
                  optionRefs.current[i] = el;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                lang={code}
                onClick={() => choose(code)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2 text-left text-[0.9375rem] transition",
                  code === "bn" ? "font-bengali" : "font-serif",
                  active
                    ? "bg-accent/5 text-content"
                    : "text-content-soft hover:bg-content/5 hover:text-content",
                )}
              >
                <span>{meta.name}</span>
                {active ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                ) : (
                  <span
                    aria-hidden
                    className="text-[0.6875rem] uppercase tracking-wider text-content-faint"
                  >
                    {code === "bn" ? null : meta.short}
                  </span>
                )}
              </button>
            );
          })}

          <p
            className={cn(
              "mt-1.5 border-t border-rule px-2 pb-1 pt-2.5 text-[0.6875rem] leading-relaxed text-content-faint",
              isBn ? "font-bengali-sans" : "font-serif",
            )}
          >
            {t("lang.note")}
          </p>
        </div>
      )}
    </div>
  );
}
