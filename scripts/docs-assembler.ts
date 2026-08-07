/**
 * Documentation Assembler — Pure formatting logic.
 *
 * Takes the AI analysis results and assembles the final Markdown
 * documentation document. No AI calls, no side effects, fully
 * deterministic.
 */

import type {
  EpisodeAnalysis,
  EpisodeEntities,
  ThemeClassification,
  CharacterEntity,
  GlossaryEntry,
  TimelineEntry,
} from "./docs-ai";

// ─── Types ────────────────────────────────────────────────────

export interface EpisodeData {
  number: number;
  title: string;
  rawScript: string;
  analysis: EpisodeAnalysis;
  entities: EpisodeEntities;
  wordCount: number;
  readingMinutes: number;
  thumbnailFile: string | null;
  status: "Published" | "Draft" | "Archived";
}

export interface SeriesData {
  seriesName: string;
  seriesSlug: string;
  episodes: EpisodeData[];
  themes: ThemeClassification;
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function anchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function toBengaliNumber(n: number): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/[0-9]/g, (d) => bn[Number(d)]);
}

function table(headers: string[], rows: string[][]): string {
  const header = `| ${headers.join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${header}\n${separator}\n${body}`;
}

function countWords(text: string): number {
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

// ─── Document Assembly ────────────────────────────────────────

export function assembleDocument(data: SeriesData): string {
  const sections: string[] = [];

  sections.push(renderCoverPage(data));
  sections.push(renderTableOfContents(data));
  sections.push(renderSeriesOverview(data));

  for (const ep of data.episodes) {
    sections.push(renderEpisode(ep, data));
  }

  sections.push(renderCharacterIndex(data));
  sections.push(renderMasterTimeline(data));
  sections.push(renderGlossary(data));
  sections.push(renderThemes(data));
  sections.push(renderSeriesIndex(data));
  sections.push(renderRevisionHistory(data));

  return sections.join("\n\n---\n\n");
}

// ─── Section Renderers ────────────────────────────────────────

function renderCoverPage(data: SeriesData): string {
  const totalWords = data.episodes.reduce((sum, ep) => sum + ep.wordCount, 0);
  const totalReading = data.episodes.reduce((sum, ep) => sum + ep.readingMinutes, 0);
  const completedCount = data.episodes.filter((e) => e.status === "Published").length;

  return `# ${data.seriesName} — Master Documentation

> **Official Documentation Archive — Thoughts Whatever**
> This document is the permanent internal knowledge base for the "${data.seriesName}" series.

${table(
  ["Field", "Value"],
  [
    ["**Series Name**", data.seriesName],
    ["**English Slug**", `\`${data.seriesSlug}\``],
    ["**Total Episodes**", toBengaliNumber(data.episodes.length)],
    ["**Completed Episodes**", toBengaliNumber(completedCount)],
    ["**Total Word Count**", toBengaliNumber(totalWords)],
    ["**Estimated Reading Time**", `${toBengaliNumber(totalReading)} মিনিট`],
    ["**Publishing Status**", completedCount === data.episodes.length ? "✅ Complete" : "🔄 In Progress"],
    ["**Last Updated**", data.generatedAt],
  ],
)}`;
}

function renderTableOfContents(data: SeriesData): string {
  const lines: string[] = [
    "## Table of Contents\n",
    `1. [Series Overview](#${anchor("series-overview")})`,
  ];

  for (const ep of data.episodes) {
    const label = `Episode ${toBengaliNumber(ep.number)}: ${ep.title}`;
    lines.push(`${ep.number + 1}. [${label}](#${anchor(`episode-${ep.number}`)})`);
  }

  const offset = data.episodes.length + 2;
  lines.push(`${offset}. [Character Index](#${anchor("character-index")})`);
  lines.push(`${offset + 1}. [Master Timeline](#${anchor("master-timeline")})`);
  lines.push(`${offset + 2}. [Glossary](#${anchor("glossary")})`);
  lines.push(`${offset + 3}. [Themes](#${anchor("themes")})`);
  lines.push(`${offset + 4}. [Series Index](#${anchor("series-index")})`);
  lines.push(`${offset + 5}. [Revision History](#${anchor("revision-history")})`);

  return lines.join("\n");
}

