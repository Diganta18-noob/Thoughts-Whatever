/**
 * Transliteration Context Provider
 * 
 * Provides transliteration utilities to the entire component tree.
 * This is a lightweight wrapper that ensures the transliteration
 * system is available everywhere.
 */

"use client";

import { createContext, useContext, type ReactNode } from "react";
import { 
  banglaToEnglish, 
  englishToBangla, 
  toEnglishSlug,
  toSeoText,
  getSiteName,
  autoTransliterate 
} from "@/lib/transliterate";

interface TransliterationContextValue {
  banglaToEnglish: typeof banglaToEnglish;
  englishToBangla: typeof englishToBangla;
  toEnglishSlug: typeof toEnglishSlug;
  toSeoText: typeof toSeoText;
  getSiteName: typeof getSiteName;
  autoTransliterate: typeof autoTransliterate;
}

const TransliterationContext = createContext<TransliterationContextValue | null>(null);

export function TransliterationProvider({ children }: { children: ReactNode }) {
  const value: TransliterationContextValue = {
    banglaToEnglish,
    englishToBangla,
    toEnglishSlug,
    toSeoText,
    getSiteName,
    autoTransliterate,
  };

  return (
    <TransliterationContext.Provider value={value}>
      {children}
    </TransliterationContext.Provider>
  );
}

/**
 * Hook to access transliteration utilities
 */
export function useTransliterationContext() {
  const context = useContext(TransliterationContext);
  
  if (!context) {
    // If provider not found, return the functions directly as fallback
    return {
      banglaToEnglish,
      englishToBangla,
      toEnglishSlug,
      toSeoText,
      getSiteName,
      autoTransliterate,
    };
  }
  
  return context;
}
