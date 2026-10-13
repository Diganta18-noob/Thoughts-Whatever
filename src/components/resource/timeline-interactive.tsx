"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  History,
  Bookmark,
  Share2,
} from "lucide-react";
import {
  TIMELINE_DATA,
  TIMELINE_ERAS,
  CATEGORIES,
  TIMELINE_FAQS,
  type TimelineItem,
} from "@/lib/timeline-data";

export function TimelineInteractive() {
  const [selectedEra, setSelectedEra] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("all");
  const [realSearch, setRealSearch] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>("meghnadbadh-1861");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredItems = useMemo(() => {
    return TIMELINE_DATA.filter((item) => {
      const matchesEra = selectedEra === "all" || item.eraId === selectedEra;
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const q = realSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.titleBn.toLowerCase().includes(q) ||
        (item.titleEn && item.titleEn.toLowerCase().includes(q)) ||
        item.authorBn.toLowerCase().includes(q) ||
        item.significanceBn.toLowerCase().includes(q) ||
        item.year.includes(q);

      return matchesEra && matchesCategory && matchesSearch;
    });
  }, [selectedEra, selectedCategory, realSearch]);

  return (
    <div className="space-y-12">
      {/* ── Filter Bar & Controls ────────────────────────── */}
      <section className="sticky top-16 z-20 rounded-xl border border-rule/80 bg-surface/95 p-4 shadow-sm backdrop-blur transition-all">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-faint" />
            <input
              type="text"
              value={realSearch}
              onChange={(e) => setRealSearch(e.target.value)}
              placeholder="লেখক, বইয়ের নাম বা সাল খুঁজুন (যেমন: রবীন্দ্রনাথ, ১৮৬১, নীলদর্পণ)..."
              className="w-full rounded-md border border-rule bg-surface-raised/60 py-2.5 pl-10 pr-4 font-bengali text-sm text-content placeholder:text-content-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition"
            />
            {realSearch && (
              <button
                onClick={() => setRealSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-content-faint hover:text-content"
              >
                মুছুন
              </button>
            )}
          </div>

          {/* Category Dropdown/Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-md px-3 py-1.5 font-bengali text-xs transition ${
                  selectedCategory === cat.id
                    ? "bg-accent text-surface font-semibold shadow-xs"
                    : "border border-rule bg-surface-raised/40 text-content-soft hover:border-accent/40 hover:text-content"
                }`}
              >
                {cat.labelBn}
              </button>
            ))}
          </div>
        </div>

        {/* Eras Horizontal Selector */}
        <div className="mt-4 flex gap-2 overflow-x-auto border-t border-rule/60 pt-3 scrollbar-thin">
          {TIMELINE_ERAS.map((era) => {
            const isSelected = selectedEra === era.id;
            return (
              <button
                key={era.id}
                onClick={() => setSelectedEra(era.id)}
                className={`group flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-left transition ${
                  isSelected
                    ? "border border-accent/60 bg-accent/10 text-accent font-medium shadow-xs"
                    : "border border-rule/60 bg-surface-raised/20 text-content-soft hover:border-accent/40 hover:text-content"
                }`}
              >
                <div className="min-w-0">
                  <div className="font-bengali text-xs font-medium">
                    {era.nameBn}
                  </div>
                  <div className="font-mono text-[0.65rem] text-content-faint group-hover:text-content-soft">
                    {era.range}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Active Filters Summary ───────────────────────── */}
      <div className="flex items-center justify-between text-xs font-mono text-content-faint">
        <div>
          পাওয়া গেছে:{" "}
          <span className="font-semibold text-content">
            {filteredItems.length}
          </span>{" "}
          টি যুগান্তকারী ঘটনা
        </div>
        {(selectedEra !== "all" ||
          selectedCategory !== "all" ||
          realSearch) && (
          <button
            onClick={() => {
              setSelectedEra("all");
              setSelectedCategory("all");
              setRealSearch("");
            }}
            className="text-accent underline hover:opacity-80 transition"
          >
            সব ফিল্টার রিসেট করুন
          </button>
        )}
      </div>

      {/* ── Timeline Road / Milestones ───────────────────── */}
      <div className="relative border-l-2 border-accent/30 pl-4 sm:pl-8 space-y-10 ml-3 sm:ml-6">
        {filteredItems.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id} className="relative group">
              {/* Timeline Marker Dot */}
              <div
                className={`absolute -left-[23px] sm:-left-[39px] top-6 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full border-2 transition ${
                  item.featured
                    ? "border-accent bg-accent text-surface shadow-md"
                    : "border-rule/80 bg-surface text-content-faint group-hover:border-accent group-hover:text-accent"
                }`}
              >
                <Sparkles className="h-3 w-3" />
              </div>

              {/* Card Body */}
              <div
                className={`rounded-xl border transition-all duration-200 ${
                  isExpanded
                    ? "border-accent/60 bg-surface-raised/60 shadow-md ring-1 ring-accent/20"
                    : "border-rule/80 bg-surface-raised/30 hover:border-accent/40 hover:bg-surface-raised/50"
                } p-5 sm:p-7`}
              >
                {/* Header info */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule/50 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-md bg-accent/15 px-3 py-1 font-mono text-sm font-bold text-accent">
                      {item.year}
                    </span>
                    <span className="font-bengali text-xs text-content-faint font-medium">
                      {item.eraNameBn}
                    </span>
                  </div>
                  <span className="rounded-full border border-rule/80 px-2.5 py-0.5 font-bengali text-[0.7rem] text-content-soft">
                    {item.categoryLabelBn}
                  </span>
                </div>

                {/* Main Title & Author */}
                <div className="mt-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                  <h3 className="font-bengali text-xl font-semibold leading-snug text-content group-hover:text-accent sm:text-2xl transition-colors">
                    {item.titleBn}
                  </h3>
                  <div className="mt-1 font-bengali text-sm font-medium text-accent/90">
                    লেখক / রূপকার: {item.authorBn}
                  </div>
                  <p className="mt-3 font-bengali text-base leading-relaxed text-content-soft">
                    {item.significanceBn}
                  </p>
                </div>

                {/* Expandable Deep Dive Section */}
                {isExpanded && (
                  <div className="mt-5 space-y-4 border-t border-rule/60 pt-4 animate-in fade-in duration-200">
                    <div>
                      <h4 className="flex items-center gap-2 font-bengali text-xs font-bold uppercase tracking-wider text-content-faint">
                        <History className="h-3.5 w-3.5 text-accent" />
                        ঐতিহাসিক পটভূমি ও প্রেক্ষাপট:
                      </h4>
                      <p className="mt-1.5 font-bengali text-sm leading-relaxed text-content">
                        {item.historicalContextBn}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bengali text-xs font-bold uppercase tracking-wider text-content-faint">
                        মূল প্রভাব ও উল্লেখযোগ্য বৈশিষ্ট্য:
                      </h4>
                      <ul className="mt-2 space-y-1.5 font-bengali text-sm text-content-soft">
                        {item.keyPointsBn.map((point, pIdx) => (
                          <li key={pIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent/80 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Internal Link to Thoughts Whatever companion piece */}
                    {item.twLink && (
                      <div className="mt-5 rounded-lg border border-accent/30 bg-accent/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent font-semibold">
                            Thoughts Whatever গভীর বিশ্লেষণ
                          </div>
                          <div className="font-bengali text-sm font-medium text-content">
                            {item.twLinkLabelBn || "সম্পূর্ণ তথ্যচিত্র ও পাঠ-পর্যালোচনা দেখুন"}
                          </div>
                        </div>
                        <Link
                          href={item.twLink}
                          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 font-bengali text-xs font-semibold text-surface transition hover:opacity-90 shrink-0 shadow-xs"
                        >
                          <span>পড়ুন ও দেখুন</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Footer toggle */}
                <div className="mt-4 flex items-center justify-between pt-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="inline-flex items-center gap-1 font-bengali text-xs font-medium text-accent hover:underline"
                  >
                    <span>{isExpanded ? "সংক্ষিপ্ত করুন" : "বিস্তারিত প্রেক্ষাপট দেখুন"}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <span className="font-mono text-[0.6875rem] text-content-faint">
                    #{idx + 1}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── FAQ Section Accordion ────────────────────────── */}
      <section className="mt-20 rounded-2xl border border-rule/80 bg-surface-raised/40 p-6 sm:p-10">
        <div className="max-w-measure-wide">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-semibold">
            <BookOpen className="h-4 w-4" />
            <span>সচরাচর জিজ্ঞাসা ও প্রশ্নোত্তর</span>
          </div>
          <h2 className="mt-2 font-bengali text-2xl font-bold text-content sm:text-3xl">
            বাংলা সাহিত্যের ইতিহাস নিয়ে গুরুত্বপূর্ণ প্রশ্নোত্তর
          </h2>
          <p className="mt-2 font-bengali text-sm text-content-soft">
            বিশ্ববিদ্যালয়, প্রতিযোগিতামূলক পরীক্ষা (WBCS) এবং বাংলা সাহিত্যের অনুরাগীদের জন্য বিশদ ব্যাখ্যা।
          </p>

          <div className="mt-8 divide-y divide-rule/60">
            {TIMELINE_FAQS.map((faq, fIdx) => {
              const isOpen = openFaqIndex === fIdx;
              return (
                <div key={fIdx} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : fIdx)}
                    className="flex w-full items-center justify-between gap-4 text-left font-bengali text-lg font-medium text-content hover:text-accent transition-colors"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-content-faint transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-accent" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 font-bengali text-base leading-relaxed text-content-soft animate-in fade-in duration-200">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
