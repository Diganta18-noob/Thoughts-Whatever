import { prisma } from "@/lib/prisma";
import { siteConfig, absoluteUrl } from "@/lib/utils";
import { KIND_META, PRIMARY_NAV, SECONDARY_NAV, type PieceKindKey, piecePath } from "@/lib/nav";
import { PUBLISHED, getPieceBySlug, getRecentPieces, getFeaturedSeries, getFilterFacets } from "@/lib/pieces";
import { toIsoString } from "@/lib/i18n/format";

/**
 * Generate 404 Recovery Markdown for nonexistent routes.
 */
export function render404Markdown(requestedPath: string): string {
  return `# 404 — Page Not Found / পৃষ্ঠাটি খুঁজে পাওয়া যায়নি

The requested resource \`${requestedPath}\` does not exist on ${siteConfig.name}.

## Useful Places to Continue (পুনরুদ্ধার নির্দেশিকা)

- **Home**: [${siteConfig.url}](${siteConfig.url}) — Main index and curated stories
- **Writing (রচনা)**: [${absoluteUrl("/writing")}](${absoluteUrl("/writing")}) — Full essays and reel companion texts
- **Blog (ব্লগ)**: [${absoluteUrl("/blog")}](${absoluteUrl("/blog")}) — Longform written for the page
- **Documentary (তথ্যচিত্র)**: [${absoluteUrl("/documentary")}](${absoluteUrl("/documentary")}) — Video essays, research notes, and primary sources
- **Series (ধারাবাহিক)**: [${absoluteUrl("/series")}](${absoluteUrl("/series")}) — Serialized literature and documentaries
- **Archive (সংগ্রহ)**: [${absoluteUrl("/archive")}](${absoluteUrl("/archive")}) — Searchable catalog by author, era, and form
- **Timeline (টাইমলাইন)**: [${absoluteUrl("/resource/bangla-sahityer-timeline")}](${absoluteUrl("/resource/bangla-sahityer-timeline")}) — Bengali literary chronological history
- **About (পরিচয়)**: [${absoluteUrl("/about")}](${absoluteUrl("/about")}) — Editorial mission and publication background
- **Contact (যোগাযোগ)**: [${absoluteUrl("/contact")}](${absoluteUrl("/contact")}) — Editorial inquiries and feedback
- **AI Agent Guide**: [${absoluteUrl("/llms.txt")}](${absoluteUrl("/llms.txt")}) — Machine-readable directory & LLM usage instructions
- **Sitemap**: [${absoluteUrl("/sitemap.xml")}](${absoluteUrl("/sitemap.xml")})
`;
}

/**
 * Generate structured Markdown representation for the Homepage.
 */
