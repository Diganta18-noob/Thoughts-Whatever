"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Globe,
  History,
  Users,
  HelpCircle,
  ChevronDown,
  Sparkles,
  ArrowRight,
  BookmarkCheck,
  BookOpen,
} from "lucide-react";
import { type SeriesEnhancement } from "@/lib/series-enhancements";

export function SeriesEnhancementsView({
  enhancement,
}: {
  enhancement: SeriesEnhancement;
}) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showEnglishAbstract, setShowEnglishAbstract] = useState<boolean>(true);

  return (
    <div className="mt-16 space-y-12">
      {/* ── Section 1: English Abstract & Global Context ──── */}
      <section className="rounded-2xl border border-rule/80 bg-surface-raised/50 p-6 sm:p-8 backdrop-blur shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-rule/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-accent/15 text-accent">
              <Globe className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-semibold text-content">
                English Overview & Critical Abstract
              </h2>
              <p className="text-xs text-content-faint font-sans">
                {enhancement.englishTitle} · {enhancement.englishAuthor}
              </p>
            </div>
          </div>
          <span className="inline-flex self-start sm:self-auto items-center gap-1 rounded-full border border-rule px-2.5 py-0.5 font-mono text-[0.6875rem] text-content-soft">
            Bilingual Reference
          </span>
        </div>

        <div className="mt-6 space-y-4 font-sans text-sm leading-relaxed text-content-soft">
          <p className="text-content font-serif text-base leading-relaxed">
            {enhancement.englishAbstract.overview}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="rounded-xl border border-rule/60 bg-surface p-4">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent font-semibold">
                Historical Impact
              </span>
              <p className="mt-1.5 text-xs text-content-soft leading-relaxed">
                {enhancement.englishAbstract.historicalImportance}
              </p>
            </div>
            <div className="rounded-xl border border-rule/60 bg-surface p-4">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent font-semibold">
                Literary Significance
              </span>
              <p className="mt-1.5 text-xs text-content-soft leading-relaxed">
                {enhancement.englishAbstract.literarySignificance}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Historical Background ──────────────── */}
      <section className="rounded-2xl border border-rule/80 bg-surface-raised/40 p-6 sm:p-8">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-semibold">
          <History className="h-4 w-4" />
          <span>ঐতিহাসিক প্রেক্ষাপট ও যুগপ্রভাব</span>
        </div>

        <h2 className="mt-2 font-bengali text-2xl font-bold text-content sm:text-3xl">
          {enhancement.historicalContext.titleBn}
        </h2>
        <div className="mt-1 font-bengali text-xs text-content-faint">
          কালপর্ব: {enhancement.historicalContext.periodBn}
        </div>

        <p className="mt-4 font-bengali text-base leading-relaxed text-content-soft">
          {enhancement.historicalContext.narrativeBn}
        </p>

        <div className="mt-6 border-t border-rule/50 pt-5">
          <h3 className="font-bengali text-xs font-bold uppercase tracking-wider text-content-faint mb-3">
            উল্লেখযোগ্য ঐতিহাসিক তথ্য ও গুরুত্ব:
          </h3>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {enhancement.historicalContext.keyFactsBn.map((fact, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 rounded-lg border border-rule/50 bg-surface/60 p-3 font-bengali text-xs text-content"
              >
                <Sparkles className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Section 3: Characters & Archetypes ────────────── */}
      <section>
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-semibold mb-2">
          <Users className="h-4 w-4" />
          <span>চরিত্র পরিচয় ও মনস্তাত্ত্বিক রূপরেখা</span>
        </div>
        <h2 className="font-bengali text-2xl font-bold text-content sm:text-3xl mb-6">
          প্রধান চরিত্রসমূহ ও সামাজিক প্রতীক
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {enhancement.characters.map((char, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-rule/80 bg-surface-raised/40 p-5 hover:border-accent/40 transition"
            >
              <div className="flex items-baseline justify-between gap-2 border-b border-rule/50 pb-2">
                <h3 className="font-bengali text-lg font-semibold text-content">
                  {char.nameBn}
                </h3>
                <span className="font-mono text-xs text-content-faint">
                  {char.nameEn}
                </span>
              </div>
              <div className="mt-2 font-bengali text-xs font-medium text-accent">
                {char.roleBn}
              </div>
              <p className="mt-2 font-bengali text-sm text-content-soft leading-relaxed">
                {char.significanceBn}
              </p>
              {char.quoteOrTraitBn && (
                <div className="mt-3 rounded-md bg-surface p-2.5 font-bengali text-xs italic text-content-faint border border-rule/40">
                  {char.quoteOrTraitBn}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Timeline Connection Cross-Link ─────── */}
      <section className="rounded-2xl border border-accent/40 bg-gradient-to-r from-accent/10 via-surface-raised to-accent/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent font-bold">
            ঐতিহাসিক টাইমলাইন সংযোগ · Bengali Literature Timeline
          </span>
          <h3 className="font-bengali text-xl font-bold text-content">
            {enhancement.timelineEraLabelBn}-এ এই সৃষ্টির স্থান
          </h3>
          <p className="font-bengali text-xs text-content-soft max-w-xl">
            ফোর্ট উইলিয়াম কলেজ থেকে সমকালীন সাহিত্য — ১৮০০ থেকে ২০২৫ পর্যন্ত বাংলা সাহিত্যের ২২৫ বছরের সমগ্র ঐতিহাসিক টাইমলাইনে এই সৃষ্টির ভূমিকা দেখুন।
          </p>
        </div>
        <Link
          href="/resource/bangla-sahityer-timeline"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-bengali text-sm font-semibold text-surface transition hover:opacity-90 shrink-0 shadow-sm"
        >
          <span>পূর্ণাঙ্গ টাইমলাইন দেখুন</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* ── Section 5: FAQs Accordion ─────────────────────── */}
      <section className="rounded-2xl border border-rule/80 bg-surface-raised/40 p-6 sm:p-8">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-semibold">
          <HelpCircle className="h-4 w-4" />
          <span>সচরাচর জিজ্ঞাসা ও প্রশ্নোত্তর (FAQs)</span>
        </div>
        <h2 className="mt-2 font-bengali text-2xl font-bold text-content sm:text-3xl">
          গবেষণা ও পরীক্ষার জন্য প্রয়োজনীয় প্রশ্নোত্তর
        </h2>

        <div className="mt-6 divide-y divide-rule/60">
          {enhancement.faqs.map((faq, fIdx) => {
            const isOpen = openFaqIndex === fIdx;
            return (
              <div key={fIdx} className="py-4">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                  className="flex w-full items-center justify-between gap-4 text-left font-bengali text-base sm:text-lg font-medium text-content hover:text-accent transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-content-faint transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-accent" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 font-bengali text-sm sm:text-base leading-relaxed text-content-soft animate-in fade-in duration-200">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 6: Citation Box ──────────────────────── */}
      <aside className="rounded-xl border border-rule/80 bg-surface p-5 sm:p-6 text-xs text-content-soft font-sans">
        <div className="flex items-center gap-2 font-mono text-accent font-semibold uppercase text-[0.6875rem] mb-2">
          <BookmarkCheck className="h-3.5 w-3.5" />
          <span>How to cite this analysis</span>
        </div>
        <div className="font-mono text-xs bg-surface-raised p-3 rounded border border-rule/60 select-all text-content">
          Thoughts Whatever (2026). {enhancement.englishTitle} — Comprehensive Literary & Historical Analysis. thoughtswhatever.in/series/{enhancement.slug}
        </div>
      </aside>
    </div>
  );
}
