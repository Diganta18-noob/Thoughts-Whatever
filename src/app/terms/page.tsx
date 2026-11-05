import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms for reading, sharing, and using the Thoughts Whatever literary archive.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6" lang="en">
    <PageHeader titleBn="ব্যবহারের শর্তাবলী" labelEn="Terms & Conditions" />
    <div className="prose mx-auto mt-8 max-w-measure text-content">
      <p>Last updated: 7 October 2026.</p>
      <h2>Reading and sharing</h2><p>Published material is available for reading without an account. You may share links. Copyright remains with the relevant authors, creators, or rights holders. Availability in this archive does not grant permission to reproduce or redistribute a work; check its displayed rights information and obtain permission where required.</p>
      <h2>Responsible use</h2><p>Do not attempt unauthorized access, disrupt the service, submit spam, or misuse other people’s information. Downloads and media access remain subject to each work’s rights and access restrictions.</p>
      <h2>Editorial and archival material</h2><p>Research, translations, transcripts, captions, and historical metadata may contain errors. Contact us to request a correction or raise a rights concern. External links are provided for context; their publishers control their content and policies.</p>
      <h2>The Letter and privacy</h2><p>Newsletter subscriptions require email confirmation and can be cancelled using the unsubscribe link. See our <Link href="/privacy">Privacy Policy</Link> for storage and analytics choices.</p>
      <h2>Availability and updates</h2><p>We may update content and these terms as the service changes. We cannot promise uninterrupted availability. Nothing in these terms removes rights provided by applicable law.</p>
      <h2>Contact</h2><p>Use the <Link href="/contact">contact page</Link> for corrections, permissions, privacy requests, and questions.</p>
    </div>
  </div>;
}
