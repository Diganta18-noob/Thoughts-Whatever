import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, ExternalLink, HelpCircle, Lock, AlertTriangle, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "স্বত্ব ও অধিকার সংরক্ষণ নীতি | রেফারেন্স লাইব্রেরি | Thoughts.Whatever",
  description:
    "Thoughts.Whatever ডিজিটাল আর্কাইভের বৌদ্ধিক স্বত্বাধিকার, পাবলিক ডোমেইন মূল্যায়ন এবং সংরক্ষণ সংক্রান্ত বিস্তারিত নীতি।",
};

export default function ReferenceRightsPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-200 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-12">
        {/* Back Link */}
        <div>
          <Link
            href="/reference"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>রেফারেন্স লাইব্রেরিতে ফিরুন</span>
          </Link>
        </div>

        {/* Title Header */}
        <div className="space-y-4 border-b border-zinc-850 pb-8">
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Editorial & Legal Rights Architecture</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
            স্বত্ব, কপিরাইট ও ডিজিটাল সংরক্ষণ নীতি
          </h1>

          <p className="text-zinc-400 font-serif text-base sm:text-lg leading-relaxed">
            Thoughts.Whatever রেফারেন্স লাইব্রেরি একটি দায়িত্বশীল, অধিকার-সচেতন ডিজিটাল সংগ্রহাগার। আমাদের মূল নীতি: <em>“যাচাইকৃত স্বত্বাধিকার থাকলে তবেই হোস্ট করি; অন্যথায় প্রাতিষ্ঠানিক মূল উৎসে সংযোগ স্থাপন করি।”</em>
          </p>
        </div>

        {/* Core Principles */}
        <section className="space-y-6 text-sm text-zinc-300 leading-relaxed font-sans">
          <h2 className="font-serif text-2xl font-bold text-zinc-100">
            ১. মূল নীতিমালা ও স্বত্ব পরীক্ষণ
          </h2>

          <p>
            Thoughts.Whatever একটি উন্মুক্ত বাণিজ্যিক ফাইল-ডাউনলোড সাইট নয়। এটি বাংলা সাহিত্যের ইতিহাস, ধ্রুপদী পাঠ্য এবং গবেষণামূলক নথির একটি প্রাতিষ্ঠানিক ডিজিটাল সংগ্রহাগার। ইন্টারনেটে কোনো ফাইলের অস্তিত্ব থাকা মানেই তা যথেচ্ছভাবে পুনরুৎপাদন বা পুনর্বন্টনযোগ্য নয়। তাই প্রতিটি নথির ক্ষেত্রে নিম্নলিখিত নীতি প্রযোজ্য:
          </p>

          <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 font-mono text-emerald-400 font-semibold text-xs uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>ইন্টারনেট আর্কাইভ $\neq$ পাবলিক ডোমেইন</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              ইন্টারনেট আর্কাইভ (Internet Archive) বা অন্য যেকোনো উন্মুক্ত পোর্টালে কোনো স্ক্যান আপলোড থাকা স্বয়ংক্রিয়ভাবে তার কপিরাইট-মুক্ত অবস্থা নির্দেশ করে না। আমরা প্রতিটি সংস্করণের প্রকাশনার সাল, রচয়িতা বা সম্পাদকের প্রয়াণ কাল এবং প্রযোজ্য কপিরাইট আইনের ধারা পর্যালোচনা করে পৃথকভাবে স্বত্ব মূল্যায়ন করি। যতক্ষণ না নিশ্চিত প্রমাণ পাওয়া যাচ্ছে, উপাদানটি <strong>‘স্বত্ব অপরীক্ষিত’ (Rights Unverified)</strong> হিসেবে কেবল মূল সূত্রের লিংকসহ তালিকাভুক্ত থাকে।
            </p>
          </div>

          <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center gap-2 font-mono text-emerald-400 font-semibold text-xs uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>মূল সাহিত্যকর্ম বনাম সুনির্দিষ্ট সংস্করণ</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              একটি প্রাচীন পৌরাণিক বা ধ্রুপদী সাহিত্যকর্ম (যেমন: কালিকাপুরাণ বা রামায়ণ) পাবলিক ডোমেইন হলেও, তার কোনো আধুনিক বঙ্গানুবাদ, সম্পাদনালব্ধ টীকা বা বিশেষ সংস্করণ নতুন স্বত্বের আওতাধীন হতে পারে। Thoughts.Whatever মূল সাহিত্যকর্মের (‘Work’) সাথে সুনির্দিষ্ট সংস্করণকে (‘Edition’) প্রযুক্তিগতভাবে পৃথক রেখে প্রতিটি সংস্করণের জন্য স্বতন্ত্র স্বত্ব নিয়ন্ত্রণ করে।
            </p>
          </div>
        </section>

        {/* Rights Badges System */}
        <section className="space-y-6 pt-6 border-t border-zinc-850">
          <h2 className="font-serif text-2xl font-bold text-zinc-100">
            ২. স্বত্ব স্থিতি নির্দেশক (Rights States)
          </h2>

          <div className="grid grid-cols-1 gap-4">
            <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold">
                  PUBLIC DOMAIN
                </span>
                <span className="font-serif font-bold text-zinc-100">পাবলিক ডোমেইন</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                ভারতীয় কপিরাইট আইন, ১৯৫৭ (সংশোধিত ২০১২) অনুযায়ী যেসকল সাহিত্যকর্মের স্বত্বাধিকারীর প্রয়াণ-পরবর্তী ৬০ বছরের মেয়াদ অতিক্রান্ত হয়েছে। এর ডিজিটাল প্রতিলিপি আমাদের সুরক্ষিত স্টোরেজে হোস্ট করা থাকে এবং পাঠকক্ষে সরাসরি পাঠ ও ব্যক্তিগত গবেষণার জন্য ডাউনলোড করা যায়।
              </p>
            </div>

            <div className="p-4 bg-sky-950/20 border border-sky-800/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800 font-semibold">
                  LICENSED
                </span>
                <span className="font-serif font-bold text-zinc-100">অনুমোদিত / লাইসেন্সপ্রাপ্ত</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                যেসব উপাদান ক্রিয়েটিভ কমন্স (Creative Commons) বা স্বত্বাধিকারী/সংগঠনের স্পষ্ট লিখিত অনুমতি বা প্রাতিষ্ঠানিক চুক্তির অধীনে ব্যবহারের অধিকার Thoughts.Whatever লাভ করেছে।
              </p>
            </div>

            <div className="p-4 bg-zinc-900/60 border border-zinc-700/60 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-zinc-850 text-zinc-300 border border-zinc-700 font-semibold">
                  EXTERNAL SOURCE
                </span>
                <span className="font-serif font-bold text-zinc-100">বহিরাগত প্রাতিষ্ঠানিক উৎস</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Thoughts.Whatever কোনো নিজস্ব ফাইল হোস্ট করে না। ন্যাশনাল লাইব্রেরি, বিভিন্ন বিশ্ববিদ্যালয় বা প্রাতিষ্ঠানিক সংগ্রহশালার মূল উন্মুক্ত ক্যাটালগের সরাসরি রেফারেন্স লিংক প্রদান করা হয়।
              </p>
            </div>

            <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-semibold">
                  RIGHTS UNVERIFIED
                </span>
                <span className="font-serif font-bold text-zinc-100">স্বত্ব অপরীক্ষিত</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                উপাদানটির আইনি ও প্রকাশনা ইতিহাস এখনও পূর্ণাঙ্গভাবে যাচাই হয়নি। এই অবস্থায় কোনো ডাউনলোড বা অনলাইন রিডার ফাইল সংরক্ষণ নিষিদ্ধ; ব্যবহারকারীরা কেবল শিরোনাম, গ্রন্থপঞ্জি ও মূল উৎসের লিংক দেখতে পান।
              </p>
            </div>

            <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 font-semibold">
                  RESTRICTED
                </span>
                <span className="font-serif font-bold text-zinc-100">সংরক্ষিত কপিরাইট</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                সক্রিয় কপিরাইটের আওতাধীন সাহিত্যকর্ম। কেবল গবেষকদের জন্য গ্রন্থপঞ্জি পরিচিতি ও তথ্যসূত্র হিসেবে ক্যাটালগে প্রদর্শিত; কোনো ফাইল বিতরণ বা হোস্ট করা সম্পূর্ণ নিষিদ্ধ।
              </p>
            </div>
          </div>
        </section>

        {/* Takedown & Grievance */}
        <section className="space-y-6 pt-6 border-t border-zinc-850">
          <h2 className="font-serif text-2xl font-bold text-zinc-100">
            ৩. আপত্তি, সংশোধন ও টেকডাউন নীতি
          </h2>

          <p className="text-sm text-zinc-300 leading-relaxed">
            যদি আপনি কোনো সাহিত্যকর্ম বা নথির বৈধ স্বত্বাধিকারী হন এবং মনে করেন যে Thoughts.Whatever-এ আপনার অনুমতি ব্যতিরেকে কোনো তথ্য বা ফাইল তালিকাভুক্ত বা হোস্ট করা হয়েছে, তবে অবিলম্বে আমাদের সাথে যোগাযোগ করুন।
          </p>

          <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
            <h3 className="font-serif font-bold text-sm text-zinc-200">
              অভিযোগ দাখিলের প্রক্রিয়া:
            </h3>
            <ul className="text-xs text-zinc-400 space-y-2 list-disc list-inside">
              <li>উপাদানটির বিস্তারিত পাতায় গিয়ে <strong>‘স্বত্ব সংক্রান্ত আপত্তি জানান’</strong> বোতামে ক্লিক করুন।</li>
              <li>আপনার পরিচয়, যোগাযোগের ইমেইল এবং স্বত্বাধিকারের প্রমাণপত্র (URL বা সংযুক্তি) উল্লেখ করুন।</li>
              <li>আমাদের সম্পাদকীয় দল ২৪ থেকে ৪৮ ঘণ্টার মধ্যে নথিটি পর্যালোচনা করবে এবং প্রয়োজনে তাৎক্ষণিকভাবে জনসাধারণের প্রবেশাধিকার স্থগিত করবে।</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
