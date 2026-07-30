/**
 * Migration Script: Apply Transliteration to Existing Database Content
 * 
 * This script updates all existing database records to apply the
 * transliteration loop, converting "থট্‌স হোয়াটেভার" to "thoughts whatever"
 * in all relevant text fields.
 * 
 * Usage:
 *   npm run migrate:transliteration
 *   npm run migrate:transliteration -- --dry-run
 *   npm run migrate:transliteration -- --verbose
 */

import { PrismaClient } from "@prisma/client";
import { banglaToEnglish, toEnglishSlug } from "../src/lib/transliterate";

// Create a separate Prisma client WITHOUT middleware
// This ensures we can read/write raw data without auto-transliteration
const prisma = new PrismaClient();

interface MigrationStats {
  model: string;
  totalRecords: number;
  updatedRecords: number;
  fields: string[];
  errors: number;
}

const stats: MigrationStats[] = [];

// Configuration
const isDryRun = process.argv.includes("--dry-run");
const isVerbose = process.argv.includes("--verbose");

function log(message: string, level: "info" | "success" | "error" | "verbose" = "info") {
  if (level === "verbose" && !isVerbose) return;
  
  const prefix = {
    info: "ℹ",
    success: "✓",
    error: "✗",
    verbose: "→",
  }[level];
  
  console.log(`${prefix} ${message}`);
}

/**
 * Check if a string needs transliteration
 */
function needsTransliteration(text: string | null): boolean {
  if (!text) return false;
  const transliterated = banglaToEnglish(text);
  return transliterated !== text;
}

/**
 * Migrate Piece records
 */
async function migratePieces() {
  log("Migrating Piece records...", "info");
  
  const pieces = await prisma.piece.findMany({
    select: {
      id: true,
      slug: true,
      titleBn: true,
      titleEn: true,
      subtitleBn: true,
      dekBn: true,
      bodyBn: true,
      excerptBn: true,
      seoDescription: true,
    },
  });

  let updated = 0;
  let errors = 0;

  for (const piece of pieces) {
    try {
      const updates: any = {};
      let hasChanges = false;

      // Check each text field
      if (needsTransliteration(piece.titleBn)) {
        updates.titleBn = banglaToEnglish(piece.titleBn);
        hasChanges = true;
        log(`  - Piece ${piece.id}: titleBn`, "verbose");
      }

      if (needsTransliteration(piece.titleEn)) {
        updates.titleEn = banglaToEnglish(piece.titleEn!);
        hasChanges = true;
        log(`  - Piece ${piece.id}: titleEn`, "verbose");
      }

      if (needsTransliteration(piece.subtitleBn)) {
        updates.subtitleBn = banglaToEnglish(piece.subtitleBn!);
        hasChanges = true;
        log(`  - Piece ${piece.id}: subtitleBn`, "verbose");
      }

      if (needsTransliteration(piece.dekBn)) {
        updates.dekBn = banglaToEnglish(piece.dekBn!);
        hasChanges = true;
        log(`  - Piece ${piece.id}: dekBn`, "verbose");
      }

      if (needsTransliteration(piece.bodyBn)) {
        updates.bodyBn = banglaToEnglish(piece.bodyBn);
        hasChanges = true;
        log(`  - Piece ${piece.id}: bodyBn`, "verbose");
      }

      if (needsTransliteration(piece.excerptBn)) {
        updates.excerptBn = banglaToEnglish(piece.excerptBn!);
        hasChanges = true;
        log(`  - Piece ${piece.id}: excerptBn`, "verbose");
      }

      if (needsTransliteration(piece.seoDescription)) {
        updates.seoDescription = banglaToEnglish(piece.seoDescription!);
        hasChanges = true;
        log(`  - Piece ${piece.id}: seoDescription`, "verbose");
      }

      // Check if slug needs transliteration
      if (piece.slug && needsTransliteration(piece.slug)) {
        updates.slug = toEnglishSlug(piece.slug);
        hasChanges = true;
        log(`  - Piece ${piece.id}: slug (${piece.slug} → ${updates.slug})`, "verbose");
      }

      if (hasChanges) {
        if (!isDryRun) {
          await prisma.piece.update({
            where: { id: piece.id },
            data: updates,
          });
        }
        updated++;
        log(`  Updated piece: ${piece.slug}`, "success");
      }
    } catch (error) {
      errors++;
      log(`  Error updating piece ${piece.id}: ${error}`, "error");
    }
  }

  stats.push({
    model: "Piece",
    totalRecords: pieces.length,
    updatedRecords: updated,
    fields: ["titleBn", "titleEn", "subtitleBn", "dekBn", "bodyBn", "excerptBn", "seoDescription", "slug"],
    errors,
  });

  log(`Completed Piece migration: ${updated}/${pieces.length} updated`, "success");
}

