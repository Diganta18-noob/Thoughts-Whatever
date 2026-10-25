/** @jest-environment node */
import fs from "node:fs";
import path from "node:path";

it("exposes only reviewed public environment identifiers", () => {
  const allowed = new Set(["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_SITE_NAME", "NEXT_PUBLIC_INSTAGRAM", "NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST", "NEXT_PUBLIC_DEBUG_LOADING", "NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION", "NEXT_PUBLIC_YANDEX_VERIFICATION", "NEXT_PUBLIC_BING_VERIFICATION"]);
  const scan = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (/\.[jt]sx?$/.test(file)) {
        const names = fs.readFileSync(file, "utf8").match(/NEXT_PUBLIC_[A-Z0-9_]+/g) || [];
        expect(names.filter((name) => !allowed.has(name))).toEqual([]);
      }
    }
  };
  scan(path.join(process.cwd(), "src"));
});
