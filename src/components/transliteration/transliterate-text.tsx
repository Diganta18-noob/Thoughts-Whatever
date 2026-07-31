/**
 * Transliteration Components
 * 
 * Components that automatically transliterate their children
 * based on language context or explicit settings.
 */

"use client";

import { type ReactNode } from "react";
import { useTransliterate, useEnglishOnly, useBengaliOnly, useSeoText } from "./use-transliterate";

interface TransliterateProps {
  children: string;
  className?: string;
  lang?: string;
}

/**
 * Auto-transliterates text based on current language setting
 * 
 * @example
 * <TransliterateText>থট্‌স হোয়াটেভার</TransliterateText>
 * // If language is "en", renders: "thoughts whatever"
 * // If language is "bn", renders: "থট্‌স হোয়াটেভার"
 */
export function TransliterateText({ children, className, lang }: TransliterateProps) {
  const transliterated = useTransliterate(children);
  return <span className={className} lang={lang}>{transliterated}</span>;
}

/**
 * Always shows English, even if content has Bengali
 * 
 * @example
 * <EnglishText>থট্‌স হোয়াটেভার</EnglishText>
 * // Always renders: "thoughts whatever"
 */
export function EnglishText({ children, className }: TransliterateProps) {
  const english = useEnglishOnly(children);
  return <span className={className} lang="en">{english}</span>;
}

/**
 * Always shows Bengali, even if content has English
 * 
 * @example
 * <BengaliText>thoughts whatever</BengaliText>
 * // Always renders: "থট্‌স হোয়াটেভার"
 */
export function BengaliText({ children, className }: TransliterateProps) {
  const bengali = useBengaliOnly(children);
  return <span className={className} lang="bn">{bengali}</span>;
}

/**
 * SEO-optimized text (always English for search engines)
 * Use in meta tags, structured data, etc.
 * 
 * @example
 * <meta name="description" content={<SeoText>থট্‌স হোয়াটেভার</SeoText>} />
 */
export function SeoText({ children }: { children: string }): string {
  const seoText = useSeoText(children);
  return seoText || children;
}

/**
 * Wrapper for any element that needs auto-transliteration
 */
interface TransliterateWrapperProps {
  children: ReactNode;
  text: string;
  renderAs?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  className?: string;
  lang?: string;
}

export function TransliterateWrapper({ 
  children, 
  text, 
  renderAs: Component = "span",
  className,
  lang 
}: TransliterateWrapperProps) {
  const transliterated = useTransliterate(text);
  
  return (
    <Component className={className} lang={lang}>
      {children}
    </Component>
  );
}
