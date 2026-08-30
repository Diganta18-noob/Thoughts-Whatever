import type { Metadata } from "next";
import { Instagram, Mail, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LetterBlock } from "@/components/newsletter/letter-block";
import { siteConfig, absoluteUrl } from "@/lib/utils";
import { JsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "যোগাযোগ — Contact",
  description: `${siteConfig.name} — সম্পাদকীয় যোগাযোগ, তথ্যসূত্র সংশোধন ও মতামত পাঠানোর মাধ্যম।`,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `যোগাযোগ (Contact) — ${siteConfig.name}`,
    description: `Thoughts Whatever সম্পাদকীয় বিভাগ ও প্রকাশনার সাথে যোগাযোগের মাধ্যম।`,
    url: absoluteUrl("/contact"),
  },
};

export default function ContactPage() {
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Thoughts Whatever",
    url: absoluteUrl("/contact"),
    description: "Editorial inquiry, source verification, and communication channels for Thoughts Whatever.",
    mainEntity: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      sameAs: [siteConfig.instagram],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "editorial inquiry",
        url: absoluteUrl("/contact"),
      },
    },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <JsonLd data={contactJsonLd} />
      <PageHeader
        labelEn="Contact"
        titleBn="যোগাযোগ"
        descEn="Editorial inquiries, corrections, and reader conversations"
      />

      <div className="mx-auto max-w-measure py-12">
        <div className="prose-bengali" lang="bn">
          <p>
            {siteConfig.name} বাংলা সাহিত্য, কবিতা ও তথ্যচিত্রের একটি মুক্ত সম্পাদকীয় প্ল্যাটফর্ম। আপনার কোনো প্রশ্ন, প্রস্তাবনা, লেখার পর্যালোচনা বা তথ্যসূত্রের সংশোধনী থাকলে আমাদের সাথে সরাসরি যোগাযোগ করতে পারেন।
          </p>

          <h2>সম্পাদকীয় মতামত ও অনুসন্ধান</h2>
          <p>
            আমাদের প্রতিটি রচনার পিছনে থাকে দীর্ঘ গবেষণা, পাণ্ডুলিপির পাঠ ও তথ্যসূত্রের যাচাই। কোনো লেখায় তথ্যগত ত্রুটি বা কোনো উৎসের অসম্পূর্ণতা নজরে এলে আমাদের অবগত করুন; আমরা তা দ্রুত যাচাই করে সংশোধন করব।
          </p>

          <h2>যোগাযোগের মাধ্যম</h2>
          <p>
            আমাদের সাথে যোগাযোগের প্রধান মাধ্যম হলো আমাদের অফিসিয়াল ইনস্টাগ্রাম বার্তা ও চিঠিপত্রের উন্মুক্ত প্ল্যাটফর্ম। সরাসরি বার্তা পাঠাতে নিচের লিংক ব্যবহার করুন:
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <a
            href={siteConfig.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg border border-rule/70 bg-surface-raised/30 p-4 transition-all hover:border-accent/50 hover:bg-surface-raised/60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Instagram className="h-5 w-5" />
            </div>
            <div>
              <span className="font-mono text-xs text-content-faint">Instagram Direct</span>
              <p className="font-medium text-content">@thoughts.whatever_</p>
            </div>
          </a>

          <div className="flex items-center gap-3 rounded-lg border border-rule/70 bg-surface-raised/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <span className="font-mono text-xs text-content-faint">চিঠি ও মতামত</span>
              <p className="font-bengali text-sm text-content">নিউজলেটারের মাধ্যমে প্রতিক্রিয়া</p>
            </div>
          </div>
        </div>

        <div className="mt-14 space-y-6">
          <LetterBlock source="contact" />
        </div>
      </div>
    </div>
  );
}
