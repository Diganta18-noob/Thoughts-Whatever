/**
 * Third admin pass: radius/shadow normalisation, table parts, native selects.
 *
 *   npx tsx scripts/codemod-admin-structure.ts           dry run
 *   npx tsx scripts/codemod-admin-structure.ts --write   rewrites the files
 *
 * Three separate problems, one traversal:
 *
 * 1. RADIUS. The agreed shape is the 9px `--radius` token, exposed as
 *    `rounded-card`. The admin instead paints panels at `rounded-sm` (2px),
 *    with `rounded`, `-md`, `-lg` and `-xl` also in play — so every surface
 *    has a slightly different corner and none of them is the one we chose.
 *    Only panels are touched: a class string has to name both a rule border
 *    and a surface background to qualify. `rounded-full` and the side-specific
 *    forms are left alone.
 *
 * 2. TABLE PARTS. thead/tbody/tr/th/td become THead/TBody/TR/TH/TD, which
 *    carry the agreed cell padding, header treatment and row hover. The
 *    `<table>` element itself is deliberately NOT converted to the `Table`
 *    primitive: every admin table already sits inside a wrapper div that draws
 *    the box, and `Table` draws its own, so converting would nest two boxes.
 *    Pass 1 fixes those wrappers instead.
 *
 * 3. SELECTS. The control pass skipped `<select>` because the Radix Select is
 *    not a drop-in. NativeSelect is, so they migrate here.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const WRITE = process.argv.includes("--write");

// ── 1. radius + shadow ───────────────────────────────────────────────

/** A class string describing a panel, rather than an inline chip or a bar. */
function isPanel(classes: string): boolean {
  const hasBorder = /\bborder-rule(?:\/\d+)?\b/.test(classes);
  const hasSurface = /\bbg-surface(?:-raised)?(?:\/\d+)?\b/.test(classes);
  return hasBorder && hasSurface;
}

const RADIUS_RE = /\brounded(?:-(?:sm|md|lg|xl|2xl|3xl))?\b(?!-)/g;

function normaliseRadius(classes: string, count: { n: number }): string {
  if (!isPanel(classes)) return classes;
  return classes.replace(RADIUS_RE, (m) => {
    if (m === "rounded-card") return m;
    count.n++;
    return "rounded-card";
  });
}

// ── shared JSX helpers ───────────────────────────────────────────────

/**
 * Index just past the JSX tag opening at `start`. Brace- and quote-aware:
 * an attribute like `onChange={(e) => f(e)}` contains a `>`, so a regex
 * cannot find the real end of the tag.
 */
function endOfTag(src: string, start: number): number {
  let quote: string | null = null;
  let braces = 0;
  for (let i = start; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") braces++;
    else if (ch === "}") braces--;
    else if (ch === ">" && braces === 0) return i + 1;
  }
  return -1;
}

/** Rewrites the `</lower>` that matches the opening tag ending at `from`. */
function renameCloser(src: string, from: number, lower: string, upper: string): string | null {
  let depth = 1;
  let i = from;
  const open = `<${lower}`;
  const close = `</${lower}>`;
  while (i < src.length) {
    const o = src.indexOf(open, i);
    const c = src.indexOf(close, i);
    if (c === -1) return null;
    if (o !== -1 && o < c) {
      depth++;
      i = o + open.length;
      continue;
    }
    depth--;
    if (depth === 0) {
      return src.slice(0, c) + `</${upper}>` + src.slice(c + close.length);
    }
    i = c + close.length;
  }
  return null;
}

/** Renames every `<lower>` tag to `<Upper>`, closers included. */
function renameTag(src: string, lower: string, upper: string, count: { n: number }): string {
  let out = src;
  let cursor = 0;
  for (;;) {
    const at = out.indexOf(`<${lower}`, cursor);
    if (at === -1) break;
    const after = out[at + lower.length + 1];
    // `<th` must not match `<thead`.
    if (after && /[\w-]/.test(after)) {
      cursor = at + 1;
      continue;
    }
    const end = endOfTag(out, at);
    if (end === -1) break;
    const tagText = out.slice(at, end);
    const replaced = `<${upper}` + tagText.slice(lower.length + 1);
    const head = out.slice(0, at) + replaced;
    const tail = out.slice(end);

    if (/\/>$/.test(tagText)) {
      out = head + tail;
    } else {
      const renamed = renameCloser(tail, 0, lower, upper);
      if (renamed === null) {
        cursor = end;
        continue;
      }
      out = head + renamed;
    }
    count.n++;
    cursor = at + replaced.length;
  }
  return out;
}

// ── 3. select boilerplate ────────────────────────────────────────────

/** Classes NativeSelect already applies; keeping them is noise or conflict. */
const SELECT_BOILERPLATE = [
  /^h-(?:8|9|10)$/, /^w-full$/,
  /^px-(?:2|2\.5|3|3\.5)$/, /^py-(?:1|1\.5|2|2\.5)$/,
  /^pl-3$/, /^pr-(?:8|10)$/,
  /^rounded(?:-(?:sm|md|lg|xl|card))?$/,
  /^border$/, /^border-rule(?:\/\d+)?$/,
  /^bg-surface(?:-raised)?(?:\/\d+)?$/,
  /^text-(?:xs|sm|step-0)$/,
  /^text-content(?:-soft|-faint)?$/,
  /^font-(?:sans|ui)$/,
  /^appearance-none$/,
  /^outline-none$/, /^focus:outline-none$/, /^focus-visible:outline-none$/,
  /^focus:border-(?:accent|success|rule|content)(?:\/\d+)?$/,
  /^focus:ring-(?:0|1|2|accent|rule)(?:\/\d+)?$/,
  /^disabled:(?:opacity-\d+|cursor-not-allowed)$/,
  /^transition(?:-colors|-all)?$/,
];

