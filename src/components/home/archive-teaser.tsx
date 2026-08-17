"use client";

import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatNumber } from "@/lib/i18n/format";

import { SectionHeader } from "@/components/home/section-header";

export function ArchiveTeaser({ years }: { years: number[] }) {
  const { locale, isBn, t } = useLanguage();

  if (!years.length) return null;

  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";

  return (
    <section className="py-section">
      <SectionHeader
        titleBn="সংগ্রহ"
        gloss={t("home.archiveGloss")}
        rank="utility"
      />

      <Reveal delay={0.1}>
        <div>
          <p className={`mb-4 text-sm text-content-faint ${monoFace}`}>
            {t("home.browseByYear")}
          </p>

          <div className="flex flex-wrap gap-2">
            {years.map((year) => (
              <Link
                key={year}
                href={`/archive?year=${year}`}
                className={`inline-flex items-center rounded-full border border-rule px-4 py-2 text-sm transition hover:border-accent/40 hover:text-accent ${monoFace}`}
              >
                {formatNumber(year, locale)}
              </Link>
            ))}
          </div>

          <Link
            href="/archive"
            className={`mt-6 inline-flex items-center gap-2 rounded-sm border border-accent/20 bg-accent/5 px-6 py-3 text-sm transition hover:border-accent/30 hover:bg-accent/10 ${isBn ? "font-bengali" : "font-serif"}`}
            lang={locale}
          >
            {t("home.everythingElse")} →
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