function renderSeriesOverview(data: SeriesData): string {
  // Build overview from first episode's analysis and overall theme data
  const themeList = data.themes.themes.map((t) => t.category).join(", ");
  const totalReading = data.episodes.reduce((sum, ep) => sum + ep.readingMinutes, 0);

  return `## Series Overview

### Purpose

"${data.seriesName}" সিরিজটি একটি বহু-পর্বের সাহিত্য বিশ্লেষণ ধারাবাহিক যা Thoughts Whatever-এ প্রকাশিত। প্রতিটি পর্ব একটি Instagram reel-এর পিছনের সম্পূর্ণ গবেষণা, বিশ্লেষণ ও রচনা ধারণ করে।

### Themes

${themeList || "Classification pending."}

### Expected Audience

বাংলা সাহিত্যের পাঠক, সাহিত্য বিশ্লেষণে আগ্রহী শিক্ষার্থী ও গবেষক, এবং Instagram-এ Thoughts Whatever-এর দর্শক যারা reel-এর বিস্তারিত পড়তে চান।

### Difficulty Level

General Reader — সাহিত্যের পূর্ব জ্ঞান সহায়ক কিন্তু আবশ্যক নয়।

### Estimated Total Reading Time

${toBengaliNumber(totalReading)} মিনিট (${toBengaliNumber(data.episodes.length)} পর্ব)

### Series Status

${data.episodes.every((e) => e.status === "Published") ? "✅ সম্পূর্ণ — সব পর্ব প্রকাশিত।" : `🔄 চলমান — ${toBengaliNumber(data.episodes.filter((e) => e.status === "Published").length)}/${toBengaliNumber(data.episodes.length)} পর্ব প্রকাশিত।`}`;
}

function renderEpisode(ep: EpisodeData, data: SeriesData): string {
  const prevEp = data.episodes.find((e) => e.number === ep.number - 1);
  const nextEp = data.episodes.find((e) => e.number === ep.number + 1);

  const sections: string[] = [];

  // ─── Header ────────────────────────────────────────────────
  sections.push(`## Episode ${toBengaliNumber(ep.number)}: ${ep.title}

${table(
  ["Field", "Value"],
  [
    ["**Episode Number**", toBengaliNumber(ep.number)],
    ["**Status**", ep.status === "Published" ? "✅ Published" : ep.status === "Draft" ? "📝 Draft" : "📦 Archived"],
    ["**Word Count**", toBengaliNumber(ep.wordCount)],
    ["**Reading Time**", `${toBengaliNumber(ep.readingMinutes)} মিনিট`],
  ],
)}`);

  // ─── Episode Summary ────────────────────────────────────────
  sections.push(`### Episode Summary

${ep.analysis.summary}`);

  // ─── Original Script ────────────────────────────────────────
  sections.push(`### Original Script

> ⚠️ **Preserved verbatim from the context file. Do not modify.**

\`\`\`
${ep.rawScript}
\`\`\``);

  // ─── Narration Script ───────────────────────────────────────
  sections.push(`### Narration Script

${ep.analysis.narrationScript}`);

  // ─── Key Takeaways ──────────────────────────────────────────
  sections.push(`### Key Takeaways

${ep.analysis.keyTakeaways.map((t) => `- ${t}`).join("\n")}`);

  // ─── Literary Analysis ──────────────────────────────────────
  sections.push(`### Literary Analysis

${ep.analysis.literaryAnalysis}`);

  // ─── Historical Context ─────────────────────────────────────
  sections.push(`### Historical Context

${ep.analysis.historicalContext}`);

  // ─── Important Quotes ───────────────────────────────────────
  if (ep.entities.quotes.length > 0) {
    const quoteRows = ep.entities.quotes.map((q) => [
      `"${q.text}"`,
      q.attribution || "—",
      q.significance,
    ]);
    sections.push(`### Important Quotes

${table(["Quote", "Attribution", "Significance"], quoteRows)}`);
  } else {
    sections.push("### Important Quotes\n\nএই পর্বে উল্লেখযোগ্য উদ্ধৃতি চিহ্নিত হয়নি।");
  }

  // ─── Difficult Bengali Words ────────────────────────────────
  if (ep.entities.difficultWords.length > 0) {
    const wordRows = ep.entities.difficultWords.map((w) => [
      `**${w.word}**`,
      w.meaning,
      w.usage,
    ]);
    sections.push(`### Difficult Bengali Words

${table(["Word", "Meaning", "Usage"], wordRows)}`);
  } else {
    sections.push("### Difficult Bengali Words\n\nএই পর্বে কঠিন শব্দ চিহ্নিত হয়নি।");
  }

  // ─── Characters Mentioned ──────────────────────────────────
  if (ep.entities.characters.length > 0) {
    const charRows = ep.entities.characters.map((c) => [
      `**${c.name}**`,
      c.role,
      c.importance,
    ]);
    sections.push(`### Characters Mentioned

${table(["Name", "Role", "Importance"], charRows)}`);
  } else {
    sections.push("### Characters Mentioned\n\nএই পর্বে নির্দিষ্ট চরিত্র উল্লেখ করা হয়নি।");
  }

  // ─── Locations Mentioned ────────────────────────────────────
  if (ep.entities.locations.length > 0) {
    const locRows = ep.entities.locations.map((l) => [`**${l.name}**`, l.context]);
    sections.push(`### Locations Mentioned

${table(["Location", "Context"], locRows)}`);
  } else {
    sections.push("### Locations Mentioned\n\nএই পর্বে নির্দিষ্ট স্থানের উল্লেখ নেই।");
  }

  // ─── Timeline ───────────────────────────────────────────────
  if (ep.entities.timelineEvents.length > 0) {
    const tlRows = ep.entities.timelineEvents
      .sort((a, b) => a.order - b.order)
      .map((t) => [t.period, t.event]);
    sections.push(`### Timeline

${table(["Period", "Event"], tlRows)}`);
  } else {
    sections.push("### Timeline\n\nএই পর্বে নির্দিষ্ট সময়রেখার ঘটনা উল্লেখ করা হয়নি।");
  }

  // ─── References ─────────────────────────────────────────────
  if (ep.entities.references.length > 0) {
    const refRows = ep.entities.references.map((r) => [`**${r.source}**`, r.context]);
    sections.push(`### References

${table(["Source", "Context"], refRows)}`);
  } else {
    sections.push("### References\n\nএই পর্বে বাহ্যিক তথ্যসূত্রের সরাসরি উল্লেখ নেই।");
  }

  // ─── SEO Metadata ──────────────────────────────────────────
  const slug = `${data.seriesSlug}-${ep.number}`;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thoughts-whatever.vercel.app";
  const canonicalUrl = `${baseUrl}/writing/${slug}`;
  sections.push(`### SEO Metadata

${table(
  ["Field", "Value"],
  [
    ["**Slug**", `\`${slug}\``],
    ["**Meta Title**", `${ep.title} — ${data.seriesName} | Thoughts Whatever`],
    ["**Meta Description**", ep.analysis.summary.slice(0, 160)],
    ["**Reading Time**", `${toBengaliNumber(ep.readingMinutes)} মিনিট`],
    ["**Canonical URL**", canonicalUrl],
  ],
)}`);

  // ─── Website Integration ───────────────────────────────────
  sections.push(`### Website Integration

