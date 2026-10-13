"use client";

import { usePathname } from "next/navigation";
import { useLanguageSafe } from "@/components/providers/language-provider";
import { englishTranslations } from "@/lib/english-translations";
import { normalizeTranslationText, needsEnglishTranslation } from "@/lib/content-translation";

/** Local bundle only: no API, credentials, network requests, or external cache. */
export function englishText(source: string): string | undefined {
  const text = normalizeTranslationText(source);
  if (!needsEnglishTranslation(text)) return source;
  const exact = englishTranslations[text];
  if (exact) return `${source.match(/^\s*/)?.[0] || ""}${exact}${source.match(/\s*$/)?.[0] || ""}`;
  const latinDigits = source.replace(/[০-৯]/g, digit => String(digit.charCodeAt(0) - 0x09e6));
  return needsEnglishTranslation(latinDigits) ? undefined : latinDigits;
}

export function useTranslatedText(source: string): string {
  const { isBn } = useLanguageSafe();
  const pathname = usePathname();
  if (isBn || pathname?.startsWith("/admin") || pathname?.startsWith("/preview")) return source;
  return englishText(source) ?? "English translation not available yet";
}
