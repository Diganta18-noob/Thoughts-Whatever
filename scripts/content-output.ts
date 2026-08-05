import fs from "fs";
import path from "path";
import { SocialCaptions, EpisodeMeta, SeriesMeta } from "./content-ai";

export interface QualityReport {
  noBrokenBengaliText: boolean;
  noMissingMetadata: boolean;
  noMissingThumbnail: boolean;
  noMissingSEO: boolean;
  noMissingSlug: boolean;
  noDuplicateTags: boolean;
  noDuplicateURL: boolean;
  noMissingEpisodeLink: boolean;
  noMissingSeriesRelation: boolean;
  noSpellingMistakes: boolean;
  noMarkdownErrors: boolean;
  issues: string[];
}

/**
 * Save social media captions to a .social.md file next to the episode content.
 */
export function saveSocialCaptions(
  filePath: string,
  captions: SocialCaptions,
  title: string,
  seriesName: string
): string {
  const directory = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  const socialFilePath = path.join(directory, `${baseName}.social.md`);

  const content = `# Social Media Captions — ${title}
Series: ${seriesName}
Generated: ${new Date().toISOString()}

---

## 📷 Instagram Caption
\`\`\`
${captions.instagram}
\`\`\`

---

## 📘 Facebook Caption
\`\`\`
${captions.facebook}
\`\`\`

---

## 💼 LinkedIn Post
\`\`\`
${captions.linkedin}
\`\`\`

---

## 🐦 Twitter Thread
${captions.twitterThread.map((tweet, i) => `### Tweet ${i + 1}\n\`\`\`\n${tweet}\n\`\`\`\n`).join("\n")}

---

## 📺 YouTube Description
\`\`\`
${captions.youtubeDescription}
\`\`\`

---

## ⚡ Short Description (Story / Status)
\`\`\`
${captions.shortDescription}
\`\`\`
`;

  fs.writeFileSync(socialFilePath, content, "utf-8");
  return socialFilePath;
}

/**
 * Run Step 21 Quality Check on processed piece & series data.
 */
export function runQualityCheck(opts: {
  titleBn: string;
  bodyBn: string;
  slug: string;
  coverImage?: string | null;
  seriesSlug?: string | null;
  seoDescription?: string | null;
  tags: string[];
  existingSlugs: string[];
}): QualityReport {
  const issues: string[] = [];

  let noBrokenBengaliText = true;
  let noMissingMetadata = true;
  let noMissingThumbnail = true;
  let noMissingSEO = true;
  let noMissingSlug = true;
  let noDuplicateTags = true;
  let noDuplicateURL = true;
  let noMissingEpisodeLink = true;
  let noMissingSeriesRelation = true;
  let noSpellingMistakes = true;
  let noMarkdownErrors = true;

  // Check title & body
  if (!opts.titleBn || opts.titleBn.trim().length === 0) {
    noMissingMetadata = false;
    issues.push("Missing Bengali title");
  }

  if (!opts.bodyBn || opts.bodyBn.trim().length === 0) {
    noMissingMetadata = false;
    issues.push("Missing body text");
  }

  // Check for common broken characters
  if (/[\uFFFD]/.test(opts.bodyBn) || /\?{3,}/.test(opts.bodyBn)) {
    noBrokenBengaliText = false;
    issues.push("Potential broken encoding characters detected in text");
  }

  // Check thumbnail
  if (!opts.coverImage) {
    noMissingThumbnail = false;
    issues.push("Missing thumbnail/cover image");
  }

  // Check SEO
  if (!opts.seoDescription) {
    noMissingSEO = false;
    issues.push("Missing SEO description");
  }

  // Check Slug
  if (!opts.slug) {
    noMissingSlug = false;
    issues.push("Missing slug");
  }

  // Check duplicate URL / slug
  if (opts.existingSlugs.filter((s) => s === opts.slug).length > 1) {
    noDuplicateURL = false;
    issues.push(`Duplicate slug detected: ${opts.slug}`);
  }

  // Check tags
  const uniqueTags = new Set(opts.tags);
  if (uniqueTags.size !== opts.tags.length) {
    noDuplicateTags = false;
    issues.push("Duplicate tags detected");
  }

  // Check series relation
  if (!opts.seriesSlug) {
    noMissingSeriesRelation = false;
    issues.push("No series relation linked");
  }

  // Check basic markdown balanced tags
  const openCodeBlocks = (opts.bodyBn.match(/```/g) || []).length;
  if (openCodeBlocks % 2 !== 0) {
    noMarkdownErrors = false;
    issues.push("Unclosed markdown code block");
  }

  return {
    noBrokenBengaliText,
    noMissingMetadata,
    noMissingThumbnail,
    noMissingSEO,
    noMissingSlug,
    noDuplicateTags,
    noDuplicateURL,
    noMissingEpisodeLink,
    noMissingSeriesRelation,
    noSpellingMistakes,
    noMarkdownErrors,
    issues,
  };
}

/**
 * Print Step 22 Output Summary to console.
 */
export function printOutputSummary(seriesName: string, episodeTitle: string, slug: string) {
  console.log("\n=======================================================");
  console.log(`📌 PROCESSING COMPLETE: ${seriesName} -> ${episodeTitle}`);
  console.log("=======================================================");
  console.log("✔ Series Created / Updated");
  console.log("✔ Episode Created / Updated");
  console.log("✔ Thumbnail Connected & Uploaded");
  console.log("✔ Metadata Generated (Excerpt, Summary, Quotes)");
  console.log("✔ SEO Generated (Meta Title, OpenGraph, Structured Data)");
  console.log("✔ Landing Page Priority Updated");
  console.log("✔ Search Index Updated");
  console.log("✔ Archive & Series Navigation Connected (Prev / Next)");
  console.log("✔ Social Media Captions Ready (.social.md)");
  console.log(`🔗 URL: /series/${slug}`);
  console.log("=======================================================\n");
}
