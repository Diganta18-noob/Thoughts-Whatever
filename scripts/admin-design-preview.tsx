import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import { AdminProviders } from "../src/components/providers/admin-providers";
import { AdminLayoutClient } from "../src/components/admin/admin-layout-client";
import { CustomDashboard } from "../src/components/admin/custom-dashboard";
import { AutomationDashboard } from "../src/components/admin/automation-dashboard";
import { PieceEditor, EMPTY_PIECE } from "../src/components/admin/piece-editor";
(globalThis as any).React = React;
const out = path.resolve("screenshots/admin-design");
fs.mkdirSync(out, { recursive: true });
const css = fs.readFileSync(path.join(out, "preview.css"), "utf8");
const router: any = { push() {}, replace() {}, refresh() {}, prefetch() {}, back() {}, forward() {} };
const fixtures = [
  { name: "overview", route: "/admin", element: <CustomDashboard workSummary={{ drafts: 5, scheduled: 2, failedJobs: 0 }} recentPieces={[
    { id: "sample1", titleBn: "রবীন্দ্রনাথের গানে প্রকৃতি", kind: "RACHANA", slug: "sample", status: "DRAFT", updatedAt: "2026-10-24T08:00:00Z" },
    { id: "sample2", titleBn: "বাংলা সাহিত্যের নতুন পাঠ", kind: "BLOG", slug: "sample2", status: "PUBLISHED", updatedAt: "2026-10-23T08:00:00Z" },
  ]} /> },
  { name: "editor", route: "/admin/pieces/new", element: <PieceEditor recoveryOwner="preview" initial={{ ...EMPTY_PIECE, titleBn: "একটি নতুন রচনা", bodyBn: "বাংলা ভাষা ও সাহিত্যের কথা।" }} authors={[]} tags={[]} series={[]} /> },
  { name: "system", route: "/admin/system", element: <AutomationDashboard initialData={{ isRunning: false, health: { status: "HEALTHY", memoryUsageMb: 112, dbConnected: true }, security: { activeSessions: 1, revokedTokenReuseAttempts: 0 }, logs: ["Backup completed successfully.", "Content cache refreshed."], lastReport: { timestamp: "2026-10-24T08:00:00Z", overallStatus: "SUCCESS", totalDurationMs: 1200, summary: { total: 1, passed: 1, warnings: 0, failed: 0 }, steps: [{ stepNumber: 1, name: "Database backup", status: "SUCCESS", message: "Backup verified", durationMs: 1200 }] } }} /> },
];
async function main() {
 const browser = await chromium.launch({ headless: true, channel: "chrome" });
 const results = [];
 for (const fixture of fixtures) {
  const body = renderToStaticMarkup(<AppRouterContext.Provider value={router}><PathnameContext.Provider value={fixture.route}><AdminProviders><AdminLayoutClient adminEmail="editor@example.com" adminRole="SUPER_ADMIN">{fixture.element}</AdminLayoutClient></AdminProviders></PathnameContext.Provider></AppRouterContext.Provider>);
  for (const theme of ["cream", "night"]) for (const width of [1440, 390]) {
   const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
   await page.setContent(`<!doctype html><html data-theme="${theme}" lang="en"><head><meta charset="utf-8"><style>:root{--font-ui:Arial;--font-latin-serif:Georgia;--font-bengali-serif:serif;--font-bengali-sans:Arial;--font-mono:monospace}</style><style>${css}</style></head><body>${body}</body></html>`);
   await page.screenshot({ path: path.join(out, `${process.env.PREVIEW_STAGE || "after"}-${fixture.name}-${theme}-${width}.png`), fullPage: true });
   const metrics = await page.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
   const colors = await page.locator("button.bg-accent, a.bg-accent").first().evaluate((element) => ({ color: getComputedStyle(element).color, background: getComputedStyle(element).backgroundColor })).catch(() => null);
   if (metrics.width > metrics.viewport) throw new Error(`Page overflow: ${fixture.name}/${theme}/${width}`);
   if (colors) {
     const luminance = (color: string) => {
       const values = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((value) => {
         const channel = value / 255;
         return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
       });
       return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
     };
     const foreground = luminance(colors.color);
     const background = luminance(colors.background);
     const contrast = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
     if (contrast < 4.5) throw new Error(`Primary action contrast ${contrast.toFixed(2)}: ${fixture.name}/${theme}`);
   }
   results.push({ screen: fixture.name, theme, ...metrics, primaryColors: colors });
   await page.close();
  }
 }
 await browser.close();
 console.log(JSON.stringify(results));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
