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
    <>
      <span lang="en" className={cn("font-serif", className)}>
        {item.labelEn}
      </span>
      <span
        lang="bn"
        className={cn("ml-2 font-bengali text-xs text-content-faint", glossClassName)}
      >
        {item.labelBn}
      </span>
    </>
  );
}
