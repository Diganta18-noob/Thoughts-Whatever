"use client";

import { useLanguage } from "@/components/providers/language-provider";
import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

/**
 * A section name, wherever one is printed outside the header.
 *
 * Navigation uses only the selected language.
 *
 * The strings come from `nav.ts`, not from a dictionary. Section names live in
 * exactly one place and this reads them.
 */
export function NavLabel({
  item,
  className,
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
    <span className={className}>
      <span lang="en" className="font-serif">
        {item.labelEn}
      </span>
    </span>
  );
}
