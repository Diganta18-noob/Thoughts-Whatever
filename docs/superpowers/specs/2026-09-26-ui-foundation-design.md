# UI Foundation — Danda Repair & Primitive Layer

**Date:** 2026-09-26
**Status:** Design approved
**Scope:** Repair corrupted Latin text in the database, then build the missing UI primitive layer on the existing design tokens. First of three cycles.

---

## 1. Motivation

Two findings drove this design, both established by measurement rather than taste.

### 1.1 The homepage ships corrupted text

Every lowercase `l` in Latin-script text fields has been replaced with the Bengali danda `।`. Twenty-nine instances render on the homepage alone, including the EDITOR'S SELECTION excerpt:

```
“Nothing first enters the। ife of morta। s without a curse.” — Sophoc। es
Michea।   Devi।   Benga। i   itse। f   crue। est   ob। igated
"Uneasy। ies the head that wears a crown"
```

The corruption signature is exact and consistent: a Latin letter, then `।`, then a space. The inverse — `।` followed directly by a Latin letter — never occurs. That regularity is what makes an automated repair feasible.

**Root cause is outside this repository.** `src/lib/transliterate.ts` only rewrites the brand name; no `|` → `।` normalizer exists anywhere in `src/` or `scripts/`. The damage matches an OCR ingest chain (`l` misread as `|`, then normalized to `।`) or an editor find-and-replace. Consequently this is a one-time data repair with no code fix and no risk of recurrence.

### 1.2 There is no UI primitive layer

| Measure | Value |
|---|---|
| Files in `src/components/ui/` | **2** (`error-state`, `story-read-link`) |
| Distinct hand-rolled button class strings | **166** |
| Files containing an inline `<button>` | **94** |
| `components.json` (shadcn registry) | absent |
| Admin routes | **42** |
| Largest admin files | `piece-editor.tsx` 921 · `reference-editor-modal.tsx` 845 · `media/page.tsx` 700 |

Those page files are large because each one implements layout, data fetching, *and* presentation. Every route rebuilds its own buttons, inputs, cards and tables.

The token layer, by contrast, is in good shape: four themes on CSS custom properties, a fluid `--step-0..7` scale, semantic font roles, and `prefers-reduced-motion` handled globally in `src/app/globals.css`. The foundation exists; nothing was ever built on top of it.

### 1.3 On the referenced libraries

Three libraries were proposed as the source of improvement. Assessed:

| Library | Cost | Verdict |
|---|---|---|
| **Vengeance UI** | free, OSS, shadcn registry | Usable — *after* `components.json` exists |
| **Skiper UI** | $129 | Micro-detail effects for product landing pages; little applies to long-form reading |
| **Animmaster Lib** | ~$5, Google Drive delivery, 60% vanilla JS | No buttons, forms, modals or layout primitives at all; components described as rebuilt from other companies' sites |

None of the three provides what is actually missing. They all presuppose a primitive layer and extend it with motion. Building that layer first is the prerequisite, and it is what makes `npx shadcn add @vengeanceui/...` possible later.

---

## 2. Design decisions