function strip(classes: string, patterns: RegExp[]): string {
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .filter((c) => !patterns.some((p) => p.test(c)))
    .join(" ");
}

function migrateSelects(src: string, count: { n: number }, skipped: { n: number }): string {
  let out = src;
  let cursor = 0;
  for (;;) {
    const at = out.indexOf("<select", cursor);
    if (at === -1) break;
    const after = out[at + 7];
    if (after && /[\w-]/.test(after)) {
      cursor = at + 1;
      continue;
    }
    const end = endOfTag(out, at);
    if (end === -1) break;
    const tagText = out.slice(at, end);

    // A multi-select is a list box, not a one-line field; h-9 would crush it.
    if (/\bmultiple\b/.test(tagText) || /\bsize=/.test(tagText)) {
      skipped.n++;
      cursor = end;
      continue;
    }
    const cm = /className="([^"]*)"/.exec(tagText);
    if (!cm || !/\bpx-|\bpl-/.test(cm[1])) {
      if (cm) skipped.n++;
      cursor = end;
      continue;
    }

    const kept = strip(cm[1], SELECT_BOILERPLATE);
    let replaced = "<NativeSelect" + tagText.slice(7);
    replaced = kept
      ? replaced.replace(/className="[^"]*"/, `className="${kept}"`)
      : replaced.replace(/\s*className="[^"]*"/, "");

    const head = out.slice(0, at) + replaced;
    const tail = out.slice(end);
    const renamed = renameCloser(tail, 0, "select", "NativeSelect");
    if (renamed === null) {
      skipped.n++;
      cursor = end;
      continue;
    }
    out = head + renamed;
    count.n++;
    cursor = at + replaced.length;
  }
  return out;
}

// ── imports ──────────────────────────────────────────────────────────

function ensureImports(src: string, candidates: string[]): string {
  const needed = candidates.filter((n) => new RegExp(`<${n}(?=[\\s/>])`).test(src));
  if (needed.length === 0) return src;

  const existing = /import\s*\{([^}]*)\}\s*from\s*"@\/components\/ui";?/.exec(src);
  if (existing) {
    const have = existing[1].split(",").map((s) => s.trim()).filter(Boolean);
    const merged = [...new Set([...have, ...needed])].sort();
    return src.replace(existing[0], `import { ${merged.join(", ")} } from "@/components/ui";`);
  }
  const line = `import { ${[...new Set(needed)].sort().join(", ")} } from "@/components/ui";`;
  const imports = [...src.matchAll(/^import .*?;$/gms)];
  if (imports.length) {
    const last = imports[imports.length - 1];
    const at = last.index! + last[0].length;
    return src.slice(0, at) + "\n" + line + src.slice(at);
  }
  const directive = /^(?:"use client";|'use client';)\s*/.exec(src);
  const at = directive ? directive[0].length : 0;
  return src.slice(0, at) + line + "\n" + src.slice(at);
}

// ── run ──────────────────────────────────────────────────────────────

const files = execSync('git ls-files "src/app/admin" "src/components/admin"', { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((f) => f.endsWith(".tsx"));

const TABLE_PARTS: Array<[string, string]> = [
  ["thead", "THead"],
  ["tbody", "TBody"],
  ["tr", "TR"],
  ["th", "TH"],
  ["td", "TD"],
];

const totals = { radius: 0, shadow: 0, tableParts: 0, selects: 0, skipped: 0 };
let changed = 0;

for (const file of files) {
  const before = readFileSync(file, "utf8");
  let s = before;

  const radius = { n: 0 };
  s = s.replace(/className="([^"]*)"/g, (whole, classes: string) => {
    const next = normaliseRadius(classes, radius);
    return next === classes ? whole : `className="${next}"`;
  });

  // `shadow-xs` predates the token; the panel shadow is `shadow-card`, which
  // is `none` on the reading themes and real on the archive surface.
  const shadowBefore = (s.match(/\bshadow-xs\b/g) ?? []).length;
  s = s.replace(/\bshadow-xs\b/g, "shadow-card");

  const tableParts = { n: 0 };
  if (/<table(?=[\s/>])/.test(s)) {
    for (const [lower, upper] of TABLE_PARTS) {
      s = renameTag(s, lower, upper, tableParts);
    }
  }

  const selects = { n: 0 };
  const skipped = { n: 0 };
  s = migrateSelects(s, selects, skipped);

  totals.skipped += skipped.n;
  if (s === before) continue;

  s = ensureImports(s, ["THead", "TBody", "TR", "TH", "TD", "NativeSelect"]);

  totals.radius += radius.n;
  totals.shadow += shadowBefore;
  totals.tableParts += tableParts.n;
  totals.selects += selects.n;
  changed++;
  if (WRITE) writeFileSync(file, s, "utf8");
  console.log(
    `${WRITE ? "rewrote" : "would rewrite"}  ${file}  ` +
      `(${radius.n} radius, ${tableParts.n} table, ${selects.n} select)`,
  );
}

console.log(
  `\n${changed} files. ${totals.radius} panel radii onto rounded-card, ` +
    `${totals.shadow} shadow-xs onto shadow-card, ${totals.tableParts} table parts, ` +
    `${totals.selects} selects onto NativeSelect. ${totals.skipped} selects left alone.` +
    (WRITE ? "" : "\nDry run — pass --write to apply."),
);
