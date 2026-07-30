import { NextResponse } from "next/server";
import { getArticles } from "@/lib/supabase/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://katha-kahini.com";
  const articles = await getArticles();

  const rssItems = articles
    .map(
      (a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${baseUrl}/article/${a.slug}</link>
      <guid>${baseUrl}/article/${a.slug}</guid>
      <pubDate>${new Date(a.published_at).toUTCString()}</pubDate>
      <description><![CDATA[${a.excerpt}]]></description>
    </item>`
    )
    .join("");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>কথা ও কাহিনী — বাংলা ডকুমেন্টারি ও সাহিত্য আর্কাইভ</title>
    <link>${baseUrl}</link>
    <description>বাঙালি ইতিহাস, সাহিত্য, শিল্পকলা ও প্রামাণ্য নিবন্ধের ডিজিটালাইজড সংগ্রহশালা</description>
    <language>bn</language>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