/**
 * Migrate Author records
 */
async function migrateAuthors() {
  log("Migrating Author records...", "info");
  
  const authors = await prisma.author.findMany({
    select: {
      id: true,
      slug: true,
      nameBn: true,
      nameEn: true,
      bioBn: true,
    },
  });

  let updated = 0;
  let errors = 0;

  for (const author of authors) {
    try {
      const updates: any = {};
      let hasChanges = false;

      if (needsTransliteration(author.nameBn)) {
        updates.nameBn = banglaToEnglish(author.nameBn);
        hasChanges = true;
      }

      if (needsTransliteration(author.nameEn)) {
        updates.nameEn = banglaToEnglish(author.nameEn!);
        hasChanges = true;
      }

      if (needsTransliteration(author.bioBn)) {
        updates.bioBn = banglaToEnglish(author.bioBn!);
        hasChanges = true;
      }

      if (author.slug && needsTransliteration(author.slug)) {
        updates.slug = toEnglishSlug(author.slug);
        hasChanges = true;
      }

      if (hasChanges) {
        if (!isDryRun) {
          await prisma.author.update({
            where: { id: author.id },
            data: updates,
          });
        }
        updated++;
        log(`  Updated author: ${author.slug}`, "success");
      }
    } catch (error) {
      errors++;
      log(`  Error updating author ${author.id}: ${error}`, "error");
    }
  }

  stats.push({
    model: "Author",
    totalRecords: authors.length,
    updatedRecords: updated,
    fields: ["nameBn", "nameEn", "bioBn", "slug"],
    errors,
  });

  log(`Completed Author migration: ${updated}/${authors.length} updated`, "success");
}

/**
 * Migrate Tag records
 */
async function migrateTags() {
  log("Migrating Tag records...", "info");
  
  const tags = await prisma.tag.findMany({
    select: {
      id: true,
      slug: true,
      labelBn: true,
      labelEn: true,
    },
  });

  let updated = 0;
  let errors = 0;

  for (const tag of tags) {
    try {
      const updates: any = {};
      let hasChanges = false;

      if (needsTransliteration(tag.labelBn)) {
        updates.labelBn = banglaToEnglish(tag.labelBn);
        hasChanges = true;
      }

      if (needsTransliteration(tag.labelEn)) {
        updates.labelEn = banglaToEnglish(tag.labelEn!);
        hasChanges = true;
      }

      if (tag.slug && needsTransliteration(tag.slug)) {
        updates.slug = toEnglishSlug(tag.slug);
        hasChanges = true;
      }

      if (hasChanges) {
        if (!isDryRun) {
          await prisma.tag.update({
            where: { id: tag.id },
            data: updates,
          });
        }
        updated++;
        log(`  Updated tag: ${tag.slug}`, "success");
      }
    } catch (error) {
      errors++;
      log(`  Error updating tag ${tag.id}: ${error}`, "error");
    }
  }

  stats.push({
    model: "Tag",
    totalRecords: tags.length,
    updatedRecords: updated,
    fields: ["labelBn", "labelEn", "slug"],
    errors,
  });

  log(`Completed Tag migration: ${updated}/${tags.length} updated`, "success");
}

/**
 * Migrate Series records
 */
async function migrateSeries() {
  log("Migrating Series records...", "info");
  
  const series = await prisma.series.findMany({
    select: {
      id: true,
      slug: true,
      titleBn: true,
      titleEn: true,
      descBn: true,
    },
  });

  let updated = 0;
  let errors = 0;

  for (const item of series) {
    try {
      const updates: any = {};
      let hasChanges = false;

      if (needsTransliteration(item.titleBn)) {
        updates.titleBn = banglaToEnglish(item.titleBn);
        hasChanges = true;
      }

      if (needsTransliteration(item.titleEn)) {
        updates.titleEn = banglaToEnglish(item.titleEn!);
        hasChanges = true;
      }

      if (needsTransliteration(item.descBn)) {
        updates.descBn = banglaToEnglish(item.descBn!);
        hasChanges = true;
      }

      if (item.slug && needsTransliteration(item.slug)) {
        updates.slug = toEnglishSlug(item.slug);
        hasChanges = true;
      }

      if (hasChanges) {
        if (!isDryRun) {
          await prisma.series.update({
            where: { id: item.id },
            data: updates,
          });
        }
        updated++;
        log(`  Updated series: ${item.slug}`, "success");
      }
    } catch (error) {
      errors++;
      log(`  Error updating series ${item.id}: ${error}`, "error");
    }
  }

  stats.push({
    model: "Series",
    totalRecords: series.length,
    updatedRecords: updated,
    fields: ["titleBn", "titleEn", "descBn", "slug"],
    errors,
  });

  log(`Completed Series migration: ${updated}/${series.length} updated`, "success");
}

