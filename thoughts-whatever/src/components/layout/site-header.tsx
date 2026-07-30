"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Instagram, Menu, X } from "lucide-react";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/nav";
import { siteConfig, cn } from "@/lib/utils";
import { ReadingSettingsButton } from "@/components/reader/reading-settings";
import { SearchDialog } from "@/components/search/search-dialog";
import { useBookmarks } from "@/components/providers/bookmarks-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { LanguageToggle } from "@/components/layout/language-toggle";

export function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { bookmarks, ready } = useBookmarks();
  const { t, locale, isBn } = useLanguage();

  // Close the mobile menu on navigation.
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      data-print="hide"
      className="sticky top-0 z-30 border-b border-rule bg-surface/90 backdrop-blur"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Wordmark — Bengali, in the display face. The brand is Bengali even
            though the chrome around it is switchable. */}
        <Link
          href="/"
          className="group shrink-0"
          aria-label={t("header.home", { site: siteConfig.nameEn })}
        >
          <span className="block font-display text-[1.35rem] leading-none text-content transition-colors group-hover:text-accent">
            Thoughts Whatever
          </span>
          <span className="label mt-1 hidden sm:block">
            {isBn ? siteConfig.tagline : siteConfig.taglineEn}
          </span>
        </Link>

        <nav
          lang={locale}
          className="ml-auto hidden items-center gap-1 md:flex"
          aria-label={t("nav.sections")}
        >
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-sm px-3 py-2 text-sm transition-colors",
                isBn ? "font-bengali" : "font-serif",
                isActive(item.href)
                  ? "text-accent"
                  : "text-content-soft hover:text-content",
              )}
            >
              {isBn ? item.labelBn : item.labelEn}
              {isActive(item.href) && (
                <span className="absolute inset-x-3 -bottom-px h-px bg-accent" />
              )}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 md:ml-2">
          <SearchDialog />
          <LanguageToggle />
          <ReadingSettingsButton />

          <Link
            href="/bookmarks"
            aria-label={t("header.saved")}
            title={t("header.saved")}
            className="relative grid h-9 w-9 place-items-center rounded-full text-content-soft transition hover:bg-content/5 hover:text-content"
          >
            <Bookmark className="h-[1.05rem] w-[1.05rem]" />
            {ready && bookmarks.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
          </Link>

          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("header.instagram")}
            className="hidden h-9 w-9 place-items-center rounded-full text-content-soft transition hover:bg-content/5 hover:text-content sm:grid"
          >
            <Instagram className="h-[1.05rem] w-[1.05rem]" />
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? t("header.closeMenu") : t("header.openMenu")}
            className="grid h-9 w-9 place-items-center rounded-full text-content-soft transition hover:bg-content/5 hover:text-content md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — shows both languages, since this is where a reader
          orients themselves. */}
      {menuOpen && (
        <nav
          className="animate-fade-in border-t border-rule bg-surface-raised md:hidden"
          aria-label={t("nav.sections")}
        >
          <ul className="divide-y divide-rule/60">
            {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-baseline justify-between px-5 py-3.5 transition",
                    isActive(item.href) ? "bg-accent/5" : "hover:bg-content/[0.03]",
                  )}
                >
                  <span
                    lang={locale}
                    className={cn(
                      "text-[0.9375rem]",
                      isBn ? "font-bengali" : "font-serif",
                      isActive(item.href) ? "text-accent" : "text-content",
                    )}
                  >
                    {isBn ? item.labelBn : item.labelEn}
                  </span>
                  {!isBn && (
                    <span className="font-bengali text-sm text-content-faint">
                      {item.labelBn}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
