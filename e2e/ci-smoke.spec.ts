import { test, expect } from "@playwright/test";

test("public routes render and unknown content is marked not found", async ({ page }) => {
  for (const route of ["/", "/writing", "/blog", "/documentary", "/series", "/authors", "/reference", "/privacy", "/terms", "/contact"]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Application error");
  }
  const missing = await page.goto("/writing/ci-does-not-exist");
  // Next.js can commit streaming headers before notFound() resolves. In that
  // case the status is 200, with the recovery page and noindex in the stream.
  expect([200, 404]).toContain(missing?.status());
  await expect(page.getByRole("navigation", { name: "Recovery navigation" })).toBeVisible();
  await expect(page.locator('meta[name="robots"][content*="noindex"]').first()).toBeAttached();
});

test("consent, mobile layout, metadata and preview assets work", async ({ page, request }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const analyticsRequests: string[] = [];
  page.on("request", (req) => { if (req.url().includes("/ingest/") || req.url().includes("/api/analytics/event")) analyticsRequests.push(req.url()); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Cookie preferences" })).toBeVisible();
  expect(analyticsRequests).toEqual([]);
  await page.getByRole("button", { name: "Reject optional analytics" }).click();
  await page.reload();
  await expect(page.getByRole("region", { name: "Cookie preferences" })).toHaveCount(0);
  expect(analyticsRequests).toEqual([]);
  await page.getByRole("button", { name: "Cookie settings", exact: true }).click();
  await page.getByRole("button", { name: "Accept analytics", exact: true }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("tw_consent"))).toBe("accepted");
  await page.getByRole("button", { name: "Cookie settings", exact: true }).click();
  await page.getByRole("button", { name: "Reject optional analytics" }).click();
  for (const route of ["/", "/reference", "/privacy", "/terms"]) {
    await page.goto(route);
    await expect(page.locator('meta[name="description"]').first()).toHaveAttribute("content", /.+/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), route).toBe(true);
    await expect(page.locator("main img:not([alt])")).toHaveCount(0);
  }
  const preview = await request.get("/opengraph-image");
  expect(preview.status()).toBe(200);
  expect(preview.headers()["content-type"]).toContain("image/png");
  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/reference");
  expect(await sitemap.text()).toContain("/terms");
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await testInfo.attach("mobile-home", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  const timings = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return { ttfbMs: Math.round(nav.responseStart - nav.requestStart), domReadyMs: Math.round(nav.domContentLoadedEventEnd), resources: performance.getEntriesByType("resource").length };
  });
  await testInfo.attach("page-speed", { body: JSON.stringify(timings), contentType: "application/json" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await testInfo.attach("desktop-home", { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
});

test("admin routes require login and seeded credentials authenticate", async ({ page, request }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByTestId("email-input")).toBeVisible();
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  expect(email, "Set TEST_ADMIN_EMAIL for the seeded test database").toBeTruthy();
  expect(password, "Set TEST_ADMIN_PASSWORD for the seeded test database").toBeTruthy();
  const rejected = await request.post("/api/admin/login", { data: { email, password: "incorrect-ci-password" } });
  expect(rejected.status()).toBe(401);
  const login = await request.post("/api/admin/login", { data: { email, password } });
  expect(login.status()).toBe(200);
  expect(await login.json()).toMatchObject({ ok: true });
  expect(login.headers()["set-cookie"]).toBeTruthy();
});
