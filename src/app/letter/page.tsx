import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { T } from "@/components/i18n/t";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";

export const metadata: Metadata = {
  title: "চিঠি",
  description: "মাসে একটা চিঠি — নতুন লেখা আর পুরোনো সংগ্রহ থেকে কিছু।",
  alternates: { canonical: "/letter" },
};

export default function LetterPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <PageHeader
        labelEn="The letter"
        titleBn="চিঠি"
        descEn="One letter a month"
      />

      <div className="mx-auto max-w-measure py-12">
        {/* `prose-bengali` is kept for its measure, leading and spacing; the
            face comes from each paragraph, because this is the site explaining
            its own mailing list rather than a piece of writing. */}
        <div className="prose-bengali">
          <T
            as="p"
            k="letter.intro1"
            className="font-serif"
            bnClassName="font-bengali"
          />
          <T
            as="p"
            k="letter.intro2"
            className="font-serif"
            bnClassName="font-bengali"
          />
          <T
            as="p"
            k="letter.intro3"
            className="font-serif"
            bnClassName="font-bengali"
          />
        </div>

        <div className="mt-10 border-t border-rule pt-8">
          <SubscribeForm source="letter-page" />
        </div>
      </div>
    </div>
  );
}
