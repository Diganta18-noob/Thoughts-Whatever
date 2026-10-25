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
        <div className="prose mx-auto max-w-measure text-content" lang="en">
          <p>Last updated: 7 October 2026. Published reading does not require a reader account.</p>
          <h2>Essential browser storage</h2>
          <p>Theme, language, bookmarks, reading progress, audio preferences, and your consent choice are stored in your browser. Administrator login uses authentication cookies. Clearing browser storage removes local preferences and saved reading state.</p>
          <h2>Optional analytics</h2>
          <p>Optional readership analytics stays disabled until you accept it. When enabled, our database records a random session identifier, content interactions, browser information, referring site, and approximate location supplied by our hosting provider. PostHog may also process interaction events. We disable automatic click tracking and session recording, and exclude administrator pages from optional tracking.</p>
          <p>Use Cookie settings in the footer to accept or reject analytics at any time. Rejection stops future optional tracking; it does not automatically erase previously recorded events. We also honour Do Not Track and Global Privacy Control signals.</p>
          <h2>The Letter</h2>
          <p>We store the email address and any name you submit, subscription source, confirmation status, and subscription dates to send the newsletter. Signup requires email confirmation. Unsubscribe using the link in a letter. Our hosting, database, and email providers process information needed to operate these services.</p>
          <h2>External media and service logs</h2>
          <p>Images, audio, and embedded media may be delivered by external services such as Cloudinary, Instagram, or YouTube. Visiting or loading those services is subject to their own privacy policies. Hosting and security logs may include network information needed to operate and protect the site.</p>
          <h2>Requests and retention</h2>
          <p>We do not sell newsletter addresses. Contact us to request access, correction, deletion, or information about retention. Subscription records remain until removed by the operator; unsubscribing stops mail delivery. There is currently no automatic expiry for stored analytics events.</p>
          <p>For privacy questions and requests, use our <a href="/contact">contact page</a>. Please avoid sending unnecessary sensitive information.</p>
        </div>

        <div className="mt-12 border-t border-rule/50 pt-6 text-xs text-content-faint">
          <p>সর্বশেষ সংস্করণ: অক্টোবর ২০২৬ — {siteConfig.name} প্রকাশনা</p>
        </div>
      </div>
    </div>
  );
}
