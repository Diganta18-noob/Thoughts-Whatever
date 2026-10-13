"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe2 } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

export function ReferenceRightsContent() {
  const { isBn: contextIsBn, setLocale } = useLanguage();
  // Allow an explicit toggle on this page or follow the site language preference
  const [lang, setLang] = useState<"en" | "bn">(contextIsBn ? "bn" : "en");

  const isEnglish = lang === "en";

  const handleLangChange = (newLang: "en" | "bn") => {
    setLang(newLang);
    setLocale(newLang);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      {/* Top Navigation & Language Switcher */}
      <div className="pt-8 flex items-center justify-between">
        <Link
          href="/reference"
          className="inline-flex items-center gap-1.5 label !text-content-faint hover:!text-accent transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>{isEnglish ? "Back to Reference Library" : "রেফারেন্স লাইব্রেরিতে ফিরুন"}</span>
        </Link>

        {/* Dual Language Switcher Pill */}
        <div className="inline-flex items-center gap-1 bg-surface-raised border border-rule p-1 rounded-lg text-xs font-mono">
          <Globe2 className="w-3.5 h-3.5 text-content-faint ml-1 mr-0.5" />
          <button
            onClick={() => handleLangChange("en")}
            className={`px-2.5 py-1 rounded transition-colors ${
              isEnglish
                ? "bg-accent text-surface font-bold shadow-sm"
                : "text-content-faint hover:text-content"
            }`}
          >
            English
          </button>
          <button
            onClick={() => handleLangChange("bn")}
            className={`px-2.5 py-1 rounded transition-colors font-bengali ${
              !isEnglish
                ? "bg-accent text-surface font-bold shadow-sm"
                : "text-content-faint hover:text-content"
            }`}
          >
            বাংলা
          </button>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-rule pb-8 pt-10 sm:pt-14">
        <span className="label block uppercase tracking-widest text-content-faint">
          {isEnglish ? "Archive & Provenance Policy" : "আর্কাইভ ও স্বত্বাধিকার নীতি"}
        </span>
        <h1 className={`mt-3 text-[2rem] sm:text-[2.5rem] font-medium leading-tight text-content ${!isEnglish ? "font-bengali" : "font-sans"}`}>
          {isEnglish ? "Rights & Provenance Policy" : "স্বত্ব ও অধিকার সংরক্ষণ নীতি"}
        </h1>
        <p className={`mt-3 max-w-measure-wide text-sm sm:text-base leading-relaxed text-content-soft ${!isEnglish ? "font-bengali" : "font-sans"}`}>
          {isEnglish
            ? "Editorial, legal rights framework, public domain evaluation, and digital preservation principles for the Thoughts.Whatever Reference Library."
            : "বৌদ্ধিক স্বত্বাধিকার, পাবলিক ডোমেইন মূল্যায়ন ও দায়িত্বশীল সংরক্ষণের প্রাতিষ্ঠানিক রূপরেখা।"}
        </p>
      </header>

      {/* Policy Content */}
      <div className="mx-auto max-w-measure py-12 space-y-12 text-sm leading-relaxed text-content-soft font-serif">
        {/* Section 1 */}
        <section className="space-y-4">
          <span className="label block">1. The Core Invariant</span>
          <h2 className={`text-2xl font-medium text-content ${!isEnglish ? "font-bengali" : "font-sans"}`}>
            {isEnglish ? "Verified Rights & Institutional Provenance" : "যাচাইকৃত স্বত্ব ও প্রাতিষ্ঠানিক যোগসূত্র"}
          </h2>
          {isEnglish ? (
            <div className="space-y-3 font-sans text-sm leading-relaxed text-content-soft">
              <p>
                <strong>Thoughts.Whatever</strong> is not an indiscriminate file-sharing repository. Our core invariant:{" "}
                <em className="text-content font-serif">
                  &ldquo;We only host and serve digital materials when their public-domain status or licensing has been independently verified; otherwise, we direct readers straight to the original institutional archive.&rdquo;
                </em>
              </p>
              <p className="text-xs text-content-faint italic border-l-2 border-accent/40 pl-3">
                Availability on Internet Archive, university libraries, or open scans does not automatically confer redistribution or commercial reproduction rights. Online accessibility and copyright distribution are treated as distinct legal realities.
              </p>
            </div>
          ) : (
            <div className="space-y-3 font-bengali text-bengali-base leading-relaxed text-content-soft">
              <p>
                Thoughts.Whatever কোনো সাধারণ ফাইল-ডাউনলোড পোর্টাল নয়। আমাদের মূল নীতি:{" "}
                <em>&ldquo;যাচাইকৃত স্বত্বাধিকার থাকলে তবেই নিজস্ব সার্ভারে সংরক্ষিত রাখি; অন্যথায় মূল প্রাতিষ্ঠানিক সংগ্রহাগারের সরাসরি রেফারেন্স লিংক প্রদান করি।&rdquo;</em>
              </p>
              <p className="text-xs text-content-faint italic border-l-2 border-accent/40 pl-3 not-bengali">
                Internet Archive availability does not automatically establish redistribution or hosting rights. Online accessibility and copyright redistribution are treated as distinct legal questions.
              </p>
            </div>
          )}
        </section>

        {/* Section 2 */}
        <section className="space-y-4 border-t border-rule pt-8">
          <span className="label block">2. Work vs. Edition Distinction</span>
          <h2 className={`text-2xl font-medium text-content ${!isEnglish ? "font-bengali" : "font-sans"}`}>
            {isEnglish ? "Intellectual Work vs. Specific Edition" : "মূল সাহিত্যকর্ম বনাম সুনির্দিষ্ট সংস্করণ"}
          </h2>
          {isEnglish ? (
            <div className="space-y-3 font-sans text-sm leading-relaxed text-content-soft">
              <p>
                While a classical literary or mythological work (such as the <em>Kalika Purana</em>, <em>Meghnad Badh Kavya</em>, or <em>Anandamath</em>) may be firmly in the Public Domain, modern translations, critical editions, scholarly annotations, or newly illustrated prints may carry independent copyright.
              </p>
              <p>
                For this reason, Thoughts.Whatever maintains a strict structural separation between the overarching intellectual <strong>Work</strong> and the specific physical/digital <strong>Edition</strong>. Rights are evaluated and verified per-edition, guaranteeing that archival fidelity and copyright safety never conflict.
              </p>
            </div>
          ) : (
            <p className="font-bengali text-bengali-base leading-relaxed text-content-soft">
              একটি ঐতিহাসিক ধ্রুপদী সাহিত্যকর্ম (যেমন: কালিকাপুরাণ বা আনন্দমঠ) সার্বজনীন বা পাবলিক ডোমেইন হলেও, তার কোনো আধুনিক বঙ্গানুবাদ, সম্পাদনালব্ধ টীকা বা সচিত্র সংস্করণ নতুন কপিরাইটের আওতাভুক্ত হতে পারে। এই কারণে Thoughts.Whatever মূল সাহিত্যকর্মের (&lsquo;Work&rsquo;) সাথে সুনির্দিষ্ট সংস্করণকে (&lsquo;Edition&rsquo;) প্রযুক্তিগতভাবে পৃথক রেখে প্রতিটির জন্য আলাদা স্বত্ব মূল্যায়ন বজায় রাখে।
            </p>
          )}
        </section>

        {/* Section 3 */}
        <section className="space-y-4 border-t border-rule pt-8">
          <span className="label block">3. Rights Classifications</span>
          <h2 className={`text-2xl font-medium text-content ${!isEnglish ? "font-bengali" : "font-sans"}`}>
            {isEnglish ? "Rights & Status Taxonomy" : "স্বত্ব নির্দেশক শ্রেণীবিভাগ"}
          </h2>

          <div className="space-y-4 pt-2">
            {/* Public Domain */}
            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <div className="flex items-center justify-between">
                <span className="label text-emerald-500 font-bold">Public Domain</span>
                <span className="text-[0.625rem] font-mono text-emerald-400/80 uppercase tracking-widest border border-emerald-500/30 px-1.5 py-0.5 rounded">
                  Open Access
                </span>
              </div>
              <p className={isEnglish ? "font-sans text-xs text-content-soft leading-relaxed" : "font-bengali text-xs text-content-soft leading-relaxed"}>
                {isEnglish
                  ? "Works where copyright protection has expired under Indian Copyright Law, 1957 (e.g., author passed away more than 60 years ago) or corresponding international statutes. Full in-site reading, high-res scan inspection, and local downloads are permitted."
                  : "ভারতীয় কপিরাইট আইন, ১৯৫৭ (সংশোধিত ২০১২) অনুযায়ী যেসকল সাহিত্যকর্মের রচয়িতার প্রয়াণ-পরবর্তী ৬০ বছর মেয়াদ অতিক্রান্ত হয়েছে। এর ডিজিটাল প্রতিলিপি পাঠ ও গবেষণার জন্য উন্মুক্ত।"}
              </p>
            </div>

            {/* Licensed */}
            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <div className="flex items-center justify-between">
                <span className="label text-sky-400 font-bold">Licensed</span>
                <span className="text-[0.625rem] font-mono text-sky-400/80 uppercase tracking-widest border border-sky-400/30 px-1.5 py-0.5 rounded">
                  Authorized
                </span>
              </div>
              <p className={isEnglish ? "font-sans text-xs text-content-soft leading-relaxed" : "font-bengali text-xs text-content-soft leading-relaxed"}>
                {isEnglish
                  ? "Materials hosted under explicit permission, copyright holder authorization, archival bequest (such as Debabrata Biswas's recorded personal directive), or Creative Commons licenses."
                  : "ক্রিয়েটিভ কমন্স বা স্বত্বাধিকারী/সংগঠনের স্পষ্ট লিখিত অনুমতি বা প্রাতিষ্ঠানিক চুক্তির অধীনে পরিবেশিত সাহিত্যকর্ম।"}
              </p>
            </div>

            {/* External Source */}
            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <div className="flex items-center justify-between">
                <span className="label text-content-faint font-bold">External Source</span>
                <span className="text-[0.625rem] font-mono text-content-faint uppercase tracking-widest border border-rule px-1.5 py-0.5 rounded">
                  Referenced Only
                </span>
              </div>
              <p className={isEnglish ? "font-sans text-xs text-content-soft leading-relaxed" : "font-bengali text-xs text-content-soft leading-relaxed"}>
                {isEnglish
                  ? "Archival catalogs and scans indexed from National Library, university collections, or repository partners. Readers are provided with direct repository links; no local files are hosted."
                  : "ন্যাশনাল লাইব্রেরি বা বিশ্ববিদ্যালয় সংগ্রহশালার মূল ক্যাটালগের সরাসরি রেফারেন্স লিংক প্রদান করা হয়; কোনো নিজস্ব ফাইল হোস্ট করা হয় না।"}
              </p>
            </div>

            {/* Rights Unverified */}
            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <div className="flex items-center justify-between">
                <span className="label text-amber-400 font-bold">Rights Unverified</span>
                <span className="text-[0.625rem] font-mono text-amber-400 uppercase tracking-widest border border-amber-400/30 px-1.5 py-0.5 rounded">
                  Under Review
                </span>
              </div>
              <p className={isEnglish ? "font-sans text-xs text-content-soft leading-relaxed" : "font-bengali text-xs text-content-soft leading-relaxed"}>
                {isEnglish
                  ? "Materials whose publication timeline, translator contracts, or copyright renewals are undergoing editorial verification. File downloads and raw media hosting are strictly prohibited on these editions pending verification."
                  : "উপাদানটির প্রকাশনা ইতিহাস ও আইনি স্থিতি এখনও পরীক্ষাধীন। এই অবস্থায় কোনো ডাউনলোড বা অনলাইন রিডার ফাইল রাখা সম্পূর্ণ নিষিদ্ধ।"}
              </p>
            </div>

            {/* Restricted */}
            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <div className="flex items-center justify-between">
                <span className="label text-rose-400 font-bold">Restricted</span>
                <span className="text-[0.625rem] font-mono text-rose-400 uppercase tracking-widest border border-rose-400/30 px-1.5 py-0.5 rounded">
                  In Copyright
                </span>
              </div>
              <p className={isEnglish ? "font-sans text-xs text-content-soft leading-relaxed" : "font-bengali text-xs text-content-soft leading-relaxed"}>
                {isEnglish
                  ? "Works under active commercial copyright. Displayed solely for bibliographic research, citations, and critical commentary. No files or media are stored or distributed."
                  : "সক্রিয় কপিরাইটের আওতাভুক্ত সাহিত্যকর্ম। কেবল গবেষকদের জন্য গ্রন্থপঞ্জি তথ্য হিসেবে প্রদর্শিত; কোনো ফাইল সংরক্ষণ করা হয় না।"}
              </p>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4 border-t border-rule pt-8">
          <span className="label block">4. Takedown & Grievance Redressal</span>
          <h2 className={`text-2xl font-medium text-content ${!isEnglish ? "font-bengali" : "font-sans"}`}>
            {isEnglish ? "Takedown Notice & Grievance Mechanism" : "আপত্তি ও টেকডাউন নীতি"}
          </h2>
          {isEnglish ? (
            <div className="space-y-3 font-sans text-sm leading-relaxed text-content-soft">
              <p>
                Thoughts.Whatever respects the intellectual property rights of authors, translators, estates, and academic publishers. If you are a copyright owner or an authorized representative and believe that any cataloged record or media item infringes upon your copyright, you may submit an expedited notice via the <strong>&ldquo;Report Rights Issue&rdquo;</strong> button on the item&rsquo;s dossier page.
              </p>
              <p>
                Our editorial and archival team investigates all legitimate inquiries within 48 hours and will restrict or remove disputed files immediately pending formal resolution.
              </p>
            </div>
          ) : (
            <p className="font-bengali text-bengali-base leading-relaxed text-content-soft">
              যদি কোনো সাহিত্যকর্ম বা নথির বৈধ স্বত্বাধিকারী মনে করেন যে তার অধিকার লঙ্ঘিত হয়েছে, তবে সংশ্লিষ্ট উপাদানটির বিবরণ পাতায় থাকা &ldquo;Report Rights Issue&rdquo; ফর্মের মাধ্যমে তাৎক্ষণিকভাবে নোটিশ পাঠাতে পারেন। আমাদের সম্পাদকীয় দল তা দ্রুত পর্যালোচনা করে ব্যবস্থা গ্রহণ করবে।
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
