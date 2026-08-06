import { test, expect } from "@playwright/test";
import { STORAGE_STATE } from "../playwright.config";

test.describe("Admin System Management & Maintenance", () => {
  test.use({ storageState: STORAGE_STATE });

  test("View taxonomy manager page", async ({ page }) => {
    await page.goto("/admin/taxonomy");
    await expect(page).toHaveURL("/admin/taxonomy");
  });

  test("View subscribers admin dashboard", async ({ page }) => {
    await page.goto("/admin/subscribers");
    await expect(page).toHaveURL("/admin/subscribers");
  });

  test("View settings page", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page).toHaveURL("/admin/settings");
  });

  test("Mock audio transcription API error handling", async ({ page }) => {
    // Intercept external AI API route and return controlled error state
    await page.route("/api/admin/transcribe", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "Unsupported audio format", code: "INVALID_FORMAT" }),
      });
    });
  });
});