export async function renderHomeMarkdown(): Promise<string> {
  let recent: Awaited<ReturnType<typeof getRecentPieces>> = [];
  let series: Awaited<ReturnType<typeof getFeaturedSeries>> = [];

  try {
    const [p, s] = await Promise.all([
      getRecentPieces({ take: 10 }),
      getFeaturedSeries(3),
    ]);
    recent = p;
    series = s;
  } catch {
    // Fallback if db error
  }

  const lines: string[] = [
    `# ${siteConfig.name}`,
    ``,
    `> **${siteConfig.tagline}**`,
    `> *${siteConfig.taglineEn}*`,
    ``,
    `**Canonical URL**: ${siteConfig.url}`,
    ``,
    `## About the Publication`,
    ``,
    `Thoughts Whatever is an editorial publication and digital archive dedicated to Bengali literature, close reading, and documentary history. It publishes complete unabridged essays, longform literary investigations, and video research notes.`,
    ``,
    `## Navigation & Sections`,
    ``,
  ];

  for (const item of PRIMARY_NAV) {
    lines.push(`- **[${item.labelBn} (${item.labelEn})](${absoluteUrl(item.href)})**: ${item.descEn || ""}`);
  }
  for (const item of SECONDARY_NAV) {
    lines.push(`- **[${item.labelBn} (${item.labelEn})](${absoluteUrl(item.href)})**`);
  }

  if (series.length > 0) {
    lines.push(``, `## Featured Series (ধারাবাহিক)`, ``);
    for (const s of series) {
      lines.push(`### [${s.titleBn}](${absoluteUrl(`/series/${s.slug}`)})`);
      if (s.descBn) lines.push(s.descBn, ``);
      if (s.pieces && s.pieces.length > 0) {
        lines.push(`Episodes (${s.pieces.length}):`);
        for (const ep of s.pieces) {
          const epPath = piecePath(ep.kind as PieceKindKey, ep.slug);
          lines.push(`- [${ep.titleBn}](${absoluteUrl(epPath)}) (${ep.readingMinutes} min read)`);
        }
        lines.push(``);
      }
    }
  }

  if (recent.length > 0) {
    lines.push(``, `## Latest Published Writing (সাম্প্রতিক রচনা)`, ``);
    for (const piece of recent) {
      const pPath = piecePath(piece.kind, piece.slug);
      const authors = piece.authors?.map((a) => a.nameBn).join(", ") || "";
      const dateStr = piece.publishedAt ? (toIsoString(piece.publishedAt) || "").split("T")[0] || "" : "";
      const kindMeta = KIND_META[piece.kind as PieceKindKey];
      const kindLabel = kindMeta ? kindMeta.labelEn : piece.kind;
      lines.push(`- **[${piece.titleBn}](${absoluteUrl(pPath)})** — ${kindLabel}${authors ? ` by ${authors}` : ""}${dateStr ? ` (${dateStr})` : ""}`);
      if (piece.dekBn) {
        lines.push(`  > ${piece.dekBn}`);
      }
    }
  }

  lines.push(
    ``,
    `## Machine-Readable Resources`,
    `- [Agent Guide (/llms.txt)](${absoluteUrl("/llms.txt")})`,
    `- [Sitemap (/sitemap.xml)](${absoluteUrl("/sitemap.xml")})`,
    `- [RSS Feed (/rss.xml)](${absoluteUrl("/rss.xml")})`,
  );

  return lines.join("\n");
}

/**
 * Generate Markdown for a single Article.
 */
export async function renderArticleMarkdown(slug: string): Promise<string | null> {
  const piece = await getPieceBySlug(slug);
  if (!piece) return null;

  const url = absoluteUrl(piecePath(piece.kind, piece.slug));
  const authors = piece.authors?.map((a) => a.nameBn).join(", ") || "";
  const tags = piece.tags?.map((t) => t.labelBn).join(", ") || "";
  const datePublished = piece.publishedAt ? toIsoString(piece.publishedAt) : "";
  const kindMeta = KIND_META[piece.kind as PieceKindKey];

  const lines: string[] = [
    `# ${piece.titleBn}`,
    ``,
  ];

  if (piece.subtitleBn) {
    lines.push(`> **${piece.subtitleBn}**`, ``);
  }

  lines.push(
    `---`,
    `- **Publication**: [${siteConfig.name}](${siteConfig.url})`,
    `- **Section**: ${kindMeta ? `${kindMeta.labelEn} (${kindMeta.labelBn})` : piece.kind}`,
    `- **Author(s)**: ${authors || "Editorial"}`,
    `- **Published Date**: ${datePublished}`,
    `- **Reading Time**: ${piece.readingMinutes} minutes`,
    `- **Canonical URL**: ${url}`,
  );

  if (piece.series) {
    lines.push(`- **Series**: [${piece.series.titleBn}](${absoluteUrl(`/series/${piece.series.slug}`)}) (Episode ${piece.seriesOrder || 1})`);
  }
  if (tags) {
    lines.push(`- **Tags**: ${tags}`);
  }

  lines.push(`---`, ``);

  if (piece.dekBn) {
    lines.push(`### Summary`, ``, piece.dekBn, ``, `---`, ``);
  }

  lines.push(`## Content`, ``, piece.bodyBn, ``);

  if (piece.sources && piece.sources.length > 0) {
    lines.push(`## References & Sources (তথ্যসূত্র)`, ``);
    for (const src of piece.sources) {
      lines.push(`- **${src.label}**${src.note ? ` — ${src.note}` : ""}${src.url ? `: [Link](${src.url})` : ""}`);
    }
    lines.push(``);
  }

  if (piece.reelUrl || piece.videoUrl) {
    lines.push(`## Media Links`, ``);
    if (piece.reelUrl) lines.push(`- **Instagram Reel**: ${piece.reelUrl}`);
    if (piece.videoUrl) lines.push(`- **Video**: ${piece.videoUrl}`);
    lines.push(``);
  }

  return lines.join("\n");
}

