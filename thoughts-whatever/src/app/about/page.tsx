import type { Metadata } from "next";
import { Instagram } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LetterBlock } from "@/components/newsletter/letter-block";
import { siteConfig } from "@/lib/utils";

export const metadata: Metadata = {
  title: "পরিচয়",
  description: `${siteConfig.name} — বাংলা সাহিত্য, পাঠ ও তথ্যচিত্র নিয়ে একটি পত্রিকা ও আর্কাইভ।`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <PageHeader
        labelEn="About"
        titleBn="পরিচয়"
        descEn="What this is, and why it exists"
      />

      <div className="mx-auto max-w-measure py-12">
        <div className="prose-bengali" lang="bn">
          <p>
            একটা রিল এক মিনিটের। তার পিছনে যে পড়াশোনা, যে খসড়া, যে বাদ পড়া
            অংশ — সেসবের জায়গা ইনস্টাগ্রামে নেই। এই সাইটটা সেই জায়গা।
          </p>

          <p>
            এখানে তিন রকম লেখা আছে। <strong>রচনা</strong> — প্রতিটি রিলের
            সম্পূর্ণ লেখা, যেভাবে লেখা হয়েছিল, কাটছাঁট ছাড়া।{" "}
            <strong>ব্লগ</strong> — যা কোনও রিলের সঙ্গে জোড়া নয়, শুধু পড়ার
            জন্য লেখা। আর <strong>তথ্যচিত্র</strong> — যেখানে ভিডিওর সঙ্গে
            থাকে তার কালরেখা আর তথ্যসূত্র।
          </p>

          <h2>কেন সূত্র দেওয়া হয়</h2>

          <p>
            বাংলা সাহিত্য নিয়ে ইন্টারনেটে যা পাওয়া যায়, তার বেশিরভাগেরই উৎস
            জানা যায় না। কে কোথা থেকে পেল, কোন সংস্করণ, কোন বছর — কিছুই না।
            ফলে ভুল তথ্য বছরের পর বছর ঘুরতে থাকে।
          </p>

          <p>
            এখানে প্রতিটি তথ্যচিত্রের নিচে তথ্যসূত্র দেওয়া থাকে। কোনটা বই,
            কোনটা পত্রিকা, কোনটা আর্কাইভ — লেখা থাকে। ভুল চোখে পড়লে জানালে
            সংশোধন করা হয়।
          </p>

          <h2>পড়ার ব্যবস্থা</h2>

          <p>
            লেখার আকার, লাইনের ফাঁক, কাগজের রং — সব বদলে নেওয়া যায় উপরের
            সেটিংস থেকে। যেসব লেখার আবৃত্তি আছে, সেগুলো শোনা যায়; শুনতে শুনতে
            অন্য পাতায় গেলেও আবৃত্তি চলতে থাকে। যেকোনও লেখা PDF করে রাখা যায়।
          </p>

          <p>
            কোনও লগ-ইন নেই, কোনও অ্যাকাউন্ট নেই। &ldquo;পরে পড়ব&rdquo; তালিকা
            আপনার নিজের ব্রাউজারেই থাকে — আমাদের কাছে যায় না।
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
