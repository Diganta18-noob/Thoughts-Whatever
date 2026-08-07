/**
 * Documentation AI — Deep analysis of Bengali narration scripts.
 *
 * Separate from content-ai.ts because these prompts serve a different
 * purpose: deep literary analysis and entity extraction for archival
 * documentation, not publishing metadata and social captions.
 *
 * Every function has a hardcoded fallback — the pipeline completes
 * even if the AI is down.
 */

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
    "X-Title": "Thoughts Whatever - Documentation Engine",
  },
});

const MODEL = "openai/gpt-4o-mini";

// ─── Types ────────────────────────────────────────────────────

export interface EpisodeAnalysis {
  summary: string;
  narrationScript: string;
  keyTakeaways: string[];
  literaryAnalysis: string;
  historicalContext: string;
  internalNotes: string;
}

export interface CharacterEntity {
  name: string;
  role: string;
  importance: string;
}

export interface LocationEntity {
  name: string;
  context: string;
}

export interface QuoteEntity {
  text: string;
  attribution: string;
  significance: string;
}

export interface GlossaryEntry {
  word: string;
  meaning: string;
  usage: string;
}

export interface TimelineEntry {
  event: string;
  period: string;
  order: number;
}

export interface ReferenceEntry {
  source: string;
  context: string;
}

export interface EpisodeEntities {
  characters: CharacterEntity[];
  locations: LocationEntity[];
  quotes: QuoteEntity[];
  difficultWords: GlossaryEntry[];
  timelineEvents: TimelineEntry[];
  references: ReferenceEntry[];
}

export interface ThemeEntry {
  category: string;
  episodes: number[];
  description: string;
}

export interface ThemeClassification {
  themes: ThemeEntry[];
}

// ─── AI Functions ─────────────────────────────────────────────

/**
 * Deep analysis of a single episode: summary, literary analysis,
 * historical context, key takeaways, and narration-ready script.
 */
