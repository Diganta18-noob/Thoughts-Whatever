import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("⚠️ Warning: No OPENROUTER_API_KEY or OPENAI_API_KEY set in environment.");
}

const openai = new OpenAI({
  baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
  apiKey: apiKey || "dummy-key",
  defaultHeaders: {
    "HTTP-Referer": "https://thoughts-whatever.vercel.app",
    "X-Title": "Thoughts Whatever",
  },
});

const DEFAULT_MODEL = "openai/gpt-4o-mini";

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
 * Format raw Bengali article text into premium markdown formatting.
 * Preserves the original Bengali writing word-for-word, improving spacing, punctuation,
 * paragraphing, blockquotes, citations, emphasis, headings, and pull quotes.
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

export async function formatArticleBody(rawContent: string, title: string): Promise<string> {
  const prompt = `You are an expert Bengali literature editor and visual layout designer for 'Thoughts Whatever'.

Your task is to transform raw Bengali article text into premium, publishing-ready Markdown.

STRICT RULES:
1. ALWAYS preserve the exact original Bengali writing and language. Do NOT rewrite, paraphrase, translate, or remove sentences unless fixing clear typos/spacing issues.
2. Fix Bengali spacing, punctuation, quotes (e.g. replacing 'l' or 'L' used mistakenly as dandi '।', fixing missing spaces after punctuation).
3. Format into clear, readable paragraphs with appropriate blank lines (\n\n).
4. Use Markdown blockquotes (> ...) for pull quotes or literary quotes.
5. Do NOT include top-level Markdown headers (do NOT add ## Title or # Title) and do NOT wrap output in markdown code fences (\`\`\`markdown). Output raw markdown directly.

Raw Article Title: ${title}
Raw Article Text:
${rawContent}
`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = response.choices[0]?.message?.content?.trim();
    if (result) return cleanMarkdownBody(result, title);
  } catch (err) {
    console.error("AI formatting error, falling back to clean raw text:", err);
  }

  // Fallback cleanup if AI fails
  return cleanMarkdownBody(
    rawContent
      .replace(/\s*l\s*/g, "। ")
      .replace(/\s*L\s*/g, "। ")
      .replace(/।([^\s])/g, "। $1")
      .replace(/\n{3,}/g, "\n\n"),
    title,
  );
}

/**
 * Generate metadata for a new or existing Series.
 */
export async function generateSeriesMetadata(seriesName: string, sampleContent: string): Promise<SeriesMeta> {
  const prompt = `You are the Chief Content Editor for 'Thoughts Whatever' (Bengali Literature & Documentary publication).

Given the series title and a sample of content, generate comprehensive series metadata.

Series Title: ${seriesName}
Content Sample: ${sampleContent.slice(0, 800)}

Return ONLY valid JSON matching this schema:
{
  "titleEn": "English title translation/transliteration",
  "descBn": "Concise Bengali description (1-2 sentences)",
  "longDescBn": "Detailed Bengali description (3-4 sentences)",
  "seoDescription": "English SEO description for search engines",
  "heroDescription": "Evocative Bengali hero section intro line",
  "bannerTitle": "Bengali banner title",
  "subtitle": "Bengali subtitle",
  "tags": ["Bengali tag 1", "Bengali tag 2"],
  "englishTags": ["English tag 1", "English tag 2"],
  "readingLevel": "General Reader / Advanced / Academic",
  "estimatedDuration": "Total estimated reading time (e.g. '৩০ মিনিট')",
  "category": "Literature / Essay / Poetry / Archive / Criticism / Documentary / History",
  "colorTheme": "Warm Sepia / Midnight Blue / Deep Crimson / Amber",
  "icon": "book-open / feather / scroll / compass"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as SeriesMeta;
    }
  } catch (err) {
    console.error("Error generating series metadata:", err);
  }

  return {
    titleEn: seriesName,
    descBn: `${seriesName} বিষয়ে একটি ধারাবাহিক বিশ্লেষণ ও আলোচনা।`,
    longDescBn: `${seriesName} ধারাবাহিকে বাংলা সাহিত্য ও ইতিহাসের আলোয় বিশেষ বিশ্লেষণ प्रस्तुत করা হয়েছে।`,
    seoDescription: `Explore the complete series on ${seriesName} on Thoughts Whatever.`,
    heroDescription: `${seriesName} — সাহিত্যের নতুন আলোয়।`,
    bannerTitle: seriesName,
    subtitle: "ধারাবাহিক পাঠ ও পুনঃপাঠ",
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
 * Generate metadata for an Episode (Piece).
 */
export async function generateEpisodeMetadata(
  seriesName: string,
  episodeTitle: string,
  formattedBody: string,
  episodeNumber: number
): Promise<EpisodeMeta> {
  const prompt = `You are an SEO Specialist, UX Writer, and Metadata Manager for 'Thoughts Whatever'.

Analyze this episode of the series "${seriesName}".

Episode Number: ${episodeNumber}
Episode Title: ${episodeTitle}
Body Preview:
${formattedBody.slice(0, 1000)}

Return ONLY valid JSON matching this schema:
{
  "titleEn": "English translation or transliteration of the title",
  "slug": "english-slug-for-url-e-g-meghnad-badh-kabya-1",
  "readingTimeMinutes": 5,
  "excerpt": "Compelling 1-2 sentence Bengali excerpt of the article",
  "summary": "Detailed 3-4 sentence Bengali summary of key points",
  "shortDescription": "Single line summary in Bengali",
  "quote": "Most impactful direct quote from the text in Bengali",
  "highlightedQuote": "A striking standalone literary line or pull quote in Bengali",
  "seoMetaTitle": "SEO Meta Title in English or Bilingual (max 60 chars)",
  "seoDescription": "English SEO Meta Description (140-160 chars)",
  "openGraphDescription": "Engaging OpenGraph summary for social sharing (English/Bengali)",
  "twitterDescription": "Twitter summary card description (English)",
  "keywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
  "bengaliTags": ["মধুসূদন", "মেঘনাদ", "রামায়ণ", "বাংলা সাহিত্য"],
  "englishTags": ["Michael Madhusudan Dutt", "Meghnad", "Ramayana", "Bengali Literature"],
  "category": "Writing / Poetry / Literature / Archive / Essay / Documentary / Criticism"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as EpisodeMeta;
    }
  } catch (err) {
    console.error("Error generating episode metadata:", err);
  }

  return {
    titleEn: episodeTitle,
    slug: `episode-${episodeNumber}`,
    readingTimeMinutes: 4,
    excerpt: formattedBody.slice(0, 150) + "...",
    summary: formattedBody.slice(0, 300) + "...",
    shortDescription: episodeTitle,
    quote: "ঘরের শত্রু বিভীষণ",
    highlightedQuote: "এই কাব্য ইতিহাসের পাতায় রুদ্ধ কণ্ঠস্বরের।",
    seoMetaTitle: `${episodeTitle} | Thoughts Whatever`,
    seoDescription: `Read ${episodeTitle} - part of ${seriesName} on Thoughts Whatever.`,
    openGraphDescription: `Explore ${episodeTitle} on Thoughts Whatever.`,
    twitterDescription: `Read ${episodeTitle} on Thoughts Whatever.`,
    keywords: [seriesName, episodeTitle, "Bengali Literature"],
    bengaliTags: ["বাংলা সাহিত্য", "বিশ্লেষণ"],
    englishTags: ["Bengali Literature", "Analysis"],
    category: "Writing",
  };
}

