import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

import { createAccessToken, createRefreshToken } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const ADMIN_ROUTES = [
  { name: "01-admin-login", path: "/admin/login" },
  { name: "02-admin-overview", path: "/admin" },
  { name: "03-admin-pieces", path: "/admin/pieces" },
  { name: "04-admin-pieces-new", path: "/admin/pieces/new" },
  { name: "05-admin-series", path: "/admin/series" },
  { name: "06-admin-prompts", path: "/admin/prompts" },
  { name: "07-admin-taxonomy", path: "/admin/taxonomy" },
  { name: "08-admin-analytics", path: "/admin/analytics" },
  { name: "09-admin-audit-log", path: "/admin/audit-log" },
  { name: "10-admin-subscribers", path: "/admin/subscribers" },
  { name: "11-admin-system", path: "/admin/system" },
  { name: "12-admin-transliteration", path: "/admin/transliteration" },
  { name: "13-admin-import", path: "/admin/import" },
  { name: "14-admin-settings", path: "/admin/settings" },
];

async function main() {
  console.log(`🚀 Starting Full Admin Portal Screenshot Capture on: ${BASE_URL}\n`);

  const outputDir = path.join(process.cwd(), "screenshots", "08-admin");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Find admin user to forge valid JWT session cookie directly
  const admin = await prisma.adminUser.findFirst();
  if (!admin) {
    throw new Error("No admin user found in database");
  }

  const accessToken = createAccessToken(admin.id, admin.email);
  const refreshTokenRecord = await createRefreshToken(admin.id, { userAgent: "Playwright-Capture" });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  // 1. Capture Login Screen without cookies
  const loginPage = await context.newPage();
  console.log("📸 Capturing /admin/login...");
  await loginPage.goto(`${BASE_URL}/admin/login`, { waitUntil: "networkidle" });
  await loginPage.screenshot({ path: path.join(outputDir, `01-admin-login-desktop.png`), fullPage: true });
  await loginPage.close();

  const urlObj = new URL(BASE_URL);
  const cookieDomain = urlObj.hostname;

  // 2. Set Cookies on context
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

  const page = await context.newPage();

  // 3. Capture all authenticated admin routes
  for (const route of ADMIN_ROUTES) {
    if (route.name === "01-admin-login") continue;

    console.log(`📸 Capturing ${route.path}...`);
    try {
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(2000);
      const filePath = path.join(outputDir, `${route.name}-desktop.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`   ✅ Saved: ${route.name}-desktop.png`);
    } catch (err: any) {
      console.warn(`   ⚠️ Warning capturing ${route.path}: ${err.message}`);
    }
  }

  await browser.close();
  console.log(`\n🎉 All Admin Portal screenshots successfully captured in: ${outputDir}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
