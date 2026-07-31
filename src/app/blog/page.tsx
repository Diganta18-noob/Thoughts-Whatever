import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { PieceCard } from "@/components/pieces/piece-card";
import { LetterBlock } from "@/components/newsletter/letter-block";
import { T } from "@/components/i18n/t";
import { getRecentPieces, countPieces } from "@/lib/pieces";
import { Count } from "@/components/i18n/values";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ব্লগ",
  description:
    "ফিডের জন্য নয়, পড়ার জন্য লেখা — বাংলা সাহিত্য, পাঠ ও চিন্তা নিয়ে দীর্ঘ লেখা।",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [pieces, total] = await Promise.all([
    getRecentPieces({ kind: "BLOG", take: 60 }),
    countPieces("BLOG"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <PageHeader
        labelEn="Blog"
        titleBn="ব্লগ"
        descBn="কোনও রিলের সঙ্গে জোড়া নেই। যা পড়েছি, যা ভেবেছি, আর যেসব প্রশ্ন এক মিনিটে মেটে না — সেসব এখানে।"
        descEn="Longform written for the page, not the feed"
        count={<Count k="common.count" value={total} />}
      />

      {pieces.length === 0 ? (
        <T
          as="p"
          k="empty.nothingPublished"
          className="py-24 text-center text-bengali-base text-content-faint"
          bnClassName="font-bengali"
        />
      ) : (
        <div className="grid gap-10 py-12 lg:grid-cols-[1fr_18rem] lg:gap-16">
          <div className="divide-y divide-rule">
            {pieces.map((piece) => (
              <div key={piece.slug} className="py-8 first:pt-0">
                <PieceCard piece={piece} />
              </div>
            ))}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <LetterBlock source="blog" />
          </aside>
        </div>
      )}
    </div>
  );
}
