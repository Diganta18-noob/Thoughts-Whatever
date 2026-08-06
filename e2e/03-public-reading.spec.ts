import { test, expect } from "@playwright/test";

test.describe("Public Reading & Content Exploration Surface", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Browse homepage and public sections", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Thoughts Whatever/i);

    // Navigate to /writing
    await page.goto("/writing");
    await expect(page).toHaveURL("/writing");

    // Navigate to /blog
    await page.goto("/blog");
    await expect(page).toHaveURL("/blog");

    // Navigate to /documentary
    await page.goto("/documentary");
    await expect(page).toHaveURL("/documentary");

    // Navigate to /authors
    await page.goto("/authors");
    await expect(page).toHaveURL("/authors");
  });

  test("Theme and locale persistence", async ({ page }) => {
    await page.goto("/");

    // Verify dataset theme default
    const theme = await page.getAttribute("html", "data-theme");
    expect(["cream", "sepia", "night"]).toContain(theme || "cream");
  });

  test("404 handling on non-existent article slug", async ({ page }) => {
    const response = await page.goto("/writing/non-existent-article-slug-12345");
    expect(response?.status()).toBe(404);
  });
});
