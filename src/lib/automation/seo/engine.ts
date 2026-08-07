/**
 * SEO Engine — Dynamic Sitemap, RSS, Robots Validator, and Metadata Auditor
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { absoluteUrl, siteConfig } from "@/lib/utils";
import { KIND_META } from "@/lib/nav";
import { writeLog } from "../notifications/logger";

// ─── 1. Sitemap Generator ─────────────────────────────────────

export async function generateSitemapXml(): Promise<{ urlCount: number; path: string }> {
  const pieces = await prisma.piece.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
    select: { slug: true, kind: true, updatedAt: true },
  });

  const authors = await prisma.author.findMany({ select: { slug: true, updatedAt: true } });
  const seriesList = await prisma.series.findMany({ select: { slug: true, updatedAt: true } });

  const urls: { loc: string; lastmod: string; priority: string }[] = [
    { loc: absoluteUrl("/"), lastmod: new Date().toISOString(), priority: "1.0" },
    { loc: absoluteUrl("/writing"), lastmod: new Date().toISOString(), priority: "0.9" },
    { loc: absoluteUrl("/blog"), lastmod: new Date().toISOString(), priority: "0.9" },
    { loc: absoluteUrl("/documentary"), lastmod: new Date().toISOString(), priority: "0.9" },
    { loc: absoluteUrl("/archive"), lastmod: new Date().toISOString(), priority: "0.8" },
    { loc: absoluteUrl("/series"), lastmod: new Date().toISOString(), priority: "0.7" },
  ];

  for (const p of pieces) {
    const sectionPath = KIND_META[p.kind as keyof typeof KIND_META]?.path || "/writing";
    urls.push({
      loc: absoluteUrl(`${sectionPath}/${encodeURIComponent(p.slug)}`),
      lastmod: p.updatedAt.toISOString(),
      priority: "0.8",
    });
  }

  for (const a of authors) {
    urls.push({
      loc: absoluteUrl(`/authors/${encodeURIComponent(a.slug)}`),
      lastmod: a.updatedAt.toISOString(),
      priority: "0.6",
    });
  }

  for (const s of seriesList) {
    urls.push({
      loc: absoluteUrl(`/series/${encodeURIComponent(s.slug)}`),
      lastmod: s.updatedAt.toISOString(),
      priority: "0.6",
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <priority>${u.priority}</priority>\n  </url>`).join("\n")}
</urlset>`;

  const publicPath = path.join(process.cwd(), "public", "sitemap.xml");
  try {
    fs.writeFileSync(publicPath, xml, "utf-8");
  } catch {
    /* serverless disk write ignore */
  }

  writeLog("automation", "INFO", `Generated sitemap.xml containing ${urls.length} URLs.`);
  return { urlCount: urls.length, path: "/sitemap.xml" };
}

// ─── 2. RSS Generator ─────────────────────────────────────────

export async function generateRssXml(): Promise<{ itemCount: number; path: string }> {
  const pieces = await prisma.piece.findMany({
    where: { status: "PUBLISHED", publishedAt: { not: null } },
    select: { slug: true, titleBn: true, excerptBn: true, kind: true, publishedAt: true },
    orderBy: { publishedAt: "desc" },
    take: 30,
  });

  const items = pieces.map((p) => {
    const sectionPath = KIND_META[p.kind as keyof typeof KIND_META]?.path || "/writing";
    const link = absoluteUrl(`${sectionPath}/${encodeURIComponent(p.slug)}`);
    return `    <item>
      <title><![CDATA[${p.titleBn}]]></title>
      <link>${link}</link>
      <guid>${link}</guid>
      <pubDate>${p.publishedAt?.toUTCString()}</pubDate>
      <description><![CDATA[${p.excerptBn || ""}]]></description>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteConfig.name}</title>
    <link>${siteConfig.url}</link>
    <description>${siteConfig.tagline}</description>
    <language>bn</language>
${items.join("\n")}
  </channel>
</rss>`;

  const publicPath = path.join(process.cwd(), "public", "rss.xml");
  try {
    fs.writeFileSync(publicPath, xml, "utf-8");
  } catch {
    /* serverless disk write ignore */
  }

  writeLog("automation", "INFO", `Generated rss.xml with ${pieces.length} latest items.`);
  return { itemCount: pieces.length, path: "/rss.xml" };
}

// ─── 3. SEO Validation Audit ──────────────────────────────────

export async function validateSeo(): Promise<{ passed: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  const pieces = await prisma.piece.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, titleBn: true, seoDescription: true, coverImage: true },
  });

  for (const p of pieces) {
    if (!p.seoDescription || p.seoDescription.length < 30) {
      warnings.push(`Piece ${p.slug}: SEO description missing or too short`);
    }
    if (!p.coverImage) {
      warnings.push(`Piece ${p.slug}: Missing OG cover image`);
    }
  }

  writeLog("automation", "INFO", `SEO Audit finished across ${pieces.length} pieces (${warnings.length} warnings).`);
  return { passed: warnings.length === 0, warnings };
}
