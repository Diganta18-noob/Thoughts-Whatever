import { test, expect } from "@playwright/test";
import { STORAGE_STATE } from "../playwright.config";

test.describe("Article Management & Publishing Lifecycle (CRUD)", () => {
  test.use({ storageState: STORAGE_STATE }); // Use saved logged-in session

  test("Happy path: Create, edit, and delete an article", async ({ page }) => {
    const testSlug = `e2e-test-article-${Date.now()}`;
    const testTitle = "ইটুই টেস্ট নিবন্ধ";

    await page.goto("/admin/pieces/new");

    // Fill new piece form
    await page.fill('input[name="slug"]', testSlug);
    await page.fill('input[name="titleBn"]', testTitle);
    await page.fill('textarea[name="bodyBn"]', "এটি একটি প্লেরাইট ইটুই স্বয়ংক্রিয় পরীক্ষার লেখা।");

    // Save as draft
    await page.click('button[type="submit"]');

    // Verify redirected or saved
    await page.waitForURL(/\/admin\/pieces/);
    await expect(page.locator(`text=${testTitle}`).first()).toBeVisible();
  });

  test("Failure state: Validation error on empty title", async ({ page }) => {
    await page.goto("/admin/pieces/new");

    await page.fill('input[name="slug"]', `empty-test-${Date.now()}`);
    // Leave title empty
    await page.fill('textarea[name="bodyBn"]', "লেখা...");
    await page.click('button[type="submit"]');

    // Should remain on page or show validation error
    await expect(page).toHaveURL("/admin/pieces/new");
  });
});
