import { readingMinutes } from "@/lib/bengali";

/**
 * Markdown helpers. Pieces are authored as markdown in the admin editor and
 * rendered with react-markdown on the page — no build step, so a typo fix is
 * live the moment it is saved.
 */

/**
 * Strip any variant of the `— thoughts.whatever` signature from content body,
 * including dashes (em-dash, en-dash, hyphen, double hyphen), varied spacing,
 * and trailing whitespace/empty lines.
 */
export function stripThoughtsSignature(md: string): string {
  if (!md) return "";
  // Match lines or trailing fragments containing dashes + thoughts.whatever (case-insensitive)
  // Tolerates em-dash (—), en-dash (–), hyphen (-), double-hyphen (--), with or without leading/trailing spaces
  const signatureRegex = /(?:^|\n)\s*(?:[—–-]{1,2}|―|‒)?\s*thoughts\.whatever\s*(?=\n|$)/gi;
  return md
    .replace(signatureRegex, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Strip markdown syntax down to plain text, for excerpts and OG descriptions. */
export function stripMarkdown(md: string): string {
  if (!md) return "";
  const clean = stripThoughtsSignature(md);
  return clean
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
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
 */
export function deriveExcerpt(md: string, limit = 180): string {
  const text = stripMarkdown(md);
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export type Heading = { id: string; text: string; level: number };

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

export function formatMarkdownBody(md: string): string {
  if (!md) return "";

  let cleaned = md.trim();
  cleaned = cleaned.replace(/^\s*#{1,6}\s+[^>\n]+\s*>\s*/, '> ');
  cleaned = cleaned.replace(/^\s*#{1,6}\s+[^>\n]+\n+/, '');
  cleaned = cleaned.replace(/^([“"'][^”"'\n]+[”"'])\s*$/gm, '> $1');

  const blocks = cleaned.split(/\n\s*\n/);
  const formattedBlocks = blocks.map((block) => {
    const trimmedBlock = block.trim();
    if (trimmedBlock.startsWith('>') || trimmedBlock.startsWith('-') || trimmedBlock.startsWith('#')) {
      return trimmedBlock;
    }
    return trimmedBlock.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
  });

  return formattedBlocks.join('\n\n').trim();
}

export function derivePieceMeta(body: string, excerpt?: string | null) {
  const formattedBody = formatMarkdownBody(body);
  return {
    excerptBn: excerpt?.trim() || deriveExcerpt(formattedBody),
    readingMinutes: readingMinutes(formattedBody),
  };
}

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

export function firstGrapheme(text: string): { head: string; tail: string } | null {
  if (!text) return null;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });
    const [first] = segmenter.segment(text);
    if (!first) return null;
    return { head: first.segment, tail: text.slice(first.segment.length) };
  }

  return null;
}

function graphemeCount(text: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });
    return [...segmenter.segment(text)].length;
  }
  return text.length;
}

export type PullQuote = {
  text: string;
  slug: string;
  titleBn: string;
  kind: string;
};

const MAX_QUOTE = 240;

export function extractPullQuotes(
  pieces: Array<{ slug: string; titleBn: string; kind: string; bodyBn: string }>,
): PullQuote[] {
  const quotes: PullQuote[] = [];

  for (const piece of pieces) {
    const lines = piece.bodyBn.split("\n");
    let inFence = false;
    const quoteLines: string[] = [];
    let collecting = false;

    for (const line of lines) {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;

      if (/^\s{0,3}>/.test(line)) {
        collecting = true;
        quoteLines.push(line.replace(/^\s{0,3}>\s?/, ""));
      } else if (collecting) {
        break;
      }
    }

    if (!collecting) continue;
    const text = stripMarkdown(quoteLines.join(" ")).trim();
    if (!text || graphemeCount(text) > MAX_QUOTE) continue;

    quotes.push({
      text,
      slug: piece.slug,
      titleBn: piece.titleBn,
      kind: piece.kind,
    });
  }

  return quotes;
}
