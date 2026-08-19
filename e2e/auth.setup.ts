import { test as setup, expect } from "@playwright/test";
import path from "path";
import { STORAGE_STATE } from "../playwright.config";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/admin/login");
  await page.waitForLoadState("domcontentloaded");

  const emailInput = page.getByTestId("email-input");
  await emailInput.waitFor({ state: "visible", timeout: 15000 });

  const email = process.env.TEST_ADMIN_EMAIL || "admin@thoughts.whatever.com";
  const password = process.env.TEST_ADMIN_PASSWORD || "[REDACTED]";

  await emailInput.fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("login-submit").click();


  // Wait for redirect to /admin dashboard or check for successful login indicator
  await page.waitForURL("**/admin", { timeout: 45000, waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("logout-button")).toBeVisible({ timeout: 15000 });


  // Save auth cookies to storage state file
  await page.context().storageState({ path: STORAGE_STATE });
});
