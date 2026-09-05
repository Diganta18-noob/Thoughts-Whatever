import dotenv from "dotenv";

dotenv.config();

export interface SeriesMeta {
  titleEn: string;
  descBn: string;
  longDescBn: string;
  seoDescription: string;
  heroDescription: string;
  bannerTitle: string;
  subtitle: string;
  tags: string[];
  englishTags: string[];
  readingLevel: string;
  estimatedDuration: string;
  category: string;
  colorTheme: string;
  icon: string;
}

export interface EpisodeMeta {
  titleEn: string;
  slug: string;
  readingTimeMinutes: number;
  excerpt: string;
  summary: string;
  shortDescription: string;
  quote: string;
  highlightedQuote: string;
  seoMetaTitle: string;
  seoDescription: string;
  openGraphDescription: string;
  twitterDescription: string;
  keywords: string[];
  bengaliTags: string[];
  englishTags: string[];
  category: string;
}

export interface SocialCaptions {
  instagram: string;
  facebook: string;
  linkedin: string;
  twitterThread: string[];
  youtubeDescription: string;
  shortDescription: string;
}

/**
 * Format raw Bengali article text into clean markdown formatting.
 * Preserves the original Bengali writing word-for-word, improving spacing, punctuation,
 * paragraphing, and preserving pull quotes.
 */
export function cleanMarkdownBody(text: string, title?: string): string {
  let cleaned = text.trim();

  // Strip code block backticks ```markdown ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```[a-z]*\n?/gi, "").replace(/\n?```$/gi, "").trim();

  // Remove redundant H1 or H2 title at top of body (e.g. ## Title)
  cleaned = cleaned.replace(/^#{1,3}\s+[^\n]+\n+/, "").trim();

  // Remove double fence leftovers
  cleaned = cleaned.replace(/^```[a-z]*\n?/gi, "").replace(/\n?```$/gi, "").trim();

  return cleaned.trim();
}

/**
 * Deterministic, offline formatting for Bengali article body.
 * Preserves 100% of the author's words without calling external AI APIs.
 */
export async function formatArticleBody(rawContent: string, title: string): Promise<string> {
  const normalized = rawContent
    .replace(/\r\n/g, "\n")
    .replace(/\s*l\s*/g, "। ")
    .replace(/\s*L\s*/g, "। ")
    .replace(/।([^\s\n"”'’])/g, "। $1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleanMarkdownBody(normalized, title);
}

/**
 * Deterministic, offline metadata generation for a series.
 */
export async function generateSeriesMetadata(seriesName: string, sampleContent: string): Promise<SeriesMeta> {
  return {
    titleEn: seriesName,
    descBn: `${seriesName} বিষয়ে একটি বিশেষ সাহিত্যিক ধারাবাহিক ও বিশ্লেষণ।`,
    longDescBn: `${seriesName} ধারাবাহিকে মূল সাহিত্যপাঠ ও গভীর ভাবার্থ উপস্থাপন করা হয়েছে।`,
    seoDescription: `Read the complete literary series on ${seriesName} on Thoughts Whatever.`,
    heroDescription: `${seriesName} — সাহিত্যের নিবিড় আলোয়।`,
    bannerTitle: seriesName,
    subtitle: "ধারাবাহিক সাহিত্যপাঠ ও আলোচনা",
    tags: ["বাংলা সাহিত্য", "ধারাবাহিক", "বিশ্লেষণ"],
    englishTags: ["Bengali Literature", "Series", "Analysis"],
    readingLevel: "General Reader",
    estimatedDuration: "২০ মিনিট",
    category: "Literature",
    colorTheme: "Deep Crimson",
    icon: "book-open",
  };
}

/**
 * Deterministic, offline metadata generation for an episode/article.
 * Derives quotes, excerpts, and SEO descriptions directly from the source text.
 */
export async function generateEpisodeMetadata(
  seriesName: string,
  episodeTitle: string,
  formattedBody: string,
  episodeNumber: number
): Promise<EpisodeMeta> {
  const clean = formattedBody.replace(/^[>#\s]+/gm, "").trim();
  const firstPara = clean.split("\n\n")[0] || clean;
  const excerpt = firstPara.length > 200 ? firstPara.slice(0, 197).trim() + "..." : firstPara;

  const sentences = clean
    .split(/[।?!]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
  const quote = sentences[0] || episodeTitle;

  return {
    titleEn: episodeTitle,
    slug: `episode-${episodeNumber}`,
    readingTimeMinutes: Math.max(1, Math.ceil(clean.split(/\s+/).length / 130)),
    excerpt,
    summary: excerpt,
    shortDescription: episodeTitle,
    quote,
    highlightedQuote: quote,
    seoMetaTitle: `${episodeTitle} | Thoughts Whatever`,
    seoDescription: `${episodeTitle} — Thoughts Whatever-এ পড়ুন সম্পূর্ণ পাঠ ও বিশ্লেষণ।`,
    openGraphDescription: excerpt,
    twitterDescription: excerpt,
    keywords: [seriesName, episodeTitle, "বাংলা সাহিত্য", "Bengali Literature"],
    bengaliTags: ["বাংলা সাহিত্য", "বিশ্লেষণ"],
    englishTags: ["Bengali Literature", "Analysis"],
    category: "Literature",
  };
}

/**
 * Deterministic, offline social media caption generation.
 */
export async function generateSocialCaptions(
  seriesName: string,
  episodeTitle: string,
  excerpt: string,
  quote: string,
  url: string
): Promise<SocialCaptions> {
  const cleanQuote = quote ? `"${quote}"\n\n` : "";

  return {
    instagram: `✨ ${episodeTitle}\n\n${cleanQuote}${excerpt}\n\n🔗 সম্পূর্ণ লেখাটি পড়ুন বায়োর লিংকে:\n${url}\n\n#ThoughtsWhatever #বাংলাসাহিত্য #${seriesName.replace(/\s+/g, "")}`,
    facebook: `📖 ${seriesName}: ${episodeTitle}\n\n${cleanQuote}${excerpt}\n\nপড়ুন পুরো লেখাটি: ${url}`,
    linkedin: `Exploring Bengali Literature: ${episodeTitle} (${seriesName})\n\n${cleanQuote}Read the full piece here: ${url}`,
    twitterThread: [
      `📌 ${quote || episodeTitle}\n\n${episodeTitle} — ${seriesName}`,
      `${excerpt}`,
      `🔗 Read the full piece on Thoughts Whatever:\n${url}`,
    ],
    youtubeDescription: `${episodeTitle} | ${seriesName}\n\n${cleanQuote}Read full article: ${url}`,
    shortDescription: `${episodeTitle} — ${seriesName}`,
  };
}
