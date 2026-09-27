/**
 * Second-pass cleanups after codemod-admin-tokens.ts.
 *
 *   npx tsx scripts/codemod-admin-polish.ts --write
 *
 * Collapsing a Tailwind tint ramp onto a single token turns pairs like
 * `bg-amber-600 hover:bg-amber-700` into `bg-warning hover:bg-warning`, which
 * is a hover state that does nothing. Restore the state change as an alpha
 * step, which is how the Button primitive expresses it.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const WRITE = process.argv.includes("--write");
const TOKENS = "accent|success|danger|warning|info|special|gold|content|content-soft|content-faint|surface|surface-raised|rule";

const files = execSync('git ls-files "src/app/admin" "src/components/admin"', { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((f) => f.endsWith(".tsx"));

let hoverFixes = 0;
let whiteFixes = 0;

for (const file of files) {
  const before = readFileSync(file, "utf8");
  let s = before;

  // A solid token background wants the surface colour on top, not literal
  // white — on the archive theme `bg-success` is a light green and white text
  // on it fails contrast. This is the pairing the Button primitive uses.
  s = s.replace(/\btext-white\b/g, () => {
    whiteFixes++;
    return "text-surface";
  });

  // `bg-X … hover:bg-X` — same colour on both sides, so nothing happens.
  const deadBg = new RegExp(`\\b(bg-(?:${TOKENS}))((?:\\s+[^\\s"'\`]+)*?)\\s+hover:\\1(?![\\w/-])`, "g");
  s = s.replace(deadBg, (_m, base: string, mid: string) => {
    hoverFixes++;
    return `${base}${mid} hover:${base}/85`;
  });

  const deadBorder = new RegExp(`\\b(border-(?:${TOKENS}))((?:\\s+[^\\s"'\`]+)*?)\\s+hover:\\1(?![\\w/-])`, "g");
  s = s.replace(deadBorder, (_m, base: string, mid: string) => {
    hoverFixes++;
    return `${base}${mid} hover:${base}/70`;
  });

  const deadText = new RegExp(`\\b(text-(?:${TOKENS}))((?:\\s+[^\\s"'\`]+)*?)\\s+hover:\\1(?![\\w/-])`, "g");
  s = s.replace(deadText, (_m, base: string, mid: string) => {
    hoverFixes++;
    return `${base}${mid} hover:${base}/80`;
  });

  if (s !== before && WRITE) writeFileSync(file, s, "utf8");
  if (s !== before) console.log(`${WRITE ? "rewrote" : "would rewrite"}  ${file}`);
}

console.log(`\ntext-white -> text-surface: ${whiteFixes}`);
console.log(`dead hover states repaired: ${hoverFixes}`);
if (!WRITE) console.log("Dry run — pass --write to apply.");
