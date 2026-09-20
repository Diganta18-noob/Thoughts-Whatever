import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { createAccessToken, createRefreshToken } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  console.log(`🚀 Starting Comprehensive Admin Portal Screenshot Capture on: ${BASE_URL}\n`);

  const outputDir = path.join(process.cwd(), "screenshots", "08-admin");
  const backupDir = path.join(process.cwd(), "screenshots", "08-admin-archive-old");

  // If old screenshot directory exists, backup old files first
  if (fs.existsSync(outputDir) && !fs.existsSync(backupDir)) {
    console.log(`📦 Archiving old screenshots to: ${backupDir}...`);
    fs.mkdirSync(backupDir, { recursive: true });
    const oldFiles = fs.readdirSync(outputDir);
    for (const f of oldFiles) {
      fs.copyFileSync(path.join(outputDir, f), path.join(backupDir, f));
    }
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find admin user to forge valid JWT session cookie directly
  const admin = await prisma.adminUser.findFirst();
  if (!admin) {
    throw new Error("No admin user found in database");
  }

  // Find sample piece and prompt to capture parameterized routes
  const samplePiece = await prisma.piece.findFirst({ select: { id: true } });
  const samplePrompt = await prisma.promptLog.findFirst({ select: { id: true } });

  const unauthenticatedRoutes = [
    { name: "01-admin-login", path: "/admin/login" },
    { name: "02-admin-forgot-password", path: "/admin/forgot-password" },
    { name: "03-admin-reset-password", path: "/admin/reset-password" },
  ];

  const authenticatedRoutes = [
    { name: "04-admin-overview", path: "/admin" },
    { name: "05-admin-pieces", path: "/admin/pieces" },
    { name: "06-admin-pieces-new", path: "/admin/pieces/new" },
    ...(samplePiece
      ? [
          { name: "07-admin-piece-edit", path: `/admin/pieces/${samplePiece.id}` },
          { name: "08-admin-piece-history", path: `/admin/pieces/${samplePiece.id}/history` },
        ]
      : []),
    { name: "09-admin-series", path: "/admin/series" },
    { name: "10-admin-taxonomy", path: "/admin/taxonomy" },
    { name: "11-admin-media", path: "/admin/media" },
    { name: "12-admin-prompts", path: "/admin/prompts" },
    { name: "13-admin-prompts-new", path: "/admin/prompts/new" },
    ...(samplePrompt ? [{ name: "14-admin-prompt-detail", path: `/admin/prompts/${samplePrompt.id}` }] : []),
    { name: "15-admin-content-graph", path: "/admin/content-graph" },
    { name: "16-admin-content-health", path: "/admin/content-health" },
    { name: "17-admin-editorial-intelligence", path: "/admin/editorial-intelligence" },
    { name: "18-admin-recommendations", path: "/admin/recommendations" },
    { name: "19-admin-analytics", path: "/admin/analytics" },
    { name: "20-admin-engagement", path: "/admin/engagement" },
    { name: "21-admin-geography", path: "/admin/geography" },
    { name: "22-admin-goals", path: "/admin/goals" },
    { name: "23-admin-activity", path: "/admin/activity" },
    { name: "24-admin-notifications", path: "/admin/notifications" },
    { name: "25-admin-subscribers", path: "/admin/subscribers" },
    { name: "26-admin-seo", path: "/admin/seo" },
    { name: "27-admin-seo-engine", path: "/admin/seo-engine" },
    { name: "28-admin-seo-engine-audit", path: "/admin/seo-engine/audit" },
    { name: "29-admin-seo-engine-websites", path: "/admin/seo-engine/websites" },
    { name: "30-admin-system", path: "/admin/system" },
    { name: "31-admin-system-monitoring", path: "/admin/system/monitoring" },
    { name: "32-admin-transliteration", path: "/admin/transliteration" },
    { name: "33-admin-import", path: "/admin/import" },
    { name: "34-admin-exports", path: "/admin/exports" },
    { name: "35-admin-incidents", path: "/admin/incidents" },
    { name: "36-admin-jobs", path: "/admin/jobs" },
    { name: "37-admin-audit-log", path: "/admin/audit-log" },
    { name: "38-admin-security", path: "/admin/security" },
    { name: "39-admin-developer", path: "/admin/developer" },
    { name: "40-admin-team", path: "/admin/team" },
    { name: "41-admin-settings", path: "/admin/settings" },
  ];

  const accessToken = createAccessToken(admin.id, admin.email);
  const refreshTokenRecord = await createRefreshToken(admin.id, { userAgent: "Playwright-Capture" });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  // 1. Capture Unauthenticated screens
  for (const route of unauthenticatedRoutes) {
    console.log(`📸 Capturing public auth route: ${route.path}...`);
    try {
      const page = await context.newPage();
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle", timeout: 25000 });
      await page.waitForTimeout(1000);
      const filePath = path.join(outputDir, `${route.name}-desktop.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      await page.close();
      console.log(`   ✅ Saved: ${route.name}-desktop.png`);
    } catch (err: any) {
      console.warn(`   ⚠️ Warning capturing ${route.path}: ${err.message}`);
    }
  }

  const urlObj = new URL(BASE_URL);
  const cookieDomain = urlObj.hostname;

  // 2. Set Cookies on context for authenticated pages
  await context.addCookies([
    {
      name: "tw_access",
      value: accessToken,
      domain: cookieDomain,
      path: "/",
      httpOnly: true,
      secure: urlObj.protocol === "https:",
      sameSite: "Lax",
    },
    {
      name: "tw_refresh",
      value: refreshTokenRecord.token,
      domain: cookieDomain,
      path: "/",
      httpOnly: true,
      secure: urlObj.protocol === "https:",
      sameSite: "Lax",
    },
  ]);

  const authPage = await context.newPage();

  // 3. Capture all authenticated admin routes
  for (const route of authenticatedRoutes) {
    console.log(`📸 Capturing ${route.path}...`);
    try {
      await authPage.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle", timeout: 30000 });
      await authPage.waitForTimeout(2000);
      const filePath = path.join(outputDir, `${route.name}-desktop.png`);
      await authPage.screenshot({ path: filePath, fullPage: true });
      console.log(`   ✅ Saved: ${route.name}-desktop.png`);
    } catch (err: any) {
      console.warn(`   ⚠️ Warning capturing ${route.path}: ${err.message}`);
    }
  }

  await authPage.close();
  await browser.close();
  console.log(`\n🎉 All ${unauthenticatedRoutes.length + authenticatedRoutes.length} Admin Portal screenshots successfully captured in: ${outputDir}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
