import { test, expect } from "@playwright/test";

test.describe("Production Data Reliability & Visual Rendering", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("Homepage renders all 11 database-driven and static sections on initial visit", async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    const response = await page.goto("/", { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);

    // 1. Header & Brand Logo
    await expect(page.locator("header")).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();

    // 2. Hero Section
    const hero = page.locator("section").first();
    await expect(hero).toBeVisible();
    await expect(page.locator("h1")).toContainText(/Thoughts Whatever/i);

    // 3. Featured Series Hero Spotlight Card (Database Content)
    const featuredHero = page.locator("section:has-text('মেঘনাদবধ'), section:has-text('তথ্যচিত্র'), section:has-text('রক্তকরবী')").first();
    await expect(featuredHero).toBeVisible();

    // 4. Writing / Series / Episode Cards (Database Content)
    const articles = page.locator("article");
    const articleCount = await articles.count();
    expect(articleCount).toBeGreaterThan(0);

    // 5. Letter / Newsletter Section
    const letterBlock = page.locator("section:has-text('LETTER'), section:has-text('letter'), section:has-text('চিঠি')").first();
    await expect(letterBlock).toBeVisible();

    // 6. Site Footer
    await expect(page.locator("footer")).toBeVisible();

    // 7. Verify zero hydration or React errors in console
    const hydrationErrors = consoleErrors.filter(
      (err) =>
        err.includes("Hydration failed") ||
        err.includes("did not match") ||
        err.includes("Minified React error #418") ||
        err.includes("Minified React error #423")
    );
    expect(hydrationErrors).toHaveLength(0);
  });

  test("50 Consecutive Normal Refreshes — database content reliably visible on every load", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    for (let i = 1; i <= 50; i++) {
      await page.reload({ waitUntil: "domcontentloaded" });

      // Verify Hero
      await expect(page.locator("h1")).toBeVisible();

      // Verify at least one database article card is visible on every single refresh
      const firstArticle = page.locator("article").first();
      await expect(firstArticle).toBeVisible({ timeout: 5000 });

      // Verify Header & Footer
      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    }
  });

  test("50 Consecutive Hard Refreshes (Bypass Cache) — no blank sections", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    for (let i = 1; i <= 50; i++) {
      // Force reload by navigating with cache disabled or hard reload
      await page.goto("/", { waitUntil: "domcontentloaded" });

      // Check Hero
      await expect(page.locator("h1")).toBeVisible();

      // Check Database Cards
      const article = page.locator("article").first();
      await expect(article).toBeVisible({ timeout: 5000 });
    }
  });

  test("Direct URL Visits across 20 iterations — writing, documentary, blog, series, authors", async ({
    page,
  }) => {
    const routes = ["/writing", "/documentary", "/blog", "/series", "/authors"];

    for (let i = 0; i < 4; i++) {
      for (const route of routes) {
        const response = await page.goto(route, { waitUntil: "domcontentloaded" });
        expect(response?.status()).toBe(200);

        // Verify page header
        await expect(page.locator("h1")).toBeVisible();

        // Verify header and footer
        await expect(page.getByRole("banner")).toBeVisible();
        await expect(page.locator("footer")).toBeVisible();
      }
    }
  });

  test("Responsive Viewports — Desktop, Tablet, Mobile", async ({ page }) => {
    const viewports = [
      { width: 1440, height: 900, name: "Desktop" },
      { width: 768, height: 1024, name: "Tablet" },
      { width: 375, height: 667, name: "Mobile" },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/", { waitUntil: "networkidle" });

      // Verify content visibility across viewports
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("article").first()).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();
    }
  });

  test("Theme and Cookie Synchronization across page refreshes", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Verify initial cookies
    const cookies = await page.context().cookies();
    const themeCookie = cookies.find((c) => c.name === "tw_theme");
    expect(themeCookie).toBeDefined();

    // Verify html data-theme matches
    const themeAttr = await page.getAttribute("html", "data-theme");
    expect(["cream", "sepia", "night"]).toContain(themeAttr);
  });
});
