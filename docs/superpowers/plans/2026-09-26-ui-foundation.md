# UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the `l` → `।` text corruption in the database, then build the 14-primitive UI layer that `src/components/ui/` is missing.

**Architecture:** Pure logic lives in `src/lib/` where jest can reach it; I/O orchestration lives in `scripts/`. Primitives are leaves in the dependency graph — they read design tokens and accept `className`, and import nothing from feature modules. All theming flows through the CSS custom properties already mapped in `tailwind.config.ts`, so no primitive branches on theme.

**Tech Stack:** Next.js App Router · TypeScript · Tailwind (token-mapped) · Radix UI · class-variance-authority · Prisma · jest (`jest-environment-node`, jsdom opt-in per file) · `tsx` for scripts

## Global Constraints

- **Spec:** `docs/superpowers/specs/2026-09-26-ui-foundation-design.md`. Read it before Task 1.
- **Script runner is `tsx`**, invoked through an npm script. Never `ts-node`.
- **Jest only collects tests under `src/`** — `testMatch` is `**/src/**/__tests__/**/*.test.[jt]s?(x)`. A test placed in `scripts/` or a root `tests/` directory will silently never run.
- **Default test environment is `jest-environment-node`.** Any test rendering React must open with the docblock `/** @jest-environment jsdom */`.
- **`cn()` already exists** at `src/lib/utils.ts:4`. Import it; do not redefine it.
- **Use the token-mapped Tailwind classes** — `bg-surface`, `bg-surface-raised`, `text-content`, `text-content-soft`, `text-content-faint`, `border-rule`, `bg-accent`, `text-accent`, `text-gold`. Never hardcode a hex value and never write `rgb(var(--…))` inline when a mapped class exists.
- **Semantic font classes only:** `font-display`, `font-body`, `font-ui`, `font-mono`. Bengali content uses `font-body`; UI chrome uses `font-ui`.
- **Visual style is B · Soft shell:** `rounded-card` (9px), `shadow-card`, filled accent primary buttons, pill badges, boxed tables.
- **`shadow-card` resolves to `none` on every reading theme** and to a real shadow only under `[data-surface="archive"]`. Never apply a Tailwind shadow utility directly to a primitive.
- **UI-language convention** (established in `native-book-reader.tsx`): visible chrome in Bengali, `aria-label` and `title` in English. The admin portal is English throughout.
- **The danda repair never writes without `--apply`.** Dry-run is the default.
- **Every commit message ends with:** `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- Run `npm run typecheck` before each commit. It must pass.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/danda-repair.ts` | Pure detection and reversal logic. No I/O, no Prisma. |
| `src/lib/__tests__/danda-repair.test.ts` | Unit tests for the above. |
| `scripts/repair-danda.ts` | CLI: DMMF reflection, DB scan, report, `--apply`. |
| `scripts/data/english-words.txt` | Committed word list. |
| `src/app/globals.css` | Adds 6 tokens. No existing token changes. |
| `tailwind.config.ts` | Maps the new tokens to utilities. |
| `components.json` | shadcn registry target. |
| `src/components/ui/*.tsx` | 14 primitives, one per file. |
| `src/components/ui/index.ts` | Barrel re-export. |
| `src/components/ui/__tests__/button.test.tsx` | Variant and `className`-merge tests. |
| `src/app/admin/(dashboard)/developer/ui/page.tsx` | Dev-only visual smoke page. |

---

## Task 1: Danda reversal logic

**Files:**
- Create: `src/lib/danda-repair.ts`
- Test: `src/lib/__tests__/danda-repair.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export const DANDA: "।";
  export interface DandaReview { dandaIndex: number; context: string; joined: string; split: string; reason: string; }
  export interface DandaRepairResult { text: string; resolved: number; reviews: DandaReview[]; }
  export function hasCorruption(text: string): boolean;
  export function tokenAround(text: string, pos: number): string;
  export function makeWordChecker(words: Iterable<string>): (word: string) => boolean;
  export function repairString(source: string, isWord: (word: string) => boolean): DandaRepairResult;
  ```

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/danda-repair.test.ts`:

```ts
import {
  DANDA,
  hasCorruption,
  tokenAround,
  makeWordChecker,
  repairString,
} from "@/lib/danda-repair";

const isWord = makeWordChecker([
  "mortals", "uneasy", "lies", "the", "head", "that", "wears",
  "nothing", "first", "enters", "life", "of", "without", "a", "curse",
  "sophocles", "michael", "devil", "bengali", "itself", "cruelest",
]);

describe("hasCorruption", () => {
  it("flags a danda immediately after a Latin letter", () => {
    expect(hasCorruption(`morta${DANDA} s`)).toBe(true);
  });

  it("ignores a legitimate danda ending a Bengali sentence", () => {
    expect(hasCorruption(`আমি রেকর্ড করে দিয়েছিলাম${DANDA}`)).toBe(false);
  });

  it("ignores a danda followed by a Latin letter with no letter before it", () => {
    expect(hasCorruption(`শোনাবেন${DANDA} and then`)).toBe(false);
  });
});

describe("tokenAround", () => {
  it("returns the maximal Latin run containing the position", () => {
    expect(tokenAround("say mortals now", 6)).toBe("mortals");
  });

  it("returns an empty string when the position is not on a letter", () => {
    expect(tokenAround("say  now", 3)).toBe("");
  });
});

