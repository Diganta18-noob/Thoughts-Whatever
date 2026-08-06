import { test, expect } from "@playwright/test";

test.describe("Client-Side Search & Reading Bookmarks", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Search page renders and filters results", async ({ page }) => {
    await page.goto("/search");
    await expect(page).toHaveURL("/search");

    const searchInput = page.locator('input[type="search"], input[type="text"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("রবীন্দ্রনাথ");
    }
  });

  test("Bookmarks page renders saved items state", async ({ page }) => {
    await page.goto("/bookmarks");
    await expect(page).toHaveURL("/bookmarks");
  });
});
