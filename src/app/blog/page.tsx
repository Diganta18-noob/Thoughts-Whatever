import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { ArticleCard } from "@/components/pieces/article-card";
import { LetterBlock } from "@/components/newsletter/letter-block";
import { T } from "@/components/i18n/t";
import { getRecentPieces, countPieces } from "@/lib/pieces";
import { Count } from "@/components/i18n/values";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "ব্লগ — Thoughts Whatever",
  description:
    "Thoughts Whatever ব্লগ ও পাঠ বিভাগ — বাংলা সাহিত্য, চিন্তাভাবনা ও দীর্ঘ প্রবন্ধ সংকলন।",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [pieces, total] = await Promise.all([
    getRecentPieces({ kind: "BLOG", take: 60 }),
    countPieces("BLOG"),
  ]);

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${siteConfig.url}/blog#webpage`,
    url: absoluteUrl("/blog"),
    name: "ব্লগ — Thoughts Whatever",
    description: "Thoughts Whatever ব্লগ ও পাঠ বিভাগ — বাংলা সাহিত্য, চিন্তাভাবনা ও দীর্ঘ প্রবন্ধ সংকলন।",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      name: siteConfig.name,
    },
  };

  const breadcrumbs = [
    { name: "মূলপাতা (Home)", path: "/" },
    { name: "ব্লগ (Blog)", path: "/blog" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <JsonLd data={blogJsonLd} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
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
                <ArticleCard piece={piece} layout="stacked" />
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
