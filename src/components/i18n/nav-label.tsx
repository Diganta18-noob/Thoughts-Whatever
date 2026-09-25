"use client";

import { useLanguage } from "@/components/providers/language-provider";
import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * A section name, wherever one is printed outside the header.
 *
 * English chrome prints the Latin label with the Bengali beside it as a gloss —
 * that pairing is how a reader learns which word means which section. Bengali
 * chrome prints the Bengali alone; the gloss would be explaining a word to the
 * person who already reads it.
 *
 * The strings come from `nav.ts`, not from a dictionary. Section names live in
 * exactly one place and this reads them.
 */
export function NavLabel({
  item,
  className,
  glossClassName,
}: {
  item: Pick<NavItem, "labelEn" | "labelBn">;
  className?: string;
  glossClassName?: string;
}) {
  const { isBn } = useLanguage();

  if (isBn) {
    return (
      <span lang="bn" className={cn("font-bengali", className)}>
        {item.labelBn}
      </span>
    );
  }

  return (
    <span className={cn("inline-grid grid-cols-[6.5rem_auto] sm:grid-cols-[7.5rem_auto] items-baseline gap-2", className)}>
      <span lang="en" className="font-serif">
        {item.labelEn}
      </span>
      <span
        lang="bn"
        className={cn("font-bengali text-xs text-content-faint", glossClassName)}
      >
        {item.labelBn}
      </span>
    </span>
  );
}
