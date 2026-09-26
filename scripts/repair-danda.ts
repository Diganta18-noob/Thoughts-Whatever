/**
 * Repairs the l-to-danda corruption across every String column in the schema.
 *
 *   npm run repair:danda              dry run, writes the report, changes nothing
 *   npm run repair:danda -- --apply   commits the occurrences that resolved cleanly
 *
 * Field discovery reflects over the Prisma DMMF, so no text column is missed
 * as the schema grows.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  DANDA,
  hasCorruption,
  makeWordChecker,
  repairString,
  type DandaReview,
} from "../src/lib/danda-repair";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const WORDS_PATH = join(process.cwd(), "scripts", "data", "english-words.txt");
const REPORT_PATH = join(process.cwd(), "danda-repair-report.txt");

function loadWords(): string[] {
  if (!existsSync(WORDS_PATH)) {
    console.warn(`⚠ ${WORDS_PATH} not found — every occurrence will be sent to review.`);
    return [];
  }
  return readFileSync(WORDS_PATH, "utf8").split(/\r?\n/).filter(Boolean);
}

interface Hit {
  model: string;
  id: string;
  field: string;
  before: string;
  after: string;
  reviews: DandaReview[];
}

interface Delegate {
  findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
  update: (args: unknown) => Promise<unknown>;
}

/** Prisma exposes each model as a camelCase delegate: Piece -> piece. */
function delegateFor(model: string): Delegate | undefined {
  const key = model.charAt(0).toLowerCase() + model.slice(1);
  return (prisma as unknown as Record<string, Delegate>)[key];
}

/** Int and BigInt ids arrive from the scan as strings. */
function castId(id: string, type: string): string | number | bigint {
  if (type === "Int") return Number(id);
  if (type === "BigInt") return BigInt(id);
  return id;
}

async function main() {
  const isWord = makeWordChecker(loadWords());
  const hits: Hit[] = [];
  let scannedModels = 0;

  for (const model of Prisma.dmmf.datamodel.models) {
    const stringFields = model.fields
      .filter((f) => f.kind === "scalar" && f.type === "String" && !f.isList)
      .map((f) => f.name);
    if (stringFields.length === 0) continue;

    const idField = model.fields.find((f) => f.isId);
    if (!idField) continue;

    const delegate = delegateFor(model.name);
    if (!delegate) continue;

    // Narrow in SQL to rows containing a danda anywhere, then apply the
    // Latin-adjacency test in JS.
    let rows: Record<string, unknown>[];
    try {
      rows = await delegate.findMany({
        where: { OR: stringFields.map((f) => ({ [f]: { contains: DANDA } })) },
        select: Object.fromEntries([idField.name, ...stringFields].map((f) => [f, true])),
      });
    } catch (err) {
      console.warn(`⚠ skipped ${model.name}: ${(err as Error).message}`);
      continue;
    }

    scannedModels++;

    for (const row of rows) {
      for (const field of stringFields) {
        const value = row[field];
        if (typeof value !== "string" || !hasCorruption(value)) continue;

        const result = repairString(value, isWord);
        hits.push({
          model: model.name,
          id: String(row[idField.name]),
          field,
          before: value,
          after: result.text,
          reviews: result.reviews,
        });
      }
    }
  }

  writeFileSync(REPORT_PATH, renderReport(hits, scannedModels), "utf8");

  const changed = hits.filter((h) => h.after !== h.before);
  const review = hits.filter((h) => h.reviews.length > 0);

  console.log(`\nScanned ${scannedModels} models.`);
  console.log(`Fields with corruption: ${hits.length}`);
  console.log(`Resolvable: ${changed.length}`);
  console.log(`Needing review: ${review.length}`);
  console.log(`Report: ${REPORT_PATH}`);

  if (!APPLY) {
    console.log("\nDry run — nothing written. Re-run with --apply to commit.");
    return;
  }

  let written = 0;
  for (const hit of changed) {
    const model = Prisma.dmmf.datamodel.models.find((m) => m.name === hit.model)!;
    const idField = model.fields.find((f) => f.isId)!;
    const delegate = delegateFor(hit.model)!;

    await delegate.update({
      where: { [idField.name]: castId(hit.id, idField.type) },
      data: { [hit.field]: hit.after },
    });
    written++;
  }
  console.log(`\n✓ Updated ${written} fields.`);
}

function renderReport(hits: Hit[], scannedModels: number): string {
  const lines: string[] = [
    "DANDA REPAIR REPORT",
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${APPLY ? "APPLY" : "DRY RUN"}`,
    `Models scanned: ${scannedModels}`,
    "",
  ];

  const review = hits.filter((h) => h.reviews.length > 0);
  const clean = hits.filter((h) => h.reviews.length === 0 && h.after !== h.before);

  lines.push(`═══ NEEDS REVIEW (${review.length}) ═══`, "");
  for (const h of review) {
    lines.push(`${h.model}.${h.field}  id=${h.id}`);
    for (const r of h.reviews) {
      lines.push(`  reason: ${r.reason}`);
      lines.push(`  context: …${r.context}…`);
      lines.push(`  join:  ${excerpt(r.joined, r.dandaIndex)}`);
      lines.push(`  split: ${excerpt(r.split, r.dandaIndex)}`);
    }
    lines.push("");
  }

  lines.push(`═══ RESOLVED (${clean.length}) ═══`, "");
  for (const h of clean) {
    lines.push(`${h.model}.${h.field}  id=${h.id}`);
    lines.push(`  before: ${firstDiff(h.before)}`);
    lines.push(`  after:  ${firstDiff(h.after)}`);
    lines.push("");
  }

  return lines.join("\n");
}

function excerpt(text: string, at: number): string {
  return text.slice(Math.max(0, at - 30), Math.min(text.length, at + 30));
}

function firstDiff(text: string): string {
  return text.length > 160 ? text.slice(0, 160) + "…" : text;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