/**
 * Generate Markdown for static and index pages.
 */
export async function renderPageMarkdown(pathname: string): Promise<string | null> {
  const cleanPath = pathname.replace(/\/$/, "") || "/";

  // Homepage
  if (cleanPath === "") {
    return renderHomeMarkdown();
  }

  // Static Pages
  if (cleanPath === "/about") {
    return `# About Thoughts Whatever (পরিচয়)

**Canonical URL**: ${absoluteUrl("/about")}

## Editorial Mission

একটা রিল এক মিনিটের। তার পিছনে যে পড়াশোনা, যে খসড়া, যে বাদ পড়া অংশ — সেসবের জায়গা ইনস্টাগ্রামে নেই। Thoughts Whatever সেই জায়গা।

Thoughts Whatever is an independent Bengali literature, close reading, and documentary publication founded to preserve and examine Bengali literary history, poetry, and cultural essays with meticulous contextual research and primary source citations.

## Sections & Formats

- **রচনা (Writing)**: The full, uncut text behind each shortform reel, published exactly as researched.
- **ব্লগ (Blog)**: Standalone longform essays composed specifically for reflective reading.
- **তথ্যচিত্র (Documentary)**: Historical deep-dives accompanied by video, chronology timelines, and verified bibliographic sources.

## Editorial Integrity & Primary Sources

বাংলা সাহিত্য নিয়ে ইন্টারনেটে যা পাওয়া যায়, তার বেশিরভাগেরই উৎস জানা যায় না। কে কোথা থেকে পেল, কোন সংস্করণ, কোন বছর — কিছুই না। ফলে ভুল তথ্য বছরের পর বছর ঘুরতে থাকে।

Every documentary piece on Thoughts Whatever carries explicit citations—specifying books, journals, archives, and edition dates.

## Contact & Links

- **Instagram**: [${siteConfig.instagram}](${siteConfig.instagram})
- **Contact Page**: [${absoluteUrl("/contact")}](${absoluteUrl("/contact")})
- **Privacy Policy**: [${absoluteUrl("/privacy")}](${absoluteUrl("/privacy")})
`;
  }

  if (cleanPath === "/contact") {
    return `# Contact Thoughts Whatever (যোগাযোগ)

**Canonical URL**: ${absoluteUrl("/contact")}

## Editorial Inquiries & Feedback

Thoughts Whatever welcomes feedback, literary inquiries, corrections, and archival collaborations from readers, researchers, and writers.

## Communication Channels

1. **Direct Editorial Messaging**:
   - Reach out via Instagram: [${siteConfig.instagram}](${siteConfig.instagram}) (\`@thoughts.whatever_\`)
2. **Corrections & Errata (তথ্যসূত্র ও সংশোধন)**:
   - If you notice a factual discrepancy or an incomplete citation in any piece, please reach out with the source edition and publication details.
3. **Newsletter (চিঠি)**:
   - Subscribe directly at [${absoluteUrl("/letter")}](${absoluteUrl("/letter")}) to receive new longform essays and essays directly.
`;
  }

  if (cleanPath === "/privacy") {
    return `# Privacy Policy (গোপনীয়তা নীতি)

**Canonical URL**: ${absoluteUrl("/privacy")}
**Effective Date**: August 2024 / Updated 2026

Thoughts Whatever is built with respect for reader privacy.

## Key Principles

1. **No Mandatory Accounts**: Readers can browse, read, search, and listen to all public essays without registering an account.
2. **Local Browser Storage**: The "পরে পড়ব" (Bookmarks / Saved for later) and reading progress features store data exclusively in your device's browser \`localStorage\`. This data is never transmitted to or stored on our servers.
3. **Newsletter Email Collection**: When you subscribe to "চিঠি" (our newsletter), your email address is stored securely solely for sending editorial letters and updates. We do not sell, rent, or share subscriber emails. You can unsubscribe at any time using the link in any letter.
4. **Analytics**: We use privacy-conscious analytics (PostHog) to understand aggregate readership patterns (such as which essays are read and device display preferences). IP addresses are anonymized.
5. **Cookies**: We use essential cookies strictly for theme preference (\`tw_theme\`), language selection (\`tw_lang\`), and secure administrator authentication.

For inquiries regarding data practices, contact us via [${absoluteUrl("/contact")}](${absoluteUrl("/contact")}).
`;
  }

  if (cleanPath === "/letter") {
    return `# Letter / চিঠি — Thoughts Whatever Newsletter

**Canonical URL**: ${absoluteUrl("/letter")}

Thoughts Whatever periodically sends letters containing reflective essays, editorial notes on ongoing documentary research, and curated reading lists.

Subscribe to receive full-text writings directly in your inbox without algorithm interference.
`;
  }

  if (cleanPath === "/resource/bangla-sahityer-timeline") {
    return `# বাংলা সাহিত্যের টাইমলাইন (Bengali Literary Timeline)

**Canonical URL**: ${absoluteUrl("/resource/bangla-sahityer-timeline")}

A chronological timeline of Bengali literature from the Charyapada (চর্যাপদ) to the modern era, mapping key literary movements, authors, and landmark texts.
`;
  }

  // Section Index Pages: /writing, /blog, /documentary
  const kindMatch = Object.entries(KIND_META).find(([, meta]) => meta.path === cleanPath);
  if (kindMatch) {
    const [kindKey, meta] = kindMatch;
    const pieces = await prisma.piece.findMany({
      where: { kind: kindKey as any, ...PUBLISHED },
      select: {
        slug: true,
        kind: true,
        titleBn: true,
        subtitleBn: true,
        dekBn: true,
        publishedAt: true,
        readingMinutes: true,
        authors: { select: { nameBn: true } },
      },
      orderBy: { publishedAt: "desc" },
    });

    const lines = [
      `# ${meta.labelBn} (${meta.labelEn}) — ${siteConfig.name}`,
      ``,
      `**Canonical URL**: ${absoluteUrl(cleanPath)}`,
      `**Total Articles**: ${pieces.length}`,
      ``,
      `## Articles`,
      ``,
    ];

    for (const p of pieces) {
      const pUrl = absoluteUrl(piecePath(p.kind as PieceKindKey, p.slug));
      const authors = p.authors.map((a: { nameBn: string }) => a.nameBn).join(", ");
      const dateStr = p.publishedAt ? (toIsoString(p.publishedAt) || "").split("T")[0] || "" : "";
      lines.push(`### [${p.titleBn}](${pUrl})`);
      lines.push(`- **Author(s)**: ${authors || "Editorial"}`);
      lines.push(`- **Published**: ${dateStr}`);
      lines.push(`- **Reading Time**: ${p.readingMinutes} min`);
      if (p.dekBn) lines.push(`- **Excerpt**: ${p.dekBn}`);
      lines.push(``);
    }

    return lines.join("\n");
  }

  // Series Index & Detail
  if (cleanPath === "/series") {
    const seriesList = await prisma.series.findMany({
      where: { pieces: { some: PUBLISHED } },
      include: {
        pieces: {
          where: PUBLISHED,
          select: { slug: true, kind: true, titleBn: true, seriesOrder: true, readingMinutes: true },
          orderBy: { seriesOrder: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const lines = [
      `# ধারাবাহিক (Series) — ${siteConfig.name}`,
      ``,
      `**Canonical URL**: ${absoluteUrl("/series")}`,
      ``,
      `## All Series`,
      ``,
    ];

    for (const s of seriesList) {
      lines.push(`### [${s.titleBn}](${absoluteUrl(`/series/${s.slug}`)})`);
      if (s.descBn) lines.push(s.descBn, ``);
      if (s.pieces && s.pieces.length > 0) {
        lines.push(`Episodes (${s.pieces.length}):`);
        for (const p of s.pieces) {
          lines.push(`- [${p.titleBn}](${absoluteUrl(piecePath(p.kind as PieceKindKey, p.slug))}) (${p.readingMinutes} min)`);
        }
        lines.push(``);
      }
    }
    return lines.join("\n");
  }

  if (cleanPath.startsWith("/series/")) {
    const slug = cleanPath.replace("/series/", "");
    const decodedSlug = decodeURIComponent(slug);
    const series = await prisma.series.findUnique({
      where: { slug: decodedSlug },
      include: {
        pieces: {
          where: PUBLISHED,
          select: { slug: true, kind: true, titleBn: true, subtitleBn: true, dekBn: true, seriesOrder: true, readingMinutes: true, publishedAt: true },
          orderBy: { seriesOrder: "asc" },
        },
      },
    });

    if (!series) return null;

    const lines = [
      `# ${series.titleBn} (ধারাবাহিক)`,
      ``,
      `**Canonical URL**: ${absoluteUrl(`/series/${series.slug}`)}`,
      ``,
    ];
    if (series.descBn) lines.push(series.descBn, ``, `---`, ``);
    lines.push(`## Episodes (${series.pieces.length})`, ``);

    for (const p of series.pieces) {
      const pUrl = absoluteUrl(piecePath(p.kind as PieceKindKey, p.slug));
      lines.push(`### Episode ${p.seriesOrder || 1}: [${p.titleBn}](${pUrl})`);
      lines.push(`- Reading Time: ${p.readingMinutes} min`);
      if (p.dekBn) lines.push(`- Excerpt: ${p.dekBn}`);
      lines.push(``);
    }
    return lines.join("\n");
  }

  // Authors Index & Detail
  if (cleanPath === "/authors") {
    const authors = await prisma.author.findMany({
      where: { pieces: { some: PUBLISHED } },
      include: {
        pieces: {
          where: PUBLISHED,
          select: { slug: true, kind: true, titleBn: true },
        },
      },
      orderBy: { nameBn: "asc" },
    });

    const lines = [
      `# লেখক (Authors) — ${siteConfig.name}`,
      ``,
      `**Canonical URL**: ${absoluteUrl("/authors")}`,
      ``,
    ];
    for (const a of authors) {
      lines.push(`- **[${a.nameBn}](${absoluteUrl(`/authors/${a.slug}`)})** (${a.pieces.length} works)`);
    }
    return lines.join("\n");
  }

  if (cleanPath.startsWith("/authors/")) {
    const slug = cleanPath.replace("/authors/", "");
    const decodedSlug = decodeURIComponent(slug);
    const author = await prisma.author.findUnique({
      where: { slug: decodedSlug },
      include: {
        pieces: {
          where: PUBLISHED,
          select: { slug: true, kind: true, titleBn: true, dekBn: true, publishedAt: true, readingMinutes: true },
          orderBy: { publishedAt: "desc" },
        },
      },
    });

    if (!author) return null;

    const lines = [
      `# ${author.nameBn}`,
      ``,
      `**Canonical URL**: ${absoluteUrl(`/authors/${author.slug}`)}`,
      ``,
    ];
    if (author.bioBn) lines.push(author.bioBn, ``, `---`, ``);
    lines.push(`## Published Works (${author.pieces.length})`, ``);

    for (const p of author.pieces) {
      const pUrl = absoluteUrl(piecePath(p.kind as PieceKindKey, p.slug));
      lines.push(`- **[${p.titleBn}](${pUrl})** (${p.readingMinutes} min read)`);
      if (p.dekBn) lines.push(`  > ${p.dekBn}`);
    }
    return lines.join("\n");
  }

  // Archive
  if (cleanPath === "/archive") {
    const pieces = await prisma.piece.findMany({
      where: PUBLISHED,
      select: { slug: true, kind: true, titleBn: true, publishedAt: true, authors: { select: { nameBn: true } } },
      orderBy: { publishedAt: "desc" },
    });

    const lines = [
      `# সংগ্রহ (Archive) — ${siteConfig.name}`,
      ``,
      `**Canonical URL**: ${absoluteUrl("/archive")}`,
      `**Total Catalog Items**: ${pieces.length}`,
      ``,
      `## Catalog Index`,
      ``,
    ];

    for (const p of pieces) {
      const pUrl = absoluteUrl(piecePath(p.kind as PieceKindKey, p.slug));
      const author = p.authors.map((a: { nameBn: string }) => a.nameBn).join(", ");
      const date = p.publishedAt ? (toIsoString(p.publishedAt) || "").split("T")[0] || "" : "";
      const kindMeta = KIND_META[p.kind as PieceKindKey];
      const kindLabel = kindMeta ? kindMeta.labelEn : p.kind;
      lines.push(`- [${p.titleBn}](${pUrl}) — ${kindLabel}${author ? ` by ${author}` : ""}${date ? ` (${date})` : ""}`);
    }
    return lines.join("\n");
  }

  // Check if it's an article directly
  for (const prefix of ["/writing/", "/blog/", "/documentary/"]) {
    if (cleanPath.startsWith(prefix)) {
      const slug = cleanPath.replace(prefix, "");
      return renderArticleMarkdown(decodeURIComponent(slug));
    }
  }

  return null;
}
