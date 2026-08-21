/**
 * Series Documentation Generator — Orchestrator
 *
 * Reads every context file in Content/context/{Series}/,
 * runs AI analysis on each episode, aggregates cross-episode
 * data, and generates a comprehensive master documentation
 * Markdown file per series.
 *
 * Usage:
 *   npm run docs:generate
 *   npm run docs:generate -- "মেঘনাদবধ কাব্য"   (specific series)
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { bengaliSlug } from "../src/lib/bengali";
import { analyzeEpisode, extractEntities, classifyThemes } from "./docs-ai";
import { assembleDocument, type EpisodeData, type SeriesData } from "./docs-assembler";

dotenv.config();

// ─── Helpers ──────────────────────────────────────────────────

function extractEpisodeNumber(filename: string): number {
  if (filename.includes("অন্তিম") || filename.toLowerCase().includes("final")) {
    return 3;
  }
  const bengaliDigits: Record<string, string> = {
    "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5",
    "৬": "6", "৭": "7", "৮": "8", "৯": "9", "০": "0",
  };
  const converted = filename.replace(/[১-৯০]/g, (d) => bengaliDigits[d] || d);
  const match = converted.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

function countWords(text: string): number {
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function estimateReadingMinutes(text: string): number {
  // Bengali reading speed: ~120 words/minute (slower than English due to conjuncts)
  const words = countWords(text);
  return Math.max(1, Math.ceil(words / 120));
}

function findThumbnail(thumbnailDir: string, episodeBaseName: string): string | null {
  if (!fs.existsSync(thumbnailDir)) return null;

  const validExts = [".png", ".jpg", ".jpeg", ".webp"];
  const files = fs.readdirSync(thumbnailDir);
  const normalizedTarget = episodeBaseName.trim().replace(/\s+/g, " ").toLowerCase();

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!validExts.includes(ext)) continue;
    const base = path.basename(file, ext).trim().replace(/\s+/g, " ").toLowerCase();
    if (base === normalizedTarget) return file;
  }

  // Prefix match fallback
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!validExts.includes(ext)) continue;
    const base = path.basename(file, ext).trim().replace(/\s+/g, " ").toLowerCase();
    if (base.startsWith(normalizedTarget) || normalizedTarget.startsWith(base)) return file;
  }

  return null;
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  📖 Thoughts Whatever — Documentation Engine        ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const contentBaseDir = path.join(process.cwd(), "Content");
  const contextBaseDir = path.join(contentBaseDir, "context");
  const thumbnailBaseDir = path.join(contentBaseDir, "Thumnail");
  const docsOutputDir = path.join(contentBaseDir, "docs");

  if (!fs.existsSync(contextBaseDir)) {
    console.error(`❌ Context directory not found at ${contextBaseDir}`);
    process.exit(1);
  }

  // Create docs output directory
  if (!fs.existsSync(docsOutputDir)) {
    fs.mkdirSync(docsOutputDir, { recursive: true });
  }

  // Filter to specific series if provided as CLI argument (ignoring flags starting with --)
  const arg = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const targetSeries = arg || null;

  const seriesFolders = fs
    .readdirSync(contextBaseDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => !targetSeries || name.includes(targetSeries));

  if (seriesFolders.length === 0) {
    console.log(targetSeries
      ? `ℹ️ No series folder matching "${targetSeries}" found.`
      : "ℹ️ No series folders found inside Content/context/");
    process.exit(0);
  }

  for (const folderName of seriesFolders) {
    const contextSeriesDir = path.join(contextBaseDir, folderName);
    const thumbnailSeriesDir = path.join(thumbnailBaseDir, folderName);

    const cleanSeriesTitle = folderName.replace(/\s*Series\s*$/i, "").trim();
    const seriesSlug = bengaliSlug(cleanSeriesTitle);

    console.log(`\n📚 Processing Series: "${cleanSeriesTitle}"`);
    console.log(`   Slug: ${seriesSlug}`);
    console.log("─".repeat(56));

    // Find episode files (exclude .social.md)
    const episodeFiles = fs
      .readdirSync(contextSeriesDir)
      .filter((file) =>
        (file.endsWith(".txt") || file.endsWith(".md")) &&
        !file.endsWith(".social.md"),
      )
      .sort((a, b) => extractEpisodeNumber(a) - extractEpisodeNumber(b));

    if (episodeFiles.length === 0) {
      console.log(`  ⚠️ No text files found in ${contextSeriesDir}`);
      continue;
    }

    console.log(`   Found ${episodeFiles.length} episodes\n`);

    const episodes: EpisodeData[] = [];

    // ─── Process each episode ──────────────────────────────────
    for (const file of episodeFiles) {
      const filePath = path.join(contextSeriesDir, file);
      const fileBaseName = path.basename(file, path.extname(file));
      const episodeNumber = extractEpisodeNumber(fileBaseName);
      const rawScript = fs.readFileSync(filePath, "utf-8");

      console.log(`  ┌─ Episode ${episodeNumber}: "${fileBaseName}"`);

      // Step 1: AI Analysis
      console.log(`  │  🤖 Analyzing episode...`);
      const analysis = await analyzeEpisode(rawScript, fileBaseName, episodeNumber, cleanSeriesTitle);
      console.log(`  │  ✅ Summary: ${analysis.summary.slice(0, 80)}...`);

      // Step 2: Entity Extraction
      console.log(`  │  🔍 Extracting entities...`);
      const entities = await extractEntities(rawScript, fileBaseName, episodeNumber, cleanSeriesTitle);
      console.log(`  │  ✅ Found: ${entities.characters.length} characters, ${entities.quotes.length} quotes, ${entities.difficultWords.length} words`);

      // Step 3: Thumbnail
      const thumbnailFile = findThumbnail(thumbnailSeriesDir, fileBaseName);
      console.log(`  │  🖼️  Thumbnail: ${thumbnailFile || "⚠️ Not found"}`);

      // Step 4: Stats
      const wordCount = countWords(rawScript);
      const readingMinutes = estimateReadingMinutes(rawScript);
      console.log(`  └─ 📊 ${wordCount} words, ~${readingMinutes} min read\n`);

      episodes.push({
        number: episodeNumber,
        title: fileBaseName,
        rawScript,
        analysis,
        entities,
        wordCount,
        readingMinutes,
        thumbnailFile,
        status: "Published",
      });
    }

    // ─── Cross-episode theme classification ─────────────────────
    console.log("  🎨 Classifying themes across all episodes...");
    const episodeSummaries = episodes.map((ep) => ({
      number: ep.number,
      title: ep.title,
      summary: ep.analysis.summary,
    }));
    const themes = await classifyThemes(episodeSummaries, cleanSeriesTitle);
    console.log(`  ✅ Classified ${themes.themes.length} themes\n`);

    // ─── Assemble document ──────────────────────────────────────
    console.log("  📄 Assembling documentation...");

    const seriesData: SeriesData = {
      seriesName: cleanSeriesTitle,
      seriesSlug: seriesSlug,
      episodes,
      themes,
      generatedAt: new Date().toISOString().split("T")[0],
    };

    const document = assembleDocument(seriesData);

    // ─── Write output ───────────────────────────────────────────
    const outputFilename = `${seriesSlug}.md`;
    const outputPath = path.join(docsOutputDir, outputFilename);
    fs.writeFileSync(outputPath, document, "utf-8");

    const fileSizeKb = (Buffer.byteLength(document, "utf-8") / 1024).toFixed(1);

    console.log("╔══════════════════════════════════════════════════════╗");
    console.log(`║  ✅ DOCUMENTATION GENERATED                          ║`);
    console.log("╠══════════════════════════════════════════════════════╣");
    console.log(`║  Series:    ${cleanSeriesTitle}`);
    console.log(`║  Episodes:  ${episodes.length}`);
    console.log(`║  Characters: ${new Set(episodes.flatMap((e) => e.entities.characters.map((c) => c.name.toLowerCase()))).size} unique`);
    console.log(`║  Themes:    ${themes.themes.length}`);
    console.log(`║  File Size: ${fileSizeKb} KB`);
    console.log(`║  Output:    ${outputPath}`);
    console.log("╚══════════════════════════════════════════════════════╝");
  }

  console.log("\n🎉 ALL DOCUMENTATION GENERATED SUCCESSFULLY!\n");
}

export { main as generateDocs };

if (require.main === module) {
  main().catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  });
}
