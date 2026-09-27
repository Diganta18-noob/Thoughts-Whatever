/**
 * Migrates admin form fields and text buttons onto the UI primitives.
 *
 *   npx tsx scripts/codemod-admin-controls.ts           dry run
 *   npx tsx scripts/codemod-admin-controls.ts --write   rewrites the files
 *
 * The admin had 182 distinct hand-written control class strings across 294
 * call sites — every one a chance to drift. The primitives already encode the
 * agreed shape (9px radius, soft shadow on the archive surface, accent focus
 * ring), so the class strings are noise at best and contradictions at worst:
 * the single most-repeated field string set its own text to
 * `text-content-faint`, which dims what you are typing.
 *
 * Only controls that declare BOTH px- and py- are converted. That deliberately
 * leaves icon-only buttons (`p-1.5`) alone — the primitive's h-9/px-4 would
 * stretch a square.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const WRITE = process.argv.includes("--write");

/**
 * Classes the primitives already apply. Dropping them is what makes the
 * migration worth doing; anything not listed here is kept, because it is
 * either layout the call site needs or a deliberate override.
 */
const FIELD_BOILERPLATE = [
  /^h-(?:8|9|10|full)$/, /^w-full$/,
  /^px-(?:2|2\.5|3|3\.5|4)$/, /^py-(?:1|1\.5|2|2\.5)$/, /^p-(?:2|3)$/,
  /^rounded(?:-(?:sm|md|lg|xl|card))?$/,
  /^border$/, /^border-rule(?:\/\d+)?$/, /^border-transparent$/,
  /^bg-surface(?:-raised)?(?:\/\d+)?$/,
  /^text-(?:xs|sm|step-0|step-1)$/,
  /^text-content(?:-soft|-faint)?$/,
  /^font-(?:sans|ui)$/,
  /^outline-none$/, /^focus:outline-none$/, /^focus-visible:outline-none$/,
  /^focus:border-(?:accent|success|rule|content)(?:\/\d+)?$/,
  /^focus:ring-(?:0|1|2|accent|rule)(?:\/\d+)?$/,
  /^focus-visible:ring-(?:0|1|2|accent)(?:\/\d+)?$/,
  /^focus-visible:ring-offset-(?:1|2|surface)$/,
  /^focus:(?:bg|text)-(?:surface|surface-raised|content)(?:\/\d+)?$/,
  /^placeholder:text-content-faint$/, /^placeholder-content-faint$/,
  /^disabled:(?:opacity-\d+|cursor-not-allowed|pointer-events-none)$/,
  /^transition(?:-colors|-all)?$/, /^duration-\d+$/, /^ease-out$/,
];

const BUTTON_BOILERPLATE = [
  ...FIELD_BOILERPLATE,
  /^(?:inline-)?flex$/, /^items-center$/, /^justify-center$/,
  /^gap-(?:1|1\.5|2|2\.5)$/, /^whitespace-nowrap$/,
  /^font-(?:medium|semibold)$/,
  /^bg-(?:accent|danger|success|warning)(?:\/\d+)?$/,
  /^text-surface$/,
  /^hover:bg-(?:accent|danger|success|warning|rule|surface|surface-raised)(?:\/\d+)?$/,
  /^hover:text-(?:content|content-soft|surface)(?:\/\d+)?$/,
  /^hover:border-(?:accent|rule|content-soft)(?:\/\d+)?$/,
  /^hover:opacity-\d+$/,
  /^disabled:hover:bg-(?:surface|surface-raised|accent)(?:\/\d+)?$/,
  /^shadow(?:-sm|-card)?$/,
];

function stripBoilerplate(classes: string, patterns: RegExp[]): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .filter((c) => !patterns.some((p) => p.test(c)))
    .join(" ");
}

function sizeFor(classes: string): "sm" | "md" | "lg" {
  if (/\bpy-(?:0\.5|1)\b/.test(classes)) return "sm";
  if (/\bpy-(?:2\.5|3)\b/.test(classes)) return "lg";
  return "md";
}

