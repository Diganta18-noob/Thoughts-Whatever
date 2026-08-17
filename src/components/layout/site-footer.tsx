"use client";

import Link from "next/link";
import { Instagram } from "lucide-react";
import { PRIMARY_NAV, SECONDARY_NAV } from "@/lib/nav";
import { siteConfig, cn } from "@/lib/utils";
import { toBengaliNumber } from "@/lib/bengali";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { useLanguage } from "@/components/providers/language-provider";
import { NavLabel } from "@/components/i18n/nav-label";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const { t, locale, isBn } = useLanguage();

  return (
    <footer data-print="hide" className="mt-20 border-t border-rule/70 bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* 1. The letter */}
          <div>
            <h2 lang={locale} className={cn("text-base font-serif font-medium text-content", isBn ? "font-display" : "font-serif")}>
              {t("letter.label")}
            </h2>
            <p
              lang={locale}
              className={cn(
                "mt-2 max-w-xs text-xs leading-relaxed text-content-soft",
                isBn ? "font-bengali" : "font-sans",
              )}
            >
              {isBn
                ? "মাসে একটি চিঠি—নতুন লেখা, পড়ার মতো বিষয়, আর যা বাদ পড়ে গেল। কোনো বিজ্ঞাপন নেই।"
                : "One letter a month—new writing, things worth reading, and whatever got cut along the way."}
            </p>
            <div className="mt-4 max-w-xs">
              <SubscribeForm source="footer" compact />
            </div>
          </div>

          {/* 2. SECTIONS */}
          <nav lang={locale} aria-label={t("nav.sections")}>
            <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-content font-mono font-medium mb-3.5">
              SECTIONS
            </h2>
            <ul className="space-y-2">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-baseline gap-2 text-xs text-content-soft transition hover:text-accent"
                  >
                    <span className="font-sans text-xs">{item.labelEn}</span>
                    <span className="font-bengali text-xs text-content-faint">{item.labelBn}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* 3. MORE */}
          <nav lang={locale} aria-label={t("nav.more")}>
            <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-content font-mono font-medium mb-3.5">
              MORE
            </h2>
            <ul className="space-y-2">
              {SECONDARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-baseline gap-2 text-xs text-content-soft transition hover:text-accent"
                  >
                    <span className="font-sans text-xs">{item.labelEn}</span>
                    <span className="font-bengali text-xs text-content-faint">{item.labelBn}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/bookmarks"
                  className="group flex items-baseline gap-2 text-xs text-content-soft transition hover:text-accent"
                >
                  <span className="font-sans text-xs">Saved</span>
                  <span className="font-bengali text-xs text-content-faint">পরে পড়ুন</span>
                </Link>
              </li>
            </ul>
          </nav>

          {/* 4. FOLLOW */}
          <div>
            <h2 className="text-[0.7rem] uppercase tracking-[0.14em] text-content font-mono font-medium mb-3.5">
              FOLLOW
            </h2>
            <ul className="space-y-2">
              <li>
                <a
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-xs text-content-soft transition hover:text-accent"
                >
                  <Instagram className="h-3.5 w-3.5 text-content-soft group-hover:text-accent" />
                  <span className="font-sans">Instagram</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Colophon Bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-rule/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.7rem] font-sans text-content-faint">
            Set in Noto Serif Bengali, Hind Siliguri, and Galada.
          </p>
          <p className="font-sans text-[0.7rem] text-content-faint">
            © {year} Thoughts Whatever
          </p>
        </div>
      </div>
    </footer>
  );
}
