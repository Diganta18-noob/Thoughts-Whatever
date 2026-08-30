import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { siteConfig, absoluteUrl } from "@/lib/utils";
import { JsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "গোপনীয়তা নীতি — Privacy Policy",
  description: `${siteConfig.name} — পাঠক ও ব্যবহারকারীর গোপনীয়তা সংক্রান্ত নিয়মাবলী ও তথ্য সুরক্ষা নীতি।`,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `গোপনীয়তা নীতি (Privacy Policy) — ${siteConfig.name}`,
    description: `${siteConfig.name} প্রকাশনার পাঠকদের তথ্য সুরক্ষা ও গোপনীয়তা সংক্রান্ত নীতি।`,
    url: absoluteUrl("/privacy"),
  },
};

export default function PrivacyPage() {
  const privacyJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Privacy Policy — Thoughts Whatever",
    url: absoluteUrl("/privacy"),
    description: "Privacy policy and reader data handling practices for Thoughts Whatever publication.",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <JsonLd data={privacyJsonLd} />
      <PageHeader
        labelEn="Privacy Policy"
        titleBn="গোপনীয়তা নীতি"
        descEn="How we respect and protect reader privacy"
      />

      <div className="mx-auto max-w-measure py-12">
        <div className="prose-bengali" lang="bn">
          <p>
            {siteConfig.name} পাঠকদের স্বাধীন ও নিরবচ্ছিন্ন পাঠের অভিজ্ঞতায় বিশ্বাসী। আমরা কোনো অপ্রয়োজনীয় ব্যক্তিগত তথ্য সংগ্রহ করি না এবং পাঠকদের গোপনীয়তাকে সর্বোচ্চ মর্যাদা দিই।
          </p>

          <h2>১. কোনো বাধ্যতামূলক অ্যাকাউন্ট নেই</h2>
          <p>
            {siteConfig.name}-এর যেকোনো রচনা, ব্লগ, তথ্যচিত্র, ধারাবাহিক বা সময়রেখা পড়ার জন্য কোনো পাঠক অ্যাকাউন্ট খোলার প্রয়োজন নেই। সমস্ত প্রকাশিত সাহিত্যকর্ম উন্মুক্ত ও অবিলম্বে পাঠযোগ্য।
          </p>

          <h2>২. ব্রাউজারের নিজস্ব সংরক্ষণাগার (Local Storage)</h2>
          <p>
            আপনি যখন কোনো লেখায় &ldquo;পরে পড়ব&rdquo; (Bookmarks) যোগ করেন অথবা কোনো লেখার কতটুকু পড়েছেন (Reading Progress) তা রেকর্ড হয়, সেই তথ্য কেবলমাত্র আপনার নিজের ডিভাইসের ব্রাউজার \`localStorage\`-এ সংরক্ষিত থাকে। এটি কখনোই আমাদের সার্ভারে পাঠানো হয় না এবং অন্য কারো পক্ষে তা দেখা সম্ভব নয়।
          </p>

          <h2>৩. নিউজলেটার ও ইমেল সংগ্রহ</h2>
          <p>
            আপনি যদি স্বেচ্ছায় আমাদের &ldquo;চিঠি&rdquo; (Newsletter)-তে আপনার ইমেল ঠিকানা জমা দেন, তবে তা শুধুমাত্র নতুন লেখা ও সম্পাদকের নোট পাঠানোর কাজে সুরক্ষিতভাবে ব্যবহৃত হয়। আমরা কখনোই কোনো তৃতীয় পক্ষের কাছে এই ইমেল ঠিকানা বিক্রি, ভাড়া বা হস্তান্তর করি না। প্রতিটি চিঠির নিচে থাকা &ldquo;Unsubscribe&rdquo; লিংকের মাধ্যমে যেকোনো সময় সহজেই সদস্যপদ প্রত্যাহার করা যায়।
          </p>

          <h2>৪. অ্যানালিটিক্স ও কুকিজ (Analytics & Cookies)</h2>
          <p>
            ওয়েবসাইটের গতি ও পাঠক অভিজ্ঞতা উন্নত করার জন্য আমরা পরিচয়হীন (anonymized) পরিসংখ্যান টুল ব্যবহার করি। আমাদের ব্যবহৃত কুকিগুলি কেবলমাত্র আপনার পছন্দের থিম (\`tw_theme\`), ভাষা (\`tw_lang\`) এবং প্রশাসনিক সুরক্ষার জন্য নিবেদিত। কোনো বিজ্ঞাপন ট্র্যাকার বা ক্রস-সাইট প্রোফাইলিং কুকি আমাদের সাইটে নেই।
          </p>

          <h2>৫. তথ্যের নিরাপত্তা ও অধিকার</h2>
          <p>
            আমাদের ডেটাবেস এবং পরিকাঠামো আধুনিক এনক্রিপশন ও সুরক্ষা প্রটোকলের আওতাভুক্ত। আপনার তথ্যের সুরক্ষা বা গোপনীয়তা সংক্রান্ত কোনো জিজ্ঞাসা থাকলে আমাদের [যোগাযোগ পৃষ্ঠার]({absoluteUrl("/contact")}) মাধ্যমে জানাতে পারেন।
          </p>
        </div>

        <div className="mt-12 border-t border-rule/50 pt-6 text-xs text-content-faint">
          <p>সর্বশেষ হালনাগাদ: আগস্ট ২০২৪ / ২০২৬ — {siteConfig.name}</p>
        </div>
      </div>
    </div>
  );
}