function variantFor(classes: string): "primary" | "secondary" | "ghost" | "danger" | "success" | "warning" | null {
  const solid = (tok: string) => new RegExp(`\\bbg-${tok}\\b(?!/)`).test(classes);
  if (solid("danger")) return "danger";
  if (solid("success")) return "success";
  if (solid("warning")) return "warning";
  if (solid("accent") || /\bbg-journal-vermilion\b/.test(classes)) return "primary";
  if (/\bborder\b/.test(classes) && /\bborder-(?:rule|content|accent)/.test(classes)) return "secondary";
  if (/\bbg-(?:surface-raised|rule)\b(?!\/)/.test(classes)) return "secondary";
  // A tinted background (bg-accent/10) is a state chip, not one of the four
  // button shapes. Leave those for a human.
  if (/\bbg-\w+\/\d+/.test(classes)) return null;
  if (!/\bbg-/.test(classes) && !/\bborder\b/.test(classes)) return "ghost";
  return null;
}

/** Finds the index just past the JSX tag opening at `start`, quote-aware. */
function endOfTag(src: string, start: number): number {
  let i = start;
  let quote: string | null = null;
  let braces = 0;
  while (i < src.length) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
    } else if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === ">" && braces === 0) return i + 1;
    i++;
  }
  return -1;
}

/** Rewrites the matching `</button>` for the opening tag ending at `from`. */
function renameCloser(src: string, from: number): string | null {
  let depth = 1;
  let i = from;
  while (i < src.length) {
    const open = src.indexOf("<button", i);
    const close = src.indexOf("</button>", i);
    if (close === -1) return null;
    if (open !== -1 && open < close) {
      depth++;
      i = open + 7;
      continue;
    }
    depth--;
    if (depth === 0) {
      return src.slice(0, close) + "</Button>" + src.slice(close + "</button>".length);
    }
    i = close + 9;
  }
  return null;
}

interface Stats {
  fields: number;
  textareas: number;
  buttons: number;
  skipped: number;
}

function migrate(src: string, stats: Stats): string {
  let out = src;

  // ── input / textarea ───────────────────────────────────────────────
  for (const tag of ["input", "textarea"] as const) {
    let cursor = 0;
    for (;;) {
      const at = out.indexOf(`<${tag}`, cursor);
      if (at === -1) break;
      const after = out[at + tag.length + 1];
      if (after && /[\w-]/.test(after)) {
        cursor = at + 1;
        continue;
      }
      const end = endOfTag(out, at);
      if (end === -1) break;
      const tagText = out.slice(at, end);

      // Checkboxes, radios, files and ranges are a different control entirely.
      if (/type=\{?["']?(?:checkbox|radio|file|range|color)["']?\}?/.test(tagText)) {
        cursor = end;
        continue;
      }
      const cm = /className="([^"]*)"/.exec(tagText);
      if (!cm || !/\bpx-/.test(cm[1]) || !/\bpy-/.test(cm[1])) {
        if (cm) stats.skipped++;
        cursor = end;
        continue;
      }

      const kept = stripBoilerplate(cm[1], FIELD_BOILERPLATE);
      const Comp = tag === "input" ? "Input" : "Textarea";
      let replaced = tagText.replace(/^<input\b/, "<Input").replace(/^<textarea\b/, "<Textarea");
      replaced = kept
        ? replaced.replace(/className="[^"]*"/, `className="${kept}"`)
        : replaced.replace(/\s*className="[^"]*"/, "");

      out = out.slice(0, at) + replaced + out.slice(end);
      if (tag === "input") stats.fields++;
      else stats.textareas++;
      cursor = at + replaced.length;
      void Comp;
    }
  }

  // Close the self-closed textarea form: <textarea ... /> stays valid as
  // <Textarea ... />, but a paired <textarea></textarea> needs its closer.
  out = out.replace(/<\/textarea>/g, "</Textarea>");

  // ── button ─────────────────────────────────────────────────────────
  let cursor = 0;
  for (;;) {
    const at = out.indexOf("<button", cursor);
    if (at === -1) break;
    const after = out[at + 7];
    if (after && /[\w-]/.test(after)) {
      cursor = at + 1;
      continue;
    }
    const end = endOfTag(out, at);
    if (end === -1) break;
    const tagText = out.slice(at, end);

    const cm = /className="([^"]*)"/.exec(tagText);
    if (!cm || !/\bpx-/.test(cm[1]) || !/\bpy-/.test(cm[1])) {
      if (cm) stats.skipped++;
      cursor = end;
      continue;
    }
    const variant = variantFor(cm[1]);
    if (!variant) {
      stats.skipped++;
      cursor = end;
      continue;
    }
    const size = sizeFor(cm[1]);
    const kept = stripBoilerplate(cm[1], BUTTON_BOILERPLATE);

    let replaced = tagText.replace(/^<button\b/, "<Button");
    // The primitive already defaults to type="button".
    replaced = replaced.replace(/\s*type="button"/, "");
    replaced = kept
      ? replaced.replace(/className="[^"]*"/, `className="${kept}"`)
      : replaced.replace(/\s*className="[^"]*"/, "");
    const attrs = ` variant="${variant}"${size === "md" ? "" : ` size="${size}"`}`;
    replaced = replaced.replace(/^<Button/, `<Button${attrs}`);

    const selfClosing = /\/>$/.test(tagText);
    const head = out.slice(0, at) + replaced;
    const tail = out.slice(end);
    if (selfClosing) {
      out = head + tail;
    } else {
      const renamed = renameCloser(tail, 0);
      if (renamed === null) {
        stats.skipped++;
        cursor = end;
        continue;
      }
      out = head + renamed;
    }
    stats.buttons++;
    cursor = at + replaced.length;
  }

  return out;
}

