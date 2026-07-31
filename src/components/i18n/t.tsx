"use client";

import { useLanguage } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/en";
import type { TranslationParams } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

type Tag = "span" | "p" | "h1" | "h2" | "h3" | "div" | "legend" | "strong";

/**
 * A translated string inside a server component.
 *
 * Most of this site renders on the server, and context does not reach there.
 * Rather than converting whole pages to client components for the sake of one
 * label, a page drops in this leaf: it ships a few bytes of JS, reads the
 * locale, and carries the right `lang` so screen readers switch voice.
 *
 * For chrome only. Never wrap a title, body, author, or tag in this.
 */
export function T({
  k,
  params,
  as: Tag = "span",
  className,
  bnClassName,
}: {
  k: TranslationKey;
  params?: TranslationParams;
  as?: Tag;
  className?: string;
  /** Extra classes when the locale is Bengali — usually a Bengali face. */
  bnClassName?: string;
}) {
  const { t, locale, isBn } = useLanguage();
  return (
    <Tag lang={locale} className={cn(className, isBn && bnClassName)}>
      {t(k, params)}
    </Tag>
  );
}

/**
 * A string that already exists in both languages somewhere else — `siteConfig`,
 * `nav.ts`, a `KIND_META` entry. No dictionary key is invented for it, because
 * duplicating it would mean two places to keep in step.
 */
export function Localized({
  en,
  bn,
  as: Tag = "span",
  className,
  bnClassName,
}: {
  en: string;
  bn: string;
  as?: Tag;
  className?: string;
  bnClassName?: string;
}) {
  const { locale, isBn } = useLanguage();
  return (
    <Tag lang={locale} className={cn(className, isBn && bnClassName)}>
      {isBn ? bn : en}
    </Tag>
  );
}

/**
 * Renders children only in English. For glosses that exist to help a reader who
 * doesn't read Bengali — under Bengali chrome they are noise, not translation.
 */
export function EnglishOnly({ children }: { children: React.ReactNode }) {
  const { isBn } = useLanguage();
  return isBn ? null : <>{children}</>;
}
