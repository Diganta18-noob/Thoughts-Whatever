/**
 * Rewrites hardcoded Tailwind palette classes in the admin portal onto the
 * theme token layer.
 *
 *   npx tsx scripts/codemod-admin-tokens.ts           dry run, prints the diff summary
 *   npx tsx scripts/codemod-admin-tokens.ts --write   rewrites the files
 *
 * Why this exists: the admin renders under [data-surface="archive"], whose
 * surface/rule/content values are tuned as a set. A literal `bg-zinc-900`
 * sitting next to `--surface: 10 10 11` never matches, and no theme change
 * can fix it. Roughly 930 such classes had accumulated across 44 files.
 *
 * The one subtlety is neutral tiers: `text-zinc-900 dark:text-zinc-100` means
 * "primary text" in BOTH modes, but the tier numbers are inverted. So light/dark
 * pairs are collapsed first, reading the semantic off the dark member, before
 * any tier is mapped.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const WRITE = process.argv.includes("--write");

const NEUTRALS = new Set(["slate", "gray", "zinc", "neutral", "stone"]);

/** Status hues collapse onto one theme-aware token each. */
const HUE_TOKEN: Record<string, string> = {
  emerald: "success", green: "success", teal: "success", lime: "success",
  red: "danger", rose: "danger",
  amber: "warning", yellow: "warning", orange: "warning",
  blue: "info", sky: "info", cyan: "info",
  indigo: "special", violet: "special", purple: "special", fuchsia: "special", pink: "special",
};

/** Neutral tier -> role, read in dark-mode terms (low number = brightest). */
function neutralTextToken(tier: number): string {
  if (tier <= 200) return "content";
  if (tier <= 400) return "content-soft";
  return "content-faint";
}

/** Neutral tier -> role in light-mode terms (high number = darkest = primary). */
function neutralTextTokenLight(tier: number): string {
  if (tier >= 800) return "content";
  if (tier >= 600) return "content-soft";
  return "content-faint";
}

function neutralBgToken(tier: number): string {
  if (tier >= 950) return "surface";
  if (tier >= 800) return "surface-raised";
  if (tier >= 600) return "rule";
  return "surface-raised";
}

const TEXTISH = new Set(["text", "fill", "stroke", "decoration", "placeholder", "caret", "accent"]);
const BGISH = new Set(["bg", "from", "to", "via"]);
const LINEISH = new Set(["border", "ring", "divide", "outline", "shadow"]);

interface Parsed {
  raw: string;
  variants: string[];
  isDark: boolean;
  prop: string;
  hue: string;
  tier: number;
  alpha: string;
}

const CLASS_RE =
  /^((?:[a-z0-9@[\]\-.:/_]+:)*)(text|bg|border|ring|fill|stroke|from|to|via|decoration|placeholder|caret|accent|divide|outline|shadow)-([a-z]+)-(\d{2,3})(\/[0-9.]+)?$/;

function parse(token: string): Parsed | null {
  const m = CLASS_RE.exec(token);
  if (!m) return null;
  const [, variantStr, prop, hue, tierStr, alpha] = m;
  if (!NEUTRALS.has(hue) && !(hue in HUE_TOKEN)) return null;
  const variants = variantStr ? variantStr.split(":").filter(Boolean) : [];
  return {
    raw: token,
    variants: variants.filter((v) => v !== "dark"),
    isDark: variants.includes("dark"),
    prop,
    hue,
    tier: Number(tierStr),
    alpha: alpha ?? "",
  };
}

/**
 * True while rewriting a component that paints its own dark background
 * (`bg-zinc-950` and friends) rather than following the reading themes.
 * Such a file's bare neutrals are already written in dark-mode terms, so
 * `text-zinc-400` there means "secondary", not "faint".
 */
let FILE_IS_DARK_ONLY = false;

/** The property family decides how a tint level translates into an alpha. */
function render(p: Parsed, darkTier: number | null): string {
  const prefix = p.variants.length ? p.variants.join(":") + ":" : "";

  if (NEUTRALS.has(p.hue)) {
    // For a light/dark pair the dark member carries the readable semantic.
    const tier = darkTier ?? p.tier;
    const useDarkScale = darkTier !== null || p.isDark || FILE_IS_DARK_ONLY;
    let token: string;
    if (TEXTISH.has(p.prop)) {
      token = useDarkScale ? neutralTextToken(tier) : neutralTextTokenLight(tier);
    } else if (BGISH.has(p.prop)) {
      token = neutralBgToken(tier);
    } else {
      token = "rule";
    }
    return `${prefix}${p.prop}-${token}${p.alpha}`;
  }

  const token = HUE_TOKEN[p.hue];

  if (TEXTISH.has(p.prop)) {
    return `${prefix}${p.prop}-${token}${p.alpha}`;
  }

  if (BGISH.has(p.prop)) {
    // An explicit alpha was already a deliberate wash; keep it. A bare
    // very-light or very-dark tier was also a wash, just spelled as a tint.
    if (p.alpha) return `${prefix}${p.prop}-${token}${p.alpha}`;
    if (p.tier >= 900 || p.tier <= 200) return `${prefix}${p.prop}-${token}/10`;
    return `${prefix}${p.prop}-${token}`;
  }

  if (LINEISH.has(p.prop)) {
    if (p.alpha) return `${prefix}${p.prop}-${token}${p.alpha}`;
    if (p.tier >= 700 || p.tier <= 200) return `${prefix}${p.prop}-${token}/40`;
    return `${prefix}${p.prop}-${token}`;
  }

  return `${prefix}${p.prop}-${token}${p.alpha}`;
}