/** Adds whatever primitives the file now references to its imports. */
function ensureImports(src: string, used: string[]): string {
  const needed = used.filter((n) => new RegExp(`<${n}[\\s/>]`).test(src));
  if (needed.length === 0) return src;

  const existing = /import\s*\{([^}]*)\}\s*from\s*"@\/components\/ui";?/.exec(src);
  if (existing) {
    const have = existing[1].split(",").map((s) => s.trim()).filter(Boolean);
    const merged = [...new Set([...have, ...needed])].sort();
    return src.replace(existing[0], `import { ${merged.join(", ")} } from "@/components/ui";`);
  }

  const line = `import { ${[...new Set(needed)].sort().join(", ")} } from "@/components/ui";\n`;
  // Sit alongside the other imports rather than above the "use client" banner.
  const imports = [...src.matchAll(/^import .*?;$/gms)];
  if (imports.length) {
    const last = imports[imports.length - 1];
    const at = last.index! + last[0].length;
    return src.slice(0, at) + "\n" + line.trimEnd() + src.slice(at);
  }
  const directive = /^("use client";|'use client';)\s*/.exec(src);
  const at = directive ? directive[0].length : 0;
  return src.slice(0, at) + line + src.slice(at);
}

const files = execSync('git ls-files "src/app/admin" "src/components/admin"', { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((f) => f.endsWith(".tsx"));

const total: Stats = { fields: 0, textareas: 0, buttons: 0, skipped: 0 };
let changed = 0;

for (const file of files) {
  const before = readFileSync(file, "utf8");
  const stats: Stats = { fields: 0, textareas: 0, buttons: 0, skipped: 0 };
  let after = migrate(before, stats);
  if (after === before) continue;

  after = ensureImports(after, ["Button", "Input", "Textarea"]);
  total.fields += stats.fields;
  total.textareas += stats.textareas;
  total.buttons += stats.buttons;
  total.skipped += stats.skipped;
  changed++;
  if (WRITE) writeFileSync(file, after, "utf8");
  console.log(
    `${WRITE ? "rewrote" : "would rewrite"}  ${file}  ` +
      `(${stats.buttons} button, ${stats.fields} input, ${stats.textareas} textarea)`,
  );
}

console.log(
  `\n${changed} files. ${total.buttons} buttons, ${total.fields} inputs, ` +
    `${total.textareas} textareas onto primitives. ${total.skipped} left for review.` +
    (WRITE ? "" : "\nDry run — pass --write to apply."),
);
