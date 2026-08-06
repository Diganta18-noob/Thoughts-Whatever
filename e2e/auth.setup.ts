import { test as setup, expect } from "@playwright/test";
import path from "path";
import { STORAGE_STATE } from "../playwright.config";

setup("authenticate as admin", async ({ page }) => {
  // Navigate to login page
  await page.goto("/admin/login");

  // Fill credentials (uses environment variable or default fallback)
  const email = process.env.TEST_ADMIN_EMAIL || "admin@example.com";
  const password = process.env.TEST_ADMIN_PASSWORD || "password123";

  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill(password);
  await page.getByTestId("login-submit").click();

  // Wait for redirect to /admin dashboard or check for successful login indicator
  await page.waitForURL("/admin");
  await expect(page.getByTestId("logout-button")).toBeVisible();

  // Save auth cookies to storage state file
  await page.context().storageState({ path: STORAGE_STATE });
});