export async function analyzeEpisode(
  rawScript: string,
  episodeTitle: string,
  episodeNumber: number,
  seriesName: string,
): Promise<EpisodeAnalysis> {
  const prompt = `You are a Bengali Literature Research Editor and Documentation Specialist for 'Thoughts Whatever'.

Analyze this episode script deeply and return structured documentation metadata.

SERIES: ${seriesName}
EPISODE NUMBER: ${episodeNumber}
EPISODE TITLE: ${episodeTitle}

ORIGINAL SCRIPT:
${rawScript}

STRICT RULES:
- The "summary" must explain what this episode discusses in 3-5 sentences. Do NOT rewrite the script.
- The "narrationScript" must be a clean, spoken-word-ready version of the original script — fix spacing, punctuation, remove stray 'l' used as dandi '।', but preserve the author's exact words and bilingual style.
- "keyTakeaways" must be 4-6 bullet points of the major ideas.
- "literaryAnalysis" must discuss themes, symbolism, narrative techniques, and writing style in 2-3 paragraphs. Be specific — reference actual lines from the script.
- "historicalContext" must explain historical references ONLY if they appear in the script. If none exist, return "এই পর্বে সুনির্দিষ্ট ঐতিহাসিক তথ্যসূত্র উল্লেখ করা হয়নি।"
- "internalNotes" captures connections to other episodes, foreshadowing, ideas for future reference.
- Do NOT invent information not present in the script.

Return ONLY valid JSON matching this schema:
{
  "summary": "...",
  "narrationScript": "...",
  "keyTakeaways": ["...", "..."],
  "literaryAnalysis": "...",
  "historicalContext": "...",
  "internalNotes": "..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as EpisodeAnalysis;
    }
  } catch (err) {
    console.error(`  ❌ AI analysis failed for Episode ${episodeNumber}:`, err);
  }

  // Fallback
  return {
    summary: `${seriesName} সিরিজের পর্ব ${episodeNumber}। বিস্তারিত বিশ্লেষণ AI ব্যতীত উপলব্ধ নয়।`,
    narrationScript: rawScript.replace(/\s*l\s*/g, "। ").replace(/\s*L\s*/g, "। ").trim(),
    keyTakeaways: ["AI বিশ্লেষণ উপলব্ধ নয় — ম্যানুয়ালি পূরণ করুন।"],
    literaryAnalysis: "AI বিশ্লেষণ উপলব্ধ নয়।",
    historicalContext: "AI বিশ্লেষণ উপলব্ধ নয়।",
    internalNotes: "",
  };
}

/**
 * Extract structured entities from a single episode: characters,
 * locations, quotes, difficult words, timeline events, references.
 */
export async function extractEntities(
  rawScript: string,
  episodeTitle: string,
  episodeNumber: number,
  seriesName: string,
): Promise<EpisodeEntities> {
  const prompt = `You are a Bengali Literature Archivist and Knowledge Extraction Specialist.

Extract all structured entities from this episode script. Only extract what is EXPLICITLY present in the text. Do NOT invent or assume.

SERIES: ${seriesName}
EPISODE: ${episodeNumber} — ${episodeTitle}

SCRIPT:
${rawScript}

Return ONLY valid JSON matching this schema:
{
  "characters": [
    { "name": "Character name (Bengali preferred)", "role": "Their role in this episode", "importance": "Why they matter" }
  ],
  "locations": [
    { "name": "Place name", "context": "How it appears in the script" }
  ],
  "quotes": [
    { "text": "Exact quote from the script", "attribution": "Who said it or where it's from", "significance": "Why it matters" }
  ],
  "difficultWords": [
    { "word": "Bengali word", "meaning": "Meaning in Bengali or English", "usage": "How it's used in context" }
  ],
  "timelineEvents": [
    { "event": "What happened", "period": "When (year, era, or relative)", "order": 1 }
  ],
  "references": [
    { "source": "Book, poem, author, or work referenced", "context": "How it connects to this episode" }
  ]
}

RULES:
- For quotes, extract ONLY lines that actually appear in the script text.
- For characters, include literary figures discussed (e.g. মেঘনাদ, রাবণ, বিভীষণ) AND real authors mentioned (e.g. মধুসূদন, রবীন্দ্রনাথ).
- For difficultWords, focus on Bengali literary terms, archaic words, or words that a general reader might not know.
- For references, list literary works, scriptures, or authors explicitly cited. Do NOT fabricate sources.
- If a category has no entries, return an empty array.`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as EpisodeEntities;
    }
  } catch (err) {
    console.error(`  ❌ Entity extraction failed for Episode ${episodeNumber}:`, err);
  }

  return {
    characters: [],
    locations: [],
    quotes: [],
    difficultWords: [],
    timelineEvents: [],
    references: [],
  };
}

/**
 * Cross-episode theme classification. Runs once per series after
 * all episodes have been analyzed.
 */
export async function classifyThemes(
  episodeSummaries: { number: number; summary: string; title: string }[],
  seriesName: string,
): Promise<ThemeClassification> {
  const episodeBlock = episodeSummaries
    .map((ep) => `Episode ${ep.number} (${ep.title}):\n${ep.summary}`)
    .join("\n\n---\n\n");

  const prompt = `You are a Literary Theme Classification Specialist.

Given the summaries of all episodes in the series "${seriesName}", classify the themes that run across the series.

EPISODES:
${episodeBlock}

Use ONLY these theme categories (add more if truly needed based on the content):
- ন্যায় (Justice)
- যুদ্ধ (War)
- পুরাণ (Mythology)
- দর্শন (Philosophy)
- পরিচয় (Identity)
- রাজনীতি (Politics)
- ধর্ম (Religion)
- সাহিত্য (Literature)
- পারিবারিক সম্পর্ক (Family)
- বিশ্বাসঘাতকতা (Betrayal)
- শোক ও মৃত্যু (Grief & Death)
- বীরত্ব (Heroism)

Return ONLY valid JSON:
{
  "themes": [
    {
      "category": "Theme name (Bengali — English)",
      "episodes": [1, 3, 5],
      "description": "How this theme manifests across the series (2-3 sentences, Bengali)"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as ThemeClassification;
    }
  } catch (err) {
    console.error("  ❌ Theme classification failed:", err);
  }

  return {
    themes: [
      {
        category: "সাহিত্য (Literature)",
        episodes: episodeSummaries.map((e) => e.number),
        description: "সম্পূর্ণ সিরিজটি বাংলা সাহিত্য বিশ্লেষণ কেন্দ্রিক।",
      },
    ],
  };
}
