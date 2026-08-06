"use client";

import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatNumber } from "@/lib/i18n/format";

type TimelineEntry = { year: number; month: number; count: number };

const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const { locale, isBn, t } = useLanguage();

  if (!entries.length) return null;

  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";
  const months = isBn ? BN_MONTHS : EN_MONTHS;

  return (
    <section className="py-16">
      <Reveal>
        <div className="mb-8 border-b border-rule pb-3">
          <h2 className="font-bengali text-2xl font-medium text-content" lang="bn">
            সময়রেখা
          </h2>
          {!isBn && (
            <p className="mt-1 font-serif text-sm italic text-content-faint" lang="en">
              {t("home.timelineGloss")}
            </p>
          )}
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="relative -mx-4 sm:-mx-6">
          <div className="overflow-x-auto px-4 pb-4 sm:px-6">
            <div className="flex gap-3">
              {entries.map((entry) => (
                <Link
                  key={`${entry.year}-${entry.month}`}
                  href={`/archive?year=${entry.year}`}
                  className="group flex shrink-0 flex-col items-start gap-2 rounded-sm border border-rule bg-surface px-4 py-3 transition hover:border-accent/40"
                >
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-sm font-medium text-content transition group-hover:text-accent ${isBn ? "font-bengali-sans" : "font-mono"}`}
                    >
                      {months[entry.month - 1]}
                    </span>
                    <span className={`text-xs text-content-faint ${monoFace}`}>
                      {formatNumber(entry.year, locale)}
                    </span>
                  </div>
                  <span className={`text-[0.6875rem] text-content-faint ${monoFace}`}>
                    {t("common.count", {
                      count: formatNumber(entry.count, locale),
                    })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
