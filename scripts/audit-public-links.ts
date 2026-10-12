import fs from "node:fs";
import path from "node:path";

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file) : [file];
  });
}

const routes = files("src/app").filter((file) => /(?:page|route)\.(?:tsx?|jsx?)$/.test(file)).map((file) => {
  const segments = path.dirname(path.relative("src/app", file)).split(path.sep)
    .filter((part) => part !== "." && !part.startsWith("("));
  return new RegExp("^/" + segments.map((part) => part.startsWith("[...") ? ".+" : part.startsWith("[") ? "[^/]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("/") + "/?$");
});
const broken: { file: string; href: string }[] = [];
let checked = 0;
for (const file of [...files("src/app"), ...files("src/components"), "src/lib/nav.ts"]) {
  if (!/\.tsx?$/.test(file) || /[\\/]admin[\\/]|__tests__/.test(file)) continue;
  const source = fs.readFileSync(file, "utf8");
  const matches = source.matchAll(/(?:href\s*=\s*\{?\s*|href\s*:\s*)["'](\/[^"']*)["']/g);
  for (const match of matches) {
    const href = match[1].split(/[?#]/)[0];
    checked++;
    if (!routes.some((route) => route.test(href)) && !fs.existsSync(path.join("public", href)) &&
      !["/icon.svg", "/icon.png", "/sitemap.xml", "/robots.txt"].includes(href)) broken.push({ file, href });
  }
}
console.log(JSON.stringify({ checked, broken }, null, 2));
if (broken.length) process.exitCode = 1;
