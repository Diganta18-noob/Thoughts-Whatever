/**
 * Checks that the control codemod left every primitive tag balanced.
 *
 *   npx tsx scripts/verify-admin-tags.ts
 *
 * A mis-renamed closing tag is the one failure mode of
 * codemod-admin-controls.ts that would still typecheck in isolation, so it
 * gets its own check. Written as a file rather than `node -e`: bash
 * double-quoting mangles the backslashes in these regexes and the resulting
 * matcher silently matches nothing, which reads as "everything is broken".
 */

import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync('git ls-files "src/app/admin" "src/components/admin"', { encoding: "utf8" })
  .split(/\r?\n/)
  .filter((f) => f.endsWith(".tsx"));

const TAGS = [
  "Button",
  "Input",
  "Textarea",
  "NativeSelect",
  "THead",
  "TBody",
  "TR",
  "TH",
  "TD",
] as const;
let bad = 0;

/**
 * Index just past the JSX tag opening at `start`. A regex cannot do this:
 * `onChange={(e) => setX(e)}` contains a `>`, so `[^>]*?/>` stops inside the
 * arrow function and reports a self-closing tag as unclosed.
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

for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const tag of TAGS) {
    let opens = 0;
    let selfClosed = 0;
    const openRe = new RegExp(`<${tag}(?=[\\s/>])`, "g");
    for (let m = openRe.exec(src); m; m = openRe.exec(src)) {
      opens++;
      const end = endOfTag(src, m.index);
      if (end === -1) {
        bad++;
        console.log(`  ${file}  <${tag}> at ${m.index} never closes its tag`);
        continue;
      }
      if (src.slice(end - 2, end) === "/>") selfClosed++;
      openRe.lastIndex = end;
    }
    const closes = (src.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
    const paired = opens - selfClosed;
    if (paired !== closes) {
      bad++;
      console.log(`  ${file}  <${tag}>: ${opens} open, ${selfClosed} self-closed, ${closes} close`);
    }
  }

  // The lowercase originals should be gone wherever a primitive replaced them.
  const orphan = /<\/(?:button|input|textarea)>/.exec(src);
  if (orphan && !new RegExp(`<${orphan[0].slice(2, -1)}(?=[\\s/>])`).test(src)) {
    bad++;
    console.log(`  ${file}  orphaned ${orphan[0]}`);
  }
}

console.log(bad === 0 ? `\n${files.length} files, all primitive tags balanced.` : `\n${bad} problems.`);
process.exit(bad === 0 ? 0 : 1);
