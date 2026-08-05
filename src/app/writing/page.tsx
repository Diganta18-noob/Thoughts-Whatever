import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ArticleCard } from "@/components/pieces/article-card";
import { T } from "@/components/i18n/t";
import { getRecentPieces, countPieces } from "@/lib/pieces";
import { Count } from "@/components/i18n/values";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "রচনা",
  description:
    "প্রতিটি রিলের পিছনের সম্পূর্ণ লেখা — বাংলা সাহিত্য, পাঠ ও বিশ্লেষণ।",
  alternates: { canonical: "/writing" },
};

export default async function WritingPage() {
  const [pieces, total] = await Promise.all([
    getRecentPieces({ kind: "RACHANA", take: 60 }),
    countPieces("RACHANA"),
  ]);

  const [lead, ...rest] = pieces;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <PageHeader
        labelEn="Writing"
        titleBn="রচনা"
        descBn="রিলে যতটা বলা যায় তা সামান্যই। এখানে প্রতিটি লেখার পুরোটা আছে — যেভাবে লেখা হয়েছিল।"
        descEn="The full text behind each reel"
        count={<Count k="common.count" value={total} />}
      />

      {pieces.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {lead && (
            <div className="border-b border-rule py-12">
              <ArticleCard piece={lead} layout="split" priority />
            </div>
          )}

          {rest.length > 0 && (
            <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((piece) => (
                <ArticleCard key={piece.slug} piece={piece} layout="stacked" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="py-24 text-center text-bengali-base text-content-faint">
      <T k="empty.nothingPublished" bnClassName="font-bengali" />{" "}
      <T k="empty.comingSoon" bnClassName="font-bengali" />
    </p>
  );
}