/**
 * Generate social media captions for multiple platforms (Instagram, Facebook, LinkedIn, Twitter thread, YouTube).
 */
export async function generateSocialCaptions(
  seriesName: string,
  episodeTitle: string,
  excerpt: string,
  quote: string,
  url: string
): Promise<SocialCaptions> {
  const prompt = `You are the Social Media Strategist for 'Thoughts Whatever' (https://thoughts-whatever.vercel.app).

Generate engaging social media captions and posts for an episode of a literary series.

Series: ${seriesName}
Episode: ${episodeTitle}
Quote: ${quote}
Excerpt: ${excerpt}
URL: ${url}

Return ONLY valid JSON matching this schema:
{
  "instagram": "Instagram caption with line breaks, emojis, literary tone, and hashtags",
  "facebook": "Engaging Facebook post in Bengali with link call-to-action",
  "linkedin": "Professional LinkedIn post focusing on literary analysis, cultural heritage, and critical thinking",
  "twitterThread": [
    "Tweet 1 (hook with quote + emoji)",
    "Tweet 2 (core premise / context)",
    "Tweet 3 (link to full piece + CTA)"
  ],
  "youtubeDescription": "YouTube video / reel description with timestamp hints, summary, and links",
  "shortDescription": "One-line catchy preview for stories/status"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as SocialCaptions;
    }
  } catch (err) {
    console.error("Error generating social captions:", err);
  }

  return {
    instagram: `✨ ${episodeTitle}\n\n"${quote}"\n\n${excerpt}\n\n🔗 সম্পূর্ণ লেখাটি পড়ুন বায়োর লিংকে:\n${url}\n\n#ThoughtsWhatever #বাংলাসাহিত্য #${seriesName.replace(/\s+/g, "")}`,
    facebook: `📖 ${seriesName}: ${episodeTitle}\n\n"${quote}"\n\n${excerpt}\n\nপড়ুন পুরো লেখাটি: ${url}`,
    linkedin: `Exploring Bengali Literature: ${episodeTitle} (${seriesName})\n\n"${quote}"\n\nRead the full piece here: ${url}`,
    twitterThread: [
      `📌 "${quote}"\n\n${episodeTitle} — ${seriesName}`,
      `${excerpt}`,
      `🔗 Read the full piece on Thoughts Whatever:\n${url}`,
    ],
    youtubeDescription: `${episodeTitle} | ${seriesName}\n\n"${quote}"\n\nRead full article: ${url}`,
    shortDescription: `${episodeTitle} — ${seriesName}`,
  };
}
