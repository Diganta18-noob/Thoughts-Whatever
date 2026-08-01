import { readingMinutes } from "@/lib/bengali";

/**
 * Markdown helpers. Pieces are authored as markdown in the admin editor and
 * rendered with react-markdown on the page — no build step, so a typo fix is
 * live the moment it is saved.
 */

/** Strip markdown syntax down to plain text, for excerpts and OG descriptions. */
export function stripMarkdown(md: string): string {
  if (!md) return "";
  return md
    .replace(/^---[\s\S]*?---/m, "") // front matter, if any sneaks in
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/^\s*[-:| ]{3,}\s*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * First ~180 characters of real prose, cut at a word boundary.
 * Bengali has no inter-word hyphenation to fall back on, so cutting
 * mid-word looks like a rendering bug rather than an ellipsis.
 */
export function deriveExcerpt(md: string, limit = 180): string {
  const text = stripMarkdown(md);
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export type Heading = { id: string; text: string; level: number };

/**
 * Headings for the in-page contents list on long essays.
 * Ids are index-based rather than slugified from Bengali text, so that two
 * sections with the same title still get distinct anchors.
 */
export function extractHeadings(md: string): Heading[] {
  const headings: Heading[] = [];
  const lines = md.split("\n");
  let inFence = false;

  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    const match = line.match(/^\s{0,3}(#{2,3})\s+(.*)$/);
    if (!match) return;
    headings.push({
      id: `section-${index}`,
      text: stripMarkdown(match[2]),
      level: match[1].length,
    });
  });

  return headings;
}

/** Everything the editor derives on save, in one place. */
export function derivePieceMeta(body: string, excerpt?: string | null) {
  return {
    excerptBn: excerpt?.trim() || deriveExcerpt(body),
    readingMinutes: readingMinutes(body),
  };
}

/**
 * Split off the opening paragraph so it can be rendered with a drop cap.
 *
 * Only a plain paragraph qualifies. If the piece opens with a heading, an
 * image, a blockquote, or verse, there is nothing to cap and the whole body
 * is returned untouched — a drop cap on a pull-quote looks like a mistake.
 */
export function splitLeadParagraph(md: string): {
  lead: string | null;
  rest: string;
} {
  const trimmed = md.trimStart();
  const firstBreak = trimmed.search(/\n\s*\n/);
  const firstBlock = (firstBreak === -1 ? trimmed : trimmed.slice(0, firstBreak)).trim();

  const isPlainParagraph =
    firstBlock.length > 0 &&
    !/^#{1,6}\s/.test(firstBlock) &&
    !/^>/.test(firstBlock) &&
    !/^!\[/.test(firstBlock) &&
    !/^\s*[-*+]\s/.test(firstBlock) &&
    !/^\s*\d+\.\s/.test(firstBlock) &&
    !/^```/.test(firstBlock) &&
    !/^\|/.test(firstBlock) &&
    !/^(-{3,}|\*{3,}|_{3,})$/.test(firstBlock);

  if (!isPlainParagraph) return { lead: null, rest: md };

  return {
    lead: firstBlock,
    rest: firstBreak === -1 ? "" : trimmed.slice(firstBreak).trimStart(),
  };
}

/**
 * Peel the first *grapheme cluster* off a string.
 *
 * This is why the drop cap is a component and not CSS. `::first-letter` works
 * on Latin because one letter is one code point. In Bengali the first visual
 * unit of "ক্ষুধা" is the conjunct ক্ষ — three code points (ক + halant + ষ) —
 * and of "কী" is ক + ী. CSS will happily take just ক and leave the halant and
 * the matra stranded at normal size, which renders as a typographic error.
 *
 * Intl.Segmenter with granularity "grapheme" gets this right. Node 18+ and
 * every current browser support it; the fallback is simply no drop cap, which
 * is a cosmetic loss rather than a broken page.
 */
export function firstGrapheme(text: string): { head: string; tail: string } | null {
  if (!text) return null;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });
    // Segments is iterable, so this pulls just the first cluster without
    // walking the whole string.
    const [first] = segmenter.segment(text);
    if (!first) return null;
    return { head: first.segment, tail: text.slice(first.segment.length) };
  }

  return null;
}