/**
 * Migrate Source and TimelineEvent records
 */
async function migrateRelatedRecords() {
  log("Migrating Source records...", "info");
  
  const sources = await prisma.source.findMany();
  let updatedSources = 0;

  for (const source of sources) {
    if (needsTransliteration(source.label) || needsTransliteration(source.note)) {
      if (!isDryRun) {
        await prisma.source.update({
          where: { id: source.id },
          data: {
            label: banglaToEnglish(source.label),
            note: source.note ? banglaToEnglish(source.note) : null,
          },
        });
      }
      updatedSources++;
    }
  }

  log(`Completed Source migration: ${updatedSources}/${sources.length} updated`, "success");

  log("Migrating TimelineEvent records...", "info");
  
  const events = await prisma.timelineEvent.findMany();
  let updatedEvents = 0;

  for (const event of events) {
    if (needsTransliteration(event.labelBn) || needsTransliteration(event.descBn)) {
      if (!isDryRun) {
        await prisma.timelineEvent.update({
          where: { id: event.id },
          data: {
            labelBn: banglaToEnglish(event.labelBn),
            descBn: event.descBn ? banglaToEnglish(event.descBn) : null,
          },
        });
      }
      updatedEvents++;
    }
  }

  log(`Completed TimelineEvent migration: ${updatedEvents}/${events.length} updated`, "success");

  stats.push(
    {
      model: "Source",
      totalRecords: sources.length,
      updatedRecords: updatedSources,
      fields: ["label", "note"],
      errors: 0,
    },
    {
      model: "TimelineEvent",
      totalRecords: events.length,
      updatedRecords: updatedEvents,
      fields: ["labelBn", "descBn"],
      errors: 0,
    }
  );
}

/**
 * Print summary report
 */
function printSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("TRANSLITERATION MIGRATION SUMMARY");
  console.log("=".repeat(60));
  
  if (isDryRun) {
    console.log("⚠️  DRY RUN MODE - No changes were made to the database");
  }
  
  console.log("\nResults by Model:");
  console.log("-".repeat(60));
  
  let totalRecords = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const stat of stats) {
    totalRecords += stat.totalRecords;
    totalUpdated += stat.updatedRecords;
    totalErrors += stat.errors;

    const percentage = stat.totalRecords > 0 
      ? ((stat.updatedRecords / stat.totalRecords) * 100).toFixed(1)
      : "0.0";

    console.log(`\n${stat.model}:`);
    console.log(`  Total records: ${stat.totalRecords}`);
    console.log(`  Updated: ${stat.updatedRecords} (${percentage}%)`);
    console.log(`  Errors: ${stat.errors}`);
    console.log(`  Fields: ${stat.fields.join(", ")}`);
  }

  console.log("\n" + "-".repeat(60));
  console.log("Overall:");
  console.log(`  Total records processed: ${totalRecords}`);
  console.log(`  Total updated: ${totalUpdated}`);
  console.log(`  Total errors: ${totalErrors}`);
  console.log("=".repeat(60) + "\n");
}

/**
 * Main migration function
 */
async function main() {
  console.log("\n🔄 Starting Transliteration Migration");
  console.log("=====================================\n");

  if (isDryRun) {
    log("Running in DRY RUN mode - no database changes will be made", "info");
  }

  try {
    await migratePieces();
    await migrateAuthors();
    await migrateTags();
    await migrateSeries();
    await migrateRelatedRecords();

    printSummary();

    if (isDryRun) {
      log("\n💡 Run without --dry-run to apply changes to the database", "info");
    } else {
      log("\n✅ Migration completed successfully!", "success");
      log("All existing content has been transliterated.", "success");
      log("Future content will be automatically transliterated via middleware.", "info");
    }
  } catch (error) {
    log(`\n❌ Migration failed: ${error}`, "error");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
