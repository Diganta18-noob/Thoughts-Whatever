/**
 * React Hooks for Client-Side Transliteration
 * 
 * Provides hooks and components to automatically transliterate text
 * in React components based on language context.
 */

"use client";

import { useMemo } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { 
  banglaToEnglish, 
  englishToBangla, 
  autoTransliterate,
  getSiteName,
  toSeoText,
  toBilingualText 
} from "@/lib/transliterate";

/**
 * Hook to transliterate text based on current language
 */
export function useTransliterate(text: string | undefined | null) {
  const { locale } = useLanguage();
  
  return useMemo(() => {
    if (!text) return text;
    return autoTransliterate(text, locale === "bn" ? "en" : "bn");
  }, [text, locale]);
}

/**
 * Hook to get site name in current language
 */
export function useSiteName() {
  const { locale } = useLanguage();
  return useMemo(() => getSiteName(locale === "bn" ? "bn" : "en"), [locale]);
}

/**
 * Hook to force transliteration to English (for SEO, URLs, etc.)
 */
export function useEnglishOnly(text: string | undefined | null) {
  return useMemo(() => {
    if (!text) return text;
    return banglaToEnglish(text);
  }, [text]);
}

/**
 * Hook to force transliteration to Bengali (for display)
 */
export function useBengaliOnly(text: string | undefined | null) {
  return useMemo(() => {
    if (!text) return text;
    return englishToBangla(text);
  }, [text]);
}

/**
 * Hook to create bilingual text (both scripts)
 */
export function useBilingualText(text: string | undefined | null, separator?: string) {
  return useMemo(() => {
    if (!text) return text;
    return toBilingualText(text, separator);
  }, [text, separator]);
}

/**
 * Hook for SEO-safe text (always English)
 */
export function useSeoText(text: string | undefined | null) {
  return useMemo(() => {
    if (!text) return text;
    return toSeoText(text);
  }, [text]);
}
