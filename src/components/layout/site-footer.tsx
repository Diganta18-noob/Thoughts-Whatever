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
    <footer data-print="hide" className="mt-24 border-t border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* চিঠি. Unlike the section descriptions, which stay Bengali because
              they are editorial voice about the writing, this one follows the
              interface: it is the offer a reader accepts by handing over an
              address, and the terms of that have to be readable by whoever is
              agreeing to them. Same reasoning in `letter-block.tsx`. */}
          <div>
            <h2 lang={locale} className={cn("text-xl text-content", isBn ? "font-display" : "font-serif")}>
              {t("letter.label")}
            </h2>
            <p
              lang={locale}
              className={cn(
                "mt-2 max-w-sm text-bengali-sm text-content-soft",
                isBn ? "font-bengali" : "font-serif",
              )}
            >
              {t("letter.footerPitch")}
            </p>
            <div className="mt-4">
              <SubscribeForm source="footer" />
            </div>
          </div>

          {/* Sections */}
          <nav lang={locale} aria-label={t("nav.sections")}>
            <h2 className={cn("label mb-4", isBn && "font-bengali-sans tracking-normal")}>
              {t("nav.sections")}
            </h2>
            <ul className="space-y-2.5">
              {PRIMARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-baseline gap-2 text-sm text-content-soft transition hover:text-accent"
                  >
                    <NavLabel item={item} glossClassName="ml-0 font-bengali text-xs text-content-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* More */}
          <nav lang={locale} aria-label={t("nav.more")}>
            <h2 className={cn("label mb-4", isBn && "font-bengali-sans tracking-normal")}>
              {t("nav.more")}
            </h2>
            <ul className="space-y-2.5">
              {SECONDARY_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex items-baseline gap-2 text-sm text-content-soft transition hover:text-accent"
                  >
                    <NavLabel item={item} glossClassName="ml-0 font-bengali text-xs text-content-faint" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/bookmarks"
                  className="group flex items-baseline gap-2 text-sm text-content-soft transition hover:text-accent"
                >
                  <NavLabel item={{ labelEn: t("nav.saved"), labelBn: "পরে পড়ব" }} glossClassName="ml-0 font-bengali text-xs text-content-faint" />
                </Link>
              </li>
              <li>
                <a
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2 text-sm text-content-soft transition hover:text-accent"
                >
                  <Instagram className="h-3.5 w-3.5" />
                  <span className={isBn ? "font-bengali" : "font-serif"}>
                    {t("header.instagram")}
                  </span>
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Colophon. A literary journal names its types — and it doubles as a
            quiet signal that the Bengali typography here was chosen, not
            defaulted into. */}
        <div className="mt-14 flex flex-col gap-4 border-t border-rule pt-6 sm:flex-row sm:items-baseline sm:justify-between">
          <p
            className={cn(
              "label normal-case tracking-normal",
              isBn && "font-bengali-sans",
            )}
            lang={locale}
          >
            {t("footer.colophon")}
          </p>
          <p className="font-bengali text-xs text-content-faint" lang="bn">
            © {toBengaliNumber(year)} Thoughts Whatever
          </p>
        </div>
      </div>
    </footer>
  );
}
