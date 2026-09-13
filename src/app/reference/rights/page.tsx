import React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rights & Provenance Policy | Reference Library | Thoughts.Whatever",
  description:
    "Editorial and legal rights framework for the Thoughts.Whatever Reference Library and Digital Archive.",
};

export default function ReferenceRightsPolicyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="pt-8">
        <Link
          href="/reference"
          className="inline-flex items-center gap-1.5 label !text-content-faint hover:!text-accent transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Reference Library</span>
        </Link>
      </div>

      <PageHeader
        labelEn="Archive Policy"
        titleBn="স্বত্ব ও অধিকার সংরক্ষণ নীতি"
        descEn="Rights architecture, public domain evaluation, and digital preservation principles"
        descBn="বৌদ্ধিক স্বত্বাধিকার ও দায়িত্বশীল সংরক্ষণের প্রাতিষ্ঠানিক রূপরেখা।"
      />

      <div className="mx-auto max-w-measure py-12 space-y-10 text-sm font-serif leading-relaxed text-content-soft">
        <section className="space-y-4">
          <span className="label block">1. The Core Invariant</span>
          <h2 className="font-bengali text-2xl font-medium text-content">
            যাচাইকৃত স্বত্ব ও প্রাতিষ্ঠানিক যোগসূত্র
          </h2>
          <p className="font-bengali text-bengali-base leading-relaxed text-content-soft">
            Thoughts.Whatever কোনো সাধারণ ফাইল-ডাউনলোড পোর্টাল নয়। আমাদের মূল নীতি: <em>&ldquo;যাচাইকৃত স্বত্বাধিকার থাকলে তবেই নিজস্ব সার্ভারে সংরক্ষিত রাখি; অন্যথায় মূল প্রাতিষ্ঠানিক সংগ্রহাগারের সরাসরি রেফারেন্স লিংক প্রদান করি।&rdquo;</em>
          </p>
          <p className="text-xs text-content-faint italic">
            Internet Archive availability does not automatically establish redistribution or hosting rights. Online accessibility and copyright redistribution are treated as distinct legal questions.
          </p>
        </section>

        <section className="space-y-4 border-t border-rule pt-8">
          <span className="label block">2. Work vs. Edition Distinction</span>
          <h2 className="font-bengali text-2xl font-medium text-content">
            মূল সাহিত্যকর্ম বনাম সুনির্দিষ্ট সংস্করণ
          </h2>
          <p className="font-bengali text-bengali-base leading-relaxed text-content-soft">
            একটি ঐতিহাসিক ধ্রুপদী সাহিত্যকর্ম (যেমন: কালিকাপুরাণ বা আনন্দমঠ) সার্বজনীন বা পাবলিক ডোমেইন হলেও, তার কোনো আধুনিক বঙ্গানুবাদ, সম্পাদনালব্ধ টীকা বা সচিত্র সংস্করণ নতুন কপিরাইটের আওতাভুক্ত হতে পারে। এই কারণে Thoughts.Whatever মূল সাহিত্যকর্মের (&lsquo;Work&rsquo;) সাথে সুনির্দিষ্ট সংস্করণকে (&lsquo;Edition&rsquo;) প্রযুক্তিগতভাবে পৃথক রেখে প্রতিটির জন্য আলাদা স্বত্ব মূল্যায়ন বজায় রাখে।
          </p>
        </section>

        <section className="space-y-4 border-t border-rule pt-8">
          <span className="label block">3. Rights Classifications</span>
          <h2 className="font-bengali text-2xl font-medium text-content">
            স্বত্ব নির্দেশক শ্রেণীবিভাগ
          </h2>

          <div className="space-y-4 pt-2">
            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <span className="label text-emerald-500">Public Domain</span>
              <p className="font-bengali text-xs text-content-soft leading-relaxed">
                ভারতীয় কপিরাইট আইন, ১৯৫৭ (সংশোধিত ২০১২) অনুযায়ী যেসকল সাহিত্যকর্মের রচয়িতার প্রয়াণ-পরবর্তী ৬০ বছর মেয়াদ অতিক্রান্ত হয়েছে। এর ডিজিটাল প্রতিলিপি পাঠ ও গবেষণার জন্য উন্মুক্ত।
              </p>
            </div>

            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <span className="label text-sky-400">Licensed</span>
              <p className="font-bengali text-xs text-content-soft leading-relaxed">
                ক্রিয়েটিভ কমন্স বা স্বত্বাধিকারী/সংগঠনের স্পষ্ট লিখিত অনুমতি বা প্রাতিষ্ঠানিক চুক্তির অধীনে পরিবেশিত সাহিত্যকর্ম।
              </p>
            </div>

            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <span className="label text-content-faint">External Source</span>
              <p className="font-bengali text-xs text-content-soft leading-relaxed">
                ন্যাশনাল লাইব্রেরি বা বিশ্ববিদ্যালয় সংগ্রহশালার মূল ক্যাটালগের সরাসরি রেফারেন্স লিংক প্রদান করা হয়; কোনো নিজস্ব ফাইল হোস্ট করা হয় না।
              </p>
            </div>

            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <span className="label text-amber-400">Rights Unverified</span>
              <p className="font-bengali text-xs text-content-soft leading-relaxed">
                উপাদানটির প্রকাশনা ইতিহাস ও আইনি স্থিতি এখনও পরীক্ষাধীন। এই অবস্থায় কোনো ডাউনলোড বা অনলাইন রিডার ফাইল রাখা সম্পূর্ণ নিষিদ্ধ।
              </p>
            </div>

            <div className="border border-rule p-4 space-y-1.5 bg-surface-raised">
              <span className="label text-rose-400">Restricted</span>
              <p className="font-bengali text-xs text-content-soft leading-relaxed">
                সক্রিয় কপিরাইটের আওতাভুক্ত সাহিত্যকর্ম। কেবল গবেষকদের জন্য গ্রন্থপঞ্জি তথ্য হিসেবে প্রদর্শিত; কোনো ফাইল সংরক্ষণ করা হয় না।
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-rule pt-8">
          <span className="label block">4. Takedown & Grievance Mechanism</span>
          <h2 className="font-bengali text-2xl font-medium text-content">
            আপত্তি ও টেকডাউন নীতি
          </h2>
          <p className="font-bengali text-bengali-base leading-relaxed text-content-soft">
            যদি কোনো সাহিত্যকর্ম বা নথির বৈধ স্বত্বাধিকারী মনে করেন যে তার অধিকার লঙ্ঘিত হয়েছে, তবে সংশ্লিষ্ট উপাদানটির বিবরণ পাতায় থাকা &ldquo;Report Rights Issue&rdquo; ফর্মের মাধ্যমে তাৎক্ষণিকভাবে নোটিশ পাঠাতে পারেন। আমাদের সম্পাদকীয় দল তা দ্রুত পর্যালোচনা করে ব্যবস্থা গ্রহণ করবে।
          </p>
        </section>
      </div>
    </div>
  );
}