describe("repairString", () => {
  it("chooses the join reading when it forms a real word", () => {
    const r = repairString(`morta${DANDA} s without a curse`, isWord);
    expect(r.text).toBe("mortals without a curse");
    expect(r.resolved).toBe(1);
    expect(r.reviews).toHaveLength(0);
  });

  it("chooses the split reading when the joined form is not a word", () => {
    const r = repairString(`Uneasy${DANDA} ies the head`, isWord);
    expect(r.text).toBe("Uneasy lies the head");
    expect(r.resolved).toBe(1);
  });

  it("repairs several occurrences in one string", () => {
    const r = repairString(
      `Nothing first enters the${DANDA} ife of morta${DANDA} s`,
      isWord,
    );
    expect(r.text).toBe("Nothing first enters the life of mortals");
    expect(r.resolved).toBe(2);
  });

  it("reviews rather than guesses when both readings are words", () => {
    const both = makeWordChecker(["all", "tall", "a"]);
    const r = repairString(`ta${DANDA} l`, both);
    expect(r.resolved).toBe(0);
    expect(r.reviews).toHaveLength(1);
    expect(r.reviews[0].reason).toMatch(/ambiguous/i);
    expect(r.text).toBe(`ta${DANDA} l`);
  });

  it("reviews when neither reading is a word", () => {
    const r = repairString(`xq${DANDA} zv`, isWord);
    expect(r.resolved).toBe(0);
    expect(r.reviews).toHaveLength(1);
    expect(r.reviews[0].reason).toMatch(/neither/i);
  });

  it("leaves legitimate Bengali dandas untouched", () => {
    const src = `আমি গাইতে পারি নাই${DANDA} morta${DANDA} s`;
    const r = repairString(src, isWord);
    expect(r.text).toBe(`আমি গাইতে পারি নাই${DANDA} mortals`);
    expect(r.resolved).toBe(1);
  });

  it("handles a corrupted occurrence with no trailing space", () => {
    const r = repairString(`morta${DANDA}s`, isWord);
    expect(r.text).toBe("mortals");
  });

  it("is case-insensitive in its word lookup", () => {
    const r = repairString(`Sophoc${DANDA} es`, isWord);
    expect(r.text).toBe("Sophocles");
  });
});

