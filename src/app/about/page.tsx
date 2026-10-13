import type { Metadata } from "next";
import Link from "next/link";
import { Instagram } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LetterBlock } from "@/components/newsletter/letter-block";
import { siteConfig } from "@/lib/utils";
import { JsonLd, aboutPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "পরিচয় — About",
  description: `${siteConfig.name} — বাংলা সাহিত্য, পাঠ-পর্যালোচনা ও তথ্যচিত্র নিয়ে একটি স্বাধীন ডিজিটাল পত্রিকা ও আর্কাইভ।`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <JsonLd data={aboutPageJsonLd()} />
      <PageHeader
        labelEn="About"
        titleBn="পরিচয়"
        descEn="What this is, and why it exists"
      />

      <div className="mx-auto max-w-measure py-12">
        <div className="prose-bengali" lang="bn">
          <p>
            <strong>{siteConfig.name}</strong> বাংলা সাহিত্য, শিল্প-সংস্কৃতি, পাঠ-পর্যালোচনা ও প্রামাণ্য তথ্যচিত্রের একটি মুক্ত ডিজিটাল প্রকাশনা ও আর্কাইভ।
          </p>

          <p>
            সোশ্যাল মিডিয়ায় একটা রিল বা ছোট ভিডিও এক মিনিটের। কিন্তু তার পিছনে যে দীর্ঘ গবেষণা, পাঠ, খসড়া আর বাদ পড়া অংশ — সেসবের গভীর স্থান ইনস্টাগ্রাম বা ফেসবুকের ফিডে হয় না। <Link href="/" className="text-accent underline decoration-accent/30 hover:decoration-accent">{siteConfig.name}</Link> সেই পূর্ণাঙ্গ পাঠের স্থায়ী ডিজিটাল ঠিকানা।
          </p>

          <p>
            এখানে তিনটি মূল বিভাগে রচনা সংকলিত হয়: <strong>রচনা</strong> — প্রতিটি রিল বা ভিডিওর মূল সম্পূর্ণ লেখা, অবিকৃত ও কাটছাঁট ছাড়া;{" "}
            <strong>ব্লগ</strong> — দীর্ঘ ও মুক্ত প্রবন্ধ যা কোনও ভিডিওর গণ্ডিতে সীমাবদ্ধ নয়, কেবল নিবিড় পাঠের জন্য; এবং <strong>তথ্যচিত্র</strong> — যেখানে ভিডিওর পাশাপাশি থাকে তার পূর্ণাঙ্গ কালরেখা ও প্রামাণ্য তথ্যসূত্র।
          </p>

          <h2>কেন উৎস ও তথ্যসূত্র দেওয়া হয়</h2>

          <p>
            বাংলা সাহিত্য নিয়ে ইন্টারনেটে যা পাওয়া যায়, তার একটি বড় অংশের কোনো যাচাইযোগ্য উৎস থাকে না। কে কোথা থেকে তথ্য পেলেন, কোন প্রকাশনা, কোন সংস্করণ — সেসব অনুচ্চারিত থাকে। ফলে তথ্যবিভ্রান্তি বছরের পর বছর ছড়িয়ে পড়ে।
          </p>

          <p>
            {siteConfig.name}-এর প্রতিটি তথ্যচিত্র ও গবেষণামূলক লেখার নিচে নির্ভরযোগ্য গ্রন্থপঞ্জি ও তথ্যসূত্র উল্লেখ করা থাকে। কোনো ত্রুটি চোখে পড়লে জানালে আমরা তা দ্রুত যাচাই করে সংশোধনের ব্যবস্থা করি।
          </p>

          <h2>পড়ার ব্যবস্থা ও স্বাচ্ছন্দ্য</h2>

          <p>
            লেখার আকার, লাইনের ফাঁক ও কাগজের বর্ণবিন্যাস — সবকিছুই পাঠক নিজের পছন্দমতো সাজিয়ে নিতে পারেন। যেসব লেখার স্বরলিপি বা পাঠ-আবৃত্তি রয়েছে, সেগুলো শুনতে শুনতেই অন্য লেখা ব্রাউজ করা যায়। প্রতিটি লেখা মুদ্রণযোগ্য PDF হিসেবেও সংরক্ষণ করা সম্ভব।
          </p>

          <p>
            এখানে কোনো বাধ্যতামূলক অ্যাকাউন্ট বা ট্র্যাকিংয়ের বাধ্যবাধকতা নেই। পাঠকের &ldquo;পরে পড়ব&rdquo; তালিকা তাঁর নিজের ব্রাউজারের স্টোরেজেই সংরক্ষিত থাকে।
          </p>
        </div>

        <div className="mt-14 space-y-6">
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 font-serif text-sm text-accent transition hover:opacity-75"
          >
            <Instagram className="h-4 w-4" />
            @thoughts.whatever_
          </a>

          <LetterBlock source="about" />
        </div>
      </div>
    </div>
  );
}