/** Only touch string and template literals — never identifiers or prose. */
function rewriteFile(source: string): string {
  const HUES = Object.keys(HUE_TOKEN).concat([...NEUTRALS]).join("|");
  const VARIANTS = "(?:[a-z0-9@[\\]\\-.:/_]+:)*";
  const PROPS =
    "text|bg|border|ring|fill|stroke|from|to|via|decoration|placeholder|caret|accent|divide|outline|shadow";

  // Pass 1 — collapse `X-hue-a dark:X-hue-b` into one theme-aware token. The
  // pair has to go first: for neutrals the two tiers are inverted, and only
  // the dark member states the role in terms the token scale shares.
  const pair = new RegExp(
    `(?<![\\w-])(${VARIANTS})(${PROPS})-(${HUES})-(\\d{2,3})(\\/[\\d.]+)?\\s+dark:\\1(?:\\2)-(?:${HUES})-(\\d{2,3})(?:\\/[\\d.]+)?(?![\\w-])`,
    "g",
  );
  let out = source.replace(
    pair,
    (whole, variantStr: string, prop: string, hue: string, tier: string, alpha: string | undefined, darkTier: string) => {
      const p: Parsed = {
        raw: whole,
        variants: (variantStr ? variantStr.split(":").filter(Boolean) : []).filter((v) => v !== "dark"),
        isDark: false,
        prop,
        hue,
        tier: Number(tier),
        alpha: alpha ?? "",
      };
      return render(p, NEUTRALS.has(hue) ? Number(darkTier) : null);
    },
  );

  // Pass 2 — map whatever is left, one class at a time. A lone `dark:` variant
  // loses the prefix: the token it maps to is already theme-aware, so keeping
  // the variant would leave the light themes unstyled.
  const single = new RegExp(
    `(?<![\\w-])(${VARIANTS})(${PROPS})-(${HUES})-(\\d{2,3})(\\/[\\d.]+)?(?![\\w-])`,
    "g",
  );
  out = out.replace(
    single,
    (whole, variantStr: string, prop: string, hue: string, tier: string, alpha: string | undefined) => {
      const variants = variantStr ? variantStr.split(":").filter(Boolean) : [];
      const isDark = variants.includes("dark");
      const p: Parsed = {
        raw: whole,
        variants: variants.filter((v) => v !== "dark"),
        isDark,
        prop,
        hue,
        tier: Number(tier),
        alpha: alpha ?? "",
      };
      return render(p, null);
    },
  );

  // Pass 3 — the collapse can leave the same class twice in a row.
  out = out.replace(
    new RegExp(`(?<![\\w-])((?:${VARIANTS})(?:${PROPS})-[a-z-]+(?:\\/[\\d.]+)?) \\1(?![\\w-])`, "g"),
    "$1",
  );

  return out;
}

// Directory pathspecs, not globs: `admin/**/*.tsx` silently skips the files
// sitting directly in `admin/`, which is most of them.
const files = execSync('git ls-files "src/app/admin" "src/components/admin"', { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));

let changedFiles = 0;
let changedClasses = 0;
const PALETTE_RE =
  /\b(?:text|bg|border|ring|fill|stroke|from|to|via|decoration|placeholder|caret|accent|divide|outline|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink)-\d{2,3}/g;

for (const file of files) {
  const before = readFileSync(file, "utf8");
  FILE_IS_DARK_ONLY = /\bbg-(?:slate|gray|zinc|neutral|stone)-(?:8|9)\d{2}\b/.test(before);
  const after = rewriteFile(before);
  if (before === after) continue;

  changedFiles++;
  changedClasses += (before.match(PALETTE_RE) ?? []).length - (after.match(PALETTE_RE) ?? []).length;
  if (WRITE) writeFileSync(file, after, "utf8");
  console.log(`${WRITE ? "rewrote" : "would rewrite"}  ${file}`);
}

console.log(
  `\n${changedFiles} files, ${changedClasses} palette classes mapped onto tokens.` +
    (WRITE ? "" : "\nDry run — pass --write to apply."),
);

const leftover = files
  .map((f) => [f, (readFileSync(f, "utf8").match(PALETTE_RE) ?? []).length] as const)
  .filter(([, n]) => n > 0);
if (leftover.length) {
  console.log(`\nStill holding literal palette classes:`);
  for (const [f, n] of leftover) console.log(`  ${n}\t${f}`);
}