describe("makeWordChecker", () => {
  it("matches regardless of case", () => {
    const ok = makeWordChecker(["Lies"]);
    expect(ok("lies")).toBe(true);
    expect(ok("LIES")).toBe(true);
  });

  it("strips a possessive suffix before a second lookup", () => {
    const ok = makeWordChecker(["mortal"]);
    expect(ok("mortal's")).toBe(true);
  });

  it("rejects an empty token", () => {
    expect(makeWordChecker(["a"])("")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/lib/__tests__/danda-repair.test.ts`
Expected: FAIL — `Cannot find module '@/lib/danda-repair'`

- [ ] **Step 3: Write the implementation**

Create `src/lib/danda-repair.ts`:

```ts
/**
 * Repairs a specific data corruption: every lowercase "l" in Latin-script
 * text was replaced with the Bengali danda, then Bengali punctuation
 * normalization stripped the space before it and forced one after.
 *
 *   "mortals"     -> "morta। s"      (join reading: no space before the l)
 *   "Uneasy lies" -> "Uneasy। ies"   (split reading: space before the l)
 *
 * Both readings are always generated and scored against a word list.
 * Anything that does not resolve cleanly is reported, never guessed at.
 */

export const DANDA = "।";

/** A danda preceded by a Latin letter cannot occur in Bengali orthography. */
const CORRUPTION = /[A-Za-z]।/;
const LETTER = /[A-Za-z']/;

export interface DandaReview {
  dandaIndex: number;
  context: string;
  joined: string;
  split: string;
  reason: string;
}

export interface DandaRepairResult {
  text: string;
  resolved: number;
  reviews: DandaReview[];
}

export function hasCorruption(text: string): boolean {
  return CORRUPTION.test(text);
}

/** The maximal run of Latin letters containing `pos`, or "" if pos is not on one. */
export function tokenAround(text: string, pos: number): string {
  if (pos < 0 || pos >= text.length || !LETTER.test(text[pos])) return "";
  let a = pos;
  let b = pos;
  while (a > 0 && LETTER.test(text[a - 1])) a--;
  while (b < text.length && LETTER.test(text[b])) b++;
  return text.slice(a, b);
}

export function makeWordChecker(words: Iterable<string>): (word: string) => boolean {
  const set = new Set<string>();
  for (const w of words) set.add(w.trim().toLowerCase());

  return (word: string): boolean => {
    if (!word) return false;
    const lower = word.toLowerCase();
    if (set.has(lower)) return true;
    if (lower.endsWith("'s") && set.has(lower.slice(0, -2))) return true;
    return false;
  };
}

function contextWindow(text: string, at: number): string {
  return text.slice(Math.max(0, at - 40), Math.min(text.length, at + 40));
}

export function repairString(
  source: string,
  isWord: (word: string) => boolean,
): DandaRepairResult {
  let text = source;
  let resolved = 0;
  const reviews: DandaReview[] = [];
  let from = 0;

  for (;;) {
    // Locate the next corruption at or after `from`.
    const rel = text.slice(from).search(CORRUPTION);
    if (rel === -1) break;

    const letterIdx = from + rel;
    const dandaIdx = letterIdx + 1;
    const hasSpace = text[dandaIdx + 1] === " ";
    const head = text.slice(0, dandaIdx);
    const tail = text.slice(dandaIdx + 1 + (hasSpace ? 1 : 0));

    const joined = head + "l" + tail;
    const split = head + " l" + tail;

    // In `joined` the restored l sits at dandaIdx; in `split` at dandaIdx + 1.
    const joinOk = isWord(tokenAround(joined, dandaIdx));
    const splitOk =
      isWord(tokenAround(split, dandaIdx + 1)) && isWord(tokenAround(split, dandaIdx - 1));

    if (joinOk && !splitOk) {
      text = joined;
      resolved++;
      from = dandaIdx;
      continue;
    }

    if (splitOk && !joinOk) {
      text = split;
      resolved++;
      from = dandaIdx + 2;
      continue;
    }

    reviews.push({
      dandaIndex: dandaIdx,
      context: contextWindow(text, dandaIdx),
      joined,
      split,
      reason:
        joinOk && splitOk
          ? "ambiguous: both readings are words"
          : "neither reading is a word",
    });
    // Skip past this occurrence so the loop terminates.
    from = dandaIdx + 1;
  }

  return { text, resolved, reviews };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/lib/__tests__/danda-repair.test.ts`
Expected: PASS — 15 tests

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/danda-repair.ts src/lib/__tests__/danda-repair.test.ts
git commit -m "$(cat <<'MSG'
feat(danda): add reversal logic for l-to-danda text corruption

Generates both the join and split readings for every corrupted
occurrence and resolves them against a word list. Ambiguous and
unrecognized cases are reported rather than guessed at, because the
affected text is literary quotation where a wrong fix is worse than
no fix.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 2: Repair script

**Files:**
- Create: `scripts/repair-danda.ts`
- Create: `scripts/data/english-words.txt`
- Modify: `package.json` (add one npm script)

**Interfaces:**
- Consumes: `DANDA`, `hasCorruption`, `makeWordChecker`, `repairString` from `src/lib/danda-repair.ts`.
- Produces: the CLI `npm run repair:danda [-- --apply]` and the file `danda-repair-report.txt`.

- [ ] **Step 1: Create the word list**

The list must be plain, newline-delimited, lowercase. Fetch a public list:

```bash
mkdir -p scripts/data
curl -sL https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt \
  -o scripts/data/english-words.txt
wc -l scripts/data/english-words.txt
```

Expected: roughly 370,000 lines. If the fetch fails, create the file empty — the script must still run and route every occurrence to review. Verify that fallback works in Step 5.

- [ ] **Step 2: Add the npm script**

In `package.json`, inside `"scripts"`, alongside the other `tsx` entries:

```json
"repair:danda": "tsx scripts/repair-danda.ts"
```

- [ ] **Step 3: Write the script**

Create `scripts/repair-danda.ts`:

```ts
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

/** Prisma exposes each model as a camelCase delegate: Piece -> piece. */
function delegateName(model: string): string {
  return model.charAt(0).toLowerCase() + model.slice(1);
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

    const delegate = (prisma as unknown as Record<string, {
      findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
      update: (args: unknown) => Promise<unknown>;
    }>)[delegateName(model.name)];
    if (!delegate) continue;

    // Narrow in SQL to rows containing a danda anywhere, then apply the
    // Latin-adjacency test in JS.
    let rows: Record<string, unknown>[];
    try {
      rows = await delegate.findMany({
        where: { OR: stringFields.map((f) => ({ [f]: { contains: DANDA } })) },
        select: Object.fromEntries(
          [idField.name, ...stringFields].map((f) => [f, true]),
        ),
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
    const delegate = (prisma as unknown as Record<string, {
      update: (args: unknown) => Promise<unknown>;
    }>)[delegateName(hit.model)];

    await delegate.update({
      where: { [idField.name]: castId(hit.id, idField.type) },
      data: { [hit.field]: hit.after },
    });
    written++;
  }
  console.log(`\n✓ Updated ${written} fields.`);
}

/** Int and BigInt ids arrive from the report as strings. */
function castId(id: string, type: string): string | number | bigint {
  if (type === "Int") return Number(id);
  if (type === "BigInt") return BigInt(id);
  return id;
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
```

- [ ] **Step 4: Run the dry run**

Run: `npm run repair:danda`
Expected: a summary on stdout and `danda-repair-report.txt` written. **Nothing in the database changes.** Confirm the report's RESOLVED section shows `morta। s` → `mortals` and `Uneasy। ies` → `Uneasy lies`.

- [ ] **Step 5: Verify the no-word-list fallback**

```bash
mv scripts/data/english-words.txt scripts/data/english-words.bak
npm run repair:danda
mv scripts/data/english-words.bak scripts/data/english-words.txt
```

Expected: the warning prints, `Resolvable: 0`, every hit lands in NEEDS REVIEW, exit code 0.

- [ ] **Step 6: Ignore the report artifact**

Append to `.gitignore`:

```
# Danda repair output
danda-repair-report.txt
```

- [ ] **Step 7: Commit (script only — the DB write is a separate, reviewed step)**

```bash
git add scripts/repair-danda.ts scripts/data/english-words.txt package.json .gitignore
git commit -m "$(cat <<'MSG'
feat(danda): add DMMF-driven repair script with dry-run default

Reflects over every String column in the schema, narrows in SQL to rows
containing a danda, then applies the Latin-adjacency test in JS. Writes a
review report and changes nothing unless --apply is passed. Runs with an
empty word list by routing every occurrence to review, so the repair is
never blocked on fetching one.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

- [ ] **Step 8: Read the report, then apply**

Open `danda-repair-report.txt`. Read the NEEDS REVIEW section first. Only once the RESOLVED entries look right:

```bash
npm run repair:danda -- --apply
```

Then confirm on the live homepage that `Sophocles`, `mortals`, and `Uneasy lies` render correctly.

---

## Task 3: Tokens, Tailwind mappings, dependencies

**Files:**
- Modify: `src/app/globals.css` (append to the `:root` block at line 90, and add one surface block)
- Modify: `tailwind.config.ts:43` (colors), `tailwind.config.ts:79` (new `borderRadius` / `boxShadow` keys)
- Create: `components.json`
- Modify: `package.json` (dependencies)

**Interfaces:**
- Consumes: nothing.
- Produces: the utilities `rounded-card`, `shadow-card`, `bg-danger`, `bg-success`, `bg-warning` (and their `text-`/`border-` forms), plus a working `font-mono`.

- [ ] **Step 1: Install dependencies**

```bash
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-dropdown-menu @radix-ui/react-tooltip @radix-ui/react-tabs class-variance-authority
```

`clsx` and `tailwind-merge` are already present — do not reinstall them.

- [ ] **Step 2: Add the tokens**

In `src/app/globals.css`, add to the existing `:root` block that begins at line 90 (the one holding `--reading-size`):

```css
  /* ─── Primitive layer ─── */
  --radius: 9px;
  --shadow-card: none;
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
```

`--font-mono` completes a mapping `tailwind.config.ts:55` already declares.

Then add the status colours to each theme block. In `:root, [data-theme="cream"]` (line 23):

```css
  --danger: 168 48 38;
  --success: 32 96 62;
  --warning: 146 98 20;
```

In `[data-theme="sepia"]` (line 35):

```css
  --danger: 164 52 34;
  --success: 38 92 60;
  --warning: 142 96 26;
```

In `[data-theme="night"]` (line 46):

```css
  --danger: 232 106 92;
  --success: 108 198 150;
  --warning: 216 172 84;
```

In `[data-surface="archive"]` (line 57):

```css
  --danger: 224 96 80;
  --success: 96 192 142;
  --warning: 212 168 78;
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.30);
```

The shadow is confined to the admin surface. Reading themes separate raised elements with `--surface-raised`, which is what that token exists for.

- [ ] **Step 3: Map the tokens in Tailwind**

In `tailwind.config.ts`, inside `theme.extend.colors` after the `gold` entry at line 42:

```ts
        danger: "rgb(var(--danger) / <alpha-value>)",
        success: "rgb(var(--success) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
```

And inside `theme.extend`, after the `letterSpacing` block at line 82:

```ts
      borderRadius: {
        card: "var(--radius)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
```

- [ ] **Step 4: Create `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "utils": "@/lib/utils",
    "hooks": "@/lib/hooks"
  }
}
```

This is what makes `npx shadcn add @vengeanceui/<component>` resolve into `src/components/ui`. Registry components will still need their colours rethemed onto these tokens — the file makes installation possible, not automatic.

- [ ] **Step 5: Verify the build picks up the new utilities**

Run: `npm run typecheck && npm run build`
Expected: both pass. A `rounded-card` or `shadow-card` class is not yet used anywhere, so this only proves the config parses.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css tailwind.config.ts components.json package.json package-lock.json
git commit -m "$(cat <<'MSG'
feat(ui): add primitive-layer tokens, Tailwind mappings, shadcn registry

Adds --radius, --shadow-card, --font-mono and per-theme --danger/
--success/--warning, then maps them to rounded-card, shadow-card and the
status colours. --font-mono completes a font-family mapping the Tailwind
config already declared but that resolved to nothing.

shadow-card is none on every reading theme and a real shadow only under
[data-surface="archive"], so the admin gets depth without the reading
pages losing their paper feel.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 4: Button

Establishes the cva + forwardRef pattern every later primitive follows.

**Files:**
- Create: `src/components/ui/button.tsx`
- Test: `src/components/ui/__tests__/button.test.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`; `rounded-card`, `shadow-card` from Task 3.
- Produces:
  ```ts
  export const buttonVariants: (props?: { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" | "lg" }) => string;
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
  export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
  ```

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/__tests__/button.test.tsx`. **The docblock is required** — the jest default environment is `node`, which has no DOM:

```tsx
/** @jest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Publish</Button>);
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it("applies the accent fill for the default primary variant", () => {
    render(<Button>Publish</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-accent");
  });

  it("applies the secondary variant instead of the primary fill", () => {
    render(<Button variant="secondary">Preview</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("bg-surface-raised");
    expect(btn).not.toHaveClass("bg-accent");
  });

  it("merges a caller className rather than dropping the variant", () => {
    render(<Button className="w-full">Publish</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("w-full");
    expect(btn).toHaveClass("bg-accent");
  });

  it("lets a caller override a conflicting utility via tailwind-merge", () => {
    render(<Button className="rounded-none">Publish</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("rounded-none");
    expect(btn).not.toHaveClass("rounded-card");
  });

  it("forwards the disabled attribute", () => {
    render(<Button disabled>Publish</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("forwards a ref to the underlying element", () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Button ref={ref}>Publish</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("defaults type to button so it cannot submit a form by accident", () => {
    render(<Button>Publish</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/components/ui/__tests__/button.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ui/button'`

- [ ] **Step 3: Write the implementation**

Create `src/components/ui/button.tsx`:

```tsx
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-card font-ui font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-surface shadow-card hover:bg-accent/90",
        secondary:
          "border border-rule bg-surface-raised text-content shadow-card hover:bg-rule/40",
        ghost: "text-content-soft hover:bg-rule/40 hover:text-content",
        danger: "bg-danger text-surface shadow-card hover:bg-danger/90",
      },
      size: {
        sm: "h-8 px-3 text-step-0",
        md: "h-9 px-4 text-step-0",
        lg: "h-11 px-6 text-step-1",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/components/ui/__tests__/button.test.tsx`
Expected: PASS — 8 tests

If `toBeInTheDocument` is undefined, `jest.setup.js` is not importing `@testing-library/jest-dom`. Add `import "@testing-library/jest-dom";` to it — the package is already a devDependency.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
git add src/components/ui/button.tsx src/components/ui/__tests__/button.test.tsx jest.setup.js
git commit -m "$(cat <<'MSG'
feat(ui): add Button primitive

First of the primitive layer. Establishes the cva + forwardRef pattern:
variants resolve to token-mapped Tailwind classes, cn() merges a caller
className so conflicting utilities override rather than duplicate, and
type defaults to "button" so a Button inside a form cannot submit it by
accident.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 5: Form primitives — Input, Textarea

**Files:**
- Create: `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx`

**Interfaces:**
- Consumes: `cn`.
- Produces:
  ```ts
  export const Input: React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement> & React.RefAttributes<HTMLInputElement>>;
  export const Textarea: React.ForwardRefExoticComponent<React.TextareaHTMLAttributes<HTMLTextAreaElement> & React.RefAttributes<HTMLTextAreaElement>>;
  ```

- [ ] **Step 1: Write `input.tsx`**

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = "text", ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-9 w-full rounded-card border border-rule bg-surface-raised px-3 font-ui text-step-0 text-content",
        "placeholder:text-content-faint",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
```

- [ ] **Step 2: Write `textarea.tsx`**

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 4, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        "w-full rounded-card border border-rule bg-surface-raised px-3 py-2 font-ui text-step-0 text-content",
        "placeholder:text-content-faint",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});
```

- [ ] **Step 3: Typecheck and commit**

```bash
npm run typecheck
git add src/components/ui/input.tsx src/components/ui/textarea.tsx
git commit -m "$(cat <<'MSG'
feat(ui): add Input and Textarea primitives

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 6: Surface primitives — Card, Badge, Table

**Files:**
- Create: `src/components/ui/card.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/table.tsx`

**Interfaces:**
- Consumes: `cn`; `--danger`/`--success`/`--warning` from Task 3.
- Produces:
  ```ts
  export const Card, CardHeader, CardTitle, CardBody, CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const badgeVariants: (props?: { tone?: "accent" | "neutral" | "success" | "warning" | "danger" }) => string;
  export const Badge: React.FC<React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>>;
  export const Table, THead, TBody, TR, TH, TD;
  ```

- [ ] **Step 1: Write `card.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-rule bg-surface-raised shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-rule px-4 py-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-ui text-step-2 font-semibold text-content", className)} {...props} />
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4 py-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2 border-t border-rule px-4 py-3", className)}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Write `badge.tsx`**

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-ui text-[0.6875rem] font-semibold",
  {
    variants: {
      tone: {
        accent: "bg-accent/12 text-accent",
        neutral: "bg-rule/50 text-content-soft",
        success: "bg-success/12 text-success",
        warning: "bg-warning/12 text-warning",
        danger: "bg-danger/12 text-danger",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
```

- [ ] **Step 3: Write `table.tsx`**

The rounded outer border is why `Table` wraps itself in a container — `overflow-hidden` on a `<table>` does not clip its own borders reliably.

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-hidden rounded-card border border-rule shadow-card">
      <table className={cn("w-full border-collapse font-ui text-step-0", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-surface-raised", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("bg-surface", className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-t border-rule first:border-t-0 hover:bg-rule/25", className)}
      {...props}
    />
  );
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-left font-semibold uppercase tracking-label text-[0.625rem] text-content-faint",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-3 py-2.5 text-content-soft", className)} {...props} />;
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
npm run typecheck
git add src/components/ui/card.tsx src/components/ui/badge.tsx src/components/ui/table.tsx
git commit -m "$(cat <<'MSG'
feat(ui): add Card, Badge and Table primitives

Table wraps itself in a rounding container because overflow-hidden on a
table element does not reliably clip its own borders.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 7: Layout primitives — PageHeader, EmptyState, Skeleton

**Files:**
- Create: `src/components/ui/page-header.tsx`, `src/components/ui/empty-state.tsx`, `src/components/ui/skeleton.tsx`

**Interfaces:**
- Consumes: `cn`.
- Produces:
  ```ts
  export function PageHeader(props: { title: string; subtitle?: string; actions?: React.ReactNode; className?: string }): JSX.Element;
  export function EmptyState(props: { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; className?: string }): JSX.Element;
  export function Skeleton(props: React.HTMLAttributes<HTMLDivElement>): JSX.Element;
  ```

- [ ] **Step 1: Write `page-header.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-wrap items-center justify-between gap-3 pb-5", className)}
    >
      <div className="min-w-0">
        <h1 className="font-ui text-step-4 font-semibold text-content">{title}</h1>
        {subtitle ? (
          <p className="mt-1 font-mono text-step-0 text-content-faint">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
```

`subtitle` uses `font-mono` because it carries counts and dates. This is the one place the metadata/prose split survives from the rejected style C, and it is the reason `--font-mono` was added.

- [ ] **Step 2: Write `empty-state.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-rule px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? <div className="text-content-faint">{icon}</div> : null}
      <h3 className="font-ui text-step-2 font-semibold text-content">{title}</h3>
      {description ? (
        <p className="max-w-measure font-ui text-step-0 text-content-soft">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
```

- [ ] **Step 3: Write `skeleton.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-card bg-rule/50", className)}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Typecheck and commit**

```bash
npm run typecheck
git add src/components/ui/page-header.tsx src/components/ui/empty-state.tsx src/components/ui/skeleton.tsx
git commit -m "$(cat <<'MSG'
feat(ui): add PageHeader, EmptyState and Skeleton primitives

PageHeader renders its subtitle in font-mono: it carries counts and dates,
and setting machine data apart from prose is the one idea worth keeping
from the rejected style C.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 8: Radix primitives — Dialog, Select, DropdownMenu, Tooltip, Tabs

These five exist so that focus traps, escape handling, roving tabindex and ARIA wiring are not hand-written.

**Files:**
- Create: `src/components/ui/dialog.tsx`, `select.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `tabs.tsx`

**Interfaces:**
- Consumes: `cn`; the five `@radix-ui/*` packages from Task 3.
- Produces:
  ```ts
  export const Dialog, DialogTrigger, DialogContent, DialogTitle, DialogFooter, DialogClose;
  export const Select, SelectTrigger, SelectContent, SelectItem, SelectValue;
  export const DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator;
  export const TooltipProvider, Tooltip, TooltipTrigger, TooltipContent;
  export const Tabs, TabsList, TabsTrigger, TabsContent;
  ```

- [ ] **Step 1: Write `dialog.tsx`**

```tsx
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function DialogContent({ className, children, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/55 data-[state=open]:animate-fade-in" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-measure -translate-x-1/2 -translate-y-1/2",
          "rounded-card border border-rule bg-surface-raised p-5 shadow-card",
          "data-[state=open]:animate-fade-up",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Close dialog"
          className="absolute right-3 top-3 rounded-card p-1 text-content-faint transition-colors hover:bg-rule/40 hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn("font-ui text-step-3 font-semibold text-content", className)}
      {...props}
    />
  );
});

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-5 flex items-center justify-end gap-2", className)} {...props} />
  );
}
```

`animate-fade-in` and `animate-fade-up` are the keyframes already defined at `tailwind.config.ts:83-101`. Reusing them keeps motion consistent, and `globals.css:112` already neutralizes them under `prefers-reduced-motion`.

- [ ] **Step 2: Write `select.tsx`**

```tsx
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between gap-2 rounded-card border border-rule bg-surface-raised px-3 font-ui text-step-0 text-content",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDown className="h-4 w-4 text-content-faint" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = "popper", ...props }, ref) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-card border border-rule bg-surface-raised shadow-card",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-card py-1.5 pl-7 pr-2 font-ui text-step-0 text-content outline-none",
        "data-[highlighted]:bg-rule/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5 text-accent" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});
```

- [ ] **Step 3: Write `dropdown-menu.tsx`**

```tsx
"use client";

import * as React from "react";
import * as MenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[10rem] overflow-hidden rounded-card border border-rule bg-surface-raised p-1 shadow-card",
          className,
        )}
        {...props}
      />
    </MenuPrimitive.Portal>
  );
});

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof MenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenuPrimitive.Item>
>(function DropdownMenuItem({ className, ...props }, ref) {
  return (
    <MenuPrimitive.Item
      ref={ref}
      className={cn(
        "flex cursor-default select-none items-center gap-2 rounded-card px-2 py-1.5 font-ui text-step-0 text-content outline-none",
        "data-[highlighted]:bg-rule/50 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <MenuPrimitive.Separator className={cn("my-1 h-px bg-rule", className)} />;
}
```

- [ ] **Step 4: Write `tooltip.tsx`**

```tsx
"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(function TooltipContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-card border border-rule bg-surface-raised px-2 py-1 font-ui text-[0.6875rem] text-content shadow-card",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
});
```

- [ ] **Step 5: Write `tabs.tsx`**

```tsx
"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn("inline-flex items-center gap-1 rounded-card bg-rule/35 p-1", className)}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "rounded-card px-3 py-1.5 font-ui text-step-0 font-medium text-content-soft transition-colors",
        "data-[state=active]:bg-surface-raised data-[state=active]:text-content data-[state=active]:shadow-card",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  );
});
```

- [ ] **Step 6: Typecheck and commit**

```bash
npm run typecheck
git add src/components/ui/dialog.tsx src/components/ui/select.tsx src/components/ui/dropdown-menu.tsx src/components/ui/tooltip.tsx src/components/ui/tabs.tsx
git commit -m "$(cat <<'MSG'
feat(ui): add Radix-backed Dialog, Select, DropdownMenu, Tooltip, Tabs

Radix carries the focus traps, escape handling, roving tabindex and ARIA
wiring; the styling is ours, on the token-mapped utilities. Dialog reuses
the fade-in/fade-up keyframes already in the Tailwind config, which
globals.css neutralizes under prefers-reduced-motion.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Task 9: Barrel export and visual smoke page

The smoke page is the primary guard for this layer: the failure mode of a themed primitive set is visual, not logical, and no unit test catches a token that reads wrong on one of four surfaces.

**Files:**
- Create: `src/components/ui/index.ts`
- Create: `src/app/admin/(dashboard)/developer/ui/page.tsx`

**Interfaces:**
- Consumes: every primitive from Tasks 4–8.
- Produces: `@/components/ui` as a single import point; the route `/admin/developer/ui`.

- [ ] **Step 1: Write the barrel**

```ts
export { Button, buttonVariants, type ButtonProps } from "./button";
export { Input } from "./input";
export { Textarea } from "./textarea";
export { Card, CardHeader, CardTitle, CardBody, CardFooter } from "./card";
export { Badge, badgeVariants, type BadgeProps } from "./badge";
export { Table, THead, TBody, TR, TH, TD } from "./table";
export { PageHeader } from "./page-header";
export { EmptyState } from "./empty-state";
export { Skeleton } from "./skeleton";
export { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogFooter, DialogClose } from "./dialog";
export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "./select";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./dropdown-menu";
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
```

- [ ] **Step 2: Write the smoke page**

`src/app/admin/(dashboard)/developer/ui/page.tsx`. It is a client component because it holds the theme-switcher state, and it is excluded from production by `notFound()`:

```tsx
"use client";

import * as React from "react";
import { notFound } from "next/navigation";
import { FileQuestion } from "lucide-react";
import {
  Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle,
  Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  EmptyState, Input, PageHeader, Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue, Skeleton, Table, TBody, TD, TH, THead, TR,
  Tabs, TabsContent, TabsList, TabsTrigger, Textarea,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui";

const THEMES = ["cream", "sepia", "night"] as const;

export default function UiSmokePage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [theme, setTheme] = React.useState<string>("cream");
  const [archive, setArchive] = React.useState(false);

  return (
    <TooltipProvider>
      <PageHeader
        title="UI primitives"
        subtitle="14 primitives · 4 surfaces · dev only"
        actions={
          <div className="flex gap-1.5">
            {THEMES.map((t) => (
              <Button
                key={t}
                size="sm"
                variant={theme === t && !archive ? "primary" : "secondary"}
                onClick={() => { setTheme(t); setArchive(false); }}
              >
                {t}
              </Button>
            ))}
            <Button
              size="sm"
              variant={archive ? "primary" : "secondary"}
              onClick={() => setArchive(true)}
            >
              archive
            </Button>
          </div>
        }
      />

      <div
        data-theme={archive ? undefined : theme}
        data-surface={archive ? "archive" : undefined}
        className="rounded-card bg-surface p-6 text-content"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Buttons</CardTitle></CardHeader>
            <CardBody className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button disabled>Disabled</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </CardBody>
            <CardFooter>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="secondary" size="sm">Hover me</Button></TooltipTrigger>
                <TooltipContent>Tooltip on the raised surface</TooltipContent>
              </Tooltip>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader><CardTitle>Form</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              <Input placeholder="Piece title" />
              <Input defaultValue="পদ্মা নদীর মাঝি" className="font-body" />
              <Textarea placeholder="Excerpt" />
              <Select defaultValue="draft">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Badges</CardTitle></CardHeader>
            <CardBody className="flex flex-wrap gap-2">
              <Badge tone="accent">Accent</Badge>
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="success">Published</Badge>
              <Badge tone="warning">Review</Badge>
              <Badge tone="danger">Failed</Badge>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Overlays &amp; tabs</CardTitle></CardHeader>
            <CardBody className="flex flex-wrap items-start gap-3">
              <Dialog>
                <DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger>
                <DialogContent>
                  <DialogTitle>Delete this piece?</DialogTitle>
                  <p className="mt-2 font-ui text-step-0 text-content-soft">
                    This cannot be undone.
                  </p>
                  <DialogFooter>
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="danger">Delete</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Duplicate</DropdownMenuItem>
                  <DropdownMenuItem>Archive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Tabs defaultValue="one" className="w-full">
                <TabsList>
                  <TabsTrigger value="one">প্রতিলিপি</TabsTrigger>
                  <TabsTrigger value="two">ক্যাপশন</TabsTrigger>
                </TabsList>
                <TabsContent value="one" className="font-ui text-step-0 text-content-soft">
                  First panel
                </TabsContent>
                <TabsContent value="two" className="font-ui text-step-0 text-content-soft">
                  Second panel
                </TabsContent>
              </Tabs>
            </CardBody>
          </Card>

          <div className="lg:col-span-2">
            <Table>
              <THead>
                <TR><TH>Title</TH><TH>Status</TH><TH>Updated</TH></TR>
              </THead>
              <TBody>
                <TR>
                  <TD className="font-body text-content">দেবী</TD>
                  <TD><Badge tone="success">Published</Badge></TD>
                  <TD className="font-mono">2026-08-14</TD>
                </TR>
                <TR>
                  <TD className="font-body text-content">বিমলা</TD>
                  <TD><Badge tone="warning">Draft</Badge></TD>
                  <TD className="font-mono">2026-08-02</TD>
                </TR>
              </TBody>
            </Table>
          </div>

          <Card>
            <CardHeader><CardTitle>Skeleton</CardTitle></CardHeader>
            <CardBody className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </CardBody>
          </Card>

          <EmptyState
            icon={<FileQuestion className="h-7 w-7" />}
            title="No pieces yet"
            description="Published writing will appear here once you create your first piece."
            action={<Button size="sm">New piece</Button>}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 3: Verify visually**

```bash
npm run dev
```

Open `http://localhost:3000/admin/developer/ui` and click through cream → sepia → night → archive. Check each:

1. Text is legible on every surface — no `content-faint` disappearing into `surface`.
2. `shadow-card` is visible **only** on archive.
3. Dialog, Select and DropdownMenu popovers use `surface-raised`, not a transparent background.
4. Focus rings are visible on all four surfaces — tab through the buttons.
5. Bengali (`font-body`) and dates (`font-mono`) are visibly different typefaces.
6. Badge tones are distinguishable on both light and dark surfaces.

- [ ] **Step 4: Run the full suite**

```bash
npm run typecheck
npm run lint
npx jest
npm run build
```

Expected: all four pass. `npm run build` must confirm the smoke page compiles even though `notFound()` gates it at runtime.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/index.ts "src/app/admin/(dashboard)/developer/ui/page.tsx"
git commit -m "$(cat <<'MSG'
feat(ui): add barrel export and dev-only visual smoke page

/admin/developer/ui renders all 14 primitives across cream, sepia, night
and archive behind a theme switcher. This is the primary guard for the
layer: the failure mode of a themed primitive set is visual, and no unit
test catches a token that reads wrong on one of four surfaces. Gated out
of production with notFound().

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
MSG
)"
```

---

## Self-Review

**Spec coverage.** Every spec section maps to a task:

| Spec | Task |
|---|---|
| §3.1 ambiguity, §3.2 resolution | 1 |
| §3.3 DMMF scan scope, §3.4 CLI interface and report | 2 |
| §4.1 dependencies, §4.2 tokens | 3 |
| §4.3 the 14 primitives | 4, 5, 6, 7, 8 |
| §4.4 boundaries (no feature-module imports; `cn()` reused) | enforced in Global Constraints; no primitive imports outside `@/lib/utils` and `@radix-ui/*` |
| §5 visual smoke page, unit tests, typecheck | 9 (smoke, full suite), 1 and 4 (unit) |

**Two corrections made while writing, both now reflected above.**

*`@radix-ui/react-popover` dropped.* The spec listed six Radix packages, but no primitive in §4.3 uses a Popover — `Select`, `DropdownMenu` and `Tooltip` each bring their own portal. Task 3 installs five. Adding a sixth unused dependency would have been the wrong call.

*Three colour tokens added.* Spec §4.2 declared only `--radius`, `--shadow-card` and `--font-mono`, but §4.3 specifies `Badge` tones `success`, `warning` and `danger`, and `Button` a `danger` variant — none of which any existing token can express. The palette stops at `accent` and `gold`. Task 3 therefore adds `--danger`, `--success` and `--warning` across all four themes plus their Tailwind mappings. Without this, Tasks 4 and 6 would reference classes that silently resolve to nothing.

**Placeholder scan.** No TBDs, no "add error handling", no "similar to Task N". Every code step carries complete, runnable code. Step 5 of Task 2 gives the exact commands for the fallback check rather than describing it.

**Type consistency.** Verified across tasks: `repairString(source, isWord)` returns `DandaRepairResult` in Task 1 and is destructured as `result.text` / `result.reviews` in Task 2. `buttonVariants` is exported in Task 4 and re-exported in Task 9. Table parts are `THead`/`TBody`/`TR`/`TH`/`TD` in Task 6 and imported under exactly those names in Task 9. `PageHeader` takes `{ title, subtitle, actions, className }` in Task 7 and is called with `title`/`subtitle`/`actions` in Task 9. `EmptyState` takes `{ icon, title, description, action }` and is called with all four.

**One dependency worth flagging.** Task 2 Step 8 writes to the production database. It is the only irreversible step in the plan, it is deliberately separated from the commit that adds the script, and it must not run before its report has been read.