${table(
  ["Field", "Value"],
  [
    ["**Series**", data.seriesName],
    ["**Previous Episode**", prevEp ? `Episode ${toBengaliNumber(prevEp.number)}: ${prevEp.title}` : "—"],
    ["**Next Episode**", nextEp ? `Episode ${toBengaliNumber(nextEp.number)}: ${nextEp.title}` : "—"],
    ["**Category**", "রচনা (Writing)"],
    ["**Breadcrumb**", `Home → Writing → ${data.seriesName} → Episode ${toBengaliNumber(ep.number)}`],
  ],
)}`);

  // ─── Thumbnail Information ─────────────────────────────────
  sections.push(`### Thumbnail Information

${table(
  ["Field", "Value"],
  [
    ["**Filename**", ep.thumbnailFile || "⚠️ Not found"],
    ["**Visual Theme**", "Editorial / Literary"],
  ],
)}`);

  // ─── Publishing Information ────────────────────────────────
  sections.push(`### Publishing Information

${table(
  ["Field", "Value"],
  [
    ["**Website URL**", canonicalUrl],
    ["**Documentation URL**", "This document"],
    ["**Last Updated**", data.generatedAt],
  ],
)}`);

  // ─── Internal Notes ────────────────────────────────────────
  if (ep.analysis.internalNotes) {
    sections.push(`### Internal Notes

