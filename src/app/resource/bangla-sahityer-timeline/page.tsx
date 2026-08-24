import type { Metadata } from "next";
import Link from "next/link";
import {
  TimelineInteractive,
  TIMELINE_FAQS,
} from "@/components/resource/timeline-interactive";
import { JsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/utils";
import {
  BookOpen,
  Calendar,
  Sparkles,
  Layers,
  ArrowUpRight,
  Share2,
  BookmarkCheck,
} from "lucide-react";

export const revalidate = 86400; // 24 hours ISR

export const metadata: Metadata = {
  title: "বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন (১৮০০–২০২৫) — ইতিহাস, যুগবিভাগ ও মাইলফলক",
  description:
    "ফোর্ট উইলিয়াম কলেজ থেকে সমকালীন পর্ব — বাংলা সাহিত্যের ২২৫ বছরের সমগ্র ইতিহাস, যুগবিভাগ, প্রধান লেখক ও কালজয়ী সৃষ্টির পূর্ণাঙ্গ ইন্টারঅ্যাক্টিভ টাইমলাইন।",
  alternates: {
    canonical: absoluteUrl("/resource/bangla-sahityer-timeline"),
  },
  keywords: [
    "বাংলা সাহিত্যের ইতিহাস",
    "বাংলা সাহিত্যের টাইমলাইন",
    "বাংলা সাহিত্যের যুগবিভাগ",
    "Bengali literature timeline",
    "রবীন্দ্রনাথ ঠাকুর",
    "মাইকেল মধুসূদন দত্ত",
    "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
    "WBCS বাংলা সাহিত্য",
    "মেঘনাদবধ কাব্য",
    "নীলদর্পণ",
    "চোখের বালি",
    "পদ্মা নদীর মাঝি",
  ],
  openGraph: {
    type: "article",
    url: absoluteUrl("/resource/bangla-sahityer-timeline"),
    title: "বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন (১৮০০–২০২৫) | Thoughts Whatever",
    description:
      "২২৫ বছরের বাংলা সাহিত্যের বিবর্তন, কালজয়ী উপন্যাস, কবিতা, নাটক ও ঐতিহাসিক প্রেক্ষাপটের সমগ্র ইন্টারঅ্যাক্টিভ টাইমলাইন।",
    siteName: siteConfig.name,
    locale: "bn_IN",
    images: [
      {
        url: absoluteUrl("/brand/logo-full.svg"),
        width: 1200,
        height: 630,
        alt: "বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন (১৮০০–২০২৫)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন (১৮০০–২০২৫) — Thoughts Whatever",
    description:
      "ফোর্ট উইলিয়াম কলেজ থেকে ডিজিটাল সাহিত্য — বাংলা সাহিত্যের ২২৫ বছরের সমগ্র ইতিহাস ও মাইলফলক।",
  },
};

export default function BanglaSahityerTimelinePage() {
  const pageUrl = absoluteUrl("/resource/bangla-sahityer-timeline");

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন (১৮০০–২০২৫) — ইতিহাস, যুগবিভাগ ও মাইলফলক",
    description:
      "ফোর্ট উইলিয়াম কলেজ থেকে সমকালীন আধুনিক পর্ব — বাংলা সাহিত্যের ২২৫ বছরের সমগ্র ইতিহাস, যুগবিভাগ, প্রধান লেখক ও কালজয়ী সৃষ্টির পূর্ণাঙ্গ ইন্টারঅ্যাক্টিভ টাইমলাইন।",
    inLanguage: "bn-IN",
    image: absoluteUrl("/brand/logo-full.svg"),
    datePublished: "2026-08-25T00:00:00.000Z",
    dateModified: "2026-08-25T00:00:00.000Z",
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      sameAs: [siteConfig.instagram].filter(Boolean),
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/logo-full.svg"),
      },
      sameAs: [siteConfig.instagram].filter(Boolean),
    },
    about: [
      { "@type": "Thing", name: "Bengali literature" },
      { "@type": "Thing", name: "বাংলা সাহিত্য" },
      { "@type": "Thing", name: "Bengal Renaissance" },
    ],
  };

  const breadcrumbs = [
    { name: "নীড়পাতা", path: "/" },
    { name: "সংগ্রহশালা", path: "/archive" },
    { name: "বাংলা সাহিত্যের টাইমলাইন", path: "/resource/bangla-sahityer-timeline" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-12">
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd data={faqJsonLd(TIMELINE_FAQS)} />

      {/* ── Header & Hero ─────────────────────────────────── */}
      <header className="border-b border-rule/80 pb-12 pt-4">
        {/* Breadcrumb Visual Trail */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs font-bengali text-content-faint">
          <Link href="/" className="hover:text-accent transition">
            নীড়পাতা
          </Link>
          <span>/</span>
          <Link href="/archive" className="hover:text-accent transition">
            সংগ্রহশালা
          </Link>
          <span>/</span>
          <span className="text-content font-medium">বাংলা সাহিত্যের টাইমলাইন</span>
        </nav>

        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent font-semibold">
          <Layers className="h-4 w-4" />
          <span>বিশেষ সংকলন ও নির্দেশিকা · Thoughts Whatever Resource</span>
        </div>

        <h1 className="mt-4 font-bengali text-3xl font-semibold leading-tight text-content sm:text-5xl lg:text-[3.25rem]">
          বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন
          <span className="block mt-1 font-sans text-2xl font-light text-content-soft sm:text-4xl">
            (১৮০০ — ২০২৫)
          </span>
        </h1>

        <p className="mt-6 max-w-3xl font-bengali text-lg leading-relaxed text-content-soft sm:text-xl">
          ফোর্ট উইলিয়াম কলেজের গদ্য সূচনা থেকে শুরু করে বঙ্গীয় নবজাগরণ, রবীন্দ্র যুগ, কল্লোলের আধুনিকতা এবং সমকালীন সাহিত্য — বাংলা সাহিত্যের ২২৫ বছরের সমগ্র পথচলা, ঐতিহাসিক পটভূমি ও কালজয়ী সৃষ্টির এক পূর্ণাঙ্গ রেফারেন্স মানচিত্র।
        </p>

        {/* Quick Highlights / Stat Badges */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-rule/70 bg-surface-raised/40 p-4">
            <div className="font-mono text-2xl font-bold text-accent">২২৫+ বছর</div>
            <div className="mt-1 font-bengali text-xs text-content-faint">মুদ্রণ ও সাহিত্যের ইতিহাস</div>
          </div>
          <div className="rounded-xl border border-rule/70 bg-surface-raised/40 p-4">
            <div className="font-mono text-2xl font-bold text-accent">৬টি যুগ</div>
            <div className="mt-1 font-bengali text-xs text-content-faint">যুগান্তকারী বিবর্তন ও পর্ব</div>
          </div>
          <div className="rounded-xl border border-rule/70 bg-surface-raised/40 p-4">
            <div className="font-mono text-2xl font-bold text-accent">২৫+ মাইলফলক</div>
            <div className="mt-1 font-bengali text-xs text-content-faint">উপন্যাস, কাব্য, নাটক ও সাময়িকপত্র</div>
          </div>
          <div className="rounded-xl border border-rule/70 bg-surface-raised/40 p-4">
            <div className="font-mono text-2xl font-bold text-accent">গভীর পাঠ</div>
            <div className="mt-1 font-bengali text-xs text-content-faint">তথ্যচিত্র ও বিশ্লেষণ সংযোগ</div>
          </div>
        </div>
      </header>

      {/* ── Main Interactive Timeline ─────────────────────── */}
      <main className="mt-12">
        <TimelineInteractive />
      </main>

      {/* ── Academic & Resource Citation Block ────────────── */}
      <aside className="mt-16 rounded-2xl border border-rule/80 bg-surface-raised/30 p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs text-accent font-semibold uppercase">
              <BookmarkCheck className="h-4 w-4" />
              <span>গবেষণা ও শিক্ষায় ব্যবহার (Cite this resource)</span>
            </div>
            <h3 className="font-bengali text-lg font-medium text-content">
              শিক্ষক, শিক্ষার্থী ও গবেষকদের জন্য রেফারেন্স
            </h3>
            <p className="font-bengali text-xs text-content-soft max-w-2xl">
              এই টাইমলাইনটি বিশ্ববিদ্যালয় সিলেবাস, WBCS ও প্রতিযোগিতামূলক পরীক্ষা এবং বাংলা সাহিত্যের গবেষণামূলক কাজের জন্য অবাধে ব্যবহার ও উদ্ধৃত করা যাবে।
            </p>
          </div>
          <div className="font-mono text-xs bg-surface border border-rule px-4 py-3 rounded-lg text-content-faint select-all">
            Thoughts Whatever (2026). বাংলা সাহিত্যের সম্পূর্ণ টাইমলাইন (১৮০০–২০২৫). thoughtswhatever.in/resource/bangla-sahityer-timeline
          </div>
        </div>
      </aside>
    </div>
  );
}
