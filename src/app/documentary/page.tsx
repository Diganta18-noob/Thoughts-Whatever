import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ArticleCard } from "@/components/pieces/article-card";
import { T } from "@/components/i18n/t";
import { getRecentPieces, countPieces } from "@/lib/pieces";
import { Count } from "@/components/i18n/values";
import { withTimeout } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ডকুমেন্টারি",
  description:
    "গবেষণাভিত্তিক তথ্যচিত্র — সূত্র, কালরেখা ও সম্পূর্ণ লেখা সমেত।",
  alternates: { canonical: "/documentary" },
};

export default async function DocumentaryPage() {
  const [pieces, total] = await Promise.all([
    withTimeout(getRecentPieces({ kind: "DOCUMENTARY", take: 40 }), [], 5000),
    withTimeout(countPieces("DOCUMENTARY"), 0, 5000),
  ]);

  const [lead, ...rest] = pieces;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <PageHeader
        labelEn="Documentary"
        titleBn="তথ্যচিত্র"
        descBn="প্রতিটি তথ্যচিত্রের সঙ্গে থাকে তার কালরেখা আর তথ্যসূত্র। কোথা থেকে কী জেনেছি, সেটা লুকিয়ে রাখার কিছু নেই।"
        descEn="Video, research notes, and sources"
        count={<Count k="common.count" value={total} />}
      />

      {pieces.length === 0 ? (
        <T
          as="p"
          k="empty.noDocumentaries"
          className="py-24 text-center text-bengali-base text-content-faint"
          bnClassName="font-bengali"
        />
      ) : (
        <>
          {lead && (
            <div className="border-b border-rule py-12">
              <ArticleCard piece={lead} variant="archive" layout="split" priority />
            </div>
          )}

          {rest.length > 0 && (
            <div className="grid gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {rest.map((piece) => (
                <ArticleCard key={piece.slug} piece={piece} variant="archive" layout="stacked" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
