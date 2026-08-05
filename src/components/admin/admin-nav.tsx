"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/en";

const ITEMS: { href: string; key: TranslationKey }[] = [
  { href: "/admin", key: "admin.nav.dashboard" },
  { href: "/admin/pieces", key: "admin.nav.pieces" },
  { href: "/admin/series", key: "admin.nav.series" },
  { href: "/admin/taxonomy", key: "admin.nav.taxonomy" },
  { href: "/admin/subscribers", key: "admin.nav.subscribers" },
  { href: "/admin/import", key: "admin.nav.import" },
  { href: "/admin/transliteration", key: "admin.nav.transliteration" },
  { href: "/admin/system", key: "admin.nav.system" },
  { href: "/admin/settings", key: "admin.nav.settings" },
];

export function AdminNav() {
  const rawPathname = usePathname();
  const pathname = rawPathname ?? "";
  const t = useTranslation();

  return (
    <nav className="flex flex-wrap items-center gap-1">
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-sm px-3 py-1.5 font-sans text-sm transition",
              active
                ? "bg-accent/10 text-accent font-medium"
                : "text-content-soft hover:text-content",
            )}
          >
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}
