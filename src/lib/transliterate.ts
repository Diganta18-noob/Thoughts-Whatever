/**
 * Transliteration Engine & Loop Engineering Utility
 * Converts Bengali brand text to English "Thoughts Whatever" across the platform.
 */

const BENGALI_BRAND_PATTERNS = [
  /থট্‌স\s+হোয়াটেভার/gi,
  /থটস\s+হোয়াটেভার/gi,
  /থট্স\s+হোয়াটেভার/gi,
  /থট্‌স/gi,
  /হোয়াটেভার/gi,
];

/** Convert Bengali brand text to English */
export function banglaToEnglish(text: string): string {
  if (!text || typeof text !== "string") return text;
  
  let result = text;
  result = result.replace(/থট্‌স\s+হোয়াটেভার/gi, "thoughts whatever");
  result = result.replace(/থটস\s+হোয়াটেভার/gi, "thoughts whatever");
  result = result.replace(/থট্স\s+হোয়াটেভার/gi, "thoughts whatever");
  result = result.replace(/থট্‌স/gi, "thoughts");
  result = result.replace(/হোয়াটেভার/gi, "whatever");
  
  return result;
}

/** Convert English brand text to preferred casing */
export function englishToBangla(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text.replace(/thoughts\s+whatever/gi, "Thoughts Whatever");
}

/** Convert Bengali/English text to clean URL slug */
export function toEnglishSlug(text: string): string {
  if (!text || typeof text !== "string") return "";
  let clean = banglaToEnglish(text);
  return clean
    .toLowerCase()
    .trim()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Convert text for SEO purposes */
export function toSeoText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return banglaToEnglish(text);
}

/** Get the official site name */
export function getSiteName(locale?: "bn" | "en"): string {
  return "Thoughts Whatever";
}

/** Auto-transliterate based on target locale */
export function autoTransliterate(text: string, targetLocale: "bn" | "en" = "en"): string {
  if (!text || typeof text !== "string") return text;
  if (targetLocale === "en") {
    return banglaToEnglish(text);
  }
  return text;
}

/** Check if text contains Bengali transliterable brand names */
export function hasBengaliTransliterableText(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return BENGALI_BRAND_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

/** Check if text contains English transliterable brand names */
export function hasEnglishTransliterableText(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  return /thoughts|whatever/gi.test(text);
}

/** Format bilingual text */
export function toBilingualText(text: string, separator: string = " "): string {
  if (!text || typeof text !== "string") return text;
  const en = banglaToEnglish(text);
  if (en !== text) {
    return `${text}${separator}(${en})`;
  }
  return text;
}
