"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", labelEn: "Overview" },
  { href: "/admin/pieces", labelEn: "Pieces" },
  { href: "/admin/series", labelEn: "Series" },
  { href: "/admin/taxonomy", labelEn: "Taxonomy" },
  { href: "/admin/subscribers", labelEn: "Letter" },
  { href: "/admin/import", labelEn: "Import" },
  { href: "/admin/transliteration", labelEn: "Transliteration" },
  { href: "/admin/settings", labelEn: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1" lang="en">
      {ITEMS.map((item) => {
        // Exact match for /admin, prefix match for the rest — otherwise
        // Overview stays lit on every page.
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-sm px-3 py-1.5 font-serif text-sm transition",
              active
                ? "bg-accent/10 text-accent"
                : "text-content-soft hover:text-content",
            )}
          >
            {item.labelEn}
          </Link>
        );
      })}
    </nav>
  );
}