| Decision | Choice | Rejected alternatives |
|---|---|---|
| Public-site direction | Quiet craft — motion is functional only; the win is typography and restraint | Cinematic entrances; motion-forward throughout (both fight long-form Bengali reading) |
| Admin goal | Foundation first | Reskin now (leaves 166 button variants); workflow-only (doesn't reduce 700-line files) |
| Primitive construction | Hybrid — Radix where accessibility is hard, hand-rolled where trivial | Full shadcn adopt (its HSL `--background`/`--foreground` contract conflicts with RGB `--surface`/`--content` across four themes); zero-dependency (hand-written focus traps, and no registry compatibility) |
| Visual style | **B · Soft shell** — 9px radius, soft shadow, filled accent buttons, pill badges, boxed tables | Editorial rule (austere in dense tables); Archival instrument (rejected on review) |
| Shadow on reading surfaces | `--shadow-card` is a token: real under `[data-surface="archive"]`, `none` under cream/sepia | One global shadow value (fights the paper feel of the reading pages) |
| Repair safety | Dry-run by default, written report, explicit `--apply` | Direct write (irreversible against literary text) |

---

## 3. Sub-project 0 — Danda repair

### 3.1 The ambiguity

Reversal is not a plain regex. The normalizer consumed the original whitespace, so the same corrupted form has two different correct readings:

| Corrupted | Correct | Reversal needed |
|---|---|---|
| `morta। s` | `mortals` | `। ` → `l` (drop the space) |
| `Uneasy। ies` | `Uneasy lies` | `। ` → ` l` (space moves before) |

A single substitution rule produces `Uneasylies` in the second case. The repair must therefore decide per occurrence.

### 3.2 Resolution strategy

The reversal removes the danda and its injected trailing space, restores the `l`, and then decides whether a space belongs *before* that `l`:

| Corrupted | Join candidate | Split candidate |
|---|---|---|
| `morta। s` | `mortals` ✓ | `morta ls` |
| `Uneasy। ies` | `Uneasylies` | `Uneasy lies` ✓ |

Both candidates are generated for every occurrence and scored against an English word list: a candidate wins only if all of its affected tokens are real words and the other candidate's are not. Anything else — both plausible, neither plausible, or no word list available — is marked `NEEDS_REVIEW` and left untouched.

**Human review is the primary path, not the fallback.** Measured volume is 29 occurrences on the homepage, so the full corpus is plausibly in the low hundreds — small enough that reading the report is realistic, and the text is literary quotation where a wrong automatic "fix" is worse than no fix. The word list exists to shrink the review queue, not to replace it.

Word list: `scripts/data/english-words.txt`, plain newline-delimited, committed to the repo so the repair is deterministic and offline. The implementation plan sources it once from a public word list; if it is absent the script still runs and routes every occurrence to `NEEDS_REVIEW`, so the repair is never blocked on it.

### 3.3 Scope of the scan

66 models, 448 `String` fields. The script reflects over the Prisma DMMF rather than hardcoding a field list, so no text column is missed. Candidate columns are every `String`/`String?` scalar; the filter is the corruption signature itself, which cannot appear in legitimate Bengali (a danda never follows a Latin letter in Bengali orthography).

### 3.4 Interface

```
scripts/repair-danda.ts

npm run repair:danda              # dry run — writes report, changes nothing
npm run repair:danda -- --apply   # commits the resolved occurrences
```

Output: `danda-repair-report.txt` listing, per occurrence, the model, record id, field, a ±40-character context window, both candidates, the chosen reading, and the reason. `NEEDS_REVIEW` rows are grouped at the top so they are read first.

`--apply` writes only occurrences that resolved cleanly. Review cases require a human edit through the admin UI.

---

## 4. Sub-project 1 — Primitive layer

### 4.1 New dependencies

Five scoped Radix packages, named in full to avoid confusion with unrelated npm packages of similar short name:

```
@radix-ui/react-dialog
@radix-ui/react-select
@radix-ui/react-dropdown-menu
@radix-ui/react-tooltip
@radix-ui/react-tabs
```

Plus `class-variance-authority`. `clsx` and `tailwind-merge` are already installed. (`@radix-ui/react-popover` is dropped — no primitive in §4.3 uses it.)

A `components.json` is added so shadcn-registry components resolve against `src/components/ui`.

### 4.2 Token additions

Three additions to `src/app/globals.css`, following the existing custom-property convention:

```css
:root {
  --radius: 9px;
  --shadow-card: none;              /* all reading themes: cream, sepia, night */
  --font-mono: ui-monospace, "SFMono-Regular", Menlo, monospace;
}

[data-surface="archive"] {
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.30);
}
```

The shadow is confined to the admin surface. Reading themes — including `night` — separate raised elements with `--surface-raised` instead, which is what that token already exists for and what reads correctly on a dark page.

No existing token changes. No component reads a raw colour value — everything resolves through `rgb(var(--surface))`, `rgb(var(--content))`, `rgb(var(--accent))`, so all four themes work with zero per-component branching.

### 4.3 Units

`src/components/ui/`, one primitive per file, each exporting its own variants:

| File | Exports | Backing |
|---|---|---|
| `button.tsx` | `Button` — variant `primary`/`secondary`/`ghost`/`danger`, size `sm`/`md`/`lg` | cva |
| `input.tsx` | `Input` | — |
| `textarea.tsx` | `Textarea` | — |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardBody`, `CardFooter` | — |
| `badge.tsx` | `Badge` — tone `accent`/`neutral`/`success`/`warning`/`danger` | cva |
| `table.tsx` | `Table`, `THead`, `TBody`, `TR`, `TH`, `TD` | — |
| `page-header.tsx` | `PageHeader` — title, subtitle, actions slot | — |
| `empty-state.tsx` | `EmptyState` — icon, title, description, action slot | — |
| `skeleton.tsx` | `Skeleton` | — |
| `dialog.tsx` | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`, `DialogFooter` | Radix |
| `select.tsx` | `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | Radix |
| `dropdown-menu.tsx` | `DropdownMenu` + parts | Radix |
| `tooltip.tsx` | `Tooltip`, `TooltipTrigger`, `TooltipContent` | Radix |
| `tabs.tsx` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Radix |
| `index.ts` | barrel re-export | — |

Each file stays small enough to read in one pass. A primitive that grows past roughly 120 lines is doing too much and should be split.

### 4.4 Boundaries

A primitive may read design tokens and accept `className`. It may not import from `@/components/admin`, `@/lib/prisma`, or any feature module — primitives are leaves in the dependency graph. This is what lets both the admin and the public site consume them without coupling.

`cn()` (the `clsx` + `tailwind-merge` wrapper) is the single styling helper; if `src/lib/utils.ts` does not already export it, it is added there.

---

## 5. Verification

**Visual smoke page** — `/admin/developer/ui`, dev-only, renders all 14 primitives in every variant across all four themes on one screen with a theme switcher. A token regression becomes visible in one glance instead of surfacing in production. This is the primary guard, because the failure mode for a themed primitive layer is visual, not logical.

**Unit (jest, already configured):**
- `repair-danda` candidate resolution — join case, split case, both-plausible → `NEEDS_REVIEW`, neither-plausible → `NEEDS_REVIEW`, multiple occurrences in one string, danda legitimately following Bengali (must be ignored).
- `Button` renders each variant/size pairing; `className` passthrough merges rather than overrides.

**Type check:** `npm run typecheck` must pass. `npm run lint` covers `scripts` and `prisma` as well as `src`.

---

## 6. Out of scope

Deferred to their own spec → plan → build cycles:

- **Sub-project 2** — migrating the 42 admin routes onto the primitives.
- **Sub-project 3** — the public-site quiet-craft pass (typography, rhythm, page transitions, reading view).
- Any Vengeance UI / Skiper component adoption. Possible after this cycle; not part of it.
- The Reference listening room, whose design is approved in `2026-09-25-reference-listening-room-design.md` and whose implementation plan is still unwritten.
- Correcting `NEEDS_REVIEW` danda occurrences, which require human judgement.

---

## 7. Documentation obligations

Per `AGENTS.md`: `docs/PROMPT_HISTORY.md` records the directives behind this cycle, and `npm run save-prompts` syncs them. No data model changes, so `docs/REFERENCE_LIBRARY_ARCHITECTURE.md` is unaffected.