${ep.analysis.internalNotes}`);
  } else {
    sections.push("### Internal Notes\n\nNo internal notes for this episode.");
  }

  return sections.join("\n\n");
}

// ─── Aggregated Sections ──────────────────────────────────────

function renderCharacterIndex(data: SeriesData): string {
  // Aggregate characters across all episodes, dedup by name
  const charMap = new Map<string, { name: string; role: string; importance: string; episodes: number[] }>();

  for (const ep of data.episodes) {
    for (const ch of ep.entities.characters) {
      const key = ch.name.trim().toLowerCase();
      const existing = charMap.get(key);
      if (existing) {
        if (!existing.episodes.includes(ep.number)) {
          existing.episodes.push(ep.number);
        }
        // Merge importance if different
        if (existing.importance !== ch.importance && !existing.importance.includes(ch.importance)) {
          existing.importance += `; ${ch.importance}`;
        }
      } else {
        charMap.set(key, {
          name: ch.name,
          role: ch.role,
          importance: ch.importance,
          episodes: [ep.number],
        });
      }
    }
  }

  if (charMap.size === 0) {
    return "## Character Index\n\nNo characters extracted.";
  }

  const rows = [...charMap.values()]
    .sort((a, b) => b.episodes.length - a.episodes.length)
    .map((c) => [
      `**${c.name}**`,
      c.role,
      c.episodes.map(toBengaliNumber).join(", "),
      c.importance,
    ]);

  return `## Character Index

${table(["Character", "Role", "Episodes", "Description"], rows)}`;
}

function renderMasterTimeline(data: SeriesData): string {
  const allEvents: (TimelineEntry & { episode: number })[] = [];

  for (const ep of data.episodes) {
    for (const event of ep.entities.timelineEvents) {
      allEvents.push({ ...event, episode: ep.number });
    }
  }

  if (allEvents.length === 0) {
    return "## Master Timeline\n\nNo timeline events extracted.";
  }

  allEvents.sort((a, b) => a.order - b.order);

  const rows = allEvents.map((e) => [
    e.period,
    e.event,
    `Episode ${toBengaliNumber(e.episode)}`,
  ]);

  return `## Master Timeline

${table(["Period", "Event", "Source"], rows)}`;
}

function renderGlossary(data: SeriesData): string {
  const wordMap = new Map<string, GlossaryEntry & { episodes: number[] }>();

  for (const ep of data.episodes) {
    for (const word of ep.entities.difficultWords) {
      const key = word.word.trim().toLowerCase();
      const existing = wordMap.get(key);
      if (existing) {
        if (!existing.episodes.includes(ep.number)) {
          existing.episodes.push(ep.number);
        }
      } else {
        wordMap.set(key, { ...word, episodes: [ep.number] });
      }
    }
  }

  if (wordMap.size === 0) {
    return "## Glossary\n\nNo glossary entries extracted.";
  }

  const rows = [...wordMap.values()]
    .sort((a, b) => a.word.localeCompare(b.word, "bn"))
    .map((w) => [
      `**${w.word}**`,
      w.meaning,
      w.usage,
      w.episodes.map(toBengaliNumber).join(", "),
    ]);

  return `## Glossary

${table(["Word", "Meaning", "Usage", "Episodes"], rows)}`;
}

function renderThemes(data: SeriesData): string {
  if (data.themes.themes.length === 0) {
    return "## Themes\n\nNo themes classified.";
  }

  const rows = data.themes.themes.map((t) => [
    `**${t.category}**`,
    t.episodes.map(toBengaliNumber).join(", "),
    t.description,
  ]);

  return `## Themes

${table(["Theme", "Episodes", "Description"], rows)}`;
}

function renderSeriesIndex(data: SeriesData): string {
  const rows = data.episodes.map((ep) => [
    toBengaliNumber(ep.number),
    ep.title,
    ep.status === "Published" ? "✅" : ep.status === "Draft" ? "📝" : "📦",
    toBengaliNumber(ep.wordCount),
    `${toBengaliNumber(ep.readingMinutes)} মিনিট`,
  ]);

  const totalWords = data.episodes.reduce((sum, ep) => sum + ep.wordCount, 0);
  const totalReading = data.episodes.reduce((sum, ep) => sum + ep.readingMinutes, 0);

  return `## Series Index

${table(
  ["#", "Title", "Status", "Words", "Reading Time"],
  [
    ...rows,
    ["—", "**Total**", "—", `**${toBengaliNumber(totalWords)}**`, `**${toBengaliNumber(totalReading)} মিনিট**`],
  ],
)}`;
}

function renderRevisionHistory(data: SeriesData): string {
  return `## Revision History

${table(
  ["Version", "Date", "Editor", "Changes"],
  [
    ["1.0", data.generatedAt, "Thoughts Whatever Documentation Engine", `Full documentation generated for ${toBengaliNumber(data.episodes.length)} episodes`],
  ],
)}

---

*Generated by Thoughts Whatever Documentation Automation Engine*
*${data.generatedAt}*`;
}
